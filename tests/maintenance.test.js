/**
 * TAIHO PLATFORM - OPERATIONAL INTEGRATION TEST SUITE
 * Tests real factory scenarios per specifications:
 * 1. Maintenance record completion & lead time
 * 2. Instant dashboard visibility
 * 3. Offline queuing & idempotent sync
 * 4. Role-based authorization & security
 * 5. Inventory movement & audit ledger preservation
 * 6. Duplicate submission prevention
 * 7. Maintenance FAIL validation
 * 8. Configurable baseline simulation
 * 9. Sensor telemetry ingestion
 */

const assert = require('assert');
const http = require('http');

const BASE_URL = 'http://localhost:5001';

async function request(path, options = {}) {
  const url = new URL(path, BASE_URL);
  const headers = options.headers || {};
  if (options.body && typeof options.body === 'object') {
    options.body = JSON.stringify(options.body);
    headers['Content-Type'] = 'application/json';
  }

  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log(' TAIHO PLATFORM - PENGUJIAN SKENARIO OPERASIONAL LAPANGAN');
  console.log('================================================================');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    process.stdout.write(`[TEST ${total}] ${name} ... `);
    try {
      await fn();
      console.log('PASSED (OK)');
      passed++;
    } catch (err) {
      console.log('FAILED (X)');
      console.error('   Error:', err.message);
    }
  }

  // Skenario 1: Operator completes maintenance
  await test('Skenario 1: Operator mencatat pemeliharaan (Record created + Lead Time dihitung)', async () => {
    const clientUuid = `test_uuid_${Date.now()}`;
    const res = await request('/api/maintenance/records', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_budi' },
      body: {
        asset_id: 'ast_cnc01',
        maintenance_type: 'Daily Inspection',
        overall_condition: 'NORMAL',
        start_time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        completion_time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        remarks: 'Pemeriksaan rutin lancar',
        client_uuid: clientUuid
      }
    });

    assert.strictEqual(res.status, 201, `Status code harus 201, didapat: ${res.status}`);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.record_number.startsWith('MNT-'));
    assert.ok(res.data.data.lead_time_seconds >= 0);
  });

  // Skenario 2: Manager immediately opens dashboard
  await test('Skenario 2: Manajer membuka dasbor seketika (Visible on Digital Factory Overview)', async () => {
    const res = await request('/api/dashboard/digital-factory', {
      method: 'GET',
      headers: { 'x-user-id': 'usr_bambang' } // Plant Manager
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.information.actual_avg_lead_time_minutes >= 0);
    assert.ok(res.data.data.information.submitted_today >= 1);
    assert.ok(res.data.data.maintenance.latest_update !== null);
  });

  // Skenario 3 & 4: Duplicate submission prevention
  await test('Skenario 3 & 4: Pencegahan duplikasi data saat sinkronisasi offline (Idempotent)', async () => {
    const fixedUuid = `offline_sync_test_${Date.now()}`;
    const payload = {
      asset_id: 'ast_press01',
      maintenance_type: 'Daily Inspection',
      overall_condition: 'NORMAL',
      remarks: 'Inspeksi press hidrolik',
      client_uuid: fixedUuid
    };

    // First submission
    const res1 = await request('/api/maintenance/records', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_joko' },
      body: payload
    });
    assert.strictEqual(res1.status, 201);
    assert.strictEqual(res1.data.data.is_duplicate, false);

    // Duplicate submission (replay)
    const res2 = await request('/api/maintenance/records', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_joko' },
      body: payload
    });
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.data.data.is_duplicate, true);
  });

  // Skenario 5: Unauthorized action rejected
  await test('Skenario 5: Operator lapangan ditolak saat mencoba ubah konfigurasi baseline (RBAC)', async () => {
    const res = await request('/api/baseline', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_budi' }, // WAREHOUSE role
      body: { labor_cost_per_hour: 999999 }
    });

    assert.strictEqual(res.status, 403, `Harus ditolak dengan status 403, didapat: ${res.status}`);
    assert.strictEqual(res.data.success, false);
  });

  // Skenario 6: Inventory transaction preserved
  await test('Skenario 6: Pengeluaran material gudang terhubung ke ledger mutasi (Stock update)', async () => {
    const res = await request('/api/transactions/issue', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_budi' },
      body: {
        material_id: 'mat_01',
        location_id: 'loc_gb_r01_s01',
        quantity: 5,
        destination_line: 'Lini Machining A',
        recipient_name: 'Seksi Machining A',
        notes: 'Uji pengeluaran material pemeliharaan'
      }
    });

    assert.ok(res.status === 200 || res.status === 201, `Status code harus 200 atau 201, didapat: ${res.status}`);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.transaction_number.startsWith('OUT-') || res.data.data.transaction_number.startsWith('TRX-'));
  });

  // Skenario 7: Maintenance FAIL validation
  await test('Skenario 7: Status FAIL wajib menyertakan temuan & tindakan perbaikan', async () => {
    // Attempt FAIL without findings and action_taken
    const resFailIncomplete = await request('/api/maintenance/records', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_joko' },
      body: {
        asset_id: 'ast_inj01',
        overall_condition: 'CRITICAL',
        remarks: 'Tanpa detail'
      }
    });

    assert.strictEqual(resFailIncomplete.status, 400);
    assert.strictEqual(resFailIncomplete.data.success, false);

    // Provide required findings & action_taken
    const resFailComplete = await request('/api/maintenance/records', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_joko' },
      body: {
        asset_id: 'ast_inj01',
        overall_condition: 'CRITICAL',
        findings: 'Heater barrel suhu anjlok 30C',
        action_taken: 'Mengganti thermocouple cadangan',
        remarks: 'Sudah ditangani'
      }
    });

    assert.strictEqual(resFailComplete.status, 201);
    assert.strictEqual(resFailComplete.data.data.asset_status, 'PROBLEM');
  });

  // Skenario 8: Baseline Simulation
  await test('Skenario 8: Simulasi ROI menghitung jam kerja terhemat tanpa angka rekaan', async () => {
    const res = await request('/api/baseline/roi-simulation?forms_per_day=30&minutes_per_form=15', {
      method: 'GET',
      headers: { 'x-user-id': 'usr_admin' }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.is_simulation, true);
    assert.ok(res.data.results.hours_saved_month > 0);
    assert.ok(res.data.results.estimated_monthly_labor_savings > 0);
  });

  // Skenario 9: Sensor Ingestion Service
  await test('Skenario 9: Telemetri sensor diterima oleh Ingestion Gateway Layer', async () => {
    const res = await request('/api/telemetry/ingest', {
      method: 'POST',
      headers: { 'x-gateway-key': 'taiho-iot-gateway-secure-2026' },
      body: {
        asset_code: 'CNC-01',
        parameter_name: 'SPINDLE_VIBRATION',
        parameter_value: 1.15,
        parameter_unit: 'mm/s',
        protocol: 'MODBUS_TCP'
      }
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.parameter_name, 'SPINDLE_VIBRATION');
  });

  console.log('================================================================');
  console.log(` HASIL: ${passed} / ${total} Skenario Operasional Berhasil Lolos.`);
  console.log('================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
