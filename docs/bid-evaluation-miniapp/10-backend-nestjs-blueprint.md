# 第4阶段：NestJS + MySQL 后端骨架（可直接开工）

> 目标：基于前面确定的数据库和 API 规范，快速搭建可联调后端。

## 1. 推荐目录结构

```text
backend/
  src/
    main.ts
    app.module.ts
    common/
      filters/
      interceptors/
      guards/
    modules/
      auth/
        auth.controller.ts
        auth.service.ts
        dto/
      profession/
        profession.controller.ts
        profession.service.ts
      eval-record/
        eval-record.controller.ts
        eval-record.service.ts
        dto/
          create-eval-record.dto.ts
          update-eval-record.dto.ts
          query-eval-record.dto.ts
          update-settlement.dto.ts
      dashboard/
        dashboard.controller.ts
        dashboard.service.ts
  prisma/ (可选)
  orm/ (TypeORM 方案可选)
```

## 2. DTO 建议（关键字段）

### 2.1 CreateEvalRecordDto
- `evalDate: string` (YYYY-MM-DD)
- `startTime?: string` (HH:mm:ss)
- `location: string`
- `projectName: string`
- `sourcePlatform: string`
- `roleInGroup: 1 | 2`
- `professionCode: string`
- `customProfession?: string`
- `summaryContent?: string`
- `riskNotes?: string`
- `expectedFee: number`
- `actualPaidAmount?: number`
- `paidDate?: string`
- `settlementStatus: 0 | 1`

### 2.2 业务校验（服务层强校验）
1. `professionCode === 'OTHER'` 时，`customProfession` 必填。
2. `settlementStatus === 1` 时，`actualPaidAmount`、`paidDate` 必填。
3. `settlementStatus === 0` 时，`actualPaidAmount`、`paidDate` 置空。

## 3. Controller 路由建议

### EvalRecordController
- `POST /api/v1/eval-records`
- `GET /api/v1/eval-records`
- `GET /api/v1/eval-records/:id`
- `PATCH /api/v1/eval-records/:id`
- `DELETE /api/v1/eval-records/:id`
- `PATCH /api/v1/eval-records/:id/settlement`

### ProfessionController
- `GET /api/v1/profession-dict/tree`
- `GET /api/v1/profession-dict/list`

### DashboardController
- `GET /api/v1/dashboard/year-overview`
- `GET /api/v1/dashboard/high-frequency-professions`
- `GET /api/v1/dashboard/monthly-income-trend`

## 4. Dashboard SQL 参考

### 4.1 年度核心总览
```sql
SELECT
  COUNT(*) AS total_eval_count,
  IFNULL(SUM(CASE WHEN settlement_status = 1 THEN actual_paid_amount ELSE 0 END), 0) AS received_amount,
  IFNULL(SUM(CASE WHEN settlement_status = 0 THEN expected_fee ELSE 0 END), 0) AS pending_collection_amount
FROM eval_records
WHERE user_id = ?
  AND YEAR(eval_date) = ?;
```

### 4.2 高频专业排行榜（TopN）
```sql
SELECT profession_code, COUNT(*) AS picked_times
FROM eval_records
WHERE user_id = ?
  AND eval_date BETWEEN ? AND ?
GROUP BY profession_code
ORDER BY picked_times DESC
LIMIT ?;
```

### 4.3 月度收益与频次趋势
```sql
SELECT
  MONTH(eval_date) AS month_no,
  COUNT(*) AS eval_count,
  IFNULL(SUM(CASE WHEN settlement_status = 1 THEN actual_paid_amount ELSE 0 END), 0) AS paid_income
FROM eval_records
WHERE user_id = ?
  AND YEAR(eval_date) = ?
GROUP BY MONTH(eval_date)
ORDER BY month_no;
```

## 5. 返回结构建议（统一）

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

错误时：

```json
{
  "code": 40001,
  "message": "参数错误",
  "data": null
}
```

## 6. 联调优先级（建议）
1. 先打通 `POST/GET /eval-records`。
2. 再接 `PATCH /settlement`（财务对账核心）。
3. 最后接 dashboard 3 个统计接口。
