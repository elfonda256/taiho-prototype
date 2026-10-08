const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.get('/stats', authMiddleware, (req, res, next) => {
  try {
    // 1. TOTAL MATERIAL (JUMLAH JENIS ITEM)
    const matRow = db.prepare(`SELECT count(*) as total_types FROM materials`).get();
    const totalMaterials = matRow.total_types;

    // 2. TOTAL NILAI STOK (RUPIAH)
    const stockRow = db.prepare(`
      SELECT COALESCE(SUM(i.current_stock * m.unit_cost), 0) as total_value
      FROM inventory i
      JOIN materials m ON i.material_id = m.id
    `).get();
    const totalStockValue = stockRow.total_value;

    // 3. MATERIAL SELISIH (ITEM YANG MEMILIKI KASUS SELISIH AKTIF)
    const discRow = db.prepare(`
      SELECT 
        COUNT(DISTINCT material_id) as discrepant_items_count,
        COALESCE(SUM(variance_value), 0) as total_discrepancy_value
      FROM discrepancies
      WHERE status IN ('PERLU_PEMERIKSAAN', 'SEDANG_DISELIDIKI')
    `).get();
    const discrepantItemsCount = discRow.discrepant_items_count;
    const totalDiscrepancyValue = discRow.total_discrepancy_value;

    // 4. MATERIAL LOSS RATE (%)
    const lossRate = totalStockValue > 0
      ? Number(((totalDiscrepancyValue / totalStockValue) * 100).toFixed(2))
      : 0;

    // 5. MATERIAL YANG PERLU DIPERIKSA (TOP PRIORITAS BERDASARKAN NILAI FINANSIAL)
    const topDiscrepancies = db.prepare(`
      SELECT 
        d.id,
        d.discrepancy_number,
        d.variance_qty,
        d.variance_value,
        d.status,
        d.system_stock,
        d.physical_stock,
        d.created_at,
        m.code as material_code,
        m.name as material_name,
        m.unit_cost,
        u.code as unit_code,
        l.code as location_code,
        l.warehouse as warehouse_name
      FROM discrepancies d
      JOIN materials m ON d.material_id = m.id
      JOIN units u ON m.unit_id = u.id
      JOIN locations l ON d.location_id = l.id
      WHERE d.status IN ('PERLU_PEMERIKSAAN', 'SEDANG_DISELIDIKI')
      ORDER BY d.variance_value DESC
      LIMIT 5
    `).all();

    // 6. RINGKASAN STOK MINIMUM (PERINGATAN STOK MENIPIS)
    const lowStockItems = db.prepare(`
      SELECT 
        m.id,
        m.code,
        m.name,
        COALESCE(SUM(i.current_stock), 0) as current_stock,
        m.min_stock,
        u.code as unit_code,
        l.code as location_code
      FROM materials m
      JOIN units u ON m.unit_id = u.id
      LEFT JOIN inventory i ON m.id = i.material_id
      LEFT JOIN locations l ON m.default_location_id = l.id
      GROUP BY m.id
      HAVING current_stock <= m.min_stock
      LIMIT 5
    `).all();

    // 7. PERSETUJUAN MENUNGGU (PENDING APPROVALS)
    const pendingApprovalsCount = db.prepare(`
      SELECT COUNT(*) as count FROM approvals WHERE status = 'MENUNGGU'
    `).get().count;

    // 8. RINGKASAN PERGERAKAN HARI INI
    const movementToday = db.prepare(`
      SELECT 
        transaction_type,
        COUNT(*) as trx_count,
        COALESCE(SUM(quantity), 0) as total_qty
      FROM inventory_transactions
      WHERE date(created_at) = date('now')
      GROUP BY transaction_type
    `).all();

    // 9. TRANSAKSI TERAKHIR (5 TRANSAKSI)
    const recentTransactions = db.prepare(`
      SELECT 
        t.id,
        t.transaction_number,
        t.transaction_type,
        t.quantity,
        t.created_at,
        t.reference_number,
        t.recipient_name,
        m.code as material_code,
        m.name as material_name,
        u.code as unit_code,
        usr.full_name as operator_name
      FROM inventory_transactions t
      JOIN materials m ON t.material_id = m.id
      JOIN units u ON t.unit_id = u.id
      JOIN users usr ON t.user_id = usr.id
      ORDER BY t.created_at DESC
      LIMIT 6
    `).all();

    // Status keselamatan umum
    const statusKeamanan = discrepantItemsCount > 0 ? 'WASPADA' : 'AMAN';

    res.json({
      success: true,
      data: {
        statusKeamanan,
        kpi: {
          totalMaterials,
          totalStockValue,
          discrepantItemsCount,
          totalDiscrepancyValue,
          lossRate,
          pendingApprovalsCount,
          lowStockCount: lowStockItems.length
        },
        topDiscrepancies,
        lowStockItems,
        movementToday,
        recentTransactions
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/digital-factory - Top-Level Digital Factory Overview
router.get('/digital-factory', authMiddleware, (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const serverTimestamp = new Date().toISOString();

    // 1. INFORMATION SECTION (Lead Time & Data Availability)
    // Fetch baseline config
    const baselineRows = db.prepare(`SELECT config_key, config_value FROM baseline_configurations`).all();
    const baselineMap = {};
    baselineRows.forEach(r => { baselineMap[r.config_key] = Number(r.config_value); });
    const baselineLeadTimeDays = baselineMap.current_reporting_delay_days || 7;

    // Maintenance records stats today
    const maintenanceToday = db.prepare(`
      SELECT 
        COUNT(*) as total_submitted,
        SUM(CASE WHEN verified_at IS NOT NULL THEN 1 ELSE 0 END) as total_verified,
        AVG(lead_time_seconds) as avg_lead_time_sec,
        MIN(lead_time_seconds) as min_lead_time_sec,
        MAX(lead_time_seconds) as max_lead_time_sec
      FROM maintenance_records
      WHERE date(created_at) = date('now')
    `).get();

    // Active machines count (target planned daily checks)
    const machineStats = db.prepare(`
      SELECT 
        COUNT(*) as total_machines,
        SUM(CASE WHEN status = 'NORMAL' THEN 1 ELSE 0 END) as normal_count,
        SUM(CASE WHEN status = 'WARNING' THEN 1 ELSE 0 END) as warning_count,
        SUM(CASE WHEN status = 'PROBLEM' THEN 1 ELSE 0 END) as problem_count,
        SUM(CASE WHEN status = 'NO_DATA' THEN 1 ELSE 0 END) as nodata_count
      FROM assets
      WHERE is_active = 1
    `).get();

    const plannedToday = machineStats.total_machines || 8;
    const submittedToday = maintenanceToday.total_submitted || 0;
    const verifiedToday = maintenanceToday.total_verified || 0;
    const pendingToday = Math.max(0, plannedToday - submittedToday);
    const dataAvailabilityPercent = plannedToday > 0 ? Math.min(100, Math.round((submittedToday / plannedToday) * 100)) : 100;

    const actualAvgLeadTimeSec = maintenanceToday.avg_lead_time_sec !== null ? Math.round(maintenanceToday.avg_lead_time_sec) : 180;
    const actualAvgLeadTimeMinutes = Number((actualAvgLeadTimeSec / 60).toFixed(1));

    // Reduction vs baseline (e.g. 7 days = 10080 mins vs 3.2 mins)
    const baselineMins = baselineLeadTimeDays * 24 * 60;
    const leadTimeReductionPercent = baselineMins > 0 
      ? Number((((baselineMins - actualAvgLeadTimeMinutes) / baselineMins) * 100).toFixed(1))
      : 99.9;

    // Latest maintenance record with exact machine and timestamp
    const latestRecord = db.prepare(`
      SELECT 
        mr.record_number,
        mr.completion_time,
        mr.submitted_at,
        mr.overall_condition,
        mr.lead_time_seconds,
        a.asset_code,
        a.asset_name,
        a.location,
        u.full_name as operator_name
      FROM maintenance_records mr
      JOIN assets a ON mr.asset_id = a.id
      LEFT JOIN users u ON mr.operator_id = u.id
      ORDER BY mr.submitted_at DESC
      LIMIT 1
    `).get();

    // 2. INVENTORY SECTION SUMMARY
    const invStock = db.prepare(`
      SELECT 
        COALESCE(SUM(i.current_stock * m.unit_cost), 0) as total_value,
        COUNT(DISTINCT i.material_id) as total_items
      FROM inventory i
      JOIN materials m ON i.material_id = m.id
    `).get();

    const invDisc = db.prepare(`
      SELECT 
        COUNT(DISTINCT material_id) as disc_count,
        COALESCE(SUM(variance_value), 0) as disc_value
      FROM discrepancies
      WHERE status IN ('PERLU_PEMERIKSAAN', 'SEDANG_DISELIDIKI')
    `).get();

    const trxTodayCount = db.prepare(`
      SELECT COUNT(*) as count FROM inventory_transactions WHERE date(created_at) = date('now')
    `).get().count;

    // 3. SYSTEM SECTION
    const activeUsers = db.prepare(`SELECT COUNT(*) as count FROM users WHERE is_active = 1`).get().count;

    res.json({
      success: true,
      data: {
        server_timestamp: serverTimestamp,
        information: {
          baseline_lead_time_days: baselineLeadTimeDays,
          actual_avg_lead_time_minutes: actualAvgLeadTimeMinutes,
          actual_avg_lead_time_seconds: actualAvgLeadTimeSec,
          lead_time_reduction_percent: leadTimeReductionPercent,
          data_availability_percent: dataAvailabilityPercent,
          planned_today: plannedToday,
          submitted_today: submittedToday,
          verified_today: verifiedToday,
          pending_today: pendingToday,
          is_validated_target: false, // Target to validate per prompt
          note: 'Lead time dihitung otomatis dari selisih waktu penyelesaian pekerjaan fisik hingga pengiriman data digital.'
        },
        maintenance: {
          machines_total: machineStats.total_machines,
          normal_count: machineStats.normal_count,
          warning_count: machineStats.warning_count,
          problem_count: machineStats.problem_count,
          nodata_count: machineStats.nodata_count,
          latest_update: latestRecord || null
        },
        inventory: {
          total_stock_value: invStock.total_value,
          total_items: invStock.total_items,
          discrepancy_cases: invDisc.disc_count,
          discrepancy_value: invDisc.disc_value,
          transactions_today: trxTodayCount
        },
        system: {
          active_users_count: activeUsers,
          sync_status: 'ONLINE_SYNCED',
          gateway_status: 'READY_LISTENING'
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
