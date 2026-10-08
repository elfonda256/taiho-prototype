const assert = require('assert');

async function runE2ESimulation() {
  console.log('========================================================================');
  console.log(' SIMULASI OPERASIONAL END-TO-END PABRIK (MATERIAL LOSS PREVENTION)');
  console.log('========================================================================\n');

  const BASE_URL = 'http://localhost:5001';
  const authHeaders = { 'Content-Type': 'application/json', 'x-user-id': 'usr_budi' };

  // 1. CEK STATUS KESEHATAN SISTEM
  console.log('[1/7] Memeriksa status kesehatan server...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const health = await healthRes.json();
  assert.strictEqual(health.status, 'online');
  console.log('  ✅ Server online & operasional:', health.system);

  // 2. DASBOR EKSEKUTIF (4 ANGKA UTAMA)
  console.log('\n[2/7] Mengambil data dasbor eksekutif...');
  const dashRes = await fetch(`${BASE_URL}/api/dashboard/stats`, { headers: authHeaders });
  const dash = await dashRes.json();
  assert(dash.success);
  console.log(`  ✅ Total Material: ${dash.data.kpi.totalMaterials} jenis`);
  console.log(`  ✅ Total Nilai Stok: Rp ${dash.data.kpi.totalStockValue.toLocaleString('id-ID')}`);
  console.log(`  ✅ Material Selisih Aktif: ${dash.data.kpi.discrepantItemsCount} item`);
  console.log(`  ✅ Nilai Selisih: Rp ${dash.data.kpi.totalDiscrepancyValue.toLocaleString('id-ID')}`);
  console.log(`  ✅ Tingkat Kehilangan (Loss Rate): ${dash.data.kpi.lossRate}%`);

  // 3. SKENARIO OPERATOR: PENGELUARAN CEPAT (MATERIAL KELUAR)
  console.log('\n[3/7] Simulasi Operator Gudang (Pak Budi): Pengeluaran Cepat 25 PCS Bearing Shell A...');
  const issueRes = await fetch(`${BASE_URL}/api/transactions/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_budi' },
    body: JSON.stringify({
      material_id: 'mat_01',
      quantity: 25,
      destination_line: 'Lini Produksi 01',
      spk_number: 'SPK-2026-10-001',
      recipient_name: 'Joko Prasetyo (Produksi)',
      notes: 'Komponen pompa batch reguler'
    })
  });
  const issueData = await issueRes.json();
  assert(issueData.success, 'Transaksi pengeluaran harus sukses');
  console.log(`  ✅ Nomor Transaksi: ${issueData.data.transaction_number}`);
  console.log(`  ✅ Stok: ${issueData.data.previous_stock} → ${issueData.data.new_stock} (Berkurang 25 unit)`);
  console.log(`  ✅ Nilai Finansial Transaksi: Rp ${Math.abs(issueData.data.financial_impact).toLocaleString('id-ID')}`);

  // 4. SKENARIO PRODUKSI: PENGEMBALIAN SISA (RETURN)
  console.log('\n[4/7] Simulasi Pengembalian Material Sisa: 5 PCS Dikembalikan ke Gudang...');
  const returnRes = await fetch(`${BASE_URL}/api/transactions/return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_budi' },
    body: JSON.stringify({
      material_id: 'mat_01',
      quantity: 5,
      from_line: 'Lini Produksi 01',
      return_reason: 'SISA_PRODUKSI',
      notes: 'Sisa perakitan pompa batch 1'
    })
  });
  const returnData = await returnRes.json();
  assert(returnData.success, 'Transaksi pengembalian harus sukses');
  console.log(`  ✅ Nomor Pengembalian: ${returnData.data.transaction_number}`);
  console.log(`  ✅ Stok Baru di Gudang: ${returnData.data.new_stock} unit`);

  // 5. SKENARIO STOCK OPNAME & DETEKSI SELISIH NETRAL
  console.log('\n[5/7] Simulasi Stock Opname Lapangan: Penghitungan Fisik Bushing Kuningan...');
  // Ambil sesi opname aktif
  const opnamesRes = await fetch(`${BASE_URL}/api/opnames`, { headers: authHeaders });
  const opnames = await opnamesRes.json();
  const activeOpnameId = opnames.data[0].id;

  const countRes = await fetch(`${BASE_URL}/api/opnames/${activeOpnameId}/count`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_budi' },
    body: JSON.stringify({
      material_code_or_id: 'MAT-000107', // Bushing Kuningan
      physical_stock: 900, // sistem ada 920 -> selisih -20
      notes: 'Dihitung di rak B02 ambalan 1'
    })
  });
  const countData = await countRes.json();
  assert(countData.success, 'Pencatatan hitung opname harus sukses');
  console.log(`  ✅ Status Evaluasi: ${countData.data.status_evaluasi}`);
  console.log(`  ✅ Selisih Terhitung: ${countData.data.discrepancy_qty} unit`);
  console.log(`  ✅ Dampak Finansial: Rp ${countData.data.discrepancy_value.toLocaleString('id-ID')}`);
  console.log(`  ✅ Pesan Ramah Pengguna: "${countData.message}"`);

  // 6. VALIDASI INTEGRITAS & PENCEGAHAN STOK NEGATIF
  console.log('\n[6/7] Menguji Batas Keamanan: Percobaan Pengeluaran Melebihi Stok...');
  const excessiveRes = await fetch(`${BASE_URL}/api/transactions/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_budi' },
    body: JSON.stringify({
      material_id: 'mat_01',
      quantity: 999999,
      destination_line: 'Lini Produksi 01',
      high_value_confirmed: true
    })
  });
  const excessiveData = await excessiveRes.json();
  assert(!excessiveData.success, 'Pengeluaran melebihi stok harus ditolak');
  console.log(`  ✅ Sistem Menolak Transaksi Negatif: "${excessiveData.message}"`);
  console.log(`  ✅ Panduan Pemulihan: "${excessiveData.bantuan}"`);

  // 7. JEJAK AUDIT & RANTAI PERTANGGUNGJAWABAN (CHAIN OF CUSTODY)
  console.log('\n[7/7] Memeriksa Rantai Pertanggungjawaban (Chain of Custody) MAT-000101...');
  const chainRes = await fetch(`${BASE_URL}/api/transactions/chain-of-custody/MAT-000101`, { headers: authHeaders });
  const chainData = await chainRes.json();
  assert(chainData.success);
  console.log(`  ✅ Jumlah Titik Jejak Digital: ${chainData.chain_of_custody_events.length} mutasi`);
  chainData.chain_of_custody_events.slice(-3).forEach(ev => {
    console.log(`     • [${ev.transaction_type}] ${ev.transaction_number} | ${ev.quantity} unit | Oleh: ${ev.operator_name} | Ref: ${ev.reference_number}`);
  });

  console.log('\n========================================================================');
  console.log(' SELURUH 7 SKENARIO SIMULASI OPERASIONAL DINYATAKAN LULUS 100%!');
  console.log('========================================================================\n');
}

runE2ESimulation().catch(err => {
  console.error('SIMULASI GAGAL:', err);
  process.exit(1);
});
