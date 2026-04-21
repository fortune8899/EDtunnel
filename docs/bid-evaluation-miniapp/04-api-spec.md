# API 设计（V1）

Base URL: `/api/v1`
认证方式：JWT（微信登录换取 token）

## 1. 登录
### `POST /auth/wx-login`
- 入参：`code`
- 出参：`token`, `user`

## 2. 评标记录
### `POST /records`
创建记录。

请求示例：
```json
{
  "bidDate": "2026-04-12",
  "startTime": "09:30",
  "endTime": "11:45",
  "location": "北京市丰台区公共资源交易中心",
  "projectName": "XX道路改造工程监理",
  "specialtyIds": [1, 3],
  "summary": "完成技术标符合性审查与商务标比对",
  "keyPoints": "重点核验业绩真实性与关键人员到岗承诺",
  "feeAmount": 1200,
  "feeType": "POST_TAX",
  "status": "SUBMITTED"
}
```

### `GET /records`
分页查询记录。

查询参数：
- `page`, `pageSize`
- `dateFrom`, `dateTo`
- `specialtyId`
- `location`

### `GET /records/:id`
记录详情。

### `PUT /records/:id`
更新记录。

### `DELETE /records/:id`
删除记录。

## 3. 统计分析
### `GET /analytics/overview`
- 参数：`granularity=day|week|month|year`, `dateFrom`, `dateTo`
- 返回：总评次、总金额、平均单次费用。

### `GET /analytics/trend`
- 参数：同上
- 返回：每个时间桶的评次与金额。

### `GET /analytics/specialties/top`
- 参数：`dateFrom`, `dateTo`, `limit`
- 返回：按抽取次数排序的专业 Top N。

## 4. 字典与导出
### `GET /specialties`
获取专业列表。

### `POST /specialties`
新增专业。

### `PUT /specialties/:id`
编辑专业。

### `DELETE /specialties/:id`
删除专业。

### `GET /export/records.csv`
按筛选条件导出 CSV。

## 5. 错误码规范
- `40001` 参数校验失败
- `40101` 登录失效
- `40301` 无权限访问
- `40401` 记录不存在
- `50001` 服务器异常
