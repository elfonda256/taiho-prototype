import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileNav from './components/MobileNav';
import RoleSwitcherModal from './components/RoleSwitcherModal';
import QRScannerModal from './components/QRScannerModal';

// Views
import DashboardView from './views/DashboardView';
import MaterialKeluarView from './views/MaterialKeluarView';
import MaterialMasukView from './views/MaterialMasukView';
import ScanQRView from './views/ScanQRView';
import StockOpnameView from './views/StockOpnameView';
import DiscrepancyView from './views/DiscrepancyView';
import MaterialsCatalogView from './views/MaterialsCatalogView';
import MaterialDetailView from './views/MaterialDetailView';
import TransactionsLedgerView from './views/TransactionsLedgerView';
import LocationsView from './views/LocationsView';
import ReportsView from './views/ReportsView';
import DemoModeView from './views/DemoModeView';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setView] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  // Material Detail Code State
  const [selectedMaterialCode, setSelectedMaterialCode] = useState(null);

  // Modals
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Fetch current user and dashboard stats
  const fetchDashboardStats = () => {
    setIsLoadingDashboard(true);
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(d => {
        if (d.success) setDashboardData(d.data);
      })
      .finally(() => setIsLoadingDashboard(false));
  };

  const fetchCurrentUser = () => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setCurrentUser(d.user);
        } else {
          // Inisialisasi otomatis peran operator gudang untuk evaluasi
          handleRoleSelect('operator_gudang');
        }
      })
      .catch(() => {
        handleRoleSelect('operator_gudang');
      });
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchDashboardStats();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRoleSelect = async username => {
    try {
      const res = await fetch('/api/auth/quick-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const d = await res.json();
      if (d.success) {
        setCurrentUser(d.user);
        fetchDashboardStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('Apakah Anda ingin me-reset database ke kondisi awal demo pabrik?')) return;
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const d = await res.json();
      alert(d.message);
      fetchDashboardStats();
      setView('dashboard');
    } catch (e) {
      alert(e.message);
    }
  };

  const handleScanSuccess = code => {
    setSelectedMaterialCode(code);
    setView('scan_qr');
  };

  const handleSelectMaterial = code => {
    setSelectedMaterialCode(code);
    setView('material_detail');
  };

  const handleIssueMaterial = code => {
    setSelectedMaterialCode(code);
    setView('material_keluar');
  };

  return (
    <div className="app-container">
      {/* Sidebar for Desktop */}
      <Sidebar
        currentView={currentView}
        setView={v => {
          setView(v);
          window.scrollTo(0, 0);
        }}
        currentUser={currentUser}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      <div className="main-wrapper">
        {/* Offline Warning Banner */}
        {!isOnline && (
          <div
            style={{
              backgroundColor: '#b91c1c',
              color: '#ffffff',
              padding: '10px 16px',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              zIndex: 9999
            }}
          >
            <span>⚠️ KONEKSI TERPUTUS: Jaringan Wi-Fi/Internet pabrik sedang offline. Mohon jangan mengirim transaksi mutasi baru sampai koneksi stabil kembali.</span>
          </div>
        )}

        {/* Top Header */}
        <Header
          currentView={currentView}
          currentUser={currentUser}
          onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
          onResetDemo={handleResetDemo}
          setView={setView}
          discrepanciesCount={dashboardData?.kpi?.discrepant_itemsCount || 0}
        />

        {/* View Router */}
        <main style={{ flex: 1 }}>
          {currentView === 'dashboard' && (
            <DashboardView
              data={dashboardData}
              isLoading={isLoadingDashboard}
              setView={setView}
              onOpenScanner={() => setIsScannerOpen(true)}
              onSelectMaterial={handleSelectMaterial}
            />
          )}

          {currentView === 'material_keluar' && (
            <MaterialKeluarView
              initialMaterialCode={selectedMaterialCode}
              onOpenScanner={() => setIsScannerOpen(true)}
              onSuccessTransaction={fetchDashboardStats}
              currentUser={currentUser}
            />
          )}

          {currentView === 'material_masuk' && (
            <MaterialMasukView
              onOpenScanner={() => setIsScannerOpen(true)}
              onSuccessTransaction={fetchDashboardStats}
            />
          )}

          {currentView === 'scan_qr' && (
            <ScanQRView
              initialCode={selectedMaterialCode}
              onOpenScanner={() => setIsScannerOpen(true)}
              setView={setView}
              onSelectMaterialForIssue={handleIssueMaterial}
              onViewHistory={handleSelectMaterial}
            />
          )}

          {currentView === 'stock_opname' && (
            <StockOpnameView
              onOpenScanner={() => setIsScannerOpen(true)}
              currentUser={currentUser}
            />
          )}

          {currentView === 'discrepancies' && (
            <DiscrepancyView
              currentUser={currentUser}
              onViewChainOfCustody={handleSelectMaterial}
            />
          )}

          {currentView === 'materials' && (
            <MaterialsCatalogView
              onSelectMaterial={handleSelectMaterial}
              onIssueMaterial={handleIssueMaterial}
            />
          )}

          {currentView === 'material_detail' && (
            <MaterialDetailView
              materialCode={selectedMaterialCode || 'MAT-000101'}
              onBack={() => setView('materials')}
              onIssueMaterial={handleIssueMaterial}
            />
          )}

          {currentView === 'ledger' && (
            <TransactionsLedgerView onSelectMaterial={handleSelectMaterial} />
          )}

          {currentView === 'locations' && (
            <LocationsView onSelectMaterial={handleSelectMaterial} />
          )}

          {currentView === 'reports' && <ReportsView />}

          {currentView === 'demo_mode' && (
            <DemoModeView setView={setView} onSelectMaterial={handleSelectMaterial} />
          )}
        </main>

        {/* Mobile Touch Navigation */}
        <MobileNav
          currentView={currentView}
          setView={v => {
            setView(v);
            window.scrollTo(0, 0);
          }}
          onOpenScanner={() => setIsScannerOpen(true)}
        />
      </div>

      {/* Global Modals */}
      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleRoleSelect}
      />

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
