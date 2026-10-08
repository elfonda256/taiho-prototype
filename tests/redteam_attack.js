const assert = require('assert');
const db = require('../server/db');

const BASE_URL = 'http://localhost:5001';

async function runRedTeamSuite() {
  console.log('========================================================================');
  console.log(' RED TEAM PENETRATION & INTEGRITY ATTACK SUITE');
  console.log(' SISTEM PENCEGAHAN KEHILANGAN MATERIAL (MANUFACTURING RUNTIME)');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  // Helper auth header for authorized requests
  const authHeaders = {
    'Content-Type': 'application/json',
    'x-user-id': 'usr_budi' // Pak Budi (Operator Gudang)
  };

  // ------------------------------------------------------------------------
  // ATTACK 1: DOUBLE SUBMIT / RAPID CLICK (IDEMPOTENCY & LOCKING TEST)
  // ------------------------------------------------------------------------
  console.log('>>> [ATTACK 1/7] DOUBLE SUBMIT / 10x RAPID CLICK ATTACK');
  try {
    // Ambil stok awal MAT-000101 dengan auth
    const matBefore = await fetch(`${BASE_URL}/api/materials/MAT-000101`, { headers: authHeaders }).then(r => r.json());
    assert(matBefore.success, 'Gagal mengambil data material awal');
    const initialStock = matBefore.data.total_current_stock;
    console.log(`    Stok awal MAT-000101: ${initialStock} unit`);

    const payload = {
      material_id: 'mat_01',
      quantity: 5,
      destination_line: 'Lini Produksi 01 (Perakitan Pompa)',
      spk_number: 'SPK-2026-REDTEAM-01',
      recipient_name: 'Joko Prasetyo',
      notes: 'Simulasi klik cepat 10x'
    };

    // Firing 10 concurrent requests within 1 millisecond
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        fetch(`${BASE_URL}/api/transactions/issue`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload)
        }).then(r => r.json())
      );
    }

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    const blockedCount = results.filter(r => !r.success && (r.duplicate_prevented || r.message?.includes('berulang'))).length;

    const matAfter = await fetch(`${BASE_URL}/api/materials/MAT-000101`, { headers: authHeaders }).then(r => r.json());
    const finalStock = matAfter.data.total_current_stock;
    const stockDeducted = initialStock - finalStock;

    console.log(`    Hasil Respons: ${successCount} Berhasil, ${blockedCount} Ditolak/Deduplikasi otomatis`);
    console.log(`    Stok berkurang: ${stockDeducted} unit (Harus tepat 5 unit, BUKAN 50 unit)`);

    assert.strictEqual(successCount, 1, 'Hanya tepat 1 transaksi yang boleh diproses');
    assert.strictEqual(stockDeducted, 5, 'Stok hanya boleh berkurang 5 unit');
    console.log('    ✅ PASSED: Serangan klik berulang (double transaction) berhasil ditangkal 100%!\n');
    passed++;
  } catch (err) {
    console.error('    ❌ FAILED:', err.message, '\n');
    failed++;
  }

  // ------------------------------------------------------------------------
  // ATTACK 2: EXCESSIVE / PHANTOM RETURN ATTACK
  // ------------------------------------------------------------------------
  console.log('>>> [ATTACK 2/7] EXCESSIVE / PHANTOM RETURN ATTACK (RETURN MORE THAN ISSUED)');
  try {
    const res = await fetch(`${BASE_URL}/api/transactions/return`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        material_id: 'mat_01',
        quantity: 500000,
        from_line: 'Lini Produksi 01 (Perakitan Pompa)',
        return_reason: 'SISA_PRODUKSI',
        notes: 'Percobaan retur fiktif 500.000 PCS'
      })
    });

    const data = await res.json();
    assert.strictEqual(data.success, false, 'Sistem harus menolak retur 500.000 PCS fiktif');
    assert(data.message.includes('Pengembalian ditolak'), 'Pesan harus menjelaskan penolakan retur');
    console.log(`    Respons Sistem: "${data.message}"`);
    console.log('    ✅ PASSED: Pengembalian fiktif / melebihi riwayat pengeluaran berhasil ditolak!\n');
    passed++;
  } catch (err) {
    console.error('    ❌ FAILED:', err.message, '\n');
    failed++;
  }

  // ------------------------------------------------------------------------
  // ATTACK 3: UNAUTHENTICATED REQUEST (INSECURE FALLBACK ELIMINATED)
  // ------------------------------------------------------------------------
  console.log('>>> [ATTACK 3/7] UNAUTHENTICATED INJECTION ATTACK');
  try {
    const res = await fetch(`${BASE_URL}/api/transactions/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // No token, no cookie, no header
      body: JSON.stringify({
        material_id: 'mat_01',
        quantity: 1,
        destination_line: 'Lini Siluman'
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 401, 'Request tanpa autentikasi wajib HTTP 401');
    assert.strictEqual(data.success, false);
    console.log(`    Respons Sistem (HTTP ${res.status}): "${data.message}"`);
    console.log('    ✅ PASSED: Bypass autentikasi berhasil ditutup total!\n');
    passed++;
  } catch (err) {
    console.error('    ❌ FAILED:', err.message, '\n');
    failed++;
  }

  // ------------------------------------------------------------------------
  // ATTACK 4: NEGATIVE STOCK ATTACK
  // ------------------------------------------------------------------------
  console.log('>>> [ATTACK 4/7] NEGATIVE STOCK ATTACK');
  try {
    const res = await fetch(`${BASE_URL}/api/transactions/issue`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        material_id: 'mat_01',
        quantity: 9999999,
        destination_line: 'Lini Produksi 01 (Perakitan Pompa)',
        high_value_confirmed: true // Disetujui nilai tinggi agar sampai ke pengecekan stok
      })
    });

    const data = await res.json();
    assert.strictEqual(data.success, false, 'Pengeluaran melebihi stok harus ditolak');
    assert(data.message.toLowerCase().includes('stok') && data.message.toLowerCase().includes('tidak cukup'), 'Harus menyebutkan stok tidak mencukupi');
    console.log(`    Respons Sistem: "${data.message}"`);
    console.log('    ✅ PASSED: Stok negatif dicegah pada lapisan database & API!\n');
    passed++;
  } catch (err) {
    console.error('    ❌ FAILED:', err.message, '\n');
    failed++;
  }

  // ------------------------------------------------------------------------
  // ATTACK 5: DIRECT DATABASE MUTATION ATTACK (IMMUTABLE TRIGGERS)
  // ------------------------------------------------------------------------
  console.log('>>> [ATTACK 5/7] DIRECT DATABASE LEDGER TAMPERING ATTACK');
  try {
    const sampleTrx = db.prepare('SELECT id FROM inventory_transactions LIMIT 1').get();
    assert(sampleTrx, 'Harus ada riwayat transaksi');

    let updateBlocked = false;
    try {
      db.prepare('UPDATE inventory_transactions SET quantity = 999 WHERE id = ?').run(sampleTrx.id);
    } catch (e) {
      if (e.message.includes('IMMUTABLE') || e.message.includes('DILARANG DIUBAH')) {
        updateBlocked = true;
      }
    }

    let deleteBlocked = false;
    try {
      db.prepare('DELETE FROM inventory_transactions WHERE id = ?').run(sampleTrx.id);
    } catch (e) {
      if (e.message.includes('IMMUTABLE') || e.message.includes('DILARANG DIHAPUS')) {
        deleteBlocked = true;
      }
    }

    assert(updateBlocked, 'Trigger SQLite wajib memblokir UPDATE pada riwayat mutasi');
    assert(deleteBlocked, 'Trigger SQLite wajib memblokir DELETE pada riwayat mutasi');
    console.log('    ✅ PASSED: Trigger imutabilitas database aktif (Anti-Tampering Ledger terbukti)!\n');
    passed++;
  } catch (err) {
    console.error('    ❌ FAILED:', err.message, '\n');
    failed++;
  }

  // ------------------------------------------------------------------------
  // ATTACK 6: HUMAN TYPO / HIGH-VALUE GUARD ATTACK
  // ------------------------------------------------------------------------
  console.log('>>> [ATTACK 6/7] HUMAN TYPO HIGH-VALUE UNCONFIRMED ATTACK (> RP 10 JUTA)');
  try {
    // Bearing Shell A unit_cost = Rp 85.000. Qty 200 = Rp 17.000.000 (di atas 10 Juta)
    const res = await fetch(`${BASE_URL}/api/transactions/issue`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        material_id: 'mat_01',
        quantity: 200,
        destination_line: 'Lini Produksi 01 (Perakitan Pompa)',
        high_value_confirmed: false // Tanpa konfirmasi
      })
    });

    const data = await res.json();
    assert.strictEqual(data.success, false, 'Transaksi bernilai tinggi tanpa konfirmasi harus ditahan');
    assert(data.requires_high_value_confirmation, 'Harus mensyaratkan konfirmasi nilai tinggi');
    console.log(`    Respons Sistem: "${data.message}"`);
    console.log('    ✅ PASSED: Pengaman salah ketik nilai tinggi (human error barrier) bekerja optimal!\n');
    passed++;
  } catch (err) {
    console.error('    ❌ FAILED:', err.message, '\n');
    failed++;
  }

  // ------------------------------------------------------------------------
  // ATTACK 7: COMPLETE MATHEMATICAL STOCK INTEGRITY CYCLE TEST
  // Initial: 1000 PCS -> Issue 100 -> Return 20 -> Issue 300 -> Transfer 200 -> Scrap 10 -> Expected: 410 PCS in source rack!
  // ------------------------------------------------------------------------
  console.log('>>> [ATTACK 7/7] MATHEMATICAL STOCK RECONCILIATION INTEGRITY CYCLE');
  try {
    // Setup dedicated test material in isolated rack
    const testMatId = 'mat_test_audit_' + Date.now();
    const testMatCode = 'MAT-AUDIT-' + Date.now().toString().slice(-4);
    const locA = 'loc_gb_r01_s01'; // Rak A01
    const locB = 'loc_gb_r01_s02'; // Rak A02

    db.prepare(`
      INSERT INTO materials (id, code, name, category_id, unit_id, unit_cost, min_stock, max_stock, qr_code_payload, status)
      VALUES (?, ?, 'Material Uji Audit Kepatuhan', 'cat_raw', 'unit_pcs', 50000, 100, 5000, ?, 'TERSEDIA')
    `).run(testMatId, testMatCode, `QR-${testMatCode}`);

    const invAId = 'inv_test_a_' + Date.now();
    db.prepare(`
      INSERT INTO inventory (id, material_id, location_id, current_stock, reserved_stock)
      VALUES (?, ?, ?, 1000, 0)
    `).run(invAId, testMatId, locA);

    console.log(`    Stok Awal Terdaftar di Rak A: 1.000 PCS`);

    // 1. Issue 100 PCS
    await fetch(`${BASE_URL}/api/transactions/issue`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        material_id: testMatId,
        quantity: 100,
        location_id: locA,
        destination_line: 'Lini Uji Audit',
        spk_number: 'SPK-AUDIT-CYCLE',
        recipient_name: 'Budi Test'
      })
    });
    console.log('    • Mutasi 1: Keluar (Issue) 100 PCS');

    // 2. Return 20 PCS
    await fetch(`${BASE_URL}/api/transactions/return`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        material_id: testMatId,
        quantity: 20,
        location_id: locA,
        from_line: 'Lini Uji Audit'
      })
    });
    console.log('    • Mutasi 2: Retur (Return) 20 PCS');

    // 3. Issue 300 PCS
    await fetch(`${BASE_URL}/api/transactions/issue`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        material_id: testMatId,
        quantity: 300,
        location_id: locA,
        destination_line: 'Lini Uji Audit',
        spk_number: 'SPK-AUDIT-CYCLE',
        recipient_name: 'Budi Test',
        high_value_confirmed: true // Value = 300 * 50k = 15M -> Confirmed
      })
    });
    console.log('    • Mutasi 3: Keluar (Issue) 300 PCS');

    // 4. Transfer 200 PCS from Rak A to Rak B
    await fetch(`${BASE_URL}/api/transactions/transfer`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        material_id: testMatId,
        quantity: 200,
        from_location_id: locA,
        to_location_id: locB,
        reason: 'Penyusunan ulang rak audit'
      })
    });
    console.log('    • Mutasi 4: Pindah (Transfer) 200 PCS dari Rak A ke Rak B');

    // 5. Scrap 10 PCS from Rak A
    await fetch(`${BASE_URL}/api/transactions/scrap`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        material_id: testMatId,
        quantity: 10,
        location_id: locA,
        reason: 'RUSAK_PROSES',
        notes: 'Uji afkir resmi'
      })
    });
    console.log('    • Mutasi 5: Afkir (Scrap) 10 PCS di Rak A');

    // Verify Stock: 1000 - 100 + 20 - 300 - 200 - 10 = 410 PCS in Rak A
    const finalInvA = db.prepare('SELECT current_stock FROM inventory WHERE id = ?').get(invAId);
    const finalInvB = db.prepare('SELECT current_stock FROM inventory WHERE material_id = ? AND location_id = ?').get(testMatId, locB);

    console.log(`    Stok Akhir Aktual di Rak A: ${finalInvA.current_stock} PCS (Target: 410 PCS)`);
    console.log(`    Stok Akhir Aktual di Rak B: ${finalInvB.current_stock} PCS (Target: 200 PCS)`);
    console.log(`    Total Stok Keseluruhan Pabrik: ${finalInvA.current_stock + finalInvB.current_stock} PCS (Target: 610 PCS)`);

    assert.strictEqual(finalInvA.current_stock, 410, 'Stok akhir di lokasi sumber wajib 410 PCS persis!');
    assert.strictEqual(finalInvB.current_stock, 200, 'Stok di lokasi tujuan transfer wajib 200 PCS persis!');
    console.log('    ✅ PASSED: Rekonsiliasi matematika integritas persediaan terbukti 100% presisi!\n');
    passed++;
  } catch (err) {
    console.error('    ❌ FAILED:', err.message, '\n');
    failed++;
  }

  console.log('========================================================================');
  console.log(` HASIL AKHIR RED TEAM: ${passed} LULUS, ${failed} GAGAL`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRedTeamSuite().catch(err => {
  console.error('CRITICAL RED TEAM ERROR:', err);
  process.exit(1);
});
