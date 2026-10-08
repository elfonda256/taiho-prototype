import React, { useState, useEffect } from 'react';
import { MapPin, Boxes, Search, Layers, ChevronRight } from 'lucide-react';

export default function LocationsView({ onSelectMaterial }) {
  const [locations, setLocations] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationItems, setLocationItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/locations')
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setLocations(d.data);
          setGrouped(d.grouped);
          if (d.data.length > 0) {
            handleSelectLocation(d.data[0]);
          }
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSelectLocation = loc => {
    setSelectedLocation(loc);
    fetch(`/api/locations/${loc.id}/inventory`)
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setLocationItems(d.items);
        }
      });
  };

  return (
    <div className="content-body">
      <div style={{ marginBottom: 20 }}>
        <h3 className="card-title" style={{ fontSize: 20 }}>Peta Lokasi & Denah Rak Penyimpanan</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Struktur hierarki: Gudang → Area → Rak → Ambalan untuk melacak keberadaan fisik setiap barang
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* LIST OF WAREHOUSES & RACKS */}
        <div className="card" style={{ padding: 16 }}>
          <h4 className="card-title" style={{ fontSize: 16, marginBottom: 14 }}>
            Daftar Rak & Gudang Pabrik
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.keys(grouped).map(warehouseName => (
              <div key={warehouseName} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  {warehouseName}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {grouped[warehouseName].map(loc => {
                    const isSelected = selectedLocation?.id === loc.id;
                    return (
                      <div
                        key={loc.id}
                        onClick={() => handleSelectLocation(loc)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-card-inner)',
                          border: isSelected ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                          color: isSelected ? 'var(--brand-primary)' : 'var(--text-main)',
                          cursor: 'pointer',
                          transition: 'all 120ms ease'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                            {loc.rack} — {loc.shelf}
                          </div>
                          <div style={{ fontSize: 11, color: isSelected ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
                            {loc.code} • {loc.area}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span
                            className="font-mono"
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: isSelected ? 'var(--brand-primary)' : 'var(--status-safe)'
                            }}
                          >
                            {loc.total_material_types} jenis
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* INVENTORY ITEMS IN SELECTED LOCATION */}
        <div className="card" style={{ padding: 16 }}>
          <div className="card-header">
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                LOKASI AKTIF
              </span>
              <h4 className="card-title" style={{ fontSize: 18 }}>
                {selectedLocation ? `${selectedLocation.warehouse} - ${selectedLocation.rack} (${selectedLocation.shelf})` : 'Pilih Lokasi'}
              </h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Kode Lokasi: <strong>{selectedLocation?.code}</strong> • {selectedLocation?.description}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <h5 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
              Material yang Tersimpan di Rak Ini ({locationItems.length} jenis):
            </h5>

            {locationItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {locationItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onSelectMaterial(item.material_code)}
                    style={{
                      padding: 14,
                      backgroundColor: 'var(--bg-card-inner)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'border-color 120ms ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-main)' }}>
                        {item.material_name}
                      </div>
                      <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {item.material_code} • {item.category_name}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="font-mono" style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>
                        {Number(item.current_stock).toLocaleString('id-ID')} {item.unit_code}
                      </div>
                      <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Rp {Number(item.item_total_value).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', borderRadius: 6 }}>
                Belum ada material yang terdaftar di ambalan rak ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
