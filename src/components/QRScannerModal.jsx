import React, { useState, useEffect, useRef } from 'react';
import { Camera, Search, Barcode, CheckCircle2, AlertCircle, Wrench, Boxes } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  if (!isOpen) return null;

  const [manualCode, setManualCode] = useState('');
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual' | 'sample'
  const [cameraError, setCameraError] = useState(null);
  const scannerRef = useRef(null);

  // Preset samples for machines and materials
  const sampleCodes = [
    // Mesin Pabrik
    { code: 'ASSET-CNC-01', name: 'CNC-01 Machining Center 4-Axis', type: 'MACHINE', cat: 'Lini Machining A' },
    { code: 'ASSET-CNC-03', name: 'CNC-03 Precision Lathe Bubut', type: 'MACHINE', cat: 'Lini Machining B' },
    { code: 'ASSET-PRESS-01', name: 'PRESS-01 Heavy Stamping 300T', type: 'MACHINE', cat: 'Lini Press & Stamping' },
    { code: 'ASSET-INJECTION-01', name: 'INJECTION-01 Molding 180T', type: 'MACHINE', cat: 'Lini Komponen Plastik' },
    // Material Gudang
    { code: 'MAT-000101', name: 'Bearing Shell A', type: 'MATERIAL', cat: 'Komponen Mesin' },
    { code: 'MAT-000201', name: 'Plat Baja SPCC 1.2mm', type: 'MATERIAL', cat: 'Bahan Logam' },
    { code: 'MAT-000107', name: 'Bushing Kuningan OD 35mm', type: 'MATERIAL', cat: 'Komponen Mesin' },
    { code: 'MAT-000401', name: 'Pelumas Hidrolik ISO VG 68', type: 'MATERIAL', cat: 'Pelumas' }
  ];

  useEffect(() => {
    let scanner = null;
    if (activeTab === 'camera') {
      try {
        scanner = new Html5QrcodeScanner(
          'qr-reader-container',
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0
          },
          false
        );

        scanner.render(
          decodedText => {
            scanner.clear();
            onScanSuccess(decodedText.trim());
            onClose();
          },
          error => {
            // Ignore frame scan errors
          }
        );
      } catch (err) {
        setCameraError('Kamera tidak dapat diakses atau peramban tidak memiliki izin kamera.');
      }
    }

    return () => {
      if (scanner) {
        try {
          scanner.clear();
        } catch (e) {}
      }
    };
  }, [activeTab]);

  const handleManualSubmit = e => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim().toUpperCase());
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div>
            <h3 className="card-title" style={{ fontSize: 17 }}>Pemindai QR Code Lapangan</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Scan QR Mesin (Pemeliharaan) atau QR Material (Pengeluaran/Gudang)
            </p>
          </div>
          <button className="btn btn-outline" style={{ minHeight: 32, padding: '0 8px' }} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-subtle)' }}>
          <button
            onClick={() => setActiveTab('camera')}
            style={{
              flex: 1,
              padding: '10px 8px',
              border: 'none',
              borderBottom: activeTab === 'camera' ? '2px solid var(--primary-900)' : 'none',
              background: activeTab === 'camera' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: 13,
              color: activeTab === 'camera' ? 'var(--primary-900)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            📷 Kamera Live
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            style={{
              flex: 1,
              padding: '10px 8px',
              border: 'none',
              borderBottom: activeTab === 'manual' ? '2px solid var(--primary-900)' : 'none',
              background: activeTab === 'manual' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: 13,
              color: activeTab === 'manual' ? 'var(--primary-900)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            ⌨️ Barcode Gun / Input
          </button>

          <button
            onClick={() => setActiveTab('sample')}
            style={{
              flex: 1,
              padding: '10px 8px',
              border: 'none',
              borderBottom: activeTab === 'sample' ? '2px solid var(--primary-900)' : 'none',
              background: activeTab === 'sample' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: 13,
              color: activeTab === 'sample' ? 'var(--primary-900)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            🏷️ Sampel Uji Cepat
          </button>
        </div>

        <div className="modal-body" style={{ padding: 18 }}>
          {activeTab === 'camera' && (
            <div>
              <div
                id="qr-reader-container"
                style={{
                  width: '100%',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  backgroundColor: '#000000',
                  minHeight: 240
                }}
              />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10 }}>
                Arahkan kamera ke stiker QR Mesin (ASSET-...) atau QR Material (MAT-...).
              </p>
            </div>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label className="form-label">Ketik Kode Mesin atau Kode Material:</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  style={{ fontSize: 17, textTransform: 'uppercase', letterSpacing: 1 }}
                  placeholder="Contoh: ASSET-CNC-03 atau MAT-000101"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  autoFocus
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  💡 Mendukung pemindai fisik (USB/Bluetooth wireless gun) di lingkungan pabrik.
                </span>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }}>
                Proses Kode Terpilih
              </button>
            </form>
          )}

          {activeTab === 'sample' && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                Ketuk sampel berikut untuk simulasi pembacaan QR instan:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {sampleCodes.map(s => {
                  const isMachine = s.type === 'MACHINE';
                  return (
                    <div
                      key={s.code}
                      onClick={() => {
                        onScanSuccess(s.code);
                        onClose();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: 'var(--bg-subtle)',
                        border: isMachine ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'background-color 120ms ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isMachine ? <Wrench size={18} color="#0284c7" /> : <Boxes size={18} color="#16a34a" />}
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-main)' }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.cat}</div>
                        </div>
                      </div>
                      <span className={`font-mono badge ${isMachine ? 'badge-primary' : 'badge-tersedia'}`}>
                        {s.code}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" style={{ width: '100%' }} onClick={onClose}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
