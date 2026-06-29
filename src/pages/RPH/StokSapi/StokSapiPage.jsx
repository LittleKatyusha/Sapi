import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Package, ClipboardList, Wheat, AlertCircle, Scale, AlertTriangle, Search, RotateCcw, Filter } from 'lucide-react';
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
  { id: 'ringkas', label: 'Ringkas', icon: Package },
  { id: 'detail', label: 'Detail', icon: ClipboardList },
  { id: 'potongpaksa', label: 'Potong Paksa', icon: Scale },
  { id: 'sapimati', label: 'Sapi Mati', icon: AlertTriangle },
];

const StokSapiPage = () => {
  useDocumentTitle('Stok Sapi RPH');
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('detail');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [ringkasData, setRingkasData] = useState(null);
  const [detailData, setDetailData] = useState(null);

  const [potongPaksaModalOpen, setPotongPaksaModalOpen] = useState(false);
  const [sapiMatiModalOpen, setSapiMatiModalOpen] = useState(false);
  const [potongSapiBiasaModalOpen, setPotongSapiBiasaModalOpen] = useState(false);
  const [selectedCowForAction, setSelectedCowForAction] = useState(null);

  const hasDateFilter = useMemo(() => !!(startDate && endDate), [startDate, endDate]);

  const fetchData = useCallback(async (opts = {}) => {
    const { explicit = false } = opts;
    setLoading(true);
    setError(null);

    try {
      const requests = [
        StokSapiService.getStokDetail(startDate || null, endDate || null),
      ];

      if (hasDateFilter) {
        requests.push(StokSapiService.getStokByJenis(startDate || null, endDate || null));
      }

      const [detailRes, ringkasRes] = await Promise.all(requests);

      let nextError = null;

      if (!detailRes.success) {
        nextError = detailRes.message;
        setDetailData(null);
      } else {
        setDetailData(detailRes.data);
      }

      if (hasDateFilter) {
        if (!ringkasRes.success) {
          if (!nextError) nextError = ringkasRes.message;
          setRingkasData(null);
        } else {
          setRingkasData(ringkasRes.data);
        }
      } else if (!explicit) {
        setRingkasData({ dates: [], rows: [] });
      }

      setError(nextError);
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat mengambil data');
      setRingkasData(null);
      setDetailData(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, hasDateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    if (startDate && endDate) {
      fetchData({ explicit: true });
    }
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
  };

  const handlePotongPaksa = useCallback((cow) => {
    setSelectedCowForAction(cow);
    setPotongPaksaModalOpen(true);
  }, []);

  const handleSapiMati = useCallback((cow) => {
    setSelectedCowForAction(cow);
    setSapiMatiModalOpen(true);
  }, []);

  const handlePotongPaksaSuccess = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handlePotongPaksaClose = useCallback(() => {
    setPotongPaksaModalOpen(false);
    setSelectedCowForAction(null);
  }, []);

  const handleSapiMatiClose = useCallback(() => {
    setSapiMatiModalOpen(false);
    setSelectedCowForAction(null);
  }, []);

  const handleSapiMatiSuccess = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handlePotongSapiBiasa = useCallback((cow) => {
    setSelectedCowForAction(cow);
    setPotongSapiBiasaModalOpen(true);
  }, []);

  const handlePotongSapiBiasaSuccess = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handlePotongSapiBiasaClose = useCallback(() => {
    setPotongSapiBiasaModalOpen(false);
    setSelectedCowForAction(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] space-y-4 p-3 sm:p-4">
        {/* Header */}
        <div className="rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-600 p-2 text-white">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">Stok Sapi</h1>
                <p className="text-xs text-gray-500">Manajemen stok sapi di RPH</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/rph/pemberian-ovk-sapi')}
                className="inline-flex items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100"
              >
                <Package className="h-3.5 w-3.5" />
                OVK
              </button>
              <button
                type="button"
                onClick={() => navigate('/rph/pemberian-pakan-sapi')}
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
              >
                <Wheat className="h-3.5 w-3.5" />
                Pakan
              </button>
            </div>
          </div>
        </div>

        {/* Filter Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <Filter className="h-3.5 w-3.5 text-emerald-600" />
              Filter Tanggal
              <span className="text-[10px] text-gray-400">(maks. 7 hari)</span>
            </div>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500">Dari</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500">Sampai</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={!startDate || !endDate || loading}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <Search className="h-3.5 w-3.5" />
                  Cari
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2 shadow-sm">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-800">Gagal memuat data</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

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
                  className={`relative flex-1 px-3 py-2.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-white text-emerald-700'
                      : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
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
          <div className="p-3">
            {activeTab === 'ringkas' && (
              <StokRingkasTab
                data={ringkasData}
                loading={loading}
                hasDateFilter={hasDateFilter}
              />
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


