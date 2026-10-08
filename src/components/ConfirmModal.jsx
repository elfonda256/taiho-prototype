import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  materialName,
  quantity,
  unit,
  financialValue,
  destination,
  actionType = 'KELUAR', // KELUAR, AFKIR, PENYESUAIAN
  confirmLabel = 'Konfirmasi',
  isLoading = false
}) {
  if (!isOpen) return null;

  const isDestructive = actionType === 'AFKIR';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: isDestructive ? '#fee2e2' : '#fef3c7',
                color: isDestructive ? '#dc2626' : '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <h3 className="card-title" style={{ fontSize: 17 }}>
              {title}
            </h3>
          </div>
          <button className="btn btn-outline" style={{ minHeight: 32, padding: '0 8px' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px 20px' }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
            {actionType === 'KELUAR' && 'Anda akan mengeluarkan material dari stok gudang:'}
            {actionType === 'AFKIR' && 'PERHATIAN: Anda akan memusnahkan / mengafkir material rusak:'}
            {actionType === 'PENYESUAIAN' && 'Anda akan menyesuaikan stok fisik pada buku besar sistem:'}
          </p>

          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              marginBottom: 16
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>Nama Material</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>
              {materialName}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Jumlah Kuantitas</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  {Number(quantity).toLocaleString('id-ID')} {unit || 'PCS'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nilai Finansial (IDR)</div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: isDestructive ? '#dc2626' : 'var(--text-main)',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  Rp {Number(financialValue || 0).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {destination && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tujuan Pengeluaran: </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>{destination}</span>
              </div>
            )}
          </div>

          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
            Apakah Anda yakin ingin memproses transaksi ini?
          </p>
        </div>

        <div className="modal-footer" style={{ gap: 10 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose} disabled={isLoading}>
            BATAL
          </button>
          <button
            className={`btn ${isDestructive ? 'btn-danger' : 'btn-success'}`}
            style={{ flex: 1.2, minHeight: 48 }}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
