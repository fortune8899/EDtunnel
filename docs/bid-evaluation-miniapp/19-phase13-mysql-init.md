# 第13阶段：MySQL 初始化脚本落地

## 目标
把“MySQL 预览模式”推进到“可初始化真实库表并启动服务”。

## 已完成
1. 新增 `backend/mysql/schema.sql`（最小可用表结构）。
2. 新增 `backend/mock-api/tools/init-mysql.js`。
3. 新增命令：`npm run mock-api:init-mysql`。
4. README 增加 MySQL 初始化步骤。

## 使用方式
```bash
MYSQL_DSN="mysql://user:pass@127.0.0.1:3306/dbname" npm run mock-api:init-mysql
STORE_MODE=mysql MYSQL_DSN="mysql://user:pass@127.0.0.1:3306/dbname" npm run mock-api
```

## 价值
- 从“架构预览”升级为“可落地初始化 + 可启动”。
- 为下一阶段真实 MySQL CRUD 联调铺路。
