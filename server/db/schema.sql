-- DATABASE SCHEMA: SISTEM PENCEGAHAN KEHILANGAN MATERIAL
-- RELATIONAL INTEGRITY & TRANSACTIONAL LEDGER ARCHITECTURE

PRAGMA foreign_keys = ON;

-- 1. ROLES
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  department TEXT NOT NULL,
  phone TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT
);

-- 4. UNITS
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

-- 5. LOCATIONS (Warehouse -> Area -> Rack -> Shelf)
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  warehouse TEXT NOT NULL,
  area TEXT NOT NULL,
  rack TEXT NOT NULL,
  shelf TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

-- 6. MATERIALS
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id),
  unit_id TEXT NOT NULL REFERENCES units(id),
  default_location_id TEXT REFERENCES locations(id),
  unit_cost REAL NOT NULL DEFAULT 0,
  min_stock REAL NOT NULL DEFAULT 0,
  max_stock REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'TERSEDIA', -- TERSEDIA, DIALOKASIKAN, DI_PRODUKSI, DIKEMBALIKAN, SELISIH
  specification TEXT,
  qr_code_payload TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. INVENTORY (Current Stock balance per material & location)
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  current_stock REAL NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  reserved_stock REAL NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(material_id, location_id)
);

-- 8. INVENTORY_TRANSACTIONS (Immutable Digital Ledger)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id TEXT PRIMARY KEY,
  transaction_number TEXT NOT NULL UNIQUE,
  material_id TEXT NOT NULL REFERENCES materials(id),
  transaction_type TEXT NOT NULL, -- RECEIVE, ISSUE, RETURN, TRANSFER, SCRAP, ADJUSTMENT
  quantity REAL NOT NULL,
  unit_id TEXT NOT NULL REFERENCES units(id),
  from_location_id TEXT REFERENCES locations(id),
  to_location_id TEXT REFERENCES locations(id),
  previous_stock REAL NOT NULL,
  new_stock REAL NOT NULL,
  financial_impact REAL NOT NULL DEFAULT 0,
  reference_type TEXT NOT NULL, -- PO, SPK, SJ, OPNAME, SCRAP_REQ
  reference_number TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  recipient_name TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  address TEXT
);

-- 10. PRODUCTION_ORDERS (SPK)
CREATE TABLE IF NOT EXISTS production_orders (
  id TEXT PRIMARY KEY,
  spk_number TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  line_name TEXT NOT NULL,
  target_quantity REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'BERJALAN', -- DIRENCANAKAN, BERJALAN, SELESAI
  start_date DATE,
  due_date DATE
);

