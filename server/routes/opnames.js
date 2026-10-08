const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, requireRole, logAudit } = require('../middleware/auth');

// 1. GET ALL STOCK OPNAMES
router.get('/', authMiddleware, (req, res, next) => {
  try {
    const opnames = db.prepare(`
      SELECT 
        o.*,
        u.full_name as started_by_name,
        apv.full_name as approved_by_name
      FROM stock_opnames o
      JOIN users u ON o.started_by = u.id
      LEFT JOIN users apv ON o.approved_by = apv.id
      ORDER BY o.created_at DESC
    `).all();

    res.json({
      success: true,
      data: opnames
    });
  } catch (err) {
    next(err);
  }
});

// 2. MULAI SESI STOCK OPNAME BARU
router.post('/start', authMiddleware, requireRole(['ADMIN', 'WAREHOUSE', 'SUPERVISOR']), (req, res, next) => {
  try {
    const { title, warehouse } = req.body;
    const opnameNumber = `OPN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const opnameId = `opn_${Date.now()}`;

    db.prepare(`
      INSERT INTO stock_opnames (
        id, opname_number, title, warehouse, started_by, status,
        total_items, discrepant_items, total_discrepancy_value, created_at
      ) VALUES (?, ?, ?, ?, ?, 'BERJALAN', 0, 0, 0, datetime('now'))
    `).run(
      opnameId,
      opnameNumber,
      title || `Stock Opname Fisik ${warehouse || 'Semua Gudang'}`,
      warehouse || 'Semua Gudang',
      req.user.id
    );

    logAudit(req.user.id, 'START_OPNAME', 'stock_opnames', opnameId, `Memulai sesi opname ${opnameNumber}`);

    res.json({
      success: true,
      message: 'Sesi stock opname berhasil dimulai.',
      data: {
        id: opnameId,
        opname_number: opnameNumber
      }
    });
  } catch (err) {
    next(err);
  }
});

// 3. GET DETAIL OPNAMES BESERTA ITEM YANG SUDAH DIHITUNG
router.get('/:id', authMiddleware, (req, res, next) => {
  try {
    const opname = db.prepare(`
      SELECT o.*, u.full_name as started_by_name, apv.full_name as approved_by_name
      FROM stock_opnames o
      JOIN users u ON o.started_by = u.id
      LEFT JOIN users apv ON o.approved_by = apv.id
      WHERE o.id = ?
    `).get(req.params.id);

    if (!opname) {
      return res.status(404).json({ success: false, message: 'Sesi stock opname tidak ditemukan.' });
    }

    const items = db.prepare(`
      SELECT 
        soi.*,
        m.code as material_code,
        m.name as material_name,
        m.unit_cost,
        u.code as unit_code,
        l.code as location_code,
        l.warehouse,
        usr.full_name as counter_name
      FROM stock_opname_items soi
      JOIN materials m ON soi.material_id = m.id
      JOIN units u ON m.unit_id = u.id
      JOIN locations l ON soi.location_id = l.id
      JOIN users usr ON soi.counted_by = usr.id
      WHERE soi.opname_id = ?
      ORDER BY soi.created_at DESC
    `).all(req.params.id);

    res.json({
      success: true,
      data: {
        opname,
        items
      }
    });
  } catch (err) {
    next(err);
  }
});

// 4. CATAT HASIL HITUNG FISIK (COUNT ITEM - FAST SCAN & DIFFERENCE CALCULATION)
router.post('/:id/count', authMiddleware, requireRole(['ADMIN', 'WAREHOUSE']), (req, res, next) => {
  try {
    const { id: opnameId } = req.params;
    const { material_code_or_id, location_id, physical_stock, notes } = req.body;

    const physQty = Number(physical_stock);
    if (isNaN(physQty) || physQty < 0) {
      return res.status(400).json({ success: false, message: 'Masukkan jumlah fisik aktual yang valid (0 atau lebih).' });
    }

    const countTx = db.transaction(() => {
      // 1. Ambil material
      const material = db.prepare(`
        SELECT * FROM materials WHERE id = ? OR code = ?
      `).get(material_code_or_id, material_code_or_id);

      if (!material) throw new Error('Material tidak ditemukan dengan kode tersebut.');

      // 2. Ambil lokasi atau default
      const locId = location_id || material.default_location_id;
      const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(locId);

      // 3. Ambil stok sistem saat ini
      const invRecord = db.prepare(`
        SELECT * FROM inventory WHERE material_id = ? AND location_id = ?
      `).get(material.id, locId);

      const systemStock = invRecord ? invRecord.current_stock : 0;
      const discrepancyQty = physQty - systemStock;
      const discrepancyValue = Math.abs(discrepancyQty) * material.unit_cost;

      // 4. Simpan ke stock_opname_items
      const itemId = `opi_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      db.prepare(`
        INSERT INTO stock_opname_items (
          id, opname_id, material_id, location_id, system_stock, physical_stock,
          discrepancy_qty, discrepancy_value, counted_by, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        itemId, opnameId, material.id, locId, systemStock, physQty,
        discrepancyQty, discrepancyValue, req.user.id, notes || ''
      );

      // 5. Jika ada selisih, buatkan rekam jejak di tabel discrepancies (Bahasa Netral)
      let discrepancyId = null;
      if (discrepancyQty !== 0) {
        discrepancyId = `dsc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const discNumber = `DISC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

        db.prepare(`
          INSERT INTO discrepancies (
            id, discrepancy_number, material_id, location_id, system_stock, physical_stock,
            variance_qty, variance_value, status, investigation_notes, opname_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PERLU_PEMERIKSAAN', ?, ?, datetime('now'))
        `).run(
          discrepancyId, discNumber, material.id, locId, systemStock, physQty,
          discrepancyQty, discrepancyValue,
          `Dicatat dari Opname #${opnameId}. ${notes || 'Diperlukan pemeriksaan fisik dan pencocokan dokumen.'}`,
          opnameId
        );

        // Update status material menjadi SELISIH
        db.prepare(`UPDATE materials SET status = 'SELISIH' WHERE id = ?`).run(material.id);
      }

      // 6. Perbarui agregat sesi opname
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total_items,
          SUM(CASE WHEN discrepancy_qty != 0 THEN 1 ELSE 0 END) as discrepant_items,
          COALESCE(SUM(discrepancy_value), 0) as total_val
        FROM stock_opname_items
        WHERE opname_id = ?
      `).get(opnameId);

      db.prepare(`
        UPDATE stock_opnames
        SET total_items = ?, discrepant_items = ?, total_discrepancy_value = ?
        WHERE id = ?
      `).run(stats.total_items, stats.discrepant_items, stats.total_val, opnameId);

      return {
        item_id: itemId,
        material_code: material.code,
        material_name: material.name,
        system_stock: systemStock,
        physical_stock: physQty,
        discrepancy_qty: discrepancyQty,
        discrepancy_value: discrepancyValue,
        status_evaluasi: discrepancyQty === 0 ? 'COCOK' : 'PERLU_PEMERIKSAAN'
      };
    });

    const result = countTx();

    res.json({
      success: true,
      message: result.discrepancy_qty === 0 
        ? `Stok ${result.material_name} sesuai (Sistem: ${result.system_stock}, Fisik: ${result.physical_stock}).`
        : `⚠️ Terdapat selisih ${result.discrepancy_qty} unit pada ${result.material_name}. Diperlukan pemeriksaan.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// 5. AJUKAN REVIEW KE SUPERVISOR
router.post('/:id/submit-review', authMiddleware, requireRole(['ADMIN', 'WAREHOUSE', 'SUPERVISOR']), (req, res, next) => {
  try {
    const { id } = req.params;
    db.prepare(`
      UPDATE stock_opnames SET status = 'REVIEW_SUPERVISOR' WHERE id = ?
    `).run(id);

    res.json({
      success: true,
      message: 'Sesi stock opname telah diajukan untuk ditinjau oleh Supervisor.'
    });
  } catch (err) {
    next(err);
  }
});

// 6. PERSETUJUAN & PENYESUAIAN STOK OLEH SUPERVISOR (ADJUSTMENT TRANSACTIONS)
router.post('/:id/approve', authMiddleware, requireRole(['ADMIN', 'SUPERVISOR']), (req, res, next) => {
  try {
    const { id } = req.params;

    const approveTx = db.transaction(() => {
      const opname = db.prepare('SELECT * FROM stock_opnames WHERE id = ?').get(id);
      if (!opname) throw new Error('Sesi opname tidak ditemukan.');

      const items = db.prepare(`
        SELECT soi.*, m.unit_id, m.unit_cost, m.code as material_code, m.name as material_name
        FROM stock_opname_items soi
        JOIN materials m ON soi.material_id = m.id
        WHERE soi.opname_id = ? AND soi.discrepancy_qty != 0
      `).all(id);

      // Buat penyesuaian ledger untuk setiap item yang berselisih
      for (const item of items) {
        const trxNumber = `ADJ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
        const trxId = `trx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

        // Update stok fisik aktual ke inventaris
        db.prepare(`
          UPDATE inventory 
          SET current_stock = ?, updated_at = datetime('now')
          WHERE material_id = ? AND location_id = ?
        `).run(item.physical_stock, item.material_id, item.location_id);

        // Catat ke Buku Besar Transaksi (Ledger)
        db.prepare(`
          INSERT INTO inventory_transactions (
            id, transaction_number, material_id, transaction_type, quantity, unit_id,
            from_location_id, to_location_id, previous_stock, new_stock, financial_impact,
            reference_type, reference_number, user_id, recipient_name, notes, created_at
          ) VALUES (?, ?, ?, 'ADJUSTMENT', ?, ?, ?, ?, ?, ?, ?, 'OPNAME', ?, ?, 'Penyesuaian Opname', ?, datetime('now'))
        `).run(
          trxId, trxNumber, item.material_id, Math.abs(item.discrepancy_qty), item.unit_id,
          item.location_id, item.location_id, item.system_stock, item.physical_stock,
          item.discrepancy_qty * item.unit_cost, opname.opname_number, req.user.id,
          `Penyesuaian stok disetujui Supervisor ${req.user.full_name} dari hasil ${opname.opname_number}`
        );

        // Update status material kembali ke TERSEDIA
        db.prepare(`UPDATE materials SET status = 'TERSEDIA' WHERE id = ?`).run(item.material_id);
      }

      // Tandai opname selesai
      db.prepare(`
        UPDATE stock_opnames 
        SET status = 'SELESAI', approved_by = ?, completed_at = datetime('now')
        WHERE id = ?
      `).run(req.user.id, id);

      // Update status discrepancies terkait
      db.prepare(`
        UPDATE discrepancies
        SET status = 'SELESAI', resolved_at = datetime('now'),
            investigation_notes = investigation_notes || ' [Telah disesuaikan oleh Supervisor]'
        WHERE opname_id = ?
      `).run(id);

      logAudit(req.user.id, 'APPROVE_OPNAME', 'stock_opnames', id, `Supervisor menyetujui penyesuaian opname ${opname.opname_number}`);

      return {
        opname_number: opname.opname_number,
        adjusted_items_count: items.length
      };
    });

    const result = approveTx();
    res.json({
      success: true,
      message: `Stock Opname ${result.opname_number} disetujui. ${result.adjusted_items_count} item telah disesuaikan di buku besar.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
