import React, { useState, useCallback } from 'react';
import { Package, ClipboardList, Scale, AlertTriangle, Wheat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import StokRingkasTab from './components/StokRingkasTab';
import StokDetailTab from './components/StokDetailTab';
import PotongPaksaTab from './components/PotongPaksaTab';
import SapiMatiTab from './components/SapiMatiTab';
import PotongPaksaModal from './modals/PotongPaksaModal';
import SapiMatiModal from './modals/SapiMatiModal';
import PotongSapiBiasaModal from './modals/PotongSapiBiasaModal';
import BeriPakanKonsentratModal from './modals/BeriPakanKonsentratModal';

const TABS = [
  { id: 'ringkas', label: 'Ringkas', icon: Package },
  { id: 'detail', label: 'Detail', icon: ClipboardList },
  { id: 'potongpaksa', label: 'Potong Paksa', icon: Scale },
  { id: 'sapimati', label: 'Sapi Mati', icon: AlertTriangle },
];

const StokSapiPage = () => {
  useDocumentTitle('Stok Sapi RPH');
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('detail');

  const [potongPaksaModalOpen, setPotongPaksaModalOpen] = useState(false);
  const [sapiMatiModalOpen, setSapiMatiModalOpen] = useState(false);
  const [potongSapiBiasaModalOpen, setPotongSapiBiasaModalOpen] = useState(false);
  const [beriPakanModalOpen, setBeriPakanModalOpen] = useState(false);
  const [stokDetailRefreshKey, setStokDetailRefreshKey] = useState(0);
  const [selectedCowForAction, setSelectedCowForAction] = useState(null);

  const handlePotongPaksa = useCallback((cow) => {
    setSelectedCowForAction(cow);
    setPotongPaksaModalOpen(true);
  }, []);

  const handleSapiMati = useCallback((cow) => {
    setSelectedCowForAction(cow);
    setSapiMatiModalOpen(true);
  }, []);

  const handlePotongPaksaClose = useCallback(() => {
    setPotongPaksaModalOpen(false);
    setSelectedCowForAction(null);
  }, []);

  const handleSapiMatiClose = useCallback(() => {
    setSapiMatiModalOpen(false);
    setSelectedCowForAction(null);
  }, []);

  const handlePotongSapiBiasa = useCallback((cow) => {
    setSelectedCowForAction(cow);
    setPotongSapiBiasaModalOpen(true);
  }, []);

  const handlePotongSapiBiasaClose = useCallback(() => {
    setPotongSapiBiasaModalOpen(false);
    setSelectedCowForAction(null);
  }, []);

  const handlePotongSapiBiasaSuccess = useCallback(() => {
    setPotongSapiBiasaModalOpen(false);
    setSelectedCowForAction(null);
    setStokDetailRefreshKey((prev) => prev + 1);
  }, []);

  const handleBeriPakan = useCallback(() => {
    setBeriPakanModalOpen(true);
  }, []);

  const handleBeriPakanClose = useCallback(() => {
    setBeriPakanModalOpen(false);
  }, []);

  const handleBeriPakanSuccess = useCallback(() => {
    setBeriPakanModalOpen(false);
    setStokDetailRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] space-y-4 p-3 sm:p-4">
        {/* Header */}
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-600 p-2.5 text-white">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Stok Sapi</h1>
                <p className="text-sm text-gray-500">Manajemen stok sapi di RPH</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBeriPakan}
                className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
              >
                <Wheat className="h-4 w-4" />
                Beri Pakan Konsentrat
              </button>
              <button
                type="button"
                onClick={() => navigate('/rph/pemberian-ovk-sapi')}
                className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100"
              >
                <Package className="h-4 w-4" />
                OVK
              </button>
            </div>
          </div>
        </div>

        {/* Main Tabbed Card */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Tab Bar */}
          <div className="flex border-b border-gray-200 bg-gray-50/50">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-white text-emerald-700'
                      : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </span>
                  {active && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'ringkas' && (
              <StokRingkasTab />
            )}
            {activeTab === 'detail' && (
              <StokDetailTab
                refreshTrigger={stokDetailRefreshKey}
                onOvk={(cow) => navigate('/rph/pemberian-ovk-sapi/add', { state: { cow } })}
                onPotongPaksa={handlePotongPaksa}
                onPotongSapiBiasa={handlePotongSapiBiasa}
                onSapiMati={handleSapiMati}
              />
            )}
            {activeTab === 'potongpaksa' && (
              <PotongPaksaTab />
            )}
            {activeTab === 'sapimati' && (
              <SapiMatiTab />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <PotongPaksaModal
        isOpen={potongPaksaModalOpen}
        onClose={handlePotongPaksaClose}
        onSuccess={handlePotongPaksaClose}
        cowData={selectedCowForAction}
      />
      <SapiMatiModal
        isOpen={sapiMatiModalOpen}
        onClose={handleSapiMatiClose}
        onSuccess={handleSapiMatiClose}
        cowData={selectedCowForAction}
      />
      <PotongSapiBiasaModal
        isOpen={potongSapiBiasaModalOpen}
        onClose={handlePotongSapiBiasaClose}
        onSuccess={handlePotongSapiBiasaSuccess}
        cowData={selectedCowForAction}
      />
      <BeriPakanKonsentratModal
        isOpen={beriPakanModalOpen}
        onClose={handleBeriPakanClose}
        onSuccess={handleBeriPakanSuccess}
      />
    </div>
  );
};

export default StokSapiPage;


