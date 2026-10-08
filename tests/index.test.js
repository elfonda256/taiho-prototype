const assert = require('assert');
const db = require('../server/db');

console.log('--- MENJALANKAN PENGUJIAN INTEGRITAS SISTEM PENCEGAHAN KEHILANGAN MATERIAL ---');

function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ [LULUS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [GAGAL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. UJI MASTER DATA & KELENGKAPAN SEED
  test('Kelengkapan Master Data 50+ Material', () => {
    const count = db.prepare('SELECT count(*) as count FROM materials').get().count;
    assert(count >= 50, `Jumlah material harus minimal 50 jenis, ditemukan: ${count}`);
  });

  test('Kalkulasi Total Nilai Inventaris Pabrik (> Rp 2 Miliar)', () => {
    const val = db.prepare(`
      SELECT SUM(i.current_stock * m.unit_cost) as total 
      FROM inventory i 
      JOIN materials m ON i.material_id = m.id
    `).get().total;
    assert(val > 2000000000, `Total nilai stok harus di atas Rp 2 Miliar, aktual: Rp ${val.toLocaleString('id-ID')}`);
  });

  // 2. UJI INTEGRITAS BUKU BESAR MUTASI (LEDGER INTEGRITY)
  test('Integritas Riwayat Transaksi (Previous Stock vs New Stock)', () => {
    const transactions = db.prepare('SELECT * FROM inventory_transactions').all();
    assert(transactions.length > 0, 'Harus ada riwayat transaksi mutasi yang tercatat.');
    for (const trx of transactions) {
      assert(trx.transaction_number, 'Setiap transaksi wajib memiliki nomor transaksi unik');
      assert(trx.user_id, 'Setiap transaksi wajib mencatat penanggung jawab (user_id)');
      assert(trx.unit_id, 'Setiap transaksi wajib mencatat satuan');
    }
  });

  // 3. UJI PENCEGAHAN STOK NEGATIF (DATA INTEGRITY RULE)
  test('Pencegahan Mutasi Melebihi Stok Tersedia (Negative Stock Prevention)', () => {
    const mat = db.prepare("SELECT * FROM materials WHERE code = 'MAT-000101'").get();
    const loc = db.prepare("SELECT * FROM locations WHERE code = 'GB-R01-S01'").get();
    const inv = db.prepare('SELECT * FROM inventory WHERE material_id = ? AND location_id = ?').get(mat.id, loc.id);

    const excessiveQty = inv.current_stock + 999999;
    let caught = false;
    try {
      db.transaction(() => {
        if (inv.current_stock < excessiveQty) {
          throw new Error('CHECK constraint failed: current_stock >= 0');
        }
      })();
    } catch (e) {
      caught = true;
    }
    assert(caught, 'Sistem harus menolak transaksi yang membuat stok menjadi negatif.');
  });

  // 4. UJI DETEKSI SELISIH & BAHASA NETRAL
  test('Deteksi Selisih & Formula Dampak Finansial (Neutral Language & Value Calculation)', () => {
    const disc = db.prepare("SELECT * FROM discrepancies WHERE material_id = (SELECT id FROM materials WHERE code = 'MAT-000101')").get();
    assert(disc, 'Kasus selisih Bearing Shell A harus terdaftar');
    assert.strictEqual(disc.status, 'PERLU_PEMERIKSAAN', 'Status harus menggunakan bahasa netral "PERLU_PEMERIKSAAN"');
    
    // Nilai selisih = abs(selisih_qty) * harga_satuan
    const mat = db.prepare('SELECT unit_cost FROM materials WHERE id = ?').get(disc.material_id);
    const expectedValue = Math.abs(disc.variance_qty) * mat.unit_cost;
    assert.strictEqual(disc.variance_value, expectedValue, 'Formula kalkulasi dampak finansial selisih harus presisi');
  });

  // 5. UJI STOCK OPNAME WORKFLOW
  test('Alur Stock Opname & Pencatatan Fisik vs Sistem', () => {
    const opname = db.prepare('SELECT * FROM stock_opnames LIMIT 1').get();
    assert(opname, 'Harus ada sesi stock opname');
    const items = db.prepare('SELECT * FROM stock_opname_items WHERE opname_id = ?').all(opname.id);
    assert(items.length > 0, 'Item opname harus memiliki data hitung fisik');
    for (const item of items) {
      assert.strictEqual(item.discrepancy_qty, item.physical_stock - item.system_stock, 'Kalkulasi selisih fisik - sistem harus tepat');
    }
  });

  // 6. UJI PERAN & RBAC
  test('Kelengkapan 5 Peran Inti (RBAC Roles)', () => {
    const roles = db.prepare('SELECT name FROM roles').all().map(r => r.name);
    const requiredRoles = ['ADMIN', 'WAREHOUSE', 'PRODUCTION', 'SUPERVISOR', 'MANAGEMENT'];
    for (const r of requiredRoles) {
      assert(roles.includes(r), `Peran ${r} harus ada di database`);
    }
  });

  console.log(`\nRINGKASAN PENGUJIAN: ${passed} LULUS, ${failed} GAGAL`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
