import React, { useState, useCallback, useEffect } from 'react';
import { Package, Loader2, Beef, Boxes, CheckCircle2, XCircle, X } from 'lucide-react';
import useDocumentTitle from '../../../../hooks/useDocumentTitle';
import PersediaanTab from './components/PersediaanTab';
import BoningTab from './components/BoningTab';
import DetailModal from './modals/DetailModal';
import EditModal from './modals/EditModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import PersediaanHasilPotongService from '../../../../services/persediaanHasilPotongService';
import StokSapiService from '../../../../services/stokSapiService';
import PotongSapiBiasaModal from '../../StokSapi/modals/PotongSapiBiasaModal';

const TABS = [
  { id: 'boning', label: 'Boning', icon: Beef, desc: 'Item potong boning' },
  { id: 'kulit', label: 'Kulit', icon: Boxes, desc: 'Hasil potong kulit' },
];

const fetchTabCount = async (type) => {
  try {
    const res = await PersediaanHasilPotongService.getData(type, { start: 0, length: 1, search: '' });
    return { type, count: res.success ? (res.recordsTotal || 0) : null };
  } catch {
    return { type, count: null };
  }
};

const PersediaanHasilPotongRphPage = () => {
  useDocumentTitle('Persediaan Hasil Potong RPH');

  const [activeTab, setActiveTab] = useState('boning');
  const [notification, setNotification] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [modalType, setModalType] = useState('boning');
  const [loading, setLoading] = useState(false);
  const [loadingContext, setLoadingContext] = useState('');
  const [tableRefreshKey, setTableRefreshKey] = useState(0);
  const [editSapiModalOpen, setEditSapiModalOpen] = useState(false);
  const [editSapiData, setEditSapiData] = useState(null);
  const [tabCounts, setTabCounts] = useState({});

  // Fetch all tab counts in parallel on mount (progressive disclosure of volume)
  useEffect(() => {
    Promise.all(TABS.map((t) => fetchTabCount(t.id))).then((results) => {
      const counts = {};
      results.forEach((r) => { counts[r.type] = r.count; });
      setTabCounts(counts);
    });
  }, [tableRefreshKey]);

  const showNotification = useCallback((type, message) => {
    setNotification({ type, message, id: Date.now() });
  }, []);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Auto-dismiss toast after 4s (non-intrusive, Stripe-style)
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Keyboard tab navigation: Left/Right arrows to switch tabs (when not in input)
  useEffect(() => {
    const handleKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const idx = TABS.findIndex((t) => t.id === activeTab);
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveTab(TABS[(idx + 1) % TABS.length].id);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveTab(TABS[(idx - 1 + TABS.length) % TABS.length].id);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTab]);

  const handleOpenDetail = useCallback(async (item) => {
    setSelectedItem(item);
    const detailType = activeTab === 'boning' && item.id_item_potong ? 'boning' : activeTab;
    setModalType(detailType);
    if (activeTab === 'kulit') {
      setDetailData({
        header: { id: item.id, name: item.item_kulit_name ?? 'Kulit' },
        tgl_potong: null,
        detail: [
          { id: item.id_item_potong, name: `Item Potong: ${item.item_potong_name ?? '-'}`, berat: item.total_berat_masuk ?? 0 },
          { id: null, name: 'Berat Keluar', berat: item.total_berat_keluar ?? 0 },
          { id: null, name: 'Berat Tersedia', berat: item.berat_tersedia ?? 0 },
        ],
      });
      setDetailModalOpen(true);
      return;
    }

    setLoading(true);
    setLoadingContext('detail');
    const detailPayload = activeTab === 'boning' && item.id_item_potong
      ? { id_item_potong: item.id_item_potong }
      : (item.pid || item.pubid);
    const res = await PersediaanHasilPotongService.show(detailType, detailPayload);
    setLoading(false);
    setLoadingContext('');
    if (res.success) {
      setDetailData(res.data);
      setDetailModalOpen(true);
    } else {
      showNotification('error', res.message || 'Gagal memuat detail');
    }
  }, [activeTab, showNotification]);

  const handleOpenEdit = useCallback(async (item) => {
    setSelectedItem(item);
    setModalType(activeTab);
    if (activeTab === 'sapi') {
      setLoading(true);
      setLoadingContext('edit');
      const res = await StokSapiService.showPotongSapiBiasa(item.pid);
      setLoading(false);
      setLoadingContext('');
      if (res.success) {
        setEditSapiData(res.data);
        setEditSapiModalOpen(true);
      } else {
        showNotification('error', res.message || 'Gagal memuat detail');
      }
      return;
    }
    if (activeTab === 'kulit') {
      setDetailData({ header: { id: item.id, name: item.jenis_sapi ?? '-' }, tgl_potong: item.tgl_potong || null, detail: [{ id: null, name: 'Kulit', berat: item.berat_kulit ?? 0 }] });
      setEditModalOpen(true);
      return;
    }
    setLoading(true);
    setLoadingContext('edit');
    const res = await PersediaanHasilPotongService.show(activeTab, item.pid);
    setLoading(false);
    setLoadingContext('');
    if (res.success) {
      setDetailData(res.data);
      setEditModalOpen(true);
    } else {
      showNotification('error', res.message || 'Gagal memuat detail');
    }
  }, [activeTab, showNotification]);

  const handleOpenDelete = useCallback((item) => {
    setSelectedItem(item);
    setModalType(activeTab);
    setDeleteModalOpen(true);
  }, [activeTab]);

  const handleDetailClose = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedItem(null);
    setDetailData(null);
  }, []);

  const handleEditClose = useCallback(() => {
    setEditModalOpen(false);
    setSelectedItem(null);
    setDetailData(null);
  }, []);

  const handleEditSapiClose = useCallback(() => {
    setEditSapiModalOpen(false);
    setSelectedItem(null);
    setEditSapiData(null);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setDeleteModalOpen(false);
    setSelectedItem(null);
  }, []);

  const handleEditSuccess = useCallback(() => {
    setEditModalOpen(false);
    setSelectedItem(null);
    setDetailData(null);
    setTableRefreshKey(k => k + 1);
    showNotification('success', 'Data berhasil diperbarui');
  }, [showNotification]);

  const handleDeleteSuccess = useCallback(() => {
    setDeleteModalOpen(false);
    setSelectedItem(null);
    setTableRefreshKey(k => k + 1);
    showNotification('success', 'Data berhasil dihapus');
  }, [showNotification]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      <div className="mx-auto max-w-full space-y-4 p-4 sm:p-5 lg:p-6">
        {/* Compact Header */}
        <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/60 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Persediaan Hasil Potong</h1>
                  <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">RPH</span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">Boning dan Kulit — semua stok hasil potong dalam satu tempat</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 font-medium text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Tersinkron
              </div>
            </div>
          </div>
        </div>

        {notification && (
          <div className="fixed top-6 right-6 z-[80] animate-in">
            <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-lg backdrop-blur-sm max-w-sm ${
              notification.type === 'success'
                ? 'border-emerald-200 bg-white/95'
                : 'border-red-200 bg-white/95'
            }`}>
              <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                notification.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {notification.type === 'success'
                  ? <CheckCircle2 className="h-5 w-5" />
                  : <XCircle className="h-5 w-5" />}
              </div>
              <div className="flex-1 pt-0.5">
                <p className={`text-sm font-bold ${notification.type === 'success' ? 'text-emerald-900' : 'text-red-900'}`}>
                  {notification.type === 'success' ? 'Berhasil' : 'Gagal'}
                </p>
                <p className={`text-sm mt-0.5 ${notification.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                  {notification.message}
                </p>
              </div>
              <button
                onClick={clearNotification}
                className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Card with Tabs */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50/80 px-2 pt-2 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-emerald-700 shadow-sm border-t-2 border-x border-slate-200 -mb-px !border-t-emerald-600'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tabCounts[tab.id] == null ? (
                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-300 animate-pulse">
                      &middot;
                    </span>
                  ) : (
                    <span className={`ml-1 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {tabCounts[tab.id] > 999 ? '999+' : tabCounts[tab.id]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-5">
            {activeTab === 'boning' ? (
              <BoningTab
                refreshKey={tableRefreshKey}
                onOpenDetail={handleOpenDetail}
                onOpenEdit={handleOpenEdit}
                onOpenDelete={handleOpenDelete}
              />
            ) : (
              <PersediaanTab
                key={`${activeTab}-${tableRefreshKey}`}
                type={activeTab}
                onOpenDetail={handleOpenDetail}
                onOpenEdit={handleOpenEdit}
                onOpenDelete={handleOpenDelete}
              />
            )}
          </div>
        </div>
      </div>

      <DetailModal
        isOpen={detailModalOpen}
        onClose={handleDetailClose}
        data={detailData}
        type={modalType}
        loading={loading}
      />
      <EditModal
        isOpen={editModalOpen}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
        data={detailData}
        type={modalType}
        item={selectedItem}
      />
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
      onClose={handleDeleteClose}
      onConfirm={async () => {
          if (!selectedItem) return;
          setLoading(true);
          setLoadingContext('delete');
          const res = activeTab === 'sapi'
            ? await StokSapiService.deletePotongSapiBiasa(selectedItem.pid)
            : await PersediaanHasilPotongService.delete(activeTab, selectedItem.pid);
          setLoading(false);
          setLoadingContext('');
          if (res.success) {
            handleDeleteSuccess();
          } else {
            showNotification('error', res.message || 'Gagal menghapus data');
          }
        }}
        item={selectedItem}
        type={modalType}
        loading={loading && loadingContext === 'delete'}
      />
      <PotongSapiBiasaModal
        isOpen={editSapiModalOpen}
        onClose={handleEditSapiClose}
        onSuccess={() => {
          handleEditSapiClose();
          setTableRefreshKey((k) => k + 1);
          showNotification('success', 'Data potong sapi berhasil diperbarui');
        }}
        cowData={selectedItem}
        mode="edit"
        initialData={editSapiData}
        recordPid={selectedItem?.pid}
      />
      {loading && loadingContext && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-2xl">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {loadingContext === 'detail' ? 'Memuat detail...' : loadingContext === 'edit' ? 'Memuat form edit...' : 'Menghapus data...'}
              </p>
              <p className="text-xs text-slate-500">
                Mohon tunggu sampai proses selesai.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersediaanHasilPotongRphPage;
