# 第11阶段：MySQL 迁移桥接工具

## 本阶段目标
为“mock-api -> MySQL 正式后端”提供一条可操作的数据迁移通道。

## 已完成
1. 新增脚本：`backend/mock-api/tools/export-sql.js`
2. 新增命令：`npm run mock-api:export-sql`
3. 支持把 `mock-db.json` 转换成 `INSERT INTO eval_records ...` SQL 文件。

## 使用示例
```bash
npm run mock-api:export-sql
```

自定义路径：
```bash
MOCK_DB_FILE=backend/mock-api/data/mock-db.json \
OUT_SQL_FILE=backend/mock-api/data/migrate.sql \
EXPORT_USER_ID=1 \
npm run mock-api:export-sql
```

## 价值
- 可把前期联调积累的数据导入 MySQL。
- 降低从原型阶段切换到正式后端的阻力。
