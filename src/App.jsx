import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileNav from './components/MobileNav';
import RoleSwitcherModal from './components/RoleSwitcherModal';
import QRScannerModal from './components/QRScannerModal';
import MobileDrawer from './components/MobileDrawer';

// Existing Material Views (100% Preserved)
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

// New Multi-Department Platform Views
import MaintenanceOperatorView from './views/MaintenanceOperatorView';
import MaintenanceDashboardView from './views/MaintenanceDashboardView';
import InformationLeadTimeView from './views/InformationLeadTimeView';
import BaselineSimulationView from './views/BaselineSimulationView';
import SensorIntegrationView from './views/SensorIntegrationView';

import { syncQueuedRecords, getQueuedRecords } from './utils/offlineQueue';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setView] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  // Material & Machine Scan States
  const [selectedMaterialCode, setSelectedMaterialCode] = useState(null);
  const [selectedAssetCode, setSelectedAssetCode] = useState(null);

  // Modals
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(getQueuedRecords().length);

  // Theme Management (Dark & Light Mode with Persisted Preference)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('taiho_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('taiho_theme', theme);
  }, [theme]);

  // Language Management (English default for Japanese Shacho & Management, Indonesian for local operations)
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('taiho_lang') || 'en';
  });

  const toggleLang = () => {
    setLang(prev => {
      const next = prev === 'en' ? 'id' : 'en';
      localStorage.setItem('taiho_lang', next);
      return next;
    });
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

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
          // Default role for quick evaluation
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

    const handleOnline = async () => {
      setIsOnline(true);
      // Auto sync offline queue
      if (getQueuedRecords().length > 0) {
        await syncQueuedRecords();
        setPendingOfflineCount(getQueuedRecords().length);
      }
    };
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

  // Smart QR Routing: Machine vs Material
  const handleScanSuccess = code => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.startsWith('ASSET-') || cleanCode.startsWith('CNC') || cleanCode.startsWith('PRESS') || cleanCode.startsWith('INJECTION') || cleanCode.startsWith('ROBOT') || cleanCode.startsWith('WASHER')) {
      setSelectedAssetCode(cleanCode);
      setView('maintenance_operator');
    } else {
      setSelectedMaterialCode(cleanCode);
      setView('scan_qr');
    }
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
        lang={lang}
        onToggleLang={toggleLang}
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
            <span>{lang === 'en' ? '⚠️ OFFLINE: Factory Wi-Fi disconnected. Tablet entries are saved locally and will auto-sync once connected.' : '⚠️ KONEKSI TERPUTUS: Wi-Fi pabrik sedang offline. Data pemeliharaan yang diinput akan disimpan otomatis di tablet dan disinkronkan saat online kembali.'}</span>
          </div>
        )}

        {/* Top Header */}
        <Header
          currentView={currentView}
          currentUser={currentUser}
          onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
          onResetDemo={handleResetDemo}
          setView={setView}
          discrepanciesCount={dashboardData?.kpi?.discrepant_itemsCount || 0}
          theme={theme}
          onToggleTheme={toggleTheme}
          lang={lang}
          onToggleLang={toggleLang}
        />

        {/* View Router */}
        <main style={{ flex: 1 }}>
          {/* DIGITAL FACTORY OVERVIEW */}
          {currentView === 'dashboard' && (
            <DashboardView
              data={dashboardData}
              isLoading={isLoadingDashboard}
              setView={setView}
              onOpenScanner={() => setIsScannerOpen(true)}
              onSelectMaterial={handleSelectMaterial}
              lang={lang}
            />
          )}

          {/* MAINTENANCE FIELD OPERATOR TABLET */}
          {currentView === 'maintenance_operator' && (
            <MaintenanceOperatorView
              currentUser={currentUser}
              preselectedAssetCode={selectedAssetCode}
              onOpenScanner={() => setIsScannerOpen(true)}
            />
          )}

          {/* MAINTENANCE DASHBOARD */}
          {currentView === 'maintenance_dashboard' && (
            <MaintenanceDashboardView
              currentUser={currentUser}
              onNavigateToOperator={() => setView('maintenance_operator')}
            />
          )}

          {/* INFORMATION LEAD TIME & DATA AVAILABILITY KPI */}
          {currentView === 'lead_time_kpi' && (
            <InformationLeadTimeView />
          )}

          {/* BASELINE CONFIGURATION & ROI SIMULATION */}
          {currentView === 'baseline_simulation' && (
            <BaselineSimulationView currentUser={currentUser} />
          )}

          {/* SENSOR & PLC INTEGRATION ARCHITECTURE */}
          {currentView === 'sensor_integration' && (
            <SensorIntegrationView />
          )}

          {/* PRESERVED INVENTORY & MATERIAL MODULES */}
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

          {currentView === 'reports' && <ReportsView lang={lang} />}

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
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          lang={lang}
        />
      </div>

      {/* Mobile Drawer (Slide-Over Navigation for Phones) */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        currentView={currentView}
        setView={v => {
          setView(v);
          window.scrollTo(0, 0);
        }}
        currentUser={currentUser}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onResetDemo={handleResetDemo}
        lang={lang}
        onToggleLang={toggleLang}
      />

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
