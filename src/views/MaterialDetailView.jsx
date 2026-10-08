import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Printer,
  ArrowUpRight,
  Clock,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Boxes,
  ScrollText
} from 'lucide-react';
import QRLabelPrintModal from '../components/QRLabelPrintModal';

export default function MaterialDetailView({
  materialCode,
  onBack,
  onIssueMaterial
}) {
  const [data, setData] = useState(null);
  const [chainOfCustody, setChainOfCustody] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLabelModal, setShowLabelModal] = useState(false);

  useEffect(() => {
    if (!materialCode) return;
    setIsLoading(true);

    // Fetch material detail & chain of custody
    Promise.all([
      fetch(`/api/materials/${materialCode}`).then(r => r.json()),
      fetch(`/api/transactions/chain-of-custody/${materialCode}`).then(r => r.json())
    ])
      .then(([matRes, chainRes]) => {
        if (matRes.success) setData(matRes.data);
        if (chainRes.success) setChainOfCustody(chainRes);
      })
      .finally(() => setIsLoading(false));
  }, [materialCode]);

  if (isLoading || !data) {
    return (
      <div className="content-body" style={{ textAlign: 'center', padding: 50 }}>
        <p style={{ color: 'var(--text-muted)' }}>Memuat detail material dan jejak audit digital...</p>
      </div>
    );
  }

  return (
    <div className="content-body" style={{ maxWidth: 1000 }}>
      {/* HEADER WITH BACK BUTTON */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <button className="btn btn-outline" style={{ minHeight: 38 }} onClick={onBack}>
          <ArrowLeft size={16} /> Kembali ke Katalog
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" style={{ minHeight: 38 }} onClick={() => setShowLabelModal(true)}>
            <Printer size={16} /> Cetak Stiker QR
          </button>
          <button className="btn btn-success" style={{ minHeight: 38 }} onClick={() => onIssueMaterial(data.code)}>
            <ArrowUpRight size={16} /> Keluarkan Material
          </button>
        </div>
      </div>

      {/* MATERIAL IDENTITY CARD */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {data.qrDataUrl && (
            <div
              style={{
                padding: 10,
                border: '1.5px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#ffffff',
                textAlign: 'center'
              }}
            >
              <img src={data.qrDataUrl} alt={data.code} style={{ width: 140, height: 140, display: 'block' }} />
              <span className="font-mono" style={{ fontSize: 12, fontWeight: 800, marginTop: 4, display: 'block', color: '#0f172a' }}>
                {data.code}
              </span>
            </div>
          )}

          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="font-mono badge badge-tersedia">{data.code}</span>
              <span className="badge badge-dialokasikan">{data.category_name}</span>
              <span
                className={`badge ${
                  data.status === 'TERSEDIA' ? 'badge-tersedia' : data.status === 'SELISIH' ? 'badge-selisih' : 'badge-diproduksi'
                }`}
              >
                {data.status}
              </span>
            </div>

            <h3 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main)', marginTop: 8 }}>
              {data.name}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>
              {data.specification || 'Spesifikasi teknis resmi standar pabrik'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginTop: 18 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>HARGA SATUAN</div>
                <div className="font-mono" style={{ fontSize: 16, fontWeight: 700 }}>
                  Rp {Number(data.unit_cost).toLocaleString('id-ID')}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>STOK TERKINI</div>
                <div className="font-mono" style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>
                  {Number(data.total_current_stock).toLocaleString('id-ID')} {data.unit_code}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>TOTAL NILAI STOK</div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 800 }}>
                  Rp {Number(data.total_stock_value).toLocaleString('id-ID')}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>LOKASI DEFAULT</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {data.location_code || 'Gudang Utama'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {data.warehouse} - {data.rack}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHAIN OF CUSTODY VISUAL TIMELINE TRACKER (SECTION 11) */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
              REKAM JEJAK MUTLAK (DIGITAL TRACEABILITY)
            </span>
            <h4 className="card-title" style={{ fontSize: 18 }}>
              Rantai Pertanggungjawaban (Chain of Custody)
            </h4>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Setiap perpindahan material tercatat kronologis beserta penanggung jawab, kuantitas, lokasi, dan dokumen referensi:
        </p>

        {chainOfCustody?.chain_of_custody_events && chainOfCustody.chain_of_custody_events.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', paddingLeft: 24 }}>
            {/* Garis vertikal timeline */}
            <div
              style={{
                position: 'absolute',
                left: 7,
                top: 10,
                bottom: 10,
                width: 2,
                backgroundColor: 'var(--border-strong)'
              }}
            />

            {chainOfCustody.chain_of_custody_events.map((ev, index) => {
              const isIssue = ev.transaction_type === 'ISSUE';
              const isReceive = ev.transaction_type === 'RECEIVE';
              const isReturn = ev.transaction_type === 'RETURN';
              const isScrap = ev.transaction_type === 'SCRAP';
              const isAdj = ev.transaction_type === 'ADJUSTMENT';

              return (
                <div key={ev.id} style={{ position: 'relative' }}>
                  {/* Titik Timeline */}
                  <div
                    style={{
                      position: 'absolute',
                      left: -24,
                      top: 4,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: isReceive ? '#10b981' : isIssue ? '#0284c7' : isScrap ? '#ef4444' : '#f59e0b',
                      border: '3px solid var(--bg-surface)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  />

                  <div
                    style={{
                      backgroundColor: 'var(--bg-card-inner)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px 16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          className={`badge ${
                            isReceive
                              ? 'badge-tersedia'
                              : isIssue
                              ? 'badge-diproduksi'
                              : isReturn
                              ? 'badge-dialokasikan'
                              : 'badge-selisih'
                          }`}
                        >
                          {ev.transaction_type}
                        </span>
                        <span className="font-mono" style={{ fontWeight: 800, fontSize: 13 }}>
                          {ev.transaction_number}
                        </span>
                      </div>

                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(ev.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                          {ev.quantity.toLocaleString('id-ID')} {data.unit_code}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                          (Stok: {ev.previous_stock} → {ev.new_stock})
                        </span>
                      </div>

                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Petugas: <strong>{ev.operator_name}</strong> {ev.recipient_name ? `→ ${ev.recipient_name}` : ''}
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
                      Ref: <strong>{ev.reference_type} #{ev.reference_number}</strong> • Catatan: {ev.notes || '-'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
            Belum ada rekam mutasi untuk material ini.
          </p>
        )}
      </div>

      {/* PRINT QR LABEL MODAL */}
      <QRLabelPrintModal
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        material={data}
      />
    </div>
  );
}
