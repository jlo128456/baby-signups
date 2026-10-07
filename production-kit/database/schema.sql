-- Due Date Sign-ups: MySQL / MariaDB tables
-- Import this once in cPanel → phpMyAdmin → your database → Import.

SET NAMES utf8mb4;

-- Team members who can sign in to the team desk
CREATE TABLE IF NOT EXISTS staff (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Packages customers can choose on the form
CREATE TABLE IF NOT EXISTS packages (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  price VARCHAR(50) NOT NULL DEFAULT '',
  cadence VARCHAR(50) NOT NULL DEFAULT 'One-off',
  description VARCHAR(500) NOT NULL DEFAULT '',
  shopify_url VARCHAR(500) NOT NULL DEFAULT '',
  shopify_variant VARCHAR(50) NOT NULL DEFAULT '',
  checkout_url VARCHAR(500) NOT NULL DEFAULT '',
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row of settings: team email addresses and Shopify store address
CREATE TABLE IF NOT EXISTS settings (
  id TINYINT UNSIGNED PRIMARY KEY,
  team TEXT NOT NULL,            -- JSON: {"amanda":"...","laura":"...","richard":"..."}
  shop_domain VARCHAR(255) NOT NULL DEFAULT '',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO settings (id, team, shop_domain) VALUES (1, '{}', '');

-- Sign-ups
CREATE TABLE IF NOT EXISTS leads (
  id CHAR(36) PRIMARY KEY,                -- made on the device, so offline re-sends never duplicate
  created_at DATETIME NOT NULL,           -- when the person actually signed up
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NOT NULL DEFAULT '',
  postcode VARCHAR(12) NOT NULL DEFAULT '',
  baby_due DATE NOT NULL,
  delivery_date DATE NOT NULL,
  package_id CHAR(36) NULL,
  subscribe TINYINT(1) NOT NULL DEFAULT 0,
  notes TEXT NOT NULL,
  consent TINYINT(1) NOT NULL DEFAULT 0,
  source VARCHAR(10) NOT NULL DEFAULT 'form',    -- 'form' or 'team'
  saved_offline TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(12) NOT NULL DEFAULT 'new',     -- new, contacted, subscribed, closed
  contacted TEXT NOT NULL,                       -- JSON: {"amanda":"2026-10-06T09:00:00Z", ...}
  team_emailed_at DATETIME NULL,
  INDEX idx_baby_due (baby_due),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products to post out to a customer (upsells)
CREATE TABLE IF NOT EXISTS upsells (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id CHAR(36) NOT NULL,
  product VARCHAR(200) NOT NULL,
  post_by DATE NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'to_post', -- to_post or posted
  posted_on DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lead (lead_id),
  CONSTRAINT fk_upsell_lead FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
