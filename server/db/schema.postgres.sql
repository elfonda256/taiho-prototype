-- ENTERPRISE POSTGRESQL PRODUCTION DDL SCHEMA
-- SISTEM PENCEGAHAN KEHILANGAN MATERIAL (MATERIAL LOSS PREVENTION SYSTEM)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role_id VARCHAR(64) NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  department VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

-- 4. UNITS
CREATE TABLE IF NOT EXISTS units (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL
);

-- 5. LOCATIONS
CREATE TABLE IF NOT EXISTS locations (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  warehouse VARCHAR(100) NOT NULL,
  area VARCHAR(100) NOT NULL,
  rack VARCHAR(50) NOT NULL,
  shelf VARCHAR(50) NOT NULL,
  description TEXT,
  is_active SMALLINT NOT NULL DEFAULT 1
);

-- 6. MATERIALS
CREATE TABLE IF NOT EXISTS materials (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  category_id VARCHAR(64) NOT NULL REFERENCES categories(id),
  unit_id VARCHAR(64) NOT NULL REFERENCES units(id),
  default_location_id VARCHAR(64) REFERENCES locations(id),
  unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  min_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'TERSEDIA',
  specification TEXT,
  qr_code_payload VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. INVENTORY (Current Stock balance per location)
CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(64) PRIMARY KEY,
  material_id VARCHAR(64) NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  location_id VARCHAR(64) NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  reserved_stock NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_inventory_mat_loc UNIQUE(material_id, location_id)
);

-- 8. INVENTORY_TRANSACTIONS (Immutable Digital Ledger)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id VARCHAR(64) PRIMARY KEY,
  transaction_number VARCHAR(100) NOT NULL UNIQUE,
  material_id VARCHAR(64) NOT NULL REFERENCES materials(id),
  transaction_type VARCHAR(50) NOT NULL,
  quantity NUMERIC(12, 2) NOT NULL,
  unit_id VARCHAR(64) NOT NULL REFERENCES units(id),
  from_location_id VARCHAR(64) REFERENCES locations(id),
  to_location_id VARCHAR(64) REFERENCES locations(id),
  previous_stock NUMERIC(12, 2) NOT NULL,
  new_stock NUMERIC(12, 2) NOT NULL,
  financial_impact NUMERIC(15, 2) NOT NULL DEFAULT 0,
  reference_type VARCHAR(50) NOT NULL,
  reference_number VARCHAR(100) NOT NULL,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  recipient_name VARCHAR(150),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(50),
  address TEXT
);

-- 10. PRODUCTION_ORDERS
CREATE TABLE IF NOT EXISTS production_orders (
  id VARCHAR(64) PRIMARY KEY,
  spk_number VARCHAR(100) NOT NULL UNIQUE,
  product_name VARCHAR(200) NOT NULL,
  line_name VARCHAR(100) NOT NULL,
  target_quantity NUMERIC(12, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'BERJALAN',
  start_date DATE,
  due_date DATE
);

-- 11. STOCK_OPNAMES
CREATE TABLE IF NOT EXISTS stock_opnames (
  id VARCHAR(64) PRIMARY KEY,
  opname_number VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  warehouse VARCHAR(100) NOT NULL,
  started_by VARCHAR(64) NOT NULL REFERENCES users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'BERJALAN',
  total_items INT DEFAULT 0,
  discrepant_items INT DEFAULT 0,
  total_discrepancy_value NUMERIC(15, 2) DEFAULT 0,
  approved_by VARCHAR(64) REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ
);

-- 12. STOCK_OPNAME_ITEMS
CREATE TABLE IF NOT EXISTS stock_opname_items (
  id VARCHAR(64) PRIMARY KEY,
  opname_id VARCHAR(64) NOT NULL REFERENCES stock_opnames(id) ON DELETE CASCADE,
  material_id VARCHAR(64) NOT NULL REFERENCES materials(id),
  location_id VARCHAR(64) NOT NULL REFERENCES locations(id),
  system_stock NUMERIC(12, 2) NOT NULL,
  physical_stock NUMERIC(12, 2) NOT NULL,
  discrepancy_qty NUMERIC(12, 2) NOT NULL,
  discrepancy_value NUMERIC(15, 2) NOT NULL,
  counted_by VARCHAR(64) NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. DISCREPANCIES (Active cases for neutral investigation)
CREATE TABLE IF NOT EXISTS discrepancies (
  id VARCHAR(64) PRIMARY KEY,
  discrepancy_number VARCHAR(100) NOT NULL UNIQUE,
  material_id VARCHAR(64) NOT NULL REFERENCES materials(id),
  location_id VARCHAR(64) NOT NULL REFERENCES locations(id),
  system_stock NUMERIC(12, 2) NOT NULL,
  physical_stock NUMERIC(12, 2) NOT NULL,
  variance_qty NUMERIC(12, 2) NOT NULL,
  variance_value NUMERIC(15, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PERLU_PEMERIKSAAN',
  investigation_notes TEXT,
  assigned_to VARCHAR(64) REFERENCES users(id),
  opname_id VARCHAR(64) REFERENCES stock_opnames(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 14. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id VARCHAR(64),
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_pg_mat_code ON materials(code);
CREATE INDEX IF NOT EXISTS idx_pg_trx_mat ON inventory_transactions(material_id);
CREATE INDEX IF NOT EXISTS idx_pg_trx_created ON inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_pg_disc_mat ON discrepancies(material_id);
CREATE INDEX IF NOT EXISTS idx_pg_disc_status ON discrepancies(status);
