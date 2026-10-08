import React, { useState, useEffect } from 'react';
import {
  QrCode,
  ArrowUpRight,
  ArrowLeftRight,
  RotateCcw,
  Clock,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  X
} from 'lucide-react';
import QRLabelPrintModal from '../components/QRLabelPrintModal';

export default function ScanQRView({
  initialCode,
  onOpenScanner,
  setView,
  onSelectMaterialForIssue,
  onViewHistory
}) {
  const [scannedCode, setScannedCode] = useState(initialCode || 'MAT-000101');
  const [materialData, setMaterialData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showLabelModal, setShowLabelModal] = useState(false);

  // Transfer & Return Modal states
  const [showActionModal, setShowActionModal] = useState(null); // 'TRANSFER' | 'RETURN'
  const [actionQty, setActionQty] = useState('');
  const [targetLocation, setTargetLocation] = useState('loc_gb_r01_s02');
  const [locationsList, setLocationsList] = useState([]);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchMaterial = code => {
    if (!code) return;
    setIsLoading(true);
    setErrorMsg(null);
    setActionSuccess(null);

    fetch(`/api/materials/${code}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMaterialData(data.data);
        } else {
          setErrorMsg(data.message || 'Material tidak ditemukan.');
          setMaterialData(null);
        }
      })
      .catch(err => {
        setErrorMsg('Gagal mengambil data material.');
        setMaterialData(null);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchMaterial(scannedCode);
    fetch('/api/locations')
      .then(res => res.json())
      .then(d => {
        if (d.success) setLocationsList(d.data);
      });
  }, [scannedCode]);

  const handleQuickTransfer = async () => {
    if (!actionQty || Number(actionQty) <= 0) return;
    try {
      const res = await fetch('/api/transactions/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: materialData.id,
          quantity: Number(actionQty),
          from_location_id: materialData.default_location_id,
          to_location_id: targetLocation,
          reason: 'Penataan ulang stok oleh operator'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setActionSuccess(`Berhasil memindahkan ${actionQty} unit ke rak baru.`);
      setShowActionModal(null);
      setActionQty('');
      fetchMaterial(scannedCode);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickReturn = async () => {
    if (!actionQty || Number(actionQty) <= 0) return;
    try {
      const res = await fetch('/api/transactions/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: materialData.id,
          quantity: Number(actionQty),
          location_id: materialData.default_location_id,
          from_line: 'Lini Produksi 01',
          return_reason: 'SISA_PRODUKSI',
          notes: 'Pengembalian sisa material'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setActionSuccess(`Berhasil mencatat pengembalian ${actionQty} unit.`);
      setShowActionModal(null);
      setActionQty('');
      fetchMaterial(scannedCode);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="content-body" style={{ maxWidth: 840 }}>
      {/* SEARCH / SCAN BAR */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: 16, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input font-mono"
              style={{ paddingLeft: 40, textTransform: 'uppercase', fontSize: 16 }}
              placeholder="Ketik kode QR (contoh: MAT-000101)..."
              value={scannedCode}
              onChange={e => setScannedCode(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') fetchMaterial(scannedCode);
              }}
            />
          </div>

          <button
            className="btn btn-outline"
            style={{ minHeight: 48, padding: '0 16px' }}
            onClick={() => fetchMaterial(scannedCode)}
          >
            Cari
          </button>

          <button
            className="btn btn-primary"
            style={{ minHeight: 48, padding: '0 20px' }}
            onClick={onOpenScanner}
          >
            <QrCode size={18} /> SCAN KAMERA
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: 14,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <CheckCircle2 color="#34d399" size={24} />
          <div style={{ color: '#34d399', fontWeight: 700 }}>{actionSuccess}</div>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: 14,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <AlertTriangle color="#f87171" size={24} />
          <div style={{ color: '#f87171', fontWeight: 600 }}>{errorMsg}</div>
        </div>
      )}

      {/* HASIL SCAN MATERIAL (SECTION 7 FORMAT PERSIS) */}
      {materialData && (
        <div className="card" style={{ border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-primary)', letterSpacing: '0.5px' }}>
                INFORMASI MATERIAL TERDETEKSI
              </span>
              <h3 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-main)', marginTop: 4 }}>
                {materialData.name}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {materialData.specification || 'Spesifikasi Industri Standar'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className="btn btn-outline"
                style={{ minHeight: 38, padding: '0 12px', fontSize: 12 }}
                onClick={() => setShowLabelModal(true)}
              >
                <Printer size={15} /> Cetak Stiker QR
              </button>
            </div>
          </div>

          {/* BOX INFORMASI LENGKAP DENGAN NILAI BESAR */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14,
              backgroundColor: 'var(--bg-card-inner)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 18,
              marginBottom: 24
            }}
          >
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Kode Material:</div>
              <div className="font-mono" style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand-primary)', marginTop: 2 }}>
                {materialData.code}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Lokasi Penyimpanan:</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>
                {materialData.location_code || 'Gudang B - Rak B01'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {materialData.warehouse} • {materialData.rack}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Stok Fisik Tersedia:</div>
              <div className="font-mono" style={{ fontSize: 24, fontWeight: 900, color: 'var(--status-safe)', marginTop: 2 }}>
                {Number(materialData.total_current_stock).toLocaleString('id-ID')} {materialData.unit_code}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status Inventaris:</div>
              <div style={{ marginTop: 4 }}>
                <span
                  className={`badge ${
                    materialData.status === 'TERSEDIA'
                      ? 'badge-tersedia'
                      : materialData.status === 'SELISIH'
                      ? 'badge-selisih'
                      : 'badge-dialokasikan'
                  }`}
                  style={{ fontSize: 13, padding: '6px 12px' }}
                >
                  {materialData.status === 'TERSEDIA' && 'TERSEDIA'}
                  {materialData.status === 'DIALOKASIKAN' && 'DIALOKASIKAN'}
                  {materialData.status === 'DI_PRODUKSI' && 'DI PRODUKSI'}
                  {materialData.status === 'DIKEMBALIKAN' && 'DIKEMBALIKAN'}
                  {materialData.status === 'SELISIH' && 'SELISIH'}
                </span>
              </div>
            </div>
          </div>

          {/* 4 TOMBOL BESAR SESUAI SECTION 7 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <button
              className="btn btn-success btn-lg"
              onClick={() => onSelectMaterialForIssue(materialData.code)}
              style={{ fontSize: 16, fontWeight: 800 }}
            >
              <ArrowUpRight size={22} />
              MATERIAL KELUAR
            </button>

            <button
              className="btn btn-outline btn-lg"
              onClick={() => setShowActionModal('TRANSFER')}
              style={{ fontSize: 16, fontWeight: 800 }}
            >
              <ArrowLeftRight size={22} color="#0284c7" />
              PINDAH LOKASI
            </button>

            <button
              className="btn btn-outline btn-lg"
              onClick={() => setShowActionModal('RETURN')}
              style={{ fontSize: 16, fontWeight: 800 }}
            >
              <RotateCcw size={22} color="#d97706" />
              KEMBALIKAN
            </button>

            <button
              className="btn btn-primary btn-lg"
              onClick={() => onViewHistory(materialData.code)}
              style={{ fontSize: 16, fontWeight: 800 }}
            >
              <Clock size={22} />
              LIHAT RIWAYAT
            </button>
          </div>
        </div>
      )}

      {/* MODAL AKSI CEPAT PINDAH / KEMBALIKAN */}
      {showActionModal && (
        <div className="modal-overlay" onClick={() => setShowActionModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="card-title">
                {showActionModal === 'TRANSFER' ? 'Pindah Lokasi Rak' : 'Terima Pengembalian Material'}
              </h3>
              <button className="btn btn-outline" style={{ minHeight: 30, padding: '0 8px' }} onClick={() => setShowActionModal(null)}>
                <X size={15} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                Material: <strong>{materialData?.name}</strong> ({materialData?.code})
              </p>

              <div className="form-group">
                <label className="form-label">Jumlah Kuantitas ({materialData?.unit_code}):</label>
                <input
                  type="number"
                  className="form-input font-mono"
                  style={{ fontSize: 20, fontWeight: 800 }}
                  value={actionQty}
                  onChange={e => setActionQty(e.target.value)}
                  placeholder="0"
                  min="1"
                />
              </div>

              {showActionModal === 'TRANSFER' && (
                <div className="form-group">
                  <label className="form-label">Pilih Lokasi Rak Tujuan Baru:</label>
                  <select
                    className="form-select"
                    value={targetLocation}
                    onChange={e => setTargetLocation(e.target.value)}
                  >
                    {locationsList.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.warehouse} - {loc.rack} ({loc.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowActionModal(null)}>
                Batal
              </button>
              <button
                className="btn btn-primary"
                onClick={showActionModal === 'TRANSFER' ? handleQuickTransfer : handleQuickReturn}
              >
                Konfirmasi Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT QR LABEL MODAL */}
      <QRLabelPrintModal
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        material={materialData}
      />
    </div>
  );
}
