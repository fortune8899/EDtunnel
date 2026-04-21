const http = require('http');
const { URL } = require('url');
const path = require('path');
const { createStore } = require('./store');

const PORT = process.env.PORT || 8788;
const STORE_MODE = process.env.STORE_MODE || 'file';
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'mock-db.json');
const MYSQL_DSN = process.env.MYSQL_DSN || '';

const professionDict = [
  { code: 'A010101', level_1: '工程类(A)', level_2: '工程规划', level_3: '公路' },
  { code: 'A010102', level_1: '工程类(A)', level_2: '工程规划', level_3: '市政道路' },
  { code: 'A020201', level_1: '工程类(A)', level_2: '工程施工', level_3: '房屋建筑' },
  { code: 'B010101', level_1: '货物类(B)', level_2: '设备', level_3: '机电设备' },
  { code: 'C010101', level_1: '服务类(C)', level_2: '咨询服务', level_3: '工程造价咨询' },
  { code: 'OTHER', level_1: '其他', level_2: '其他', level_3: '其他（手动输入）' }
];

const send = (res, statusCode, data, message = 'ok', code = 0) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ code, message, data }));
};
const notFound = (res) => send(res, 404, null, 'not found', 40401);
const badReq = (res, msg) => send(res, 400, null, msg || 'bad request', 40001);

const readBody = (req) => new Promise((resolve, reject) => {
  let data = '';
  req.on('data', (chunk) => {
    data += chunk;
    if (data.length > 1e6) {
      reject(new Error('payload too large'));
      req.destroy();
    }
  });
  req.on('end', () => {
    if (!data) return resolve({});
    try { resolve(JSON.parse(data)); } catch { reject(new Error('invalid json')); }
  });
});

const validateRecord = (payload) => {
  const required = ['eval_date', 'location', 'project_name', 'source_platform', 'role_in_group', 'profession_code', 'expected_fee'];
  for (const f of required) if (payload[f] === undefined || payload[f] === null || payload[f] === '') return `字段缺失: ${f}`;
  if (![1, 2].includes(Number(payload.role_in_group))) return 'role_in_group 必须为 1 或 2';
  if (![0, 1].includes(Number(payload.settlement_status ?? 0))) return 'settlement_status 必须为 0 或 1';
  if (payload.profession_code === 'OTHER' && !payload.custom_profession) return 'profession_code=OTHER 时 custom_profession 必填';
  if (Number(payload.settlement_status) === 1 && (!payload.actual_paid_amount || !payload.paid_date)) return '已结款时 actual_paid_amount 和 paid_date 必填';
  return null;
};

const toProfessionTree = () => {
  const mapL1 = new Map();
  for (const item of professionDict) {
    if (!mapL1.has(item.level_1)) mapL1.set(item.level_1, { text: item.level_1, value: item.level_1, children: new Map() });
    const l1 = mapL1.get(item.level_1);
    if (!l1.children.has(item.level_2)) l1.children.set(item.level_2, { text: item.level_2, value: `${item.level_1}-${item.level_2}`, children: [] });
    l1.children.get(item.level_2).children.push({ text: item.level_3, value: item.code });
  }
  return [...mapL1.values()].map((l1) => ({ text: l1.text, value: l1.value, children: [...l1.children.values()] }));
};

