const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, requireRole, logAudit } = require('../middleware/auth');

// 1. GET ALL DISCREPANCIES (FILTER BY STATUS)
router.get('/', authMiddleware, (req, res, next) => {
  try {
    const { status, limit = 50 } = req.query;

    let sql = `
      SELECT 
        d.*,
        m.code as material_code,
        m.name as material_name,
        m.unit_cost,
        u.code as unit_code,
        l.code as location_code,
        l.warehouse,
        l.rack,
        l.shelf,
        u_ass.full_name as assigned_to_name
      FROM discrepancies d
      JOIN materials m ON d.material_id = m.id
      JOIN units u ON m.unit_id = u.id
      JOIN locations l ON d.location_id = l.id
      LEFT JOIN users u_ass ON d.assigned_to = u_ass.id
      WHERE 1=1
    `;

    const params = [];
    if (status) {
      sql += ' AND d.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY d.variance_value DESC, d.created_at DESC LIMIT ?';
    params.push(Number(limit));

    const list = db.prepare(sql).all(...params);

    // Hitung total potensi kerugian finansial
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_cases,
        SUM(CASE WHEN status IN ('PERLU_PEMERIKSAAN', 'SEDANG_DISELIDIKI') THEN 1 ELSE 0 END) as active_cases,
        COALESCE(SUM(CASE WHEN status IN ('PERLU_PEMERIKSAAN', 'SEDANG_DISELIDIKI') THEN variance_value ELSE 0 END), 0) as total_potential_loss
      FROM discrepancies
    `).get();

    res.json({
      success: true,
      summary,
      data: list
    });
  } catch (err) {
    next(err);
  }
});

// 2. UPDATE INVESTIGATION NOTES & STATUS
router.put('/:id/investigate', authMiddleware, requireRole(['ADMIN', 'SUPERVISOR', 'WAREHOUSE']), (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, investigation_notes, assigned_to } = req.body;

    const disc = db.prepare('SELECT * FROM discrepancies WHERE id = ?').get(id);
    if (!disc) {
      return res.status(404).json({ success: false, message: 'Kasus selisih tidak ditemukan.' });
    }

    db.prepare(`
      UPDATE discrepancies
      SET 
        status = COALESCE(?, status),
        investigation_notes = COALESCE(?, investigation_notes),
        assigned_to = COALESCE(?, assigned_to),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(status, investigation_notes, assigned_to, id);

    logAudit(req.user.id, 'INVESTIGATE_DISCREPANCY', 'discrepancies', id, {
      status,
      investigation_notes
    });

    res.json({
      success: true,
      message: 'Catatan penelusuran selisih berhasil diperbarui.'
    });
  } catch (err) {
    next(err);
  }
});

// 3. SELESAIKAN SELISIH DENGAN PENYESUAIAN RESMI (SUPERVISOR RESOLUTION)
router.post('/:id/resolve', authMiddleware, requireRole(['ADMIN', 'SUPERVISOR']), (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution_reason, apply_stock_adjustment } = req.body;

    const resolveTx = db.transaction(() => {
      const disc = db.prepare(`
        SELECT d.*, m.unit_id, m.unit_cost, m.code as material_code, m.name as material_name
        FROM discrepancies d
        JOIN materials m ON d.material_id = m.id
        WHERE d.id = ?
      `).get(id);

      if (!disc) throw new Error('Data selisih tidak ditemukan.');

      if (apply_stock_adjustment) {
        // Update inventaris fisik ke nilai aktual
        db.prepare(`
          UPDATE inventory 
          SET current_stock = ?, updated_at = datetime('now')
          WHERE material_id = ? AND location_id = ?
        `).run(disc.physical_stock, disc.material_id, disc.location_id);

        // Catat mutasi penyesuaian di ledger
        const trxNumber = `ADJ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
        const trxId = `trx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

        db.prepare(`
          INSERT INTO inventory_transactions (
            id, transaction_number, material_id, transaction_type, quantity, unit_id,
            from_location_id, to_location_id, previous_stock, new_stock, financial_impact,
            reference_type, reference_number, user_id, recipient_name, notes, created_at
          ) VALUES (?, ?, ?, 'ADJUSTMENT', ?, ?, ?, ?, ?, ?, ?, 'SELISIH_RES', ?, ?, 'Penyelesaian Selisih', ?, datetime('now'))
        `).run(
          trxId, trxNumber, disc.material_id, Math.abs(disc.variance_qty), disc.unit_id,
          disc.location_id, disc.location_id, disc.system_stock, disc.physical_stock,
          disc.variance_qty * disc.unit_cost, disc.discrepancy_number, req.user.id,
          `Penyelesaian resmi: ${resolution_reason || 'Disetujui penyesuaian oleh Supervisor'}`
        );

        db.prepare(`UPDATE materials SET status = 'TERSEDIA' WHERE id = ?`).run(disc.material_id);
      }

      db.prepare(`
        UPDATE discrepancies
        SET status = 'SELESAI', resolved_at = datetime('now'),
            investigation_notes = COALESCE(investigation_notes, '') || ' [Diselesaikan: ' || ? || ']',
            updated_at = datetime('now')
        WHERE id = ?
      `).run(resolution_reason || 'Penyelesaian disetujui', id);

      logAudit(req.user.id, 'RESOLVE_DISCREPANCY', 'discrepancies', id, {
        resolution_reason,
        apply_stock_adjustment
      });

      return {
        discrepancy_number: disc.discrepancy_number,
        material_name: disc.material_name
      };
    });

    const result = resolveTx();
    res.json({
      success: true,
      message: `Kasus selisih ${result.discrepancy_number} (${result.material_name}) telah diselesaikan.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
