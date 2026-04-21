# MVP 演示版完成说明

## 已完成能力（当前原型）
1. 记录管理：新增、编辑、删除。
2. 列表筛选：按日期范围、地点关键字、专业筛选。
3. 看板分析：支持日/周/月/年统计（次数、总金额、平均值、专业数）。
4. 高频专业：Top5 条形图展示。
5. 数据导出：按当前筛选结果导出 CSV。
6. 数据持久化：浏览器 LocalStorage 保存。

## 使用方式
- 直接打开 `prototype/index.html`。
- 或使用 HTTP 服务访问：
  - `python3 -m http.server 4173`
  - 打开 `http://localhost:4173/docs/bid-evaluation-miniapp/prototype/index.html`

## 注意事项
- 该版本为前端演示版，不含真实后端与鉴权。
- 清理浏览器缓存会导致本地数据丢失。
