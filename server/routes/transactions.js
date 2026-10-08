const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, requireRole, logAudit } = require('../middleware/auth');

function generateTrxNumber(prefix) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${randomStr}`;
}

// Helper: Idempotency & Deduplication Storage
function getCachedIdempotentResponse(key) {
  if (!key) return null;
  const row = db.prepare('SELECT response_payload FROM idempotency_keys WHERE key = ?').get(key);
  return row ? JSON.parse(row.response_payload) : null;
}

function saveIdempotentResponse(key, trxNumber, payload) {
  if (!key) return;
  db.prepare(`
    INSERT OR REPLACE INTO idempotency_keys (key, transaction_id, response_payload, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(key, trxNumber, JSON.stringify(payload));
}

function checkRapidDuplicate(rapidKey, windowSeconds = 3) {
  const row = db.prepare(`
    SELECT response_payload FROM idempotency_keys 
    WHERE key = ? AND datetime(created_at, '+' || ? || ' seconds') >= datetime('now')
  `).get(rapidKey, windowSeconds);
  return row ? JSON.parse(row.response_payload) : null;
}

// 1. MATERIAL KELUAR (ISSUE) - ALUR UTAMA OPERATOR CEPAT
router.post('/issue', authMiddleware, requireRole(['ADMIN', 'WAREHOUSE']), (req, res, next) => {
  try {
    const {
      material_id,
      quantity,
      location_id,
      destination_line,
      spk_number,
      recipient_name,
      notes,
      idempotency_key,
      high_value_confirmed
    } = req.body;

    const clientKey = req.headers['x-idempotency-key'] || idempotency_key;

    // 1. Cek jika permintaan dengan idempotency key ini sudah pernah diproses
    if (clientKey) {
      const cached = getCachedIdempotentResponse(clientKey);
      if (cached) {
        return res.json(cached);
      }
    }

    const qty = Number(quantity);
    if (!material_id || !qty || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Kuantitas material yang dikeluarkan harus lebih besar dari 0.'
      });
    }

    if (!destination_line) {
      return res.status(400).json({
        success: false,
        message: 'Silakan pilih atau ketik tujuan pengeluaran material (contoh: Lini Produksi 01).'
      });
    }

    // 2. Proteksi Double-Click / Klik Berulang Cepat (Rapid duplicate window: 3 detik)
    const rapidKey = `rapid_issue_${req.user.id}_${material_id}_${qty}_${destination_line}`;
    const rapidCached = checkRapidDuplicate(rapidKey, 3);
    if (rapidCached) {
      return res.status(409).json({
        success: false,
        message: 'Terdeteksi penekanan tombol berulang (Double-Click). Transaksi pertama telah berhasil dicatat ke sistem.',
        duplicate_prevented: true,
        data: rapidCached.data
      });
    }

    // 3. Ambil data material & validasi konfirmasi nilai tinggi / salah ketik
    const material = db.prepare('SELECT * FROM materials WHERE id = ? OR code = ?').get(material_id, material_id);
    if (!material) {
      return res.status(400).json({ success: false, message: 'Data material tidak ditemukan.' });
    }

    const totalTrxValue = qty * material.unit_cost;
    // Jika nilai mutasi >= Rp 10.000.000, wajib ada flag konfirmasi nilai tinggi (mencegah typo 1000 jadi 10000)
    if (totalTrxValue >= 10000000 && !high_value_confirmed) {
      return res.status(400).json({
        success: false,
        requires_high_value_confirmation: true,
        message: `PERINGATAN NILAI TINGGI: Transaksi pengeluaran ${qty} ${material.unit_id} ${material.name} bernilai Rp ${totalTrxValue.toLocaleString('id-ID')}. Mohon centang konfirmasi bahwa kuantitas fisik telah diverifikasi.`,
        bantuan: 'Ini adalah fitur pengaman pencegah salah ketik kuantitas oleh operator.'
      });
    }

    // 4. Eksekusi atomik dalam transaksi database
    const issueTransaction = db.transaction(() => {
      let targetLocId = location_id;
      let invRecord = null;

      if (targetLocId) {
        invRecord = db.prepare('SELECT * FROM inventory WHERE material_id = ? AND location_id = ?').get(material.id, targetLocId);
      } else {
        invRecord = db.prepare(`
          SELECT * FROM inventory 
          WHERE material_id = ? AND current_stock >= ?
          ORDER BY current_stock DESC LIMIT 1
        `).get(material.id, qty);
        if (invRecord) targetLocId = invRecord.location_id;
      }

      if (!invRecord || invRecord.current_stock < qty) {
        const available = invRecord ? invRecord.current_stock : 0;
        const err = new Error('Stok tidak mencukupi.');
        err.statusCode = 400;
        err.customMessage = `Stok ${material.name} di lokasi tersebut hanya tersedia ${available} ${material.unit_id}, tidak cukup untuk pengeluaran ${qty}.`;
        err.recoveryTip = 'Silakan kurangi jumlah pengeluaran atau periksa rak/gudang penyimpanan lain.';
        throw err;
      }

      const previousStock = invRecord.current_stock;
      const newStock = previousStock - qty;
      const financialImpact = -totalTrxValue;
      const trxNumber = generateTrxNumber('OUT');

      db.prepare(`
        UPDATE inventory 
        SET current_stock = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(newStock, invRecord.id);

      const trxId = `trx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      db.prepare(`
        INSERT INTO inventory_transactions (
          id, transaction_number, material_id, transaction_type, quantity, unit_id,
          from_location_id, to_location_id, previous_stock, new_stock, financial_impact,
          reference_type, reference_number, user_id, recipient_name, notes, created_at
        ) VALUES (?, ?, ?, 'ISSUE', ?, ?, ?, NULL, ?, ?, ?, 'SPK', ?, ?, ?, ?, datetime('now'))
      `).run(
        trxId, trxNumber, material.id, qty, material.unit_id,
        targetLocId, previousStock, newStock, financialImpact,
        spk_number || 'SPK-REGULER', req.user.id, recipient_name || 'Operator Produksi', notes || 'Pengeluaran material ke lini kerja'
      );

      const issueId = `iss_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      db.prepare(`
        INSERT INTO material_issues (
          id, issue_number, material_id, quantity, from_location_id, destination_line,
          operator_id, recipient_name, spk_number, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        issueId, trxNumber, material.id, qty, targetLocId,
        destination_line, req.user.id, recipient_name || 'Operator Produksi', spk_number || '-', notes || ''
      );

      if (newStock === 0) {
        db.prepare(`UPDATE materials SET status = 'DI_PRODUKSI' WHERE id = ?`).run(material.id);
      }

      const responsePayload = {
        success: true,
        message: `Berhasil mengeluarkan ${qty} ${material.name} ke ${destination_line}.`,
        data: {
          transaction_number: trxNumber,
          material_code: material.code,
          material_name: material.name,
          quantity: qty,
          unit_cost: material.unit_cost,
          financial_impact: financialImpact,
          destination: destination_line,
          previous_stock: previousStock,
          new_stock: newStock,
          operator: req.user.full_name
        }
      };

      saveIdempotentResponse(rapidKey, trxNumber, responsePayload);
      if (clientKey) {
        saveIdempotentResponse(clientKey, trxNumber, responsePayload);
      }

      logAudit(req.user.id, 'ISSUE_MATERIAL', 'inventory_transactions', trxId, {
        material: material.code,
        qty,
        destination: destination_line,
        financialImpact
      });

      return responsePayload;
    });

    const result = issueTransaction();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 2. MATERIAL MASUK (RECEIVE / PENERIMAAN DARI SUPPLIER)
router.post('/receive', authMiddleware, requireRole(['ADMIN', 'WAREHOUSE']), (req, res, next) => {
  try {
    const {
      material_id,
      quantity,
      location_id,
      supplier_id,
      po_number,
      delivery_note_number,
      notes,
      idempotency_key
    } = req.body;

    const clientKey = req.headers['x-idempotency-key'] || idempotency_key;
    if (clientKey) {
      const cached = getCachedIdempotentResponse(clientKey);
      if (cached) return res.json(cached);
    }

    const qty = Number(quantity);
    if (!material_id || !qty || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Kuantitas material masuk harus lebih besar dari 0.'
      });
    }

    if (!location_id) {
      return res.status(400).json({
        success: false,
        message: 'Silakan pilih lokasi penyimpanan atau rak tujuan penerimaan.'
      });
    }

    const rapidKey = `rapid_receive_${req.user.id}_${material_id}_${qty}_${delivery_note_number || po_number || ''}`;
    const rapidCached = checkRapidDuplicate(rapidKey, 3);
    if (rapidCached) {
      return res.status(409).json({
        success: false,
        message: 'Terdeteksi penekanan tombol berulang. Penerimaan material pertama telah dicatat.',
        data: rapidCached.data
      });
    }

    const receiveTransaction = db.transaction(() => {
      const material = db.prepare('SELECT * FROM materials WHERE id = ? OR code = ?').get(material_id, material_id);
      if (!material) throw new Error('Data material tidak ditemukan.');

      // Validasi duplikasi nomor surat jalan (jika diisi)
      if (delivery_note_number && delivery_note_number.trim() !== '') {
        const existingSJ = db.prepare(`
          SELECT * FROM material_receipts WHERE delivery_note_number = ?
        `).get(delivery_note_number.trim());
        if (existingSJ) {
          const err = new Error('Surat Jalan sudah pernah diterima.');
          err.statusCode = 400;
          err.customMessage = `Surat Jalan ${delivery_note_number} sudah pernah dicatat dalam sistem sebelumnya. Duplikasi penerimaan dicegah.`;
          throw err;
        }
      }

      let invRecord = db.prepare('SELECT * FROM inventory WHERE material_id = ? AND location_id = ?').get(material.id, location_id);
      let previousStock = 0;

      if (!invRecord) {
        const invId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        db.prepare('INSERT INTO inventory (id, material_id, location_id, current_stock, reserved_stock) VALUES (?, ?, ?, 0, 0)').run(invId, material.id, location_id);
        invRecord = { id: invId, current_stock: 0, reserved_stock: 0 };
      } else {
        previousStock = invRecord.current_stock;
      }

      const newStock = previousStock + qty;
      const financialImpact = qty * material.unit_cost;
      const trxNumber = generateTrxNumber('RCV');

      db.prepare(`UPDATE inventory SET current_stock = ?, updated_at = datetime('now') WHERE id = ?`).run(newStock, invRecord.id);

      const trxId = `trx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      db.prepare(`
        INSERT INTO inventory_transactions (
          id, transaction_number, material_id, transaction_type, quantity, unit_id,
          from_location_id, to_location_id, previous_stock, new_stock, financial_impact,
          reference_type, reference_number, user_id, recipient_name, notes, created_at
        ) VALUES (?, ?, ?, 'RECEIVE', ?, ?, NULL, ?, ?, ?, ?, 'PO', ?, ?, ?, ?, datetime('now'))
      `).run(
        trxId, trxNumber, material.id, qty, material.unit_id,
        location_id, previousStock, newStock, financialImpact,
        po_number || delivery_note_number || 'PO-REGULER', req.user.id, 'Gudang Utama', notes || 'Penerimaan material baru dari pemasok'
      );

      // Catat ke tabel detail material_receipts
      const rcvId = `rcv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      db.prepare(`
        INSERT INTO material_receipts (
          id, receipt_number, material_id, quantity, to_location_id, supplier_id,
          po_number, delivery_note_number, operator_id, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        rcvId, trxNumber, material.id, qty, location_id,
        supplier_id || null, po_number || '-', delivery_note_number || '-', req.user.id, notes || ''
      );

      db.prepare(`UPDATE materials SET status = 'TERSEDIA', updated_at = datetime('now') WHERE id = ?`).run(material.id);

      const responsePayload = {
        success: true,
        message: `Penerimaan ${qty} ${material.name} berhasil disimpan.`,
        data: {
          transaction_number: trxNumber,
          material_name: material.name,
          quantity: qty,
          new_stock: newStock,
          location_id
        }
      };

      saveIdempotentResponse(rapidKey, trxNumber, responsePayload);
      if (clientKey) {
        saveIdempotentResponse(clientKey, trxNumber, responsePayload);
      }

      logAudit(req.user.id, 'RECEIVE_MATERIAL', 'inventory_transactions', trxId, {
        material: material.code,
        qty,
        location_id,
        financialImpact
      });

      return responsePayload;
    });

    const result = receiveTransaction();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 3. PENGEMBALIAN MATERIAL SISA (RETURN)
router.post('/return', authMiddleware, requireRole(['ADMIN', 'WAREHOUSE']), (req, res, next) => {
  try {
    const {
      material_id,
      quantity,
      location_id,
      from_line,
      return_reason,
      notes,
      idempotency_key
    } = req.body;

    const clientKey = req.headers['x-idempotency-key'] || idempotency_key;
    if (clientKey) {
      const cached = getCachedIdempotentResponse(clientKey);
      if (cached) return res.json(cached);
    }

    const qty = Number(quantity);
    if (!material_id || !qty || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Kuantitas pengembalian harus lebih dari 0.' });
    }

    const rapidKey = `rapid_return_${req.user.id}_${material_id}_${qty}_${from_line || ''}`;
    const rapidCached = checkRapidDuplicate(rapidKey, 3);
    if (rapidCached) {
      return res.status(409).json({
        success: false,
        message: 'Terdeteksi penekanan tombol berulang (Double-Click). Transaksi retur pertama telah berhasil disimpan.',
        data: rapidCached.data
      });
    }

    const returnTx = db.transaction(() => {
      const material = db.prepare('SELECT * FROM materials WHERE id = ? OR code = ?').get(material_id, material_id);
      if (!material) throw new Error('Material tidak ditemukan.');

      // Validasi Ketat Integritas Retur: Hitung total yang pernah dikeluarkan (Net Issued)
      const issueStats = db.prepare(`
        SELECT COALESCE(SUM(quantity), 0) as total_issued
        FROM inventory_transactions
        WHERE material_id = ? AND transaction_type = 'ISSUE'
      `).get(material.id);

      const returnStats = db.prepare(`
        SELECT COALESCE(SUM(quantity), 0) as total_returned
        FROM inventory_transactions
        WHERE material_id = ? AND transaction_type = 'RETURN'
      `).get(material.id);

      const netIssued = issueStats.total_issued - returnStats.total_returned;

      if (netIssued <= 0 || qty > netIssued) {
        const err = new Error('Pengembalian material melebihi riwayat pengeluaran.');
        err.statusCode = 400;
        err.customMessage = `Pengembalian ditolak! Jumlah retur (${qty} ${material.unit_id}) melebihi sisa riwayat pengeluaran material yang valid (${Math.max(0, netIssued)} ${material.unit_id}).`;
        err.recoveryTip = 'Pastikan Surat Perintah Kerja (SPK) atau nota mutasi pengeluaran sebelumnya telah dicatat di sistem.';
        throw err;
      }

      // Validasi lini jika ada riwayat pengeluaran spesifik lini
      if (from_line) {
        const lineIssued = db.prepare(`
          SELECT COALESCE(SUM(quantity), 0) as issued
          FROM material_issues
          WHERE material_id = ? AND destination_line = ?
        `).get(material.id, from_line).issued;

        const lineReturned = db.prepare(`
          SELECT COALESCE(SUM(quantity), 0) as returned
          FROM material_returns
          WHERE material_id = ? AND from_line = ?
        `).get(material.id, from_line).returned;

        const netLine = lineIssued - lineReturned;
        if (lineIssued > 0 && qty > netLine) {
          const err = new Error('Retur lini melebihi pengeluaran lini.');
          err.statusCode = 400;
          err.customMessage = `Pengembalian ditolak! Lini ${from_line} tercatat hanya memiliki sisa material ${netLine} ${material.unit_id}. Tidak dapat mengembalikan ${qty} ${material.unit_id}.`;
          err.recoveryTip = 'Verifikasi kuantitas fisik aktual bersama supervisor lini kerja.';
          throw err;
        }
      }

      const targetLocId = location_id || material.default_location_id;
      let invRecord = db.prepare('SELECT * FROM inventory WHERE material_id = ? AND location_id = ?').get(material.id, targetLocId);
      let previousStock = invRecord ? invRecord.current_stock : 0;

      if (!invRecord) {
        const invId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        db.prepare('INSERT INTO inventory (id, material_id, location_id, current_stock, reserved_stock) VALUES (?, ?, ?, 0, 0)').run(invId, material.id, targetLocId);
        invRecord = { id: invId };
      }

      const newStock = previousStock + qty;
      const financialImpact = qty * material.unit_cost;
      const trxNumber = generateTrxNumber('RET');

      db.prepare("UPDATE inventory SET current_stock = ?, updated_at = datetime('now') WHERE id = ?").run(newStock, invRecord.id);

      const trxId = `trx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      db.prepare(`
        INSERT INTO inventory_transactions (
          id, transaction_number, material_id, transaction_type, quantity, unit_id,
          from_location_id, to_location_id, previous_stock, new_stock, financial_impact,
          reference_type, reference_number, user_id, recipient_name, notes, created_at
        ) VALUES (?, ?, ?, 'RETURN', ?, ?, NULL, ?, ?, ?, ?, 'RET_DOC', ?, ?, ?, ?, datetime('now'))
      `).run(
        trxId, trxNumber, material.id, qty, material.unit_id,
        targetLocId, previousStock, newStock, financialImpact,
        `RET-${Date.now().toString().slice(-4)}`, req.user.id, from_line || 'Lini Produksi',
        `Alasan: ${return_reason || 'SISA_PRODUKSI'}. ${notes || ''}`
      );

      const retId = `ret_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      db.prepare(`
        INSERT INTO material_returns (
          id, return_number, material_id, quantity, to_location_id, from_line,
          return_reason, operator_id, status, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DITERIMA', ?, datetime('now'))
      `).run(
        retId, trxNumber, material.id, qty, targetLocId,
        from_line || 'Lini Produksi', return_reason || 'SISA_PRODUKSI', req.user.id, notes || ''
      );

      db.prepare("UPDATE materials SET status = 'TERSEDIA' WHERE id = ?").run(material.id);

      const responsePayload = {
        success: true,
        message: `Pengembalian ${qty} ${material.name} berhasil dicatat ke gudang.`,
        data: {
          transaction_number: trxNumber,
          material_name: material.name,
          quantity: qty,
          new_stock: newStock
        }
      };

      saveIdempotentResponse(rapidKey, trxNumber, responsePayload);
      if (clientKey) {
        saveIdempotentResponse(clientKey, trxNumber, responsePayload);
      }

      logAudit(req.user.id, 'RETURN_MATERIAL', 'inventory_transactions', trxId, {
        material: material.code,
        qty,
        from_line,
        financialImpact
      });

      return responsePayload;
    });

    const result = returnTx();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 4. PINDAH LOKASI (TRANSFER ANTAR RAK / GUDANG)
router.post('/transfer', authMiddleware, requireRole(['ADMIN', 'WAREHOUSE']), (req, res, next) => {
  try {
    const { material_id, quantity, from_location_id, to_location_id, reason, idempotency_key } = req.body;
    const clientKey = req.headers['x-idempotency-key'] || idempotency_key;

    if (clientKey) {
      const cached = getCachedIdempotentResponse(clientKey);
      if (cached) return res.json(cached);
    }

    const qty = Number(quantity);

    if (!material_id || !qty || qty <= 0 || !from_location_id || !to_location_id) {
      return res.status(400).json({ success: false, message: 'Harap lengkapi kuantitas, lokasi asal, dan lokasi tujuan transfer.' });
    }

    if (from_location_id === to_location_id) {
      return res.status(400).json({ success: false, message: 'Lokasi asal dan lokasi tujuan tidak boleh sama.' });
    }

    const rapidKey = `rapid_transfer_${req.user.id}_${material_id}_${qty}_${from_location_id}_${to_location_id}`;
    const rapidCached = checkRapidDuplicate(rapidKey, 3);
    if (rapidCached) {
      return res.status(409).json({
        success: false,
        message: 'Terdeteksi penekanan tombol berulang (Double-Click). Pemindahan stok pertama telah berhasil diproses.',
        data: rapidCached.data
      });
    }

    const transferTx = db.transaction(() => {
      const material = db.prepare('SELECT * FROM materials WHERE id = ? OR code = ?').get(material_id, material_id);
      if (!material) throw new Error('Material tidak ditemukan.');

      const sourceInv = db.prepare('SELECT * FROM inventory WHERE material_id = ? AND location_id = ?').get(material.id, from_location_id);
      if (!sourceInv || sourceInv.current_stock < qty) {
        const err = new Error('Stok asal tidak cukup.');
        err.customMessage = `Stok di lokasi asal tidak mencukupi untuk dipindahkan sebesar ${qty}.`;
        throw err;
      }

      let destInv = db.prepare('SELECT * FROM inventory WHERE material_id = ? AND location_id = ?').get(material.id, to_location_id);
      if (!destInv) {
        const invId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        db.prepare('INSERT INTO inventory (id, material_id, location_id, current_stock, reserved_stock) VALUES (?, ?, ?, 0, 0)').run(invId, material.id, to_location_id);
        destInv = { id: invId, current_stock: 0 };
      }

      const sourceNew = sourceInv.current_stock - qty;
      const destNew = destInv.current_stock + qty;
      const trxNumber = generateTrxNumber('TRF');

      db.prepare("UPDATE inventory SET current_stock = ?, updated_at = datetime('now') WHERE id = ?").run(sourceNew, sourceInv.id);
      db.prepare("UPDATE inventory SET current_stock = ?, updated_at = datetime('now') WHERE id = ?").run(destNew, destInv.id);

      const trxId = `trx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      db.prepare(`
        INSERT INTO inventory_transactions (
          id, transaction_number, material_id, transaction_type, quantity, unit_id,
          from_location_id, to_location_id, previous_stock, new_stock, financial_impact,
          reference_type, reference_number, user_id, recipient_name, notes, created_at
        ) VALUES (?, ?, ?, 'TRANSFER', ?, ?, ?, ?, ?, ?, 0, 'PINDAH_LOKASI', ?, ?, 'Internal Gudang', ?, datetime('now'))
      `).run(
        trxId, trxNumber, material.id, qty, material.unit_id,
        from_location_id, to_location_id, sourceInv.current_stock, sourceNew,
        trxNumber, req.user.id, reason || 'Pemindahan internal rak penyimpanan'
      );

      const responsePayload = {
        success: true,
        message: `Pemindahan ${qty} ${material.name} berhasil diproses.`,
        data: {
          transaction_number: trxNumber,
          material_name: material.name,
          quantity: qty,
          from_location: from_location_id,
          to_location: to_location_id
        }
      };

      saveIdempotentResponse(rapidKey, trxNumber, responsePayload);
      if (clientKey) {
        saveIdempotentResponse(clientKey, trxNumber, responsePayload);
      }

      logAudit(req.user.id, 'TRANSFER_MATERIAL', 'inventory_transactions', trxId, {
        material: material.code,
        qty,
        from_location_id,
        to_location_id
      });

      return responsePayload;
    });

    const result = transferTx();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 5. AFKIR / SCRAP (MATERIAL RUSAK DENGAN KONFIRMASI NILAI)
router.post('/scrap', authMiddleware, requireRole(['ADMIN', 'WAREHOUSE', 'SUPERVISOR']), (req, res, next) => {
  try {
    const { material_id, quantity, location_id, reason, notes } = req.body;
    const qty = Number(quantity);

    if (!material_id || !qty || qty <= 0 || !reason) {
      return res.status(400).json({ success: false, message: 'Harap isi kuantitas dan alasan afkir material.' });
    }

    const scrapTx = db.transaction(() => {
      const material = db.prepare('SELECT * FROM materials WHERE id = ? OR code = ?').get(material_id, material_id);
      if (!material) throw new Error('Material tidak ditemukan.');

      const targetLocId = location_id || material.default_location_id;
      const invRecord = db.prepare('SELECT * FROM inventory WHERE material_id = ? AND location_id = ?').get(material.id, targetLocId);

      if (!invRecord || invRecord.current_stock < qty) {
        const err = new Error('Stok tidak cukup.');
        err.customMessage = `Stok di lokasi tidak cukup untuk afkir sebesar ${qty}.`;
        throw err;
      }

      const previousStock = invRecord.current_stock;
      const newStock = previousStock - qty;
      const financialLoss = qty * material.unit_cost;
      const trxNumber = generateTrxNumber('SCR');

      db.prepare("UPDATE inventory SET current_stock = ?, updated_at = datetime('now') WHERE id = ?").run(newStock, invRecord.id);

      const trxId = `trx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      db.prepare(`
        INSERT INTO inventory_transactions (
          id, transaction_number, material_id, transaction_type, quantity, unit_id,
          from_location_id, to_location_id, previous_stock, new_stock, financial_impact,
          reference_type, reference_number, user_id, recipient_name, notes, created_at
        ) VALUES (?, ?, ?, 'SCRAP', ?, ?, ?, NULL, ?, ?, ?, 'SCRAP_REQ', ?, ?, 'Pemusnahan/Afkir', ?, datetime('now'))
      `).run(
        trxId, trxNumber, material.id, qty, material.unit_id,
        targetLocId, previousStock, newStock, -financialLoss,
        trxNumber, req.user.id, `Alasan: ${reason}. ${notes || ''}`
      );

      const scrId = `scr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      db.prepare(`
        INSERT INTO material_scraps (
          id, scrap_number, material_id, quantity, location_id, financial_loss,
          reason, operator_id, approved_by, status, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DISETUJUI', ?, datetime('now'))
      `).run(
        scrId, trxNumber, material.id, qty, targetLocId, financialLoss,
        reason, req.user.id, req.user.id, notes || ''
      );

      logAudit(req.user.id, 'SCRAP_MATERIAL', 'material_scraps', scrId, {
        material: material.code,
        qty,
        financialLoss
      });

      return {
        transaction_number: trxNumber,
        material_name: material.name,
        quantity: qty,
        financial_loss: financialLoss
      };
    });

    const result = scrapTx();
    res.json({
      success: true,
      message: `Afkir ${result.quantity} ${result.material_name} (Nilai Kerugian: Rp ${result.financial_loss.toLocaleString('id-ID')}) telah diproses.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// 6. GET TRANSACTION LEDGER (BUKU BESAR MUTASI)
router.get('/', authMiddleware, (req, res, next) => {
  try {
    const { type, search, start_date, end_date, limit = 50, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let sql = `
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
        m.code as material_code,
        m.name as material_name,
        m.unit_cost,
        u.code as unit_code,
        usr.full_name as operator_name,
        fl.code as from_location_code,
        tl.code as to_location_code
      FROM inventory_transactions t
      JOIN materials m ON t.material_id = m.id
      JOIN units u ON t.unit_id = u.id
      JOIN users usr ON t.user_id = usr.id
      LEFT JOIN locations fl ON t.from_location_id = fl.id
      LEFT JOIN locations tl ON t.to_location_id = tl.id
      WHERE 1=1
    `;

    const params = [];

    if (type) {
      sql += ' AND t.transaction_type = ?';
      params.push(type);
    }

    if (search) {
      sql += ' AND (t.transaction_number LIKE ? OR m.code LIKE ? OR m.name LIKE ? OR t.reference_number LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (start_date) {
      sql += ' AND date(t.created_at) >= date(?)';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND date(t.created_at) <= date(?)';
      params.push(end_date);
    }

    sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const transactions = db.prepare(sql).all(...params);

    const totalCount = db.prepare(`SELECT count(*) as count FROM inventory_transactions`).get().count;

    res.json({
      success: true,
      total: totalCount,
      page: Number(page),
      limit: Number(limit),
      data: transactions
    });
  } catch (err) {
    next(err);
  }
});

// 7. CHAIN OF CUSTODY (JEJAK DIGITAL SIKLUS HIDUP LENGKAP)
router.get('/chain-of-custody/:identifier', authMiddleware, (req, res, next) => {
  try {
    const { identifier } = req.params;

    const material = db.prepare(`
      SELECT m.*, u.code as unit_code, c.name as category_name
      FROM materials m
      JOIN units u ON m.unit_id = u.id
      JOIN categories c ON m.category_id = c.id
      WHERE m.id = ? OR m.code = ?
    `).get(identifier, identifier);

    if (!material) {
      return res.status(404).json({ success: false, message: 'Material tidak ditemukan.' });
    }

    // Ambil jejak runut kronologis dari awal mula
    const timeline = db.prepare(`
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
        usr.full_name as operator_name,
        fl.code as from_location_code,
        fl.warehouse as from_warehouse,
        tl.code as to_location_code,
        tl.warehouse as to_warehouse
      FROM inventory_transactions t
      JOIN users usr ON t.user_id = usr.id
      LEFT JOIN locations fl ON t.from_location_id = fl.id
      LEFT JOIN locations tl ON t.to_location_id = tl.id
      WHERE t.material_id = ?
      ORDER BY t.created_at ASC
    `).all(material.id);

    // Hitung posisi terkini
    const inventory = db.prepare(`
      SELECT i.*, l.code as location_code, l.warehouse, l.rack, l.shelf
      FROM inventory i
      JOIN locations l ON i.location_id = l.id
      WHERE i.material_id = ?
    `).all(material.id);

    res.json({
      success: true,
      material,
      current_inventory: inventory,
      chain_of_custody_events: timeline
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
