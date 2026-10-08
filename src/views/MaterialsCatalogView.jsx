import React, { useState, useEffect } from 'react';
import { Search, Filter, Boxes, ArrowUpRight, Printer, QrCode } from 'lucide-react';
import QRLabelPrintModal from '../components/QRLabelPrintModal';

export default function MaterialsCatalogView({ onSelectMaterial, onIssueMaterial }) {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [printLabelMaterial, setPrintLabelMaterial] = useState(null);

  const fetchMaterials = () => {
    setIsLoading(true);
    let url = `/api/materials?limit=100`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (selectedCat) url += `&category=${encodeURIComponent(selectedCat)}`;
    if (selectedStatus) url += `&status=${encodeURIComponent(selectedStatus)}`;

    fetch(url)
      .then(res => res.json())
      .then(d => {
        if (d.success) setMaterials(d.data);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchMaterials();
  }, [selectedCat, selectedStatus]);

  const handleSearchSubmit = e => {
    e.preventDefault();
    fetchMaterials();
  };

  return (
    <div className="content-body">
      {/* FILTER & SEARCH BAR */}
      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: 16, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 40 }}
              placeholder="Cari kode atau nama material..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 180 }}
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            <option value="cat_raw">Logam & Pelat Baja</option>
            <option value="cat_mech">Komponen Mesin & Bearing</option>
            <option value="cat_fast">Baut, Mur & Fastener</option>
            <option value="cat_chem">Pelumas & Kimia</option>
            <option value="cat_elec">Elektrikal & Sensor</option>
            <option value="cat_pack">Kemasan & Palet</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 160 }}
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="TERSEDIA">🟢 Tersedia</option>
            <option value="DIALOKASIKAN">🔵 Dialokasikan</option>
            <option value="DI_PRODUKSI">🟡 Di Produksi</option>
            <option value="SELISIH">🔴 Selisih</option>
          </select>

          <button type="submit" className="btn btn-primary" style={{ minHeight: 48, padding: '0 20px' }}>
            Cari
          </button>
        </form>
      </div>

      {/* CATALOG TABLE */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Katalog Material Pabrik ({materials.length} item terdaftar)</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Master data seluruh persediaan dengan nomor QR unik dan pemetaan rak
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>KODE</th>
                <th>NAMA MATERIAL</th>
                <th>KATEGORI</th>
                <th>LOKASI RAK</th>
                <th>HARGA SATUAN</th>
                <th>STOK FISIK</th>
                <th>TOTAL NILAI</th>
                <th>STATUS</th>
                <th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {materials.length > 0 ? (
                materials.map(m => (
                  <tr key={m.id}>
                    <td className="font-mono" style={{ fontWeight: 800, color: '#38bdf8' }}>
                      {m.code}
                    </td>
                    <td>
                      <div
                        style={{ fontWeight: 800, color: 'var(--text-main)', cursor: 'pointer' }}
                        onClick={() => onSelectMaterial(m.code)}
                      >
                        {m.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {m.specification || '-'}
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{m.category_name}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.location_code || 'Gudang Utama'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.warehouse || ''}</div>
                    </td>
                    <td className="font-mono">
                      Rp {Number(m.unit_cost).toLocaleString('id-ID')}
                    </td>
                    <td className="font-mono" style={{ fontWeight: 800, color: '#059669' }}>
                      {Number(m.total_current_stock).toLocaleString('id-ID')} {m.unit_code}
                    </td>
                    <td className="font-mono" style={{ fontWeight: 700 }}>
                      Rp {Number(m.total_stock_value).toLocaleString('id-ID')}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          m.status === 'TERSEDIA'
                            ? 'badge-tersedia'
                            : m.status === 'SELISIH'
                            ? 'badge-selisih'
                            : m.status === 'DIALOKASIKAN'
                            ? 'badge-dialokasikan'
                            : 'badge-diproduksi'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-outline"
                          style={{ minHeight: 30, padding: '0 8px', fontSize: 11 }}
                          onClick={() => onSelectMaterial(m.code)}
                          title="Lihat detail & jejak digital"
                        >
                          Detail
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ minHeight: 30, padding: '0 8px', fontSize: 11 }}
                          onClick={() => {
                            fetch(`/api/materials/${m.code}/qr-label`)
                              .then(r => r.json())
                              .then(res => {
                                if (res.success) setPrintLabelMaterial(res.label);
                              });
                          }}
                          title="Cetak label stiker QR"
                        >
                          <Printer size={13} />
                        </button>
                        <button
                          className="btn btn-success"
                          style={{ minHeight: 30, padding: '0 8px', fontSize: 11 }}
                          onClick={() => onIssueMaterial(m.code)}
                          title="Keluarkan material ini"
                        >
                          <ArrowUpRight size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                    Tidak ada material yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT QR LABEL MODAL */}
      <QRLabelPrintModal
        isOpen={!!printLabelMaterial}
        onClose={() => setPrintLabelMaterial(null)}
        material={printLabelMaterial}
      />
    </div>
  );
}
