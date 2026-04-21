/**
 * MySQLStore (Phase 14)
 *
 * 说明：
 * - 该实现用于把 mock-api 的 store 接口接入真实 MySQL。
 * - 依赖 mysql2/promise。
 */

function mapSettlementPatch(record, patch) {
  const next = { ...record, ...patch };
  if (Number(next.settlement_status) === 1) {
    if (!next.actual_paid_amount || !next.paid_date) {
      throw new Error('已结款时 actual_paid_amount 和 paid_date 必填');
    }
  }
  return next;
}

async function createMySQLStore({ dsn }) {
  let mysql;
  try {
    mysql = require('mysql2/promise');
  } catch {
    throw new Error('STORE_MODE=mysql 需要依赖 mysql2，请先安装: npm i mysql2');
  }
  if (!dsn) throw new Error('STORE_MODE=mysql 需要 MYSQL_DSN');

  const pool = mysql.createPool({ uri: dsn, connectionLimit: 10, charset: 'utf8mb4' });

  const baseFields = [
    'eval_date', 'start_time', 'location', 'project_name', 'source_platform',
    'role_in_group', 'profession_code', 'custom_profession', 'summary_content',
    'risk_notes', 'expected_fee', 'actual_paid_amount', 'paid_date', 'settlement_status'
  ];

  async function createRecord(payload) {
    const sql = `INSERT INTO eval_records (
      eval_date, start_time, location, project_name, source_platform,
      role_in_group, profession_code, custom_profession, summary_content,
      risk_notes, expected_fee, actual_paid_amount, paid_date, settlement_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = baseFields.map((f) => payload[f] ?? null);
    const [ret] = await pool.query(sql, params);
    return getRecordById(ret.insertId);
  }

  async function listRecords(query = {}) {
    const where = [];
    const args = [];

    if (query.professionCode) { where.push('profession_code = ?'); args.push(query.professionCode); }
    if (query.settlementStatus !== undefined) { where.push('settlement_status = ?'); args.push(Number(query.settlementStatus)); }
    if (query.dateFrom) { where.push('eval_date >= ?'); args.push(query.dateFrom); }
    if (query.dateTo) { where.push('eval_date <= ?'); args.push(query.dateTo); }
    if (query.keyword) { where.push('(project_name LIKE ? OR location LIKE ?)'); args.push(`%${query.keyword}%`, `%${query.keyword}%`); }

    const page = Number(query.page || 1);
    const pageSize = Number(query.pageSize || 20);
    const offset = (page - 1) * pageSize;

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT * FROM eval_records ${whereSQL} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...args, pageSize, offset]
    );
    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM eval_records ${whereSQL}`, args);

    return { list: rows, total: Number(countRows[0].total || 0), page, pageSize };
  }

  async function getRecordById(id) {
    const [rows] = await pool.query('SELECT * FROM eval_records WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  async function updateRecord(id, patch) {
    const current = await getRecordById(id);
    if (!current) return null;
    const next = mapSettlementPatch(current, patch);

    const sql = `UPDATE eval_records SET
      eval_date=?, start_time=?, location=?, project_name=?, source_platform=?,
      role_in_group=?, profession_code=?, custom_profession=?, summary_content=?,
      risk_notes=?, expected_fee=?, actual_paid_amount=?, paid_date=?, settlement_status=?,
      updated_at=CURRENT_TIMESTAMP
      WHERE id=?`;
    const params = [...baseFields.map((f) => next[f] ?? null), id];
    await pool.query(sql, params);
    return getRecordById(id);
  }

  async function deleteRecord(id) {
    const [ret] = await pool.query('DELETE FROM eval_records WHERE id = ?', [id]);
    return ret.affectedRows > 0;
  }

  async function yearOverview(year) {
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS total_eval_count,
         IFNULL(SUM(CASE WHEN settlement_status=1 THEN actual_paid_amount ELSE 0 END),0) AS received_amount,
         IFNULL(SUM(CASE WHEN settlement_status=0 THEN expected_fee ELSE 0 END),0) AS pending_collection_amount
       FROM eval_records
       WHERE YEAR(eval_date)=?`,
      [year]
    );
    return {
      year: Number(year),
      total_eval_count: Number(rows[0].total_eval_count || 0),
      received_amount: Number(rows[0].received_amount || 0),
      pending_collection_amount: Number(rows[0].pending_collection_amount || 0),
    };
  }

  async function highFrequencyProfessions(limit = 5) {
    const [rows] = await pool.query(
      `SELECT profession_code, COUNT(*) AS count
       FROM eval_records
       GROUP BY profession_code
       ORDER BY count DESC
       LIMIT ?`,
      [Number(limit)]
    );
    return rows;
  }

  async function monthlyIncomeTrend(year) {
    const [rows] = await pool.query(
      `SELECT MONTH(eval_date) AS month,
              COUNT(*) AS eval_count,
              IFNULL(SUM(CASE WHEN settlement_status=1 THEN actual_paid_amount ELSE 0 END),0) AS paid_income
       FROM eval_records
       WHERE YEAR(eval_date)=?
       GROUP BY MONTH(eval_date)
       ORDER BY month`,
      [year]
    );
    const rowByMonth = new Map(rows.map((row) => [Number(row.month), row]));
    const normalizedRows = Array.from({ length: 12 }, (_, idx) => {
      const month = idx + 1;
      const row = rowByMonth.get(month);
      return {
        month,
        eval_count: Number(row?.eval_count || 0),
        paid_income: Number(row?.paid_income || 0),
      };
    });
    return { year: Number(year), rows: normalizedRows };
  }

  return {
    mode: 'mysql',
    async load() {},
    async getRecords() {
      const d = await listRecords({ page: 1, pageSize: 2000 });
      return d.list;
    },
    async setRecords() {
      throw new Error('MySQLStore 不支持 setRecords 覆盖，请使用 create/update/delete');
    },
    async nextId() { return null; },
    async reset() { await pool.query('TRUNCATE TABLE eval_records'); },
    info() { return { persisted: true, mode: 'mysql', dsnConfigured: true }; },
    async persist() {},

    createRecord,
    listRecords,
    getRecordById,
    updateRecord,
    deleteRecord,
    yearOverview,
    highFrequencyProfessions,
    monthlyIncomeTrend,

    pool,
  };
}

module.exports = { createMySQLStore };
