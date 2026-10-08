const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const db = require('../db');
const { authMiddleware, requireRole, logAudit } = require('../middleware/auth');

// 1. GET ALL MATERIALS (WITH SEARCH, FILTER, AND STOCK)
router.get('/', authMiddleware, (req, res, next) => {
  try {
    const { search, category, status, limit = 100 } = req.query;

    let query = `
      SELECT 
        m.id,
        m.code,
        m.name,
        m.unit_cost,
        m.min_stock,
        m.max_stock,
        m.status,
        m.specification,
        m.qr_code_payload,
        c.id as category_id,
        c.name as category_name,
        u.id as unit_id,
        u.code as unit_code,
        l.id as default_location_id,
        l.code as location_code,
        l.warehouse,
        l.rack,
        l.shelf,
        COALESCE(SUM(i.current_stock), 0) as total_current_stock,
        COALESCE(SUM(i.reserved_stock), 0) as total_reserved_stock,
        COALESCE(SUM(i.current_stock * m.unit_cost), 0) as total_stock_value
      FROM materials m
      JOIN categories c ON m.category_id = c.id
      JOIN units u ON m.unit_id = u.id
      LEFT JOIN locations l ON m.default_location_id = l.id
      LEFT JOIN inventory i ON m.id = i.material_id
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += ` AND (m.code LIKE ? OR m.name LIKE ? OR m.specification LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (category) {
      query += ` AND m.category_id = ?`;
      params.push(category);
    }

    if (status) {
      query += ` AND m.status = ?`;
      params.push(status);
    }

    query += `
      GROUP BY m.id
      ORDER BY m.code ASC
      LIMIT ?
    `;
    params.push(Number(limit));

    const materials = db.prepare(query).all(...params);

    res.json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (err) {
    next(err);
  }
});

// 2. GET MATERIAL BY CODE OR ID (DETAIL LENGKAP & JEJAK HISTORIS)
router.get('/:identifier', authMiddleware, async (req, res, next) => {
  try {
    const { identifier } = req.params;

    const material = db.prepare(`
      SELECT 
        m.id,
        m.code,
        m.name,
        m.unit_cost,
        m.min_stock,
        m.max_stock,
        m.status,
        m.specification,
        m.qr_code_payload,
        c.name as category_name,
        u.code as unit_code,
        u.name as unit_name,
        l.id as default_location_id,
        l.code as location_code,
        l.warehouse,
        l.area,
        l.rack,
        l.shelf,
        COALESCE(SUM(i.current_stock), 0) as total_current_stock,
        COALESCE(SUM(i.reserved_stock), 0) as total_reserved_stock,
        COALESCE(SUM(i.current_stock * m.unit_cost), 0) as total_stock_value
      FROM materials m
      JOIN categories c ON m.category_id = c.id
      JOIN units u ON m.unit_id = u.id
      LEFT JOIN locations l ON m.default_location_id = l.id
      LEFT JOIN inventory i ON m.id = i.material_id
      WHERE m.id = ? OR m.code = ?
      GROUP BY m.id
    `).get(identifier, identifier);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: `Material dengan kode/ID '${identifier}' tidak ditemukan.`
      });
    }

    // Detail stok per lokasi rak
    const locationsBreakdown = db.prepare(`
      SELECT 
        i.id as inventory_id,
        i.current_stock,
        i.reserved_stock,
        (i.current_stock - i.reserved_stock) as available_stock,
        i.updated_at,
        l.id as location_id,
        l.code as location_code,
        l.warehouse,
        l.area,
        l.rack,
        l.shelf
      FROM inventory i
      JOIN locations l ON i.location_id = l.id
      WHERE i.material_id = ?
    `).all(material.id);

    // Hitung akumulasi pergerakan (In, Out, Return, Transfer, Scrap)
    const movementSummary = db.prepare(`
      SELECT 
        transaction_type,
        COUNT(*) as count,
        COALESCE(SUM(quantity), 0) as total_qty
      FROM inventory_transactions
      WHERE material_id = ?
      GROUP BY transaction_type
    `).all(material.id);

    // Riwayat transaksi lengkap terbaru (Buku Besar)
    const transactionHistory = db.prepare(`
      SELECT 
        t.id,
        t.transaction_number,
        t.transaction_type,
        t.quantity,
        t.previous_stock,
        t.new_stock,
        t.financial_impact,
        t.reference_type,
        t.reference_number,
        t.recipient_name,
        t.notes,
        t.created_at,
        u.code as unit_code,
        usr.full_name as operator_name,
        fl.code as from_location_code,
        tl.code as to_location_code
      FROM inventory_transactions t
      JOIN units u ON t.unit_id = u.id
      JOIN users usr ON t.user_id = usr.id
      LEFT JOIN locations fl ON t.from_location_id = fl.id
      LEFT JOIN locations tl ON t.to_location_id = tl.id
      WHERE t.material_id = ?
      ORDER BY t.created_at DESC
      LIMIT 20
    `).all(material.id);

    // Kasus selisih aktif jika ada
    const activeDiscrepancy = db.prepare(`
      SELECT * FROM discrepancies
      WHERE material_id = ? AND status IN ('PERLU_PEMERIKSAAN', 'SEDANG_DISELIDIKI')
      ORDER BY created_at DESC
      LIMIT 1
    `).get(material.id);

    // Generate QR Data URL
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(material.code, {
        errorCorrectionLevel: 'H',
        width: 250,
        margin: 2
      });
    } catch (e) {
      console.error('QR code generation error:', e);
    }

    res.json({
      success: true,
      data: {
        ...material,
        qrDataUrl,
        locations: locationsBreakdown,
        movementSummary,
        transactionHistory,
        activeDiscrepancy
      }
    });
  } catch (err) {
    next(err);
  }
});

// 3. CETAK LABEL QR
router.get('/:identifier/qr-label', authMiddleware, async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const material = db.prepare(`
      SELECT m.*, u.code as unit_code, l.code as location_code, l.warehouse, l.rack, l.shelf,
             COALESCE(SUM(i.current_stock), 0) as current_stock
      FROM materials m
      JOIN units u ON m.unit_id = u.id
      LEFT JOIN locations l ON m.default_location_id = l.id
      LEFT JOIN inventory i ON m.id = i.material_id
      WHERE m.id = ? OR m.code = ?
      GROUP BY m.id
    `).get(identifier, identifier);

    if (!material) {
      return res.status(404).json({ success: false, message: 'Material tidak ditemukan.' });
    }

    const qrDataUrl = await QRCode.toDataURL(material.code, { width: 300, margin: 1 });

    res.json({
      success: true,
      label: {
        code: material.code,
        name: material.name,
        location: material.location_code || 'Gudang Utama',
        warehouse: material.warehouse || '-',
        rack: material.rack || '-',
        shelf: material.shelf || '-',
        current_stock: material.current_stock,
        unit: material.unit_code,
        status: material.status,
        qrDataUrl
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
