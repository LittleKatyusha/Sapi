import React, { useState, useEffect, useCallback } from 'react';
import { Package, ClipboardList, RefreshCw, Wheat, AlertCircle, Scale, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import StokSapiService from '../../../services/stokSapiService';
import StokRingkasTab from './components/StokRingkasTab';
import StokDetailTab from './components/StokDetailTab';
import PotongPaksaTab from './components/PotongPaksaTab';
import SapiMatiTab from './components/SapiMatiTab';
import PotongPaksaModal from './modals/PotongPaksaModal';
import SapiMatiModal from './modals/SapiMatiModal';
import PotongSapiBiasaModal from './modals/PotongSapiBiasaModal';

const TABS = [
  { id: 'ringkas', label: 'Stok Ringkas', icon: Package },
  { id: 'detail', label: 'Stok Detail', icon: ClipboardList },
  { id: 'potongpaksa', label: 'Potong Paksa', icon: Scale },
  { id: 'sapimati', label: 'Sapi Mati', icon: AlertTriangle },
];

/** Get today's date string in YYYY-MM-DD format (local timezone) */
const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Get date N days ago in YYYY-MM-DD format */
const getDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDateYMD = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const MAX_RANGE_DAYS = 7;

const addDays = (dateString, days) => {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return formatDateYMD(d);
};

const StokSapiPage = () => {
  useDocumentTitle('Stok Sapi RPH');
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('ringkas');
  const [startDate, setStartDate] = useState(() => getDaysAgo(6));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API response data
  const [ringkasData, setRingkasData] = useState(null); // from stoksapibyjenis
  const [detailData, setDetailData] = useState(null); // from stoksapi

  // Modal state
  const [potongPaksaModalOpen, setPotongPaksaModalOpen] = useState(false);
  const [sapiMatiModalOpen, setSapiMatiModalOpen] = useState(false);
  const [potongSapiBiasaModalOpen, setPotongSapiBiasaModalOpen] = useState(false);
  const [selectedCowForAction, setSelectedCowForAction] = useState(null);

  /** Fetch both endpoints */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const end = addDays(startDate, MAX_RANGE_DAYS - 1);
      const [ringkasRes, detailRes] = await Promise.all([
        StokSapiService.getStokByJenis(startDate, end),
        StokSapiService.getStokDetail(startDate, end),
      ]);

      let nextError = null;

      if (!ringkasRes.success) {
        nextError = ringkasRes.message;
        setRingkasData(null);
      } else {
        setRingkasData(ringkasRes.data);
      }

      if (!detailRes.success) {
        if (!nextError) nextError = detailRes.message;
        setDetailData(null);
      } else {
        setDetailData(detailRes.data);
      }

      setError(nextError);
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat mengambil data');
      setRingkasData(null);
      setDetailData(null);
    } finally {
      setLoading(false);
    }
  }, [startDate]);

  /** Fetch data on mount and when dates change */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** Handle date change */
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  /** Handle potong paksa action */
  const handlePotongPaksa = useCallback((cow) => {
    setSelectedCowForAction(cow);
    setPotongPaksaModalOpen(true);
  }, []);

  /** Handle sapi mati action */
  const handleSapiMati = useCallback((cow) => {
    setSelectedCowForAction(cow);
    setSapiMatiModalOpen(true);
  }, []);

  /** Handle potong paksa success */
  const handlePotongPaksaSuccess = useCallback(() => {
    fetchData();
  }, [fetchData]);

  /** Handle potong paksa modal close */
  const handlePotongPaksaClose = useCallback(() => {
    setPotongPaksaModalOpen(false);
    setSelectedCowForAction(null);
  }, []);

  /** Handle sapi mati modal close */
  const handleSapiMatiClose = useCallback(() => {
    setSapiMatiModalOpen(false);
    setSelectedCowForAction(null);
  }, []);

  /** Handle sapi mati success */
  const handleSapiMatiSuccess = useCallback(() => {
    fetchData();
  }, [fetchData]);

  /** Handle potong sapi biasa action */
  const handlePotongSapiBiasa = useCallback((cow) => {
    setSelectedCowForAction(cow);
    setPotongSapiBiasaModalOpen(true);
  }, []);

  /** Handle potong sapi biasa success */
  const handlePotongSapiBiasaSuccess = useCallback(() => {
    fetchData();
  }, [fetchData]);

  /** Handle potong sapi biasa modal close */
  const handlePotongSapiBiasaClose = useCallback(() => {
    setPotongSapiBiasaModalOpen(false);
    setSelectedCowForAction(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-cyan-50/60">
      <div className="mx-auto max-w-full space-y-6 p-4 sm:p-6">
        {/* Header Card */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-lg sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 text-white">
                <Package className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Stok Sapi
                </h1>
                <p className="mt-1 text-sm text-gray-500 sm:text-base">
                  Manajemen stok sapi di RPH
                </p>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
<button
                type="button"
                onClick={() => navigate('/rph/pemberian-ovk-sapi')}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 shadow-sm transition hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <Package className="h-4 w-4" />
                Pemberian OVK
              </button>
              <div className="flex items-center gap-2">
                <label htmlFor="startDate" className="text-sm font-medium text-gray-600 whitespace-nowrap">
                  Tanggal:
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors"
                />
              </div>
              <span className="text-sm text-slate-500">({MAX_RANGE_DAYS} hari)</span>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Gagal memuat data</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        

        {/* Main Tabbed Card */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
          {/* Tab Bar */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50">
            <div className="flex border-b-2 border-gray-200">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex-1 px-8 py-5 text-lg font-bold transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Icon className="h-5 w-5" />
                      {tab.label}
                    </span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-gradient-to-br from-slate-50/30 to-blue-50/30 p-4 sm:p-6">
            {activeTab === 'ringkas' && (
              <StokRingkasTab data={ringkasData} loading={loading} />
            )}
            {activeTab === 'detail' && (
              <StokDetailTab
                data={detailData}
                loading={loading}
                onRefresh={fetchData}
                onOvk={(cow) => navigate('/rph/pemberian-ovk-sapi/add', { state: { cow } })}
                onPotongPaksa={handlePotongPaksa}
                onPotongSapiBiasa={handlePotongSapiBiasa}
                onSapiMati={handleSapiMati}
              />
            )}
            {activeTab === 'potongpaksa' && (
              <PotongPaksaTab onRefresh={fetchData} />
            )}
            {activeTab === 'sapimati' && (
              <SapiMatiTab onRefresh={fetchData} />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <PotongPaksaModal
        isOpen={potongPaksaModalOpen}
        onClose={handlePotongPaksaClose}
        onSuccess={handlePotongPaksaSuccess}
        cowData={selectedCowForAction}
      />
      <SapiMatiModal
        isOpen={sapiMatiModalOpen}
        onClose={handleSapiMatiClose}
        onSuccess={handleSapiMatiSuccess}
        cowData={selectedCowForAction}
      />
      <PotongSapiBiasaModal
        isOpen={potongSapiBiasaModalOpen}
        onClose={handlePotongSapiBiasaClose}
        onSuccess={handlePotongSapiBiasaSuccess}
        cowData={selectedCowForAction}
      />
    </div>
  );
};

export default StokSapiPage;


