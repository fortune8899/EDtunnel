-- Phase 13: MySQL minimal schema for mock-api mysql mode

CREATE TABLE IF NOT EXISTS eval_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  eval_date DATE NOT NULL,
  start_time TIME NULL,
  location VARCHAR(255) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  source_platform VARCHAR(100) NOT NULL,
  role_in_group TINYINT NOT NULL,
  profession_code VARCHAR(20) NOT NULL,
  custom_profession VARCHAR(255) NULL,
  summary_content TEXT NULL,
  risk_notes TEXT NULL,
  expected_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  actual_paid_amount DECIMAL(10,2) NULL,
  paid_date DATE NULL,
  settlement_status TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_eval_date (eval_date),
  INDEX idx_profession_code (profession_code),
  INDEX idx_settlement_status (settlement_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
