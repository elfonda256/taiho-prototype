import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, CheckCircle2, AlertTriangle, QrCode, Search } from 'lucide-react';

export default function MaterialMasukView({ onOpenScanner, onSuccessTransaction }) {
  const [materialsList, setMaterialsList] = useState([]);
  const [locationsList, setLocationsList] = useState([]);
  const [selectedMatId, setSelectedMatId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [locationId, setLocationId] = useState('');
  const [poNumber, setPoNumber] = useState('PO-2026-10-095');
  const [deliveryNote, setDeliveryNote] = useState('SJ-8892');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetch('/api/materials?limit=60')
      .then(res => res.json())
      .then(d => {
        if (d.success && d.data.length > 0) {
          setMaterialsList(d.data);
          setSelectedMatId(d.data[0].id);
        }
      });

    fetch('/api/locations')
      .then(res => res.json())
      .then(d => {
        if (d.success && d.data.length > 0) {
          setLocationsList(d.data);
          setLocationId(d.data[0].id);
        }
      });
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!selectedMatId || !quantity || Number(quantity) <= 0 || !locationId) {
      alert('Harap lengkapi material, kuantitas, dan lokasi penerimaan.');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/transactions/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: selectedMatId,
          quantity: Number(quantity),
          location_id: locationId,
          po_number: poNumber,
          delivery_note_number: deliveryNote,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setMessage({ type: 'success', text: data.message });
      setQuantity('');
      if (onSuccessTransaction) onSuccessTransaction();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMat = materialsList.find(m => m.id === selectedMatId);

  return (
    <div className="content-body" style={{ maxWidth: 840 }}>
      {message && (
        <div
          style={{
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fee2e2',
            border: `1.5px solid ${message.type === 'success' ? '#16a34a' : '#ef4444'}`,
            borderRadius: 'var(--radius-md)',
            padding: 16,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          {message.type === 'success' ? (
            <CheckCircle2 color="#16a34a" size={24} />
          ) : (
            <AlertTriangle color="#dc2626" size={24} />
          )}
          <div style={{ color: message.type === 'success' ? '#14532d' : '#991b1b', fontWeight: 700 }}>
            {message.text}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title" style={{ fontSize: 18 }}>Penerimaan Material Baru (Receive)</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Catat barang masuk dari pemasok / vendor dengan dokumen Surat Jalan resmi
            </p>
          </div>

          <button type="button" className="btn btn-outline" onClick={onOpenScanner}>
            <QrCode size={16} /> Scan QR Material
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Pilih Material Masuk:</label>
          <select
            className="form-select font-mono"
            value={selectedMatId}
            onChange={e => setSelectedMatId(e.target.value)}
            style={{ fontWeight: 700 }}
          >
            {materialsList.map(m => (
              <option key={m.id} value={m.id}>
                {m.code} - {m.name} (Stok Saat Ini: {m.total_current_stock} {m.unit_code})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Kuantitas Masuk ({selectedMat?.unit_code || 'PCS'}):</label>
          <input
            type="number"
            className="form-input font-mono"
            style={{ fontSize: 24, fontWeight: 800, height: 56, textAlign: 'center' }}
            placeholder="0"
            min="1"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Lokasi Rak / Gudang Tujuan Penyimpanan:</label>
          <select
            className="form-select"
            value={locationId}
            onChange={e => setLocationId(e.target.value)}
            style={{ fontWeight: 600 }}
          >
            {locationsList.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.warehouse} - {loc.rack} ({loc.shelf}) [{loc.code}]
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Nomor Purchase Order (PO):</label>
            <input
              type="text"
              className="form-input font-mono"
              value={poNumber}
              onChange={e => setPoNumber(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nomor Surat Jalan (SJ) Vendor:</label>
            <input
              type="text"
              className="form-input font-mono"
              value={deliveryNote}
              onChange={e => setDeliveryNote(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Catatan Pemeriksaan Penerimaan:</label>
          <input
            type="text"
            className="form-input"
            placeholder="Contoh: Kondisi fisik barang utuh, segel packing terverifikasi."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-xl" disabled={isLoading}>
          <ArrowDownLeft size={22} />
          {isLoading ? 'Menyimpan...' : 'SIMPAN PENERIMAAN MATERIAL'}
        </button>
      </form>
    </div>
  );
}
