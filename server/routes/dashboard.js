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

module.exports = router;
