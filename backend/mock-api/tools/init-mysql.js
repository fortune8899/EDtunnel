const fs = require('fs');
const path = require('path');

(async () => {
  let mysql;
  try {
    mysql = require('mysql2/promise');
  } catch {
    console.error('需要安装 mysql2: npm i mysql2');
    process.exit(1);
  }

  const dsn = process.env.MYSQL_DSN;
  if (!dsn) {
    console.error('请提供 MYSQL_DSN，例如: mysql://user:pass@127.0.0.1:3306/dbname');
    process.exit(1);
  }

  const schemaFile = process.env.SCHEMA_FILE || path.join(__dirname, '..', '..', 'mysql', 'schema.sql');
  if (!fs.existsSync(schemaFile)) {
    console.error(`schema file not found: ${schemaFile}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaFile, 'utf8');
  const conn = await mysql.createConnection({ uri: dsn, multipleStatements: true });
  await conn.query(sql);
  await conn.end();

  console.log(`MySQL schema initialized: ${schemaFile}`);
})();
