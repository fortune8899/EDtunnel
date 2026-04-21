-- V1 数据库结构（MySQL 8+）

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  wx_open_id VARCHAR(128) NOT NULL UNIQUE,
  nickname VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS specialty_dict (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  name VARCHAR(64) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_specialty (user_id, name),
  CONSTRAINT fk_specialty_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS bid_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  bid_date DATE NOT NULL,
  start_time TIME NULL,
  end_time TIME NULL,
  location VARCHAR(128) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  key_points TEXT NOT NULL,
  fee_amount DECIMAL(10,2) NOT NULL,
  fee_type ENUM('PRE_TAX', 'POST_TAX') NOT NULL DEFAULT 'POST_TAX',
  status ENUM('DRAFT', 'SUBMITTED') NOT NULL DEFAULT 'SUBMITTED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_bid_date (user_id, bid_date),
  INDEX idx_user_project_name (user_id, project_name),
  CONSTRAINT fk_record_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS bid_record_specialties (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  bid_record_id BIGINT NOT NULL,
  specialty_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_record_specialty (bid_record_id, specialty_id),
  CONSTRAINT fk_brs_record FOREIGN KEY (bid_record_id) REFERENCES bid_records(id) ON DELETE CASCADE,
  CONSTRAINT fk_brs_specialty FOREIGN KEY (specialty_id) REFERENCES specialty_dict(id)
);

-- 查询示例：按专业抽取次数排行
-- SELECT sd.name, COUNT(*) AS picked_times
-- FROM bid_record_specialties brs
-- JOIN specialty_dict sd ON sd.id = brs.specialty_id
-- JOIN bid_records br ON br.id = brs.bid_record_id
-- WHERE br.user_id = ? AND br.bid_date BETWEEN ? AND ?
-- GROUP BY sd.name
-- ORDER BY picked_times DESC
-- LIMIT 10;
