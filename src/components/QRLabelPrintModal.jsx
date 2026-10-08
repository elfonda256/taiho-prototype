import React from 'react';
import { Printer, Download, X } from 'lucide-react';

export default function QRLabelPrintModal({ isOpen, onClose, material }) {
  if (!isOpen || !material) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div>
            <h3 className="card-title" style={{ fontSize: 16 }}>Cetak Label Stiker QR</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Format thermal label standar rak gudang (75 x 50 mm)</p>
          </div>
          <button className="btn btn-outline" style={{ minHeight: 32, padding: '0 8px' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Printable Label Card */}
          <div
            className="print-label-area"
            style={{
              width: 320,
              padding: 16,
              backgroundColor: '#ffffff',
              border: '2px solid #0f172a',
              borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            {/* Header Pabrik */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1.5px solid #0f172a', paddingBottom: 6 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: '#0f172a' }}>
                  PT MANUFAKTUR PRESISI NUSANTARA
                </div>
                <div style={{ fontSize: 8, color: '#475569' }}>LABEL IDENTIFIKASI MATERIAL RESMI</div>
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                {material.code}
              </div>
            </div>

            {/* Konten Utama */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '4px 0' }}>
              {material.qrDataUrl ? (
                <img
                  src={material.qrDataUrl}
                  alt={`QR ${material.code}`}
                  style={{ width: 100, height: 100, border: '1px solid #cbd5e1', borderRadius: 4 }}
                />
              ) : (
                <div style={{ width: 100, height: 100, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                  QR Code
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: 4 }}>
                  {material.name}
                </div>
                <div style={{ fontSize: 10, color: '#475569', marginBottom: 6 }}>
                  {material.specification || 'Spesifikasi Standar Pabrik'}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>
                  Lokasi: <span style={{ fontFamily: 'var(--font-mono)' }}>{material.location_code || material.default_location_id || 'Gudang Utama'}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginTop: 2 }}>
                  Stok: <span style={{ fontFamily: 'var(--font-mono)' }}>{Number(material.total_current_stock || material.current_stock || 0).toLocaleString('id-ID')} {material.unit_code || 'PCS'}</span>
                </div>
              </div>
            </div>

            {/* Footer Label */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: 4, fontSize: 8, color: '#64748b' }}>
              <span>Dilarang memindahkan material tanpa scan</span>
              <span>Rev: 2026/V1</span>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ gap: 8 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
            Batal
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePrint}>
            <Printer size={16} /> Cetak Stiker
          </button>
        </div>
      </div>
    </div>
  );
}
