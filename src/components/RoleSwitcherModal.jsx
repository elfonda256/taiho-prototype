import React from 'react';
import { UserCheck, Shield, Warehouse, HardHat, BarChart3, Settings } from 'lucide-react';

export default function RoleSwitcherModal({ isOpen, onClose, currentUser, onSelectUser }) {
  if (!isOpen) return null;

  const users = [
    {
      username: 'operator_gudang',
      name: 'Pak Budi Santoso',
      role: 'WAREHOUSE',
      roleTitle: 'Operator Gudang',
      dept: 'Logistik & Gudang',
      icon: Warehouse,
      desc: 'Pengeluaran cepat, scan QR, terima material, stock opname fisik',
      color: '#10b981'
    },
    {
      username: 'operator_produksi',
      name: 'Mas Joko Prasetyo',
      role: 'PRODUCTION',
      roleTitle: 'Operator Produksi',
      dept: 'Lini Fabrikasi & Stamping',
      icon: HardHat,
      desc: 'Minta material, lapor pemakaian, kembalikan material sisa',
      color: '#38bdf8'
    },
    {
      username: 'supervisor',
      name: 'Pak Hendra Wijaya',
      role: 'SUPERVISOR',
      roleTitle: 'Supervisor Gudang',
      dept: 'Operasional Gudang',
      icon: Shield,
      desc: 'Persetujuan scrap & pengeluaran, investigasi selisih, verifikasi opname',
      color: '#fbbf24'
    },
    {
      username: 'manajemen',
      name: 'Ir. Bambang Trihatmojo',
      role: 'MANAGEMENT',
      roleTitle: 'Plant Manager',
      dept: 'Direksi & Operasional',
      icon: BarChart3,
      desc: 'Dashboard eksekutif, analisis dampak finansial, tingkat kehilangan',
      color: '#c084fc'
    },
    {
      username: 'admin',
      name: 'Bu Siti Rahmawati',
      role: 'ADMIN',
      roleTitle: 'Admin Sistem',
      dept: 'IT & Sistem Informasi',
      icon: Settings,
      desc: 'Akses penuh, kelola master data material, lokasi, dan audit log',
      color: '#38bdf8'
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div>
            <h3 className="card-title" style={{ fontSize: 17 }}>Ganti Akun & Peran Pengguna</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Simulasi perspektif alur kerja pabrik untuk evaluasi langsung
            </p>
          </div>
          <button className="btn btn-outline" style={{ minHeight: 34, padding: '0 12px', fontSize: 12 }} onClick={onClose}>
            ✕ Tutup
          </button>
        </div>

        <div className="modal-body" style={{ padding: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {users.map(u => {
              const Icon = u.icon;
              const isCurrent = currentUser?.username === u.username;

              return (
                <div
                  key={u.username}
                  onClick={() => {
                    onSelectUser(u.username);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: isCurrent ? `2px solid ${u.color}` : '1px solid var(--border-subtle)',
                    backgroundColor: isCurrent ? 'var(--bg-subtle)' : 'var(--bg-card-inner)',
                    cursor: 'pointer',
                    transition: 'all 140ms ease',
                    boxShadow: isCurrent ? `0 0 12px ${u.color}30` : 'none'
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: `${u.color}20`,
                      color: u.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: `1px solid ${u.color}40`
                    }}
                  >
                    <Icon size={22} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text-main)' }}>
                        {u.name}
                      </span>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: `${u.color}20`,
                          color: u.color,
                          borderColor: `${u.color}50`,
                          fontSize: 11,
                          padding: '2px 8px'
                        }}
                      >
                        {u.roleTitle}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      {u.dept} • {u.desc}
                    </p>
                  </div>

                  {isCurrent && (
                    <span style={{ color: u.color, fontWeight: 800, fontSize: 12.5, flexShrink: 0 }}>
                      ✓ Aktif
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
