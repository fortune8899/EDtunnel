# 第12阶段：MySQL Store 接入预览

## 目标
让 mock-api 在架构层具备“切换真实 MySQL 存储”的能力，为生产后端平滑过渡。

## 已完成
1. 新增 `backend/mock-api/mysql-store.js`（MySQLStore 预览实现）。
2. `store.js` 支持 `mode=mysql` 分支。
3. `server.js` 重构为异步 store 调用方式，兼容 file/memory/mysql 三种模式。
4. README 增加 MySQL 模式启动示例。

## 使用说明（预览）
```bash
STORE_MODE=mysql MYSQL_DSN="mysql://user:pass@127.0.0.1:3306/dbname" npm run mock-api
```

> 需安装依赖：`npm i mysql2`
