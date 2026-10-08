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

-- 15. IDEMPOTENCY_KEYS
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key VARCHAR(128) PRIMARY KEY,
  transaction_id VARCHAR(100),
  response_payload TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 16. MATERIAL_RECEIPTS
CREATE TABLE IF NOT EXISTS material_receipts (
  id VARCHAR(64) PRIMARY KEY,
  receipt_number VARCHAR(100) NOT NULL UNIQUE,
  material_id VARCHAR(64) NOT NULL REFERENCES materials(id),
  quantity NUMERIC(12, 2) NOT NULL,
  to_location_id VARCHAR(64) NOT NULL REFERENCES locations(id),
  supplier_id VARCHAR(64),
  po_number VARCHAR(100),
  delivery_note_number VARCHAR(100),
  operator_id VARCHAR(64) NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MODUL PEMELIHARAAN (MAINTENANCE) & FIELD DATA COLLECTION
-- ============================================================================

-- 17. ASSETS
CREATE TABLE IF NOT EXISTS assets (
  id VARCHAR(64) PRIMARY KEY,
  asset_code VARCHAR(50) NOT NULL UNIQUE,
  asset_name VARCHAR(150) NOT NULL,
  machine_type VARCHAR(100) NOT NULL,
  production_area VARCHAR(100) NOT NULL,
  location VARCHAR(100) NOT NULL,
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
  current_condition TEXT NOT NULL DEFAULT 'Baik & Siap Beroperasi',
  installation_date DATE,
  last_maintenance_at TIMESTAMPTZ,
  next_maintenance_at TIMESTAMPTZ,
  qr_code_payload VARCHAR(100) NOT NULL UNIQUE,
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 18. MAINTENANCE_CHECKLISTS
CREATE TABLE IF NOT EXISTS maintenance_checklists (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  machine_type VARCHAR(100) NOT NULL,
  maintenance_type VARCHAR(50) NOT NULL,
  estimated_duration_minutes INTEGER DEFAULT 10,
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 19. MAINTENANCE_CHECKLIST_ITEMS
CREATE TABLE IF NOT EXISTS maintenance_checklist_items (
  id VARCHAR(64) PRIMARY KEY,
  checklist_id VARCHAR(64) NOT NULL REFERENCES maintenance_checklists(id) ON DELETE CASCADE,
  item_order INTEGER NOT NULL,
  item_label VARCHAR(255) NOT NULL,
  standard_description TEXT,
  item_type VARCHAR(50) NOT NULL DEFAULT 'STATUS',
  min_value NUMERIC(10, 2),
  max_value NUMERIC(10, 2),
  unit VARCHAR(30),
  requires_action_if_fail SMALLINT DEFAULT 1
);

-- 20. MAINTENANCE_RECORDS
CREATE TABLE IF NOT EXISTS maintenance_records (
  id VARCHAR(64) PRIMARY KEY,
  record_number VARCHAR(100) NOT NULL UNIQUE,
  asset_id VARCHAR(64) NOT NULL REFERENCES assets(id),
  maintenance_type VARCHAR(50) NOT NULL,
  checklist_id VARCHAR(64) REFERENCES maintenance_checklists(id),
  operator_id VARCHAR(64) NOT NULL REFERENCES users(id),
  start_time TIMESTAMPTZ NOT NULL,
  completion_time TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lead_time_seconds INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
  overall_condition VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
  checklist_results JSONB,
  findings TEXT,
  action_taken TEXT,
  parts_used TEXT,
  photo_url TEXT,
  remarks TEXT,
  supervisor_id VARCHAR(64) REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  is_offline_submission SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 21. SENSOR_TELEMETRY
CREATE TABLE IF NOT EXISTS sensor_telemetry (
  id VARCHAR(64) PRIMARY KEY,
  asset_id VARCHAR(64) NOT NULL REFERENCES assets(id),
  protocol VARCHAR(50) NOT NULL DEFAULT 'MODBUS_TCP',
  parameter_name VARCHAR(100) NOT NULL,
  parameter_value NUMERIC(12, 4) NOT NULL,
  parameter_unit VARCHAR(30) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 22. BASELINE_CONFIGURATIONS
CREATE TABLE IF NOT EXISTS baseline_configurations (
  id VARCHAR(64) PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value NUMERIC(15, 2) NOT NULL,
  description TEXT,
  unit VARCHAR(50),
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_pg_mat_code ON materials(code);
CREATE INDEX IF NOT EXISTS idx_pg_trx_mat ON inventory_transactions(material_id);
CREATE INDEX IF NOT EXISTS idx_pg_trx_created ON inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_pg_disc_mat ON discrepancies(material_id);
CREATE INDEX IF NOT EXISTS idx_pg_disc_status ON discrepancies(status);
CREATE INDEX IF NOT EXISTS idx_pg_assets_code ON assets(asset_code);
CREATE INDEX IF NOT EXISTS idx_pg_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_pg_mnt_asset ON maintenance_records(asset_id);
CREATE INDEX IF NOT EXISTS idx_pg_mnt_submitted ON maintenance_records(submitted_at);
CREATE INDEX IF NOT EXISTS idx_pg_telemetry_asset ON sensor_telemetry(asset_id);
