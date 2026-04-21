# 第14阶段：MySQL CRUD 可用化

## 本阶段目标
让 MySQL 模式不再只是“读取预览”，而是支持完整 CRUD 与统计接口。

## 已完成
1. `mysql-store.js` 增加真实 CRUD 能力：
   - `createRecord`
   - `listRecords`
   - `getRecordById`
   - `updateRecord`
   - `deleteRecord`
2. 增加 MySQL 统计能力：
   - `yearOverview`
   - `highFrequencyProfessions`
   - `monthlyIncomeTrend`
3. `server.js` 增加 store 能力检测与分支调用：
   - 优先走 MySQLStore 的原生方法
   - 无对应方法时回退到 file/memory 逻辑

## 当前状态
- file/memory 模式持续可用
- mysql 模式具备核心接口能力（需安装 mysql2 并初始化 schema）
