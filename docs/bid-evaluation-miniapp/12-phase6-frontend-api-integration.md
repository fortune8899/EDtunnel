# 第6阶段：前端联调完成说明（原型增强）

本阶段目标：让 `prototype/index.html` 不仅能本地演示，还能直接对接 `mock-api`。

## 已完成
1. 新增“数据源模式”切换：本地模式 / API 模式。
2. 可配置 `API Base URL`（默认 `http://localhost:8788/api/v1`）。
3. API 模式下支持：
   - 新增记录 `POST /eval-records`
   - 列表拉取 `GET /eval-records`
   - 编辑记录 `PATCH /eval-records/:id`
   - 删除记录 `DELETE /eval-records/:id`
4. 保留本地模式（LocalStorage）用于离线演示。
5. 保留筛选、统计、Top5、CSV 导出能力。

## 联调步骤
1. 启动后端：`npm run mock-api`
2. 启动原型静态页：`python3 -m http.server 4173`
3. 打开页面：`http://localhost:4173/docs/bid-evaluation-miniapp/prototype/index.html`
4. 在“我的”页切到 API 模式，点击“从 API 拉取”。

## 说明
- 当前 mock-api 为内存数据，重启后会清空。
- 进入生产前需替换为 MySQL 持久化后端。
