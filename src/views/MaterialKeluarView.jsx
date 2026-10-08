import React, { useState, useEffect } from 'react';
import { QrCode, ArrowUpRight, CheckCircle2, AlertTriangle, Search, PackageCheck } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function MaterialKeluarView({
  initialMaterialCode,
  onOpenScanner,
  onSuccessTransaction,
  currentUser
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [destination, setDestination] = useState('Lini Produksi 01 (Perakitan Pompa)');
  const [spkNumber, setSpkNumber] = useState('SPK-2026-10-001');
  const [recipientName, setRecipientName] = useState('Joko Prasetyo (Op. Produksi)');
  const [notes, setNotes] = useState('');
  const [materialsList, setMaterialsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [highValueConfirmed, setHighValueConfirmed] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => 'idemp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8));

  // Load list of materials for quick selection
  useEffect(() => {
    fetch('/api/materials?limit=60')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMaterialsList(data.data);
          // If initialMaterialCode was passed
          if (initialMaterialCode) {
            const found = data.data.find(m => m.code === initialMaterialCode);
            if (found) setSelectedMaterial(found);
          } else if (data.data.length > 0) {
            // Default to Bearing Shell A for demonstration
            setSelectedMaterial(data.data[0]);
          }
        }
      })
      .catch(err => console.error(err));
  }, [initialMaterialCode]);

  const handleSelectMaterial = mat => {
    setSelectedMaterial(mat);
    setErrorMsg(null);
    setQuantity('');
    setHighValueConfirmed(false);
    setIdempotencyKey('idemp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8));
  };

  const handleQuickAdd = amount => {
    const current = Number(quantity) || 0;
    const maxAvailable = selectedMaterial ? selectedMaterial.total_current_stock : 0;
    const nextVal = Math.min(current + amount, maxAvailable);
    setQuantity(String(nextVal));
  };

  const handleFormSubmit = e => {
    e.preventDefault();
    const qtyNum = Number(quantity);
    if (!selectedMaterial) {
      setErrorMsg('Silakan pilih material terlebih dahulu.');
      return;
    }
    if (!qtyNum || qtyNum <= 0) {
      setErrorMsg('Masukkan jumlah kuantitas yang valid (lebih dari 0).');
      return;
    }
    if (qtyNum > selectedMaterial.total_current_stock) {
      setErrorMsg(`Kuantitas melebihi sisa stok yang tersedia (${selectedMaterial.total_current_stock} ${selectedMaterial.unit_code}).`);
      return;
    }

    const impact = qtyNum * selectedMaterial.unit_cost;
    if (impact >= 10000000 && !highValueConfirmed) {
      setErrorMsg(`Transaksi bernilai tinggi (Rp ${impact.toLocaleString('id-ID')}). Mohon centang persetujuan verifikasi fisik di bawah sebelum konfirmasi.`);
      return;
    }

    setErrorMsg(null);
    // Refresh idempotency key for this submit action
    if (!idempotencyKey) {
      setIdempotencyKey('idemp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8));
    }
    setShowConfirm(true);
  };

  const executeIssue = async () => {
    if (isLoading) return; // Prevent double trigger
    setIsLoading(true);
    try {
      const activeKey = idempotencyKey || ('idemp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8));
      const res = await fetch('/api/transactions/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': activeKey
        },
        body: JSON.stringify({
          material_id: selectedMaterial.id,
          quantity: Number(quantity),
          destination_line: destination,
          spk_number: spkNumber,
          recipient_name: recipientName,
          notes,
          idempotency_key: activeKey,
          high_value_confirmed: highValueConfirmed || financialImpact < 10000000
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Gagal memproses pengeluaran material.');
      }

      setShowConfirm(false);
      setLastReceipt(result.data);
      // Reset form state with fresh idempotency key
      setSelectedMaterial(prev => ({
        ...prev,
        total_current_stock: result.data.new_stock
      }));
      setQuantity('');
      setHighValueConfirmed(false);
      setIdempotencyKey('idemp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8));
      if (onSuccessTransaction) onSuccessTransaction();
    } catch (err) {
      setErrorMsg(err.message);
      setShowConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMaterials = materialsList.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const financialImpact = selectedMaterial ? (Number(quantity) || 0) * selectedMaterial.unit_cost : 0;

  return (
    <div className="content-body" style={{ maxWidth: 880 }}>
      {/* SUCCESS RECEIPT NOTIFICATION */}
      {lastReceipt && (
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '2px solid #16a34a',
            borderRadius: 'var(--radius-md)',
            padding: 20,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <CheckCircle2 size={28} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: 18, fontWeight: 800, color: '#166534' }}>
                Pengeluaran Material Berhasil Dicatat!
              </h4>
              <span className="font-mono badge badge-tersedia">{lastReceipt.transaction_number}</span>
            </div>

            <p style={{ fontSize: 14, color: '#14532d', marginTop: 4 }}>
              <strong>{lastReceipt.quantity.toLocaleString('id-ID')} unit</strong> {lastReceipt.material_name} telah dikeluarkan ke <strong>{lastReceipt.destination}</strong>.
            </p>

            <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 13, color: '#15803d' }}>
              <div>Stok Sebelumnya: <strong>{lastReceipt.previous_stock.toLocaleString('id-ID')}</strong></div>
              <div>Stok Terkini: <strong>{lastReceipt.new_stock.toLocaleString('id-ID')}</strong></div>
              <div>Nilai Transaksi: <strong>Rp {Math.abs(lastReceipt.financial_impact).toLocaleString('id-ID')}</strong></div>
            </div>

            <button
              className="btn btn-outline"
              style={{ minHeight: 34, padding: '0 12px', fontSize: 12, marginTop: 12 }}
              onClick={() => setLastReceipt(null)}
            >
              Tutup Bukti Transaksi
            </button>
          </div>
        </div>
      )}

      {/* ERROR ALERT */}
      {errorMsg && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1.5px solid #ef4444',
            borderRadius: 'var(--radius-md)',
            padding: 14,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <AlertTriangle color="#dc2626" size={24} />
          <div style={{ color: '#991b1b', fontWeight: 600, fontSize: 14 }}>{errorMsg}</div>
        </div>
      )}

      {/* STEP 1 & 2: SCAN ATAU PILIH MATERIAL */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
              LANGKAH 1 DARI 3
            </span>
            <h3 className="card-title" style={{ fontSize: 18 }}>Identifikasi Material</h3>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ minHeight: 42, padding: '0 16px' }}
            onClick={onOpenScanner}
          >
            <QrCode size={18} /> SCAN QR CODE
          </button>
        </div>

        {/* Selected Material Card Display (Per Prompt Section 7) */}
        {selectedMaterial ? (
          <div
            style={{
              border: '2px solid var(--primary-900)',
              borderRadius: 'var(--radius-md)',
              padding: 20,
              backgroundColor: '#f8fafc',
              marginBottom: 16
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>MATERIAL TERPILIH</span>
                <h4 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                  {selectedMaterial.name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <span className="font-mono" style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary-900)' }}>
                    Kode: {selectedMaterial.code}
                  </span>
                  <span>•</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Lokasi: <strong>{selectedMaterial.location_code || 'Gudang B - Rak B01'}</strong>
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>SISA STOK TERSEDIA</div>
                <div className="font-mono" style={{ fontSize: 28, fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
                  {Number(selectedMaterial.total_current_stock).toLocaleString('id-ID')} {selectedMaterial.unit_code}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Harga: Rp {Number(selectedMaterial.unit_cost).toLocaleString('id-ID')} / {selectedMaterial.unit_code}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ color: 'var(--text-muted)' }}>Scan QR Code label atau cari nama material di bawah.</p>
          </div>
        )}

        {/* Quick Search Selector */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: 16, color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 40 }}
            placeholder="Cari nama atau kode material (contoh: Bearing Shell, Plat Baja, Baut M8)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {searchQuery && (
          <div
            style={{
              maxHeight: 180,
              overflowY: 'auto',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              marginTop: 6,
              backgroundColor: '#ffffff'
            }}
          >
            {filteredMaterials.slice(0, 8).map(m => (
              <div
                key={m.id}
                onClick={() => {
                  handleSelectMaterial(m);
                  setSearchQuery('');
                }}
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                  <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.code}</div>
                </div>
                <span className="font-mono" style={{ fontWeight: 700, color: '#059669' }}>
                  {m.total_current_stock} {m.unit_code}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STEP 2 & 3: FORM PENGELUARAN DENGAN TOMBOL BESAR (+10, +50, +100) */}
      <form onSubmit={handleFormSubmit} className="card">
        <div className="card-header">
          <div>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
              LANGKAH 2 DARI 3
            </span>
            <h3 className="card-title" style={{ fontSize: 18 }}>Jumlah & Lokasi Tujuan</h3>
          </div>
        </div>

        {/* INPUT JUMLAH BESAR */}
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 15 }}>
            Jumlah Kuantitas Keluar ({selectedMaterial?.unit_code || 'PCS'}):
          </label>
          <input
            type="number"
            className="form-input font-mono"
            style={{ fontSize: 26, fontWeight: 800, height: 60, textAlign: 'center' }}
            placeholder="0"
            min="1"
            max={selectedMaterial?.total_current_stock || 99999}
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            required
          />

          {/* TOMBOL PRESET CEPAT (+10, +50, +100) */}
          <div className="qty-stepper-grid">
            <button type="button" className="qty-preset-btn" onClick={() => handleQuickAdd(10)}>
              + 10
            </button>
            <button type="button" className="qty-preset-btn" onClick={() => handleQuickAdd(50)}>
              + 50
            </button>
            <button type="button" className="qty-preset-btn" onClick={() => handleQuickAdd(100)}>
              + 100
            </button>
          </div>
        </div>

        {/* KALKULASI NILAI FINANSIAL LANGSUNG (RUPIAH) */}
        {quantity && Number(quantity) > 0 && selectedMaterial && (
          <div
            style={{
              backgroundColor: '#f1f5f9',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              marginBottom: 18,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ESTIMASI NILAI MATERIAL:</span>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {quantity} {selectedMaterial.unit_code} × Rp {selectedMaterial.unit_cost.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="font-mono" style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)' }}>
              Rp {financialImpact.toLocaleString('id-ID')}
            </div>
          </div>
        )}

        {/* PERINGATAN NILAI TINGGI (DI ATAS RP 10 JUTA ATAU LEBIH DARI 50% STOK) */}
        {financialImpact >= 10000000 && (
          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '2px solid #d97706',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: 18
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b45309', fontWeight: 800, fontSize: 14 }}>
              <AlertTriangle size={20} />
              <span>PERINGATAN: TRANSAKSI NILAI TINGGI (DI ATAS RP 10 JUTA)</span>
            </div>
            <p style={{ margin: '6px 0 10px', fontSize: 13, color: '#78350f', lineHeight: 1.4 }}>
              Material yang dikeluarkan bernilai <strong>Rp {financialImpact.toLocaleString('id-ID')}</strong>. 
              Mohon pastikan Anda tidak salah mengetik kuantitas (misal: 1000 alih-alih 100).
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#92400e' }}>
              <input
                type="checkbox"
                checked={highValueConfirmed}
                onChange={e => setHighValueConfirmed(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#d97706' }}
              />
              <span>Saya menyatakan telah memeriksa fisik barang dan jumlah {quantity} {selectedMaterial?.unit_code} sudah benar</span>
            </label>
          </div>
        )}

        {/* PILIH TUJUAN (Lini Produksi) */}
        <div className="form-group">
          <label className="form-label">Tujuan Pengeluaran Material:</label>
          <select
            className="form-select"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            style={{ fontWeight: 600 }}
          >
            <option value="Lini Produksi 01 (Perakitan Pompa)">Lini Produksi 01 (Perakitan Pompa)</option>
            <option value="Lini Produksi 02 (Pemesinan Turbin)">Lini Produksi 02 (Pemesinan Turbin)</option>
            <option value="Lini Fabrikasi & Stamping">Lini Fabrikasi & Stamping</option>
            <option value="Lini Finishing & Kemasan">Lini Finishing & Kemasan</option>
            <option value="Departemen Perawatan Mesin (Maintenance)">Departemen Perawatan Mesin (Maintenance)</option>
            <option value="Gudang Transit Keluar (Ekspedisi)">Gudang Transit Keluar (Ekspedisi)</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Nomor SPK / Surat Jalan:</label>
            <input
              type="text"
              className="form-input font-mono"
              value={spkNumber}
              onChange={e => setSpkNumber(e.target.value)}
              placeholder="Contoh: SPK-2026-10-001"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nama Operator Penerima:</label>
            <input
              type="text"
              className="form-input"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              placeholder="Contoh: Joko Prasetyo"
            />
          </div>
        </div>

        {/* TOMBOL KONFIRMASI BESAR */}
        <button
          type="submit"
          className="btn btn-success btn-xl"
          style={{ marginTop: 12 }}
          disabled={!selectedMaterial || !quantity || Number(quantity) <= 0}
        >
          <ArrowUpRight size={24} />
          KONFIRMASI PENGELUARAN MATERIAL
        </button>
      </form>

      {/* CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeIssue}
        title="Konfirmasi Pengeluaran Material"
        materialName={selectedMaterial?.name}
        quantity={quantity}
        unit={selectedMaterial?.unit_code}
        financialValue={financialImpact}
        destination={destination}
        actionType="KELUAR"
        confirmLabel="Ya, Keluarkan Material"
        isLoading={isLoading}
      />
    </div>
  );
}
