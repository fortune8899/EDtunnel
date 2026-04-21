# Mock API（第7阶段：持久化增强）

这是一个 Node.js Mock API，用于前端联调。当前已支持**文件持久化**（重启不丢记录）。

## 启动

```bash
npm run mock-api
# 或
node backend/mock-api/server.js
```

默认端口：`8788`

## 健康检查

- `GET /health`

返回包含：`records` 总数、`persisted` 标记、`dataFile` 路径。

## 已实现接口

- `GET /api/v1/profession-dict/list`
- `GET /api/v1/profession-dict/tree`
- `POST /api/v1/eval-records`
- `GET /api/v1/eval-records`
- `GET /api/v1/eval-records/:id`
- `PATCH /api/v1/eval-records/:id`
- `DELETE /api/v1/eval-records/:id`
- `PATCH /api/v1/eval-records/:id/settlement`
- `GET /api/v1/dashboard/year-overview?year=2026`
- `GET /api/v1/dashboard/high-frequency-professions?limit=5`
- `GET /api/v1/dashboard/monthly-income-trend?year=2026`

## 管理接口（开发联调）

- `POST /api/v1/admin/reset`：清空记录并重置自增ID。

## 新增记录示例

```bash
curl -X POST http://localhost:8788/api/v1/eval-records \
  -H 'Content-Type: application/json' \
  -d '{
    "eval_date": "2026-04-19",
    "location": "市公共资源交易中心",
    "project_name": "某道路改造项目",
    "source_platform": "市公共资源交易中心",
    "role_in_group": 1,
    "profession_code": "A010101",
    "summary_content": "完成技术标评审",
    "risk_notes": "重点核验业绩证明",
    "expected_fee": 1500,
    "settlement_status": 0
  }'
```

## 数据文件

- 路径：`backend/mock-api/data/mock-db.json`
- 可删除该文件重置数据（服务停止后操作）。


## 自动化冒烟测试

```bash
npm run mock-api:test
```

该测试会自动启动 mock-api，执行 reset/create/list/settlement/dashboard 全链路校验。


## 存储模式切换（阶段10）

默认使用文件持久化（`STORE_MODE=file`）。你也可以切到纯内存模式：

```bash
STORE_MODE=memory npm run mock-api
```

或指定数据文件：

```bash
DATA_FILE=backend/mock-api/data/mock-db.custom.json npm run mock-api
```


## 导出 SQL（迁移到 MySQL）

```bash
npm run mock-api:export-sql
```

可选环境变量：

- `MOCK_DB_FILE`：输入 JSON 文件路径
- `OUT_SQL_FILE`：输出 SQL 文件路径
- `EXPORT_USER_ID`：导出时写入的 user_id（默认 1）


## MySQL 模式（第12阶段预览）

当你安装了 `mysql2` 后，可尝试：

```bash
STORE_MODE=mysql MYSQL_DSN="mysql://user:pass@127.0.0.1:3306/dbname" npm run mock-api
```

> 若未安装 `mysql2`，服务会提示安装依赖。

MySQL 模式下已支持记录 CRUD 与 dashboard 统计接口（阶段14）。


## 初始化 MySQL 表结构（阶段13）

```bash
MYSQL_DSN="mysql://user:pass@127.0.0.1:3306/dbname" npm run mock-api:init-mysql
```

默认执行 `backend/mysql/schema.sql`，可通过 `SCHEMA_FILE` 覆盖。
