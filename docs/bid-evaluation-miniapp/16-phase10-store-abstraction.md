# 第10阶段：存储层抽象（为生产后端迁移做准备）

## 本阶段目标
将 mock-api 的数据存储逻辑从 `server.js` 中抽离，形成可切换的存储层，降低未来迁移 MySQL 的改造成本。

## 已完成
1. 新增 `backend/mock-api/store.js`，封装 store 接口：
   - `load`
   - `getRecords`
   - `setRecords`
   - `nextId`
   - `reset`
   - `persist`
   - `info`
2. 支持两种模式：
   - `STORE_MODE=file`（默认）
   - `STORE_MODE=memory`
3. `server.js` 改为依赖 store 抽象，而不是直接操作文件。

## 下一步收益
- 后续替换为 MySQL/Prisma 时，只需新增 MySQLStore 并接入统一接口。
- API 层无需大规模改写。