-- 11. MATERIAL_REQUESTS
CREATE TABLE IF NOT EXISTS material_requests (
  id TEXT PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  spk_id TEXT REFERENCES production_orders(id),
  material_id TEXT NOT NULL REFERENCES materials(id),
  quantity_requested REAL NOT NULL,
  quantity_issued REAL NOT NULL DEFAULT 0,
  production_line TEXT NOT NULL,
  requester_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'MENUNGGU', -- MENUNGGU, DISETUJUI, SELESAI, DITOLAK
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. MATERIAL_RECEIPTS
CREATE TABLE IF NOT EXISTS material_receipts (
  id TEXT PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  material_id TEXT NOT NULL REFERENCES materials(id),
  quantity REAL NOT NULL,
  to_location_id TEXT NOT NULL REFERENCES locations(id),
  supplier_id TEXT REFERENCES suppliers(id),
  po_number TEXT,
  delivery_note_number TEXT,
  operator_id TEXT NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. MATERIAL_ISSUES
CREATE TABLE IF NOT EXISTS material_issues (
  id TEXT PRIMARY KEY,
  issue_number TEXT NOT NULL UNIQUE,
  request_id TEXT REFERENCES material_requests(id),
  material_id TEXT NOT NULL REFERENCES materials(id),
  quantity REAL NOT NULL,
  from_location_id TEXT NOT NULL REFERENCES locations(id),
  destination_line TEXT NOT NULL,
  operator_id TEXT NOT NULL REFERENCES users(id),
  recipient_name TEXT NOT NULL,
  spk_number TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. MATERIAL_RETURNS
CREATE TABLE IF NOT EXISTS material_returns (
  id TEXT PRIMARY KEY,
  return_number TEXT NOT NULL UNIQUE,
  material_id TEXT NOT NULL REFERENCES materials(id),
  quantity REAL NOT NULL,
  to_location_id TEXT NOT NULL REFERENCES locations(id),
  from_line TEXT NOT NULL,
  return_reason TEXT NOT NULL, -- SISA_PRODUKSI, REVISI_DESAIN, SALAH_AMBIL, CACAT_BAHAN
  operator_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'DITERIMA', -- DIAJUKAN, DITERIMA, DITOLAK
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. MATERIAL_TRANSFERS
CREATE TABLE IF NOT EXISTS material_transfers (
  id TEXT PRIMARY KEY,
  transfer_number TEXT NOT NULL UNIQUE,
  material_id TEXT NOT NULL REFERENCES materials(id),
  quantity REAL NOT NULL,
  from_location_id TEXT NOT NULL REFERENCES locations(id),
  to_location_id TEXT NOT NULL REFERENCES locations(id),
  operator_id TEXT NOT NULL REFERENCES users(id),
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 15. MATERIAL_SCRAPS
CREATE TABLE IF NOT EXISTS material_scraps (
  id TEXT PRIMARY KEY,
  scrap_number TEXT NOT NULL UNIQUE,
  material_id TEXT NOT NULL REFERENCES materials(id),
  quantity REAL NOT NULL,
  location_id TEXT NOT NULL REFERENCES locations(id),
  financial_loss REAL NOT NULL,
  reason TEXT NOT NULL, -- RUSAK_PROSES, KADALUARSA, CACAT_GUDANG
  operator_id TEXT NOT NULL REFERENCES users(id),
  approved_by TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'MENUNGGU_PERSETUJUAN', -- MENUNGGU_PERSETUJUAN, DISETUJUI, DITOLAK
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. STOCK_OPNAMES
CREATE TABLE IF NOT EXISTS stock_opnames (
  id TEXT PRIMARY KEY,
  opname_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  warehouse TEXT NOT NULL,
  started_by TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'BERJALAN', -- BERJALAN, REVIEW_SUPERVISOR, SELESAI
  total_items INTEGER DEFAULT 0,
  discrepant_items INTEGER DEFAULT 0,
  total_discrepancy_value REAL DEFAULT 0,
  approved_by TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- 17. STOCK_OPNAME_ITEMS
CREATE TABLE IF NOT EXISTS stock_opname_items (
  id TEXT PRIMARY KEY,
  opname_id TEXT NOT NULL REFERENCES stock_opnames(id) ON DELETE CASCADE,
  material_id TEXT NOT NULL REFERENCES materials(id),
  location_id TEXT NOT NULL REFERENCES locations(id),
  system_stock REAL NOT NULL,
  physical_stock REAL NOT NULL,
  discrepancy_qty REAL NOT NULL,
  discrepancy_value REAL NOT NULL,
  counted_by TEXT NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 18. DISCREPANCIES (Kasus Selisih untuk Investigasi & Tindak Lanjut)
CREATE TABLE IF NOT EXISTS discrepancies (
  id TEXT PRIMARY KEY,
  discrepancy_number TEXT NOT NULL UNIQUE,
  material_id TEXT NOT NULL REFERENCES materials(id),
  location_id TEXT NOT NULL REFERENCES locations(id),
  system_stock REAL NOT NULL,
  physical_stock REAL NOT NULL,
  variance_qty REAL NOT NULL,
  variance_value REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'PERLU_PEMERIKSAAN', -- PERLU_PEMERIKSAAN, SEDANG_DISELIDIKI, DISETUJUI_PENYESUAIAN, SELESAI
  investigation_notes TEXT,
  assigned_to TEXT REFERENCES users(id),
  opname_id TEXT REFERENCES stock_opnames(id),
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 19. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 20. APPROVALS
CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  approval_type TEXT NOT NULL, -- SCRAP, DISCREPANCY_ADJUST, LARGE_ISSUE
  reference_id TEXT NOT NULL,
  requested_by TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'MENUNGGU', -- MENUNGGU, DISETUJUI, DITOLAK
  approved_by TEXT REFERENCES users(id),
  reason TEXT,
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME
);

-- INDEXES FOR HIGH-THROUGHPUT LOOKUPS
CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(code);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category_id);
CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);
CREATE INDEX IF NOT EXISTS idx_inventory_material ON inventory(material_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_trx_material ON inventory_transactions(material_id);
CREATE INDEX IF NOT EXISTS idx_trx_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_trx_created ON inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_discrepancies_material ON discrepancies(material_id);
CREATE INDEX IF NOT EXISTS idx_discrepancies_status ON discrepancies(status);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- 21. IDEMPOTENCY_KEYS (Pencegah Transaksi Ganda / Double-Click Prevention)
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  transaction_id TEXT,
  response_payload TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_idempotency_created ON idempotency_keys(created_at);

-- 22. IMMUTABILITY TRIGGERS (Anti-Tampering Ledger)
CREATE TRIGGER IF NOT EXISTS prevent_trx_update
BEFORE UPDATE ON inventory_transactions
BEGIN
  SELECT RAISE(ABORT, 'Buku besar transaksi mutasi bersifat permanen dan DILARANG DIUBAH (IMMUTABLE).');
END;

CREATE TRIGGER IF NOT EXISTS prevent_trx_delete
BEFORE DELETE ON inventory_transactions
BEGIN
  SELECT RAISE(ABORT, 'Buku besar transaksi mutasi bersifat permanen dan DILARANG DIHAPUS (IMMUTABLE).');
END;

CREATE TRIGGER IF NOT EXISTS prevent_audit_delete
BEFORE DELETE ON audit_logs
BEGIN
  SELECT RAISE(ABORT, 'Audit log sistem tidak boleh dihapus demi kepatuhan audit pabrik.');
END;