async function bootstrap() {
  const store = await createStore({ mode: STORE_MODE, dataFile: DATA_FILE, dsn: MYSQL_DSN });
  await store.load();

  const listRecords = async (query) => {
    if (store.listRecords) return store.listRecords(query);
    let result = [...await store.getRecords()];
    if (query.professionCode) result = result.filter((r) => r.profession_code === query.professionCode);
    if (query.settlementStatus !== undefined) result = result.filter((r) => String(r.settlement_status) === String(query.settlementStatus));
    if (query.dateFrom) result = result.filter((r) => r.eval_date >= query.dateFrom);
    if (query.dateTo) result = result.filter((r) => r.eval_date <= query.dateTo);
    if (query.keyword) result = result.filter((r) => r.project_name.includes(query.keyword) || r.location.includes(query.keyword));
    const page = Number(query.page || 1), pageSize = Number(query.pageSize || 20), start = (page - 1) * pageSize;
    return { list: result.slice(start, start + pageSize), total: result.length, page, pageSize };
  };

  const yearOverview = async (year) => {
    if (store.yearOverview) return store.yearOverview(year);
    const list = (await store.getRecords()).filter((r) => String(r.eval_date).startsWith(String(year)));
    return {
      year: Number(year),
      total_eval_count: list.length,
      received_amount: list.reduce((s, r) => s + (r.settlement_status === 1 ? Number(r.actual_paid_amount || 0) : 0), 0),
      pending_collection_amount: list.reduce((s, r) => s + (r.settlement_status === 0 ? Number(r.expected_fee || 0) : 0), 0)
    };
  };

  const highFreqProfessions = async (limit = 5) => {
    if (store.highFrequencyProfessions) return store.highFrequencyProfessions(limit);
    const m = {};
    for (const r of await store.getRecords()) m[r.profession_code] = (m[r.profession_code] || 0) + 1;
    return Object.entries(m).map(([profession_code, count]) => ({ profession_code, count })).sort((a, b) => b.count - a.count).slice(0, Number(limit || 5));
  };

  const monthlyIncomeTrend = async (year) => {
    if (store.monthlyIncomeTrend) return store.monthlyIncomeTrend(year);
    const rows = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, paid_income: 0, eval_count: 0 }));
    (await store.getRecords()).filter((r) => String(r.eval_date).startsWith(String(year))).forEach((r) => {
      const row = rows[Number(r.eval_date.slice(5, 7)) - 1];
      row.eval_count += 1;
      if (r.settlement_status === 1) row.paid_income += Number(r.actual_paid_amount || 0);
    });
    return { year: Number(year), rows };
  };

  const server = http.createServer(async (req, res) => {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      const pathname = urlObj.pathname;
      const method = req.method;

      if (pathname === '/health' && method === 'GET') {
        return send(res, 200, { ok: true, records: (await store.getRecords()).length, ...store.info() });
      }
      if (pathname === '/api/v1/admin/reset' && method === 'POST') {
        await store.reset();
        return send(res, 200, true, 'reset ok');
      }
      if (pathname === '/api/v1/profession-dict/list' && method === 'GET') return send(res, 200, professionDict);
      if (pathname === '/api/v1/profession-dict/tree' && method === 'GET') return send(res, 200, toProfessionTree());

      if (pathname === '/api/v1/eval-records' && method === 'POST') {
        const body = await readBody(req);
        const err = validateRecord(body);
        if (err) return badReq(res, err);
        let row;
        if (store.createRecord) {
          row = await store.createRecord(body);
          return send(res, 200, row);
        }
        row = {
          id: await store.nextId(),
          eval_date: body.eval_date,
          start_time: body.start_time || null,
          location: body.location,
          project_name: body.project_name,
          source_platform: body.source_platform,
          role_in_group: Number(body.role_in_group),
          profession_code: body.profession_code,
          custom_profession: body.custom_profession || null,
          summary_content: body.summary_content || null,
          risk_notes: body.risk_notes || null,
          expected_fee: Number(body.expected_fee || 0),
          actual_paid_amount: body.actual_paid_amount ? Number(body.actual_paid_amount) : null,
          paid_date: body.paid_date || null,
          settlement_status: Number(body.settlement_status || 0),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const list = await store.getRecords();
        await store.setRecords([row, ...list]);
        await store.persist();
        return send(res, 200, row);
      }

      if (pathname === '/api/v1/eval-records' && method === 'GET') return send(res, 200, await listRecords(Object.fromEntries(urlObj.searchParams.entries())));

      const matchRecord = pathname.match(/^\/api\/v1\/eval-records\/(\d+)$/);
      if (matchRecord) {
        const id = Number(matchRecord[1]);
        if (store.getRecordById && store.updateRecord && store.deleteRecord) {
          const curr = await store.getRecordById(id);
          if (!curr) return notFound(res);
          if (method === 'GET') return send(res, 200, curr);
          if (method === 'DELETE') return send(res, 200, await store.deleteRecord(id));
          if (method === 'PATCH' || method === 'PUT') {
            const body = await readBody(req);
            const merged = { ...curr, ...body };
            const err = validateRecord(merged);
            if (err) return badReq(res, err);
            const updated = await store.updateRecord(id, body);
            if (!updated) return notFound(res);
            return send(res, 200, updated);
          }
        }
        const list = await store.getRecords();
        const idx = list.findIndex((r) => r.id === id);
        if (idx < 0) return notFound(res);
        if (method === 'GET') return send(res, 200, list[idx]);
        if (method === 'DELETE') {
          list.splice(idx, 1);
          await store.setRecords(list);
          await store.persist();
          return send(res, 200, true);
        }
        if (method === 'PATCH' || method === 'PUT') {
          const body = await readBody(req);
          const merged = { ...list[idx], ...body };
          const err = validateRecord(merged);
          if (err) return badReq(res, err);
          merged.updated_at = new Date().toISOString();
          list[idx] = merged;
          await store.setRecords(list);
          await store.persist();
          return send(res, 200, merged);
        }
      }

      const matchSettlement = pathname.match(/^\/api\/v1\/eval-records\/(\d+)\/settlement$/);
      if (matchSettlement && method === 'PATCH') {
        const id = Number(matchSettlement[1]);
        const body = await readBody(req);
        if (![0, 1].includes(Number(body.settlement_status))) return badReq(res, 'settlement_status 必须为 0 或 1');
        if (Number(body.settlement_status) === 1 && (!body.actual_paid_amount || !body.paid_date)) return badReq(res, '已结款时 actual_paid_amount 和 paid_date 必填');
        if (store.updateRecord && store.getRecordById) {
          const curr = await store.getRecordById(id);
          if (!curr) return notFound(res);
          const updated = await store.updateRecord(id, body);
          return send(res, 200, updated);
        }
        const list = await store.getRecords();
        const idx = list.findIndex((r) => r.id === id);
        if (idx < 0) return notFound(res);
        list[idx].settlement_status = Number(body.settlement_status);
        list[idx].actual_paid_amount = body.actual_paid_amount ? Number(body.actual_paid_amount) : null;
        list[idx].paid_date = body.paid_date || null;
        list[idx].updated_at = new Date().toISOString();
        await store.setRecords(list);
        await store.persist();
        return send(res, 200, list[idx]);
      }

      if (pathname === '/api/v1/dashboard/year-overview' && method === 'GET') {
        const year = Number(urlObj.searchParams.get('year') || new Date().getFullYear());
        return send(res, 200, await yearOverview(year));
      }
      if (pathname === '/api/v1/dashboard/high-frequency-professions' && method === 'GET') {
        const limit = Number(urlObj.searchParams.get('limit') || 5);
        return send(res, 200, await highFreqProfessions(limit));
      }
      if (pathname === '/api/v1/dashboard/monthly-income-trend' && method === 'GET') {
        const year = Number(urlObj.searchParams.get('year') || new Date().getFullYear());
        return send(res, 200, await monthlyIncomeTrend(year));
      }

      return notFound(res);
    } catch (e) {
      return send(res, 500, null, e.message || 'server error', 50001);
    }
  });

  server.listen(PORT, () => {
    console.log(`Mock API is running at http://localhost:${PORT}`);
    console.log(`Store mode: ${store.mode}`);
    if (store.mode === 'file') console.log(`Data file: ${DATA_FILE}`);
    if (store.mode === 'mysql') console.log('Using MySQL store');
  });
}

bootstrap().catch((e) => {
  console.error('[bootstrap] failed:', e.message);
  process.exit(1);
});
