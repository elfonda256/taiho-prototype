import React, { useState, useEffect, useRef } from 'react';
import { Camera, Search, Barcode, CheckCircle2, AlertCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  if (!isOpen) return null;

  const [manualCode, setManualCode] = useState('');
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual' | 'sample'
  const [cameraError, setCameraError] = useState(null);
  const scannerRef = useRef(null);

  // Quick preset samples for zero-friction factory testing
  const sampleCodes = [
    { code: 'MAT-000101', name: 'Bearing Shell A', cat: 'Komponen Mesin' },
    { code: 'MAT-000201', name: 'Plat Baja SPCC 1.2mm', cat: 'Bahan Logam' },
    { code: 'MAT-000107', name: 'Bushing Kuningan OD 35mm', cat: 'Komponen Mesin' },
    { code: 'MAT-000301', name: 'Baut Hexagon M8x30', cat: 'Fastener' },
    { code: 'MAT-000401', name: 'Pelumas Hidrolik ISO VG 68', cat: 'Pelumas' },
    { code: 'MAT-000601', name: 'Kardus Master Box Pompa', cat: 'Kemasan' }
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
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div>
            <h3 className="card-title" style={{ fontSize: 17 }}>Pemindai QR Code & Barcode</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Arahkan kamera ke label stiker atau gunakan kode cepat
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
            ⌨️ Input Kode / Gun Scanner
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
            🏷️ Sampel Cepat
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
                Posisikan QR Code di dalam kotak hijau pemindai.
              </p>
            </div>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label className="form-label">Ketik Kode Material atau Gunakan Barcode Gun:</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  style={{ fontSize: 18, textTransform: 'uppercase', letterSpacing: 1 }}
                  placeholder="Contoh: MAT-000101"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  autoFocus
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  💡 Pemindai barcode fisik (USB/Bluetooth gun) otomatis mengirim kode dan tombol Enter.
                </span>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }}>
                Pilih Material
              </button>
            </form>
          )}

          {activeTab === 'sample' && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Pilih sampel material pabrik siap uji berikut:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sampleCodes.map(s => (
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
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'background-color 120ms ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-main)' }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.cat}</div>
                    </div>
                    <span className="font-mono badge badge-tersedia">{s.code}</span>
                  </div>
                ))}
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
