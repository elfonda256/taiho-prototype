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
      color: '#059669'
    },
    {
      username: 'operator_produksi',
      name: 'Mas Joko Prasetyo',
      role: 'PRODUCTION',
      roleTitle: 'Operator Produksi',
      dept: 'Lini Fabrikasi & Stamping',
      icon: HardHat,
      desc: 'Minta material, lapor pemakaian, kembalikan material sisa',
      color: '#0284c7'
    },
    {
      username: 'supervisor',
      name: 'Pak Hendra Wijaya',
      role: 'SUPERVISOR',
      roleTitle: 'Supervisor Gudang',
      dept: 'Operasional Gudang',
      icon: Shield,
      desc: 'Persetujuan scrap & pengeluaran, investigasi selisih, verifikasi opname',
      color: '#d97706'
    },
    {
      username: 'manajemen',
      name: 'Ir. Bambang Trihatmojo',
      role: 'MANAGEMENT',
      roleTitle: 'Plant Manager',
      dept: 'Direksi & Operasional',
      icon: BarChart3,
      desc: 'Dashboard eksekutif, analisis dampak finansial, tingkat kehilangan',
      color: '#7c3aed'
    },
    {
      username: 'admin',
      name: 'Bu Siti Rahmawati',
      role: 'ADMIN',
      roleTitle: 'Admin Sistem',
      dept: 'IT & Sistem Informasi',
      icon: Settings,
      desc: 'Akses penuh, kelola master data material, lokasi, dan audit log',
      color: '#0f172a'
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div>
            <h3 className="card-title" style={{ fontSize: 18 }}>Ganti Akun & Peran Pengguna</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Simulasi perspektif pengguna pabrik untuk pengujian sistem
            </p>
          </div>
          <button className="btn btn-outline" style={{ minHeight: 36, padding: '0 12px' }} onClick={onClose}>
            ✕ Tutup
          </button>
        </div>

        <div className="modal-body" style={{ padding: 16 }}>
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
                    border: isCurrent ? '2px solid var(--primary-900)' : '1px solid var(--border-subtle)',
                    backgroundColor: isCurrent ? '#f8fafc' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 120ms ease'
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: `${u.color}15`,
                      color: u.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Icon size={24} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)' }}>
                        {u.name}
                      </span>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: `${u.color}15`,
                          color: u.color,
                          borderColor: `${u.color}40`,
                          fontSize: 11
                        }}
                      >
                        {u.roleTitle}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {u.dept} • {u.desc}
                    </p>
                  </div>

                  {isCurrent && (
                    <span style={{ color: 'var(--primary-900)', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
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
