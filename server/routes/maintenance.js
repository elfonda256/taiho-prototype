const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/maintenance/assets - List all machines with status and maintenance summary
router.get('/assets', authMiddleware, (req, res, next) => {
  try {
    const assets = db.prepare(`
      SELECT 
        a.*,
        (SELECT COUNT(*) FROM maintenance_records mr WHERE mr.asset_id = a.id) as total_records,
        (SELECT completion_time FROM maintenance_records mr WHERE mr.asset_id = a.id ORDER BY mr.completion_time DESC LIMIT 1) as last_completed_at,
        (SELECT overall_condition FROM maintenance_records mr WHERE mr.asset_id = a.id ORDER BY mr.completion_time DESC LIMIT 1) as last_overall_condition
      FROM assets a
      WHERE a.is_active = 1
      ORDER BY a.asset_code ASC
    `).all();

    // Summary counts
    const statusSummary = {
      total: assets.length,
      normal: assets.filter(a => a.status === 'NORMAL').length,
      warning: assets.filter(a => a.status === 'WARNING').length,
      problem: assets.filter(a => a.status === 'PROBLEM').length,
      no_data: assets.filter(a => a.status === 'NO_DATA').length,
    };

    res.json({
      success: true,
      data: {
        summary: statusSummary,
        assets
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/maintenance/assets/:id - Asset detail with recent records
router.get('/assets/:id', authMiddleware, (req, res, next) => {
  try {
    const asset = db.prepare(`SELECT * FROM assets WHERE id = ?`).get(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Mesin / Asset tidak ditemukan.' });
    }

    const records = db.prepare(`
      SELECT 
        mr.*,
        u.full_name as operator_name,
        v.full_name as supervisor_name
      FROM maintenance_records mr
      LEFT JOIN users u ON mr.operator_id = u.id
      LEFT JOIN users v ON mr.supervisor_id = v.id
      WHERE mr.asset_id = ?
      ORDER BY mr.completion_time DESC
      LIMIT 20
    `).all();

    res.json({
      success: true,
      data: {
        asset,
        records
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/maintenance/checklists - Get checklists and items
router.get('/checklists', authMiddleware, (req, res, next) => {
  try {
    const machineType = req.query.machine_type;
    const maintenanceType = req.query.maintenance_type || 'DAILY';

    let checklistsQuery = `SELECT * FROM maintenance_checklists WHERE is_active = 1`;
    const params = [];

    if (machineType) {
      checklistsQuery += ` AND (machine_type = ? OR machine_type = 'ALL')`;
      params.push(machineType);
    }
    if (maintenanceType) {
      checklistsQuery += ` AND maintenance_type = ?`;
      params.push(maintenanceType);
    }

    const checklists = db.prepare(checklistsQuery).all(...params);

    const fullChecklists = checklists.map(cl => {
      const items = db.prepare(`
        SELECT * FROM maintenance_checklist_items
        WHERE checklist_id = ?
        ORDER BY item_order ASC
      `).all(cl.id);
      return {
        ...cl,
        items
      };
    });

    res.json({
      success: true,
      data: fullChecklists
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/maintenance/records - List historical records with filters
router.get('/records', authMiddleware, (req, res, next) => {
  try {
    const { asset_id, status, overall_condition, date, limit = 50 } = req.query;

    let query = `
      SELECT 
        mr.*,
        a.asset_code,
        a.asset_name,
        a.machine_type,
        a.location as asset_location,
        u.full_name as operator_name,
        u.username as operator_username,
        v.full_name as supervisor_name
      FROM maintenance_records mr
      JOIN assets a ON mr.asset_id = a.id
      LEFT JOIN users u ON mr.operator_id = u.id
      LEFT JOIN users v ON mr.supervisor_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (asset_id) {
      query += ` AND mr.asset_id = ?`;
      params.push(asset_id);
    }
    if (status) {
      query += ` AND mr.status = ?`;
      params.push(status);
    }
    if (overall_condition) {
      query += ` AND mr.overall_condition = ?`;
      params.push(overall_condition);
    }
    if (date) {
      query += ` AND date(mr.completion_time) = date(?)`;
      params.push(date);
    }

    query += ` ORDER BY mr.created_at DESC LIMIT ?`;
    params.push(Number(limit));

    const records = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: records
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/maintenance/records - Submit field maintenance record (Tablet-first, idempotent)
router.post('/records', authMiddleware, (req, res, next) => {
  const { overall_condition, condition, findings, action_taken } = req.body;
  const resolvedCondition = (overall_condition || condition || 'NORMAL').toUpperCase();

  // Required fields for CRITICAL / FAIL condition
  if ((resolvedCondition === 'CRITICAL' || resolvedCondition === 'FAIL') && (!findings || !action_taken)) {
    return res.status(400).json({
      success: false,
      message: 'Hasil Pemeriksaan Bermasalah (CRITICAL/FAIL) wajib menyertakan Deskripsi Temuan (findings) dan Tindakan Perbaikan (action_taken).'
    });
  }

  const transaction = db.transaction(() => {
    const {
      asset_id,
      maintenance_type = 'Daily Inspection',
      checklist_id,
      start_time,
      completion_time,
      parts_used,
      remarks,
      photo_url,
      checklist_results,
      client_uuid,
      is_offline_submission = 0
    } = req.body;

    const operatorId = req.user.id;

    // Validate asset
    const asset = db.prepare(`SELECT * FROM assets WHERE id = ?`).get(asset_id);
    if (!asset) {
      throw new Error(`Mesin / Asset dengan ID ${asset_id} tidak ditemukan.`);
    }

    // Idempotency check: if remarks or record id matches
    if (client_uuid) {
      const existing = db.prepare(`
        SELECT id, record_number, lead_time_seconds, created_at 
        FROM maintenance_records 
        WHERE remarks LIKE ?
      `).get(`%[UUID:${client_uuid}]%`);

      if (existing) {
        return {
          is_duplicate: true,
          record: existing,
          message: 'Data pemeliharaan telah tersinkronisasi sebelumnya (Mencegah duplikasi data).'
        };
      }
    }

    // Timestamps and Lead Time Calculation
    const effectiveStartTime = start_time || new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const effectiveCompletionTime = completion_time || new Date().toISOString();
    const submittedAt = new Date().toISOString();

    // Exact Lead Time in seconds: (submitted_at - completion_time)
    const completionDate = new Date(effectiveCompletionTime);
    const submittedDate = new Date(submittedAt);
    const leadTimeSeconds = Math.max(0, Math.floor((submittedDate.getTime() - completionDate.getTime()) / 1000));

    // Generate record ID and number
    const countAll = db.prepare(`SELECT COUNT(*) as count FROM maintenance_records`).get().count;
    const newId = `rec_${Date.now()}_${countAll + 1}`;
    const recordNumber = `MNT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(countAll + 1).padStart(3, '0')}`;

    const effectiveRemarks = client_uuid 
      ? `${remarks || ''} [UUID:${client_uuid}]`.trim() 
      : (remarks || null);

    // Insert record
    const insertStmt = db.prepare(`
      INSERT INTO maintenance_records (
        id, record_number, asset_id, maintenance_type, checklist_id,
        operator_id, start_time, completion_time, submitted_at,
        lead_time_seconds, status, overall_condition, checklist_results,
        findings, action_taken, parts_used, photo_url, remarks,
        is_offline_submission, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `);

    insertStmt.run(
      newId,
      recordNumber,
      asset.id,
      maintenance_type,
      checklist_id || null,
      operatorId,
      effectiveStartTime,
      effectiveCompletionTime,
      submittedAt,
      leadTimeSeconds,
      'COMPLETED',
      resolvedCondition,
      checklist_results ? (typeof checklist_results === 'object' ? JSON.stringify(checklist_results) : checklist_results) : null,
      findings || null,
      action_taken || null,
      parts_used ? (typeof parts_used === 'object' ? JSON.stringify(parts_used) : parts_used) : null,
      photo_url || null,
      effectiveRemarks,
      is_offline_submission ? 1 : 0,
      submittedAt,
      submittedAt
    );

    // Update asset condition and status
    let newAssetStatus = 'NORMAL';
    let newConditionDesc = 'Baik & Siap Beroperasi';
    if (resolvedCondition === 'WARNING') {
      newAssetStatus = 'WARNING';
      newConditionDesc = 'Perlu Perhatian & Pemantauan';
    } else if (resolvedCondition === 'CRITICAL' || resolvedCondition === 'FAIL') {
      newAssetStatus = 'PROBLEM';
      newConditionDesc = 'Bermasalah / Perlu Perbaikan';
    }

    db.prepare(`
      UPDATE assets 
      SET status = ?, 
          last_maintenance_at = ?,
          current_condition = ?,
          updated_at = ?
      WHERE id = ?
    `).run(newAssetStatus, effectiveCompletionTime, newConditionDesc, submittedAt, asset.id);

    // Audit log
    const auditId = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    db.prepare(`
      INSERT INTO audit_logs (
        id, user_id, action, entity, entity_id, details, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditId,
      operatorId,
      'MAINTENANCE_RECORD_SUBMIT',
      'maintenance_records',
      newId,
      JSON.stringify({
        record_number: recordNumber,
        asset_code: asset.asset_code,
        overall_condition: resolvedCondition,
        lead_time_seconds: leadTimeSeconds,
        client_uuid: client_uuid || null
      }),
      '127.0.0.1',
      submittedAt
    );

    return {
      is_duplicate: false,
      record_id: newId,
      record_number: recordNumber,
      lead_time_seconds: leadTimeSeconds,
      lead_time_formatted: leadTimeSeconds < 60 ? `${leadTimeSeconds} detik` : `${Math.floor(leadTimeSeconds / 60)} menit ${leadTimeSeconds % 60} detik`,
      asset_status: newAssetStatus,
      submitted_at: submittedAt
    };
  });

  try {
    const outcome = transaction();
    res.status(outcome.is_duplicate ? 200 : 201).json({
      success: true,
      message: outcome.is_duplicate 
        ? outcome.message 
        : 'Data pemeliharaan berhasil dicatat secara digital di sumber kerja!',
      data: outcome
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/maintenance/verify/:id - Supervisor verification
router.post('/verify/:id', authMiddleware, requireRole('MANAGER', 'SUPERVISOR', 'ADMIN'), (req, res, next) => {
  try {
    const recordId = req.params.id;
    const supervisorId = req.user.id;
    const { notes, condition } = req.body;

    const record = db.prepare(`SELECT * FROM maintenance_records WHERE id = ?`).get(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Catatan pemeliharaan tidak ditemukan.' });
    }

    const verifiedAt = new Date().toISOString();
    const supervisorUser = db.prepare(`SELECT full_name FROM users WHERE id = ?`).get(supervisorId);
    const supervisorName = supervisorUser ? supervisorUser.full_name : 'Supervisor';

    // Clean existing remarks from internal UUID tags
    const cleanOldRemarks = (record.remarks || '')
      .replace(/\[UUID:[^\]]+\]/g, '')
      .trim();

    const verificationNote = notes && notes.trim()
      ? notes.trim()
      : 'Telah diverifikasi fisik oleh Supervisor (Kondisi Sesuai Standar Operasional)';

    const updatedRemarks = cleanOldRemarks
      ? `${cleanOldRemarks} | Diverifikasi [${supervisorName}]: ${verificationNote}`
      : `Diverifikasi [${supervisorName}]: ${verificationNote}`;

    const newCondition = condition || record.overall_condition || 'NORMAL';

    db.prepare(`
      UPDATE maintenance_records
      SET supervisor_id = ?,
          verified_at = ?,
          remarks = ?,
          overall_condition = ?,
          status = 'VERIFIED',
          updated_at = ?
      WHERE id = ?
    `).run(supervisorId, verifiedAt, updatedRemarks, newCondition, verifiedAt, recordId);

    // Also update asset status and condition if associated
    if (record.asset_id) {
      const assetConditionText = newCondition === 'NORMAL' 
        ? `Normal & Siap Operasi (${verificationNote})`
        : `Status: ${newCondition} (${verificationNote})`;

      db.prepare(`
        UPDATE assets
        SET status = ?,
            current_condition = ?,
            last_maintenance_at = ?,
            updated_at = ?
        WHERE id = ?
      `).run(
        newCondition === 'PROBLEM' ? 'PROBLEM' : (newCondition === 'WARNING' ? 'WARNING' : 'NORMAL'),
        assetConditionText,
        verifiedAt,
        verifiedAt,
        record.asset_id
      );
    }

    // Audit log
    const auditId = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    db.prepare(`
      INSERT INTO audit_logs (
        id, user_id, action, entity, entity_id, details, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditId,
      supervisorId,
      'MAINTENANCE_SUPERVISOR_VERIFY',
      'maintenance_records',
      recordId,
      JSON.stringify({ 
        verified_at: verifiedAt, 
        notes: verificationNote, 
        condition: newCondition,
        supervisor_name: supervisorName
      }),
      '127.0.0.1',
      verifiedAt
    );

    res.json({
      success: true,
      message: 'Catatan pemeliharaan berhasil diverifikasi dan keterangan telah diperbarui.',
      data: {
        record_id: recordId,
        status: 'VERIFIED',
        remarks: updatedRemarks,
        overall_condition: newCondition,
        supervisor_name: supervisorName,
        verified_at: verifiedAt
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/maintenance/stats - Maintenance overview for dashboard
router.get('/stats', authMiddleware, (req, res, next) => {
  try {
    const assetsSummary = db.prepare(`
      SELECT 
        COUNT(*) as total_machines,
        SUM(CASE WHEN status = 'NORMAL' THEN 1 ELSE 0 END) as normal_count,
        SUM(CASE WHEN status = 'WARNING' THEN 1 ELSE 0 END) as warning_count,
        SUM(CASE WHEN status = 'PROBLEM' THEN 1 ELSE 0 END) as problem_count,
        SUM(CASE WHEN status = 'NO_DATA' THEN 1 ELSE 0 END) as nodata_count
      FROM assets
      WHERE is_active = 1
    `).get();

    // Determine active operating date (falls back to latest records date if current date has no records)
    const activeDateRow = db.prepare(`
      SELECT CASE 
        WHEN (SELECT COUNT(*) FROM maintenance_records WHERE date(created_at) = date('now')) > 0 
        THEN date('now')
        ELSE (SELECT COALESCE(MAX(date(created_at)), date('now')) FROM maintenance_records)
      END as target_date
    `).get();
    const targetDate = activeDateRow ? activeDateRow.target_date : new Date().toISOString().slice(0, 10);

    // Activities today
    const recordsToday = db.prepare(`
      SELECT 
        COUNT(*) as completed_today,
        SUM(CASE WHEN overall_condition IN ('CRITICAL', 'FAIL', 'PROBLEM') THEN 1 ELSE 0 END) as failed_today,
        SUM(CASE WHEN overall_condition = 'WARNING' THEN 1 ELSE 0 END) as warning_today,
        SUM(CASE WHEN overall_condition IN ('NORMAL', 'PASS') THEN 1 ELSE 0 END) as pass_today,
        (
          SELECT COUNT(*) 
          FROM maintenance_records 
          WHERE (date(verified_at) = date('now') OR (date(created_at) = ? AND verified_at IS NOT NULL))
        ) as verified_today,
        AVG(lead_time_seconds) as avg_lead_time_seconds
      FROM maintenance_records
      WHERE date(created_at) = ? OR date(submitted_at) = ?
    `).get(targetDate, targetDate, targetDate);

    // Latest updated machine
    const latestRecord = db.prepare(`
      SELECT 
        mr.record_number,
        mr.completion_time,
        mr.submitted_at,
        mr.overall_condition,
        mr.lead_time_seconds,
        a.asset_code,
        a.asset_name,
        u.full_name as operator_name
      FROM maintenance_records mr
      JOIN assets a ON mr.asset_id = a.id
      LEFT JOIN users u ON mr.operator_id = u.id
      ORDER BY mr.submitted_at DESC
      LIMIT 1
    `).get();

    res.json({
      success: true,
      data: {
        machines: assetsSummary,
        today: {
          planned: assetsSummary.total_machines,
          completed: recordsToday.completed_today || 0,
          pending: Math.max(0, assetsSummary.total_machines - (recordsToday.completed_today || 0)),
          pass: recordsToday.pass_today || 0,
          warning: recordsToday.warning_today || 0,
          failed: recordsToday.failed_today || 0,
          verified: recordsToday.verified_today || 0,
          avg_lead_time_seconds: Math.round(recordsToday.avg_lead_time_seconds || 0)
        },
        latest_update: latestRecord || null,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
