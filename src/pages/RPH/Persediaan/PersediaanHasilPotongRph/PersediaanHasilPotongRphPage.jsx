import React, { useState, useCallback } from 'react';
import { Package, Scissors, Layers } from 'lucide-react';
import useDocumentTitle from '../../../../hooks/useDocumentTitle';
import PersediaanTab from './components/PersediaanTab';
import BoningTab from './components/BoningTab';
import DetailModal from './modals/DetailModal';
import EditModal from './modals/EditModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import PersediaanHasilPotongService from '../../../../services/persediaanHasilPotongService';

const TABS = [
  { id: 'boning', label: 'Boning', icon: Scissors },
  { id: 'karkas', label: 'Karkas', icon: Layers },
  { id: 'kulit', label: 'Kulit', icon: Package },
];

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
  const [tableRefreshKey, setTableRefreshKey] = useState(0);

  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
  }, []);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const handleOpenDetail = useCallback(async (item) => {
    setSelectedItem(item);
    const detailType = activeTab === 'boning' && item.id_item_potong ? 'boning' : activeTab;
    setModalType(detailType);
    if (activeTab === 'kulit') {
      setDetailData({ header: { id: item.id, name: item.jenis_sapi ?? '-' }, tgl_potong: item.tgl_potong || null, detail: [{ id: null, name: 'Kulit', berat: item.berat_kulit ?? 0 }] });
      setDetailModalOpen(true);
      return;
    }

    setLoading(true);
    const detailPayload = activeTab === 'boning' && item.id_item_potong
      ? { id_item_potong: item.id_item_potong }
      : (item.pid || item.pubid);
    const res = await PersediaanHasilPotongService.show(detailType, detailPayload);
    setLoading(false);
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
    if (activeTab === 'kulit') {
      setDetailData({ header: { id: item.id, name: item.jenis_sapi ?? '-' }, tgl_potong: item.tgl_potong || null, detail: [{ id: null, name: 'Kulit', berat: item.berat_kulit ?? 0 }] });
      setEditModalOpen(true);
      return;
    }
    setLoading(true);
    const res = await PersediaanHasilPotongService.show(activeTab, item.pid);
    setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-cyan-50/60">
      <div className="mx-auto max-w-full space-y-6 p-4 sm:p-6">
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-lg sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 text-white">
                <Package className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Persediaan Hasil Potong
                </h1>
                <p className="mt-1 text-sm text-gray-500 sm:text-base">
                  Kelola data persediaan hasil potong RPH
                </p>
              </div>
            </div>
          </div>
        </div>

        {notification && (
          <div className={`rounded-xl border p-4 flex items-start gap-3 shadow-sm ${
            notification.type === 'success'
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }`}>
            <div className={notification.type === 'success' ? 'text-green-600' : 'text-red-600'}>
              {notification.type === 'success' ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {notification.type === 'success' ? 'Berhasil' : 'Gagal'}
              </p>
              <p className={`text-sm ${notification.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={clearNotification}
              className={`text-sm hover:opacity-70 ${notification.type === 'success' ? 'text-green-500' : 'text-red-500'}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
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

          <div className="bg-gradient-to-br from-slate-50/30 to-blue-50/30 p-4 sm:p-6">
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
          const res = await PersediaanHasilPotongService.delete(activeTab, selectedItem.pid);
          if (res.success) {
            handleDeleteSuccess();
          } else {
            showNotification('error', res.message || 'Gagal menghapus data');
          }
        }}
        item={selectedItem}
        type={modalType}
      />
    </div>
  );
};

export default PersediaanHasilPotongRphPage;
