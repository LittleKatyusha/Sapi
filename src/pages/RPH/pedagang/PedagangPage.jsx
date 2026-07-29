import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, Search, Eye, Edit2, Trash2, FileText, MoreVertical, Wallet,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowUpDown,
  Users, Activity, CheckCircle, XCircle, AlertCircle, Info,
  RotateCcw, Filter, Phone, MapPin, BarChart3, Loader2, Hash, User,
  History, X,
} from 'lucide-react';
import usePedagang from './hooks/usePedagang';
import PedagangService from '../../../services/pedagangService';
import { formatCurrency, getStatusBadgeClasses, getStatusLabel, PEDAGANG_STATUS_OPTIONS } from './utils/formatters';
import SearchableSelect from '../../../components/shared/SearchableSelect';
import AddEditPedagangModal from './modals/AddEditPedagangModal';
import PedagangDetailModal from './modals/PedagangDetailModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import RekeningPedagangModal from './modals/RekeningPedagangModal';
import TambahTabunganModal from './modals/TambahTabunganModal';

const TIPE_LABELS = { 1: 'Langganan', 2: 'Umum' };
const TIPE_OPTIONS = [
  { value: 1, label: 'Terdaftar (Tipe 1)' },
  { value: 2, label: 'Non-Terdaftar/Umum (Tipe 2)' },
];
const DISPENSASI_OPTIONS = [
  { value: 1, label: 'Aktif' },
  { value: 0, label: 'Tidak Aktif' },
];

const ActionMenuPortal = ({ row, menuPos, onClose, onDetail, onEdit, onRekening, onTabungan, onHutang, onHistory, onDelete }) => (
  <>
    <div className="fixed inset-0 z-[99998]" onClick={onClose} />
    <div
      style={{ position: 'fixed', left: menuPos.left, top: menuPos.top, zIndex: 99999 }}
      className="w-44 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden"
    >
      <button
        onClick={() => { onDetail(row); onClose(); }}
        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
      >
        <Eye className="w-3.5 h-3.5 text-blue-500" /> Lihat Detail
      </button>
      <button
        onClick={() => { onEdit(row); onClose(); }}
        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
      >
        <Edit2 className="w-3.5 h-3.5 text-amber-500" /> Edit
      </button>
      <button
        onClick={() => { onTabungan(row); onClose(); }}
        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
      >
        <Wallet className="w-3.5 h-3.5 text-teal-500" /> Tambah Tabungan
      </button>
      <button
        onClick={() => { onHutang(row); onClose(); }}
        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
      >
        <Wallet className="w-3.5 h-3.5 text-rose-500" /> Lunasi Hutang
      </button>
      <button
        onClick={() => { onRekening(row); onClose(); }}
        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
      >
        <FileText className="w-3.5 h-3.5 text-emerald-500" /> Cetak Rekening
      </button>
      <button
        onClick={() => { onHistory(row); onClose(); }}
        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
      >
        <History className="w-3.5 h-3.5 text-indigo-500" /> History Saldo
      </button>
      <div className="border-t border-gray-100 my-1" />
      <button
        onClick={() => { onDelete(row); onClose(); }}
        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
      >
        <Trash2 className="w-3.5 h-3.5" /> Hapus
      </button>
    </div>
  </>
);

const StatCard = React.memo(({ title, value, icon: Icon, accentColor, subtitle }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide truncate">{title}</p>
        <p className="text-lg font-bold text-gray-800 mt-1 truncate">{value}</p>
        {subtitle && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className={`w-8 h-8 rounded-lg ${accentColor} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
    </div>
  </div>
));

const HistorySaldoModal = ({ open, loading, data, onClose }) => {
  if (!open) return null;

  const summary = data?.summary || {};
  const rows = data?.history || [];
  const pedagang = data?.pedagang || {};
  const name = pedagang.nama_alias || pedagang.nama_identitas || '-';

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">History Saldo Pedagang</h2>
            <p className="mt-0.5 text-xs text-gray-500">{name} - {pedagang.id_pedagang || '-'}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Tutup history saldo">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4 md:grid-cols-4">
          {[
            ['Saldo Awal', summary.saldo_awal],
            ['Tabungan', summary.tabungan],
            ['Kulit', summary.kulit],
            ['Saldo Beku', summary.saldo_beku],
            ['Saldo Akhir', summary.saldo_akhir],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-gray-100 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase text-gray-500">{label}</p>
              <p className="mt-1 text-sm font-bold text-gray-900">{formatCurrency(value || 0)}</p>
            </div>
          ))}
        </div>

        <div className="max-h-[58vh] overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat history saldo...
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">Belum ada history saldo untuk pedagang ini.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-[11px] font-semibold uppercase text-gray-500">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">No Bukti</th>
                  <th className="px-4 py-3">Transaksi</th>
                  <th className="px-4 py-3 text-right">Hutang</th>
                  <th className="px-4 py-3 text-right">Pembayaran</th>
                  <th className="px-4 py-3 text-right">Kulit</th>
                  <th className="px-4 py-3 text-right">Saldo Akhir</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.pid || row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{String(row.tanggal_transaksi || '').slice(0, 16)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.no_bukti || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{row.jenis_transaksi || '-'}</div>
                      <div className="text-xs text-gray-500">{row.keterangan || row.sumber_modul || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-rose-700">{formatCurrency(row.nominal_hutang || 0)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{formatCurrency(row.nominal_pembayaran || 0)}</td>
                    <td className="px-4 py-3 text-right text-amber-700">{formatCurrency(row.nominal_kulit || 0)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(row.saldo_akhir_setelah || 0)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600">{row.status_posting || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

const PedagangPage = () => {
  const navigate = useNavigate();
  const {
    pedagangList, loading, error,
    searchId, setSearchId,
    searchName, setSearchName,
    searchHp, setSearchHp,
    statusFilter, setStatusFilter,
    pasarFilter, setPasarFilter,
    tipeFilter, setTipeFilter,
    dispensasiFilter, setDispensasiFilter,
    pagination, statistics, statsLoading,
    fetchPedagang, fetchStatistics,
    createPedagang, updatePedagang, deletePedagang,
    handlePageChange, handlePerPageChange, resetFilters,
  } = usePedagang();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRekeningModal, setShowRekeningModal] = useState(false);
  const [rekeningData, setRekeningData] = useState(null);
  const [showTabunganModal, setShowTabunganModal] = useState(false);
  const [tabunganData, setTabunganData] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    fetchPedagang(1, pagination.perPage);
    fetchStatistics();
  }, [fetchPedagang, fetchStatistics, pagination.perPage]);

  useEffect(() => {
    fetchPedagang(1, pagination.perPage);
  }, [statusFilter, pasarFilter, tipeFilter, dispensasiFilter, fetchPedagang, pagination.perPage]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ type, message });
  }, []);

  const handleAdd = useCallback(() => {
    setEditData(null);
    setShowAddModal(true);
  }, []);

  const handleEdit = useCallback((item) => {
    setEditData(item);
    setShowEditModal(true);
  }, []);

  const handleDetail = useCallback((item) => {
    setDetailData(item);
    setShowDetailModal(true);
  }, []);

  const handleDelete = useCallback((item) => {
    setDeleteData(item);
  }, []);

  const handleRekening = useCallback((item) => {
    setRekeningData(item);
    setShowRekeningModal(true);
  }, []);

  const handleTabungan = useCallback((item) => {
    setTabunganData(item);
    setShowTabunganModal(true);
  }, []);

  const handleHutang = useCallback((item) => {
    navigate('/rph/keuangan/penerimaan', {
      state: {
        mode: 'bayar_hutang',
        pedagang: {
          pid: item?.pid,
          nama_alias: item?.nama_alias,
          nama_identitas: item?.nama_identitas,
          id_pedagang: item?.id_pedagang,
          saldo_beku: item?.saldo_beku,
        },
      },
    });
  }, [navigate]);

  const handleHistory = useCallback(async (item) => {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    setHistoryData(null);
    try {
      const result = await PedagangService.getHistorySaldo(item.pid);
      if (result.success) {
        setHistoryData(result.data);
      } else {
        showNotification(result.message || 'Gagal memuat history saldo', 'error');
        setShowHistoryModal(false);
      }
    } catch {
      showNotification('Gagal memuat history saldo', 'error');
      setShowHistoryModal(false);
    } finally {
      setHistoryLoading(false);
    }
  }, [showNotification]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteData) return;
    setIsDeleting(true);
    try {
      const result = await deletePedagang(deleteData.pid);
      if (result.success) {
        showNotification(result.message || 'Pedagang berhasil dihapus');
      } else {
        showNotification(result.message || 'Gagal menghapus pedagang', 'error');
      }
    } catch {
      showNotification('Terjadi kesalahan saat menghapus data', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteData(null);
    }
  }, [deleteData, deletePedagang, showNotification]);

  const handleSave = useCallback(async (formData) => {
    try {
      let result;
      if (editData) {
        result = await updatePedagang({ pid: editData.pid, ...formData });
      } else {
        result = await createPedagang(formData);
      }
      if (result.success) {
        showNotification(result.message || (editData ? 'Pedagang berhasil diperbarui' : 'Pedagang berhasil ditambahkan'));
        setShowAddModal(false);
        setShowEditModal(false);
        setEditData(null);
        fetchStatistics();
      } else {
        showNotification(result.message || 'Gagal menyimpan data', 'error');
      }
    } catch {
      showNotification('Terjadi kesalahan saat menyimpan data', 'error');
    }
  }, [editData, updatePedagang, createPedagang, showNotification, fetchStatistics]);

  const handleRefresh = useCallback(() => {
    fetchPedagang(pagination.currentPage, pagination.perPage);
    fetchStatistics();
    showNotification('Data berhasil dimuat ulang', 'info');
  }, [fetchPedagang, fetchStatistics, pagination.currentPage, pagination.perPage, showNotification]);

  const openActionMenu = useCallback((e, row) => {
    const menuId = row.pid || row.id;
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ left: Math.max(8, rect.left - 160), top: rect.bottom + 4 });
    setOpenMenuId(menuId);
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return pedagangList;
    return [...pedagangList].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortConfig.direction === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [pedagangList, sortConfig]);

  const stats = useMemo(() => ({
    total: statistics?.summary?.total_pedagang ?? pagination.totalItems,
    saldoAkhir: statistics?.summary?.total_saldo_akhir ?? 0,
    hutang: statistics?.summary?.total_saldo_beku ?? 0,
    dispensasiAktif: statistics?.summary?.total_dispensasi_aktif ?? 0,
  }), [statistics, pagination.totalItems]);

  const activeFilterCount = [searchId, searchName, searchHp, statusFilter, pasarFilter, tipeFilter, dispensasiFilter].filter(v => v !== '' && v !== undefined && v !== null).length;

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-3 h-3 text-emerald-600" />
      : <ChevronDown className="w-3 h-3 text-emerald-600" />;
  };

  const menuPortal = openMenuId
    ? createPortal(
        <ActionMenuPortal
          row={pedagangList.find(r => (r.pid || r.id) === openMenuId)}
          menuPos={menuPos}
          onClose={() => { setOpenMenuId(null); setMenuPos(null); }}
          onDetail={handleDetail}
          onEdit={handleEdit}
          onRekening={handleRekening}
          onTabungan={handleTabungan}
          onHutang={handleHutang}
          onHistory={handleHistory}
          onDelete={handleDelete}
        />,
        document.body
      )
    : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="w-full space-y-6">
        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-4 right-4 z-[100001]">
            <div className={`max-w-md w-full bg-white shadow-2xl rounded-xl pointer-events-auto overflow-hidden ${
              notification.type === 'success' ? 'border-l-4 border-emerald-500' :
              notification.type === 'info' ? 'border-l-4 border-blue-500' :
              'border-l-4 border-red-500'
            }`}>
              <div className={`p-4 ${
                notification.type === 'success' ? 'bg-gradient-to-r from-emerald-50 to-white' :
                notification.type === 'info' ? 'bg-gradient-to-r from-blue-50 to-white' :
                'bg-gradient-to-r from-red-50 to-white'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {notification.type === 'success' ? (
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                    ) : notification.type === 'info' ? (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <Info className="w-6 h-6 text-white" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <p className={`text-base font-bold ${
                      notification.type === 'success' ? 'text-emerald-800' :
                      notification.type === 'info' ? 'text-blue-800' :
                      'text-red-800'
                    }`}>
                      {notification.type === 'success' ? 'Berhasil!' :
                       notification.type === 'info' ? 'Informasi' : 'Gagal!'}
                    </p>
                    <p className="mt-1 text-sm text-gray-700 leading-relaxed">{notification.message}</p>
                  </div>
                  <button
                    onClick={() => setNotification(null)}
                    className={`ml-4 rounded-lg p-1.5 transition ${
                      notification.type === 'success' ? 'text-emerald-600 hover:bg-emerald-100' :
                      notification.type === 'info' ? 'text-blue-600 hover:bg-blue-100' :
                      'text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Data Master Pedagang</h1>
            <p className="text-sm text-gray-500 mt-0.5">Kelola data pedagang, transaksi angkatan, dan setoran</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/RPH/pedagang/statistik')}
              className="bg-white hover:bg-gray-50 text-gray-600 px-3 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2 text-sm font-medium transition"
            >
              <BarChart3 className="w-4 h-4" /> Statistik
            </button>
            <button
              onClick={handleRefresh}
              className="bg-white hover:bg-gray-50 text-gray-600 px-3 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2 text-sm font-medium transition"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={handleAdd}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition"
            >
              <PlusCircle className="w-4 h-4" /> Tambah Pedagang
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
          <StatCard title="Total Pedagang" value={statsLoading ? '...' : stats.total} icon={Users} accentColor="bg-blue-500" subtitle="Seluruh data" />
          <StatCard title="Total Saldo Akhir" value={statsLoading ? '...' : formatCurrency(stats.saldoAkhir)} icon={Wallet} accentColor="bg-amber-500" subtitle="Akumulasi saldo" />
          <StatCard title="Total Hutang" value={statsLoading ? '...' : formatCurrency(stats.hutang)} icon={AlertCircle} accentColor="bg-rose-500" subtitle="Akumulasi saldo beku" />
          <StatCard title="Dispensasi Aktif" value={statsLoading ? '...' : stats.dispensasiAktif} icon={Activity} accentColor="bg-purple-500" subtitle="Pedagang dengan dispensasi" />
        </div>

        {/* Action Bar */}
        <div className="flex justify-end items-center gap-3">
          <button
            onClick={() => setIsFilterExpanded(v => !v)}
            className={`px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition ${
              isFilterExpanded || activeFilterCount > 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filter Lanjutan
            {activeFilterCount > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition ${isFilterExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter Panel */}
        {isFilterExpanded && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cari ID Pedagang</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari ID pedagang..."
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cari Nama</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nama alias/identitas..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cari No HP</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari no HP..."
                    value={searchHp}
                    onChange={(e) => setSearchHp(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status Pedagang</label>
                <SearchableSelect
                  options={PEDAGANG_STATUS_OPTIONS}
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val ?? '')}
                  placeholder="Semua Status"
                  isSearchable={true}
                  isClearable={true}
                  accentColor="green"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tipe Pedagang</label>
                <SearchableSelect
                  options={TIPE_OPTIONS}
                  value={tipeFilter}
                  onChange={(val) => setTipeFilter(val ?? '')}
                  placeholder="Semua Tipe"
                  isSearchable={true}
                  isClearable={true}
                  accentColor="green"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pasar</label>
                <input
                  type="text"
                  placeholder="Nama pasar..."
                  value={pasarFilter}
                  onChange={(e) => setPasarFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Dispensasi</label>
                <SearchableSelect
                  options={DISPENSASI_OPTIONS}
                  value={dispensasiFilter}
                  onChange={(val) => setDispensasiFilter(val ?? '')}
                  placeholder="Semua"
                  isSearchable={false}
                  isClearable={true}
                  accentColor="green"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Search & Reset Buttons */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => fetchPedagang(1, pagination.perPage)}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                {loading ? 'Mencari...' : 'Cari'}
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold flex items-center gap-2 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {searchId && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-100">
                      ID: "{searchId}"
                      <button onClick={() => setSearchId('')} className="hover:bg-emerald-100 rounded-full">
                        <XCircle className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {searchName && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-100">
                      Nama: "{searchName}"
                      <button onClick={() => setSearchName('')} className="hover:bg-emerald-100 rounded-full">
                        <XCircle className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {searchHp && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-100">
                      No HP: "{searchHp}"
                      <button onClick={() => setSearchHp('')} className="hover:bg-emerald-100 rounded-full">
                        <XCircle className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {statusFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-100">
                      Status: {getStatusLabel(Number(statusFilter))}
                      <button onClick={() => setStatusFilter('')} className="hover:bg-emerald-100 rounded-full">
                        <XCircle className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {tipeFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-100">
                      Tipe: {TIPE_LABELS[tipeFilter] || tipeFilter}
                      <button onClick={() => setTipeFilter('')} className="hover:bg-emerald-100 rounded-full">
                        <XCircle className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {pasarFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-100">
                      Pasar: {pasarFilter}
                      <button onClick={() => setPasarFilter('')} className="hover:bg-emerald-100 rounded-full">
                        <XCircle className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {dispensasiFilter !== '' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-100">
                      Dispensasi: {dispensasiFilter === '1' ? 'Aktif' : 'Tidak Aktif'}
                      <button onClick={() => setDispensasiFilter('')} className="hover:bg-emerald-100 rounded-full">
                        <XCircle className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
                <button
                  onClick={resetFilters}
                  className="text-xs font-semibold text-gray-500 hover:text-red-600 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Semua
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 text-sm font-medium">Koneksi API Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Table - Desktop */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-[10px] font-bold text-gray-500 uppercase px-3 py-3 w-10">No</th>
                  <th className="text-left text-[10px] font-bold text-gray-500 uppercase px-3 py-3">
                    <button onClick={() => handleSort('nama_alias')} className="flex items-center gap-1 hover:text-gray-700">
                      Pedagang <SortIcon column="nama_alias" />
                    </button>
                  </th>
                  <th className="text-left text-[10px] font-bold text-gray-500 uppercase px-3 py-3">Pasar / Status</th>
                  <th className="text-right text-[10px] font-bold text-gray-500 uppercase px-3 py-3">
                    <button onClick={() => handleSort('saldo_akhir')} className="flex items-center gap-1 hover:text-gray-700 ml-auto">
                      Saldo <SortIcon column="saldo_akhir" />
                    </button>
                  </th>
                  <th className="text-right text-[10px] font-bold text-gray-500 uppercase px-3 py-3">Hutang</th>
                  <th className="text-center text-[10px] font-bold text-gray-500 uppercase px-3 py-3">Dispensasi</th>
                  <th className="text-center text-[10px] font-bold text-gray-500 uppercase px-3 py-3 w-10">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Memuat data...</p>
                    </td>
                  </tr>
                ) : sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Tidak ada data pedagang ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  sortedData.map((row, idx) => (
                    <tr key={row.pid || row.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="px-3 py-3 text-xs text-gray-400">
                        {(pagination.currentPage - 1) * pagination.perPage + idx + 1}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold flex-shrink-0">
                            {(row.nama_alias || row.nama_identitas || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{row.nama_alias || '-'}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1.5">
                              <span className="font-mono">{row.id_pedagang || '-'}</span>
                              {row.no_hp && (
                                <span className="flex items-center gap-0.5">
                                  · <Phone className="w-3 h-3" /> {row.no_hp}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-700 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" /> {row.pasar || '-'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${getStatusBadgeClasses(row.status_pedagang)}`}>
                              {row.status_label || getStatusLabel(row.status_pedagang)}
                            </span>
                            <span className="text-[10px] text-gray-400">{TIPE_LABELS[row.tipe_pedagang] || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-gray-400 uppercase font-semibold">Keseluruhan</span>
                            <span className="text-sm font-bold text-emerald-700 tabular-nums">{formatCurrency(row.saldo_keseluruhan)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-gray-400 uppercase font-semibold">Akhir</span>
                            <span className="text-xs font-semibold text-gray-700 tabular-nums">{formatCurrency(row.saldo_akhir)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm font-semibold text-rose-600 tabular-nums">
                          {formatCurrency(row.saldo_beku)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {row.is_dispensasi === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Aktif
                          </span>
                        ) : Number(row.total_dispensasi) > 0 ? (
                          <span className="text-[10px] text-gray-500">{row.total_dispensasi}x</span>
                        ) : (
                          <span className="text-[10px] text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={(e) => openActionMenu(e, row)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table - Mobile Cards */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Memuat data...</p>
            </div>
          ) : sortedData.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Tidak ada data pedagang</p>
            </div>
          ) : (
            sortedData.map((row, idx) => (
              <div key={row.pid || row.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-bold flex-shrink-0">
                      {(row.nama_alias || row.nama_identitas || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{row.nama_alias || '-'}</p>
                      <p className="text-xs text-gray-400 font-mono">{row.id_pedagang || '-'}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => openActionMenu(e, row)}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Pasar</p>
                    <p className="text-gray-700 truncate">{row.pasar || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Status</p>
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full ${getStatusBadgeClasses(row.status_pedagang)}`}>
                      {row.status_label || getStatusLabel(row.status_pedagang)}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-400">Saldo Keseluruhan</p>
                    <p className="text-emerald-700 font-bold">{formatCurrency(row.saldo_keseluruhan)}</p>
                    <p className="text-[10px] text-gray-400">Akhir: {formatCurrency(row.saldo_akhir)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Hutang</p>
                    <p className="text-rose-600 font-bold">{formatCurrency(row.saldo_beku)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Dispensasi</p>
                    {row.is_dispensasi === 1 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Aktif
                      </span>
                    ) : Number(row.total_dispensasi) > 0 ? (
                      <span className="text-gray-600">{row.total_dispensasi}x</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Baris per halaman:</span>
            <select
              value={pagination.perPage}
              onChange={(e) => handlePerPageChange(parseInt(e.target.value), 1)}
              className="px-2 py-1 rounded-md border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-gray-400">
              {((pagination.currentPage - 1) * pagination.perPage) + 1}-{Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems)} dari {pagination.totalItems}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.currentPage === 1}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-md">
              {pagination.currentPage} / {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {menuPortal}

      {/* Modals */}
      <AddEditPedagangModal
        isOpen={showAddModal || showEditModal}
        onClose={() => { setShowAddModal(false); setShowEditModal(false); setEditData(null); }}
        onSave={handleSave}
        editData={editData}
        loading={loading}
      />
      <PedagangDetailModal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setDetailData(null); }}
        data={detailData}
      />
      <DeleteConfirmationModal
        isOpen={!!deleteData}
        onClose={() => { setDeleteData(null); setIsDeleting(false); }}
        onConfirm={handleConfirmDelete}
        title={`Hapus Pedagang "${deleteData?.nama_alias || ''}"?`}
        description="Tindakan ini akan menghapus data pedagang secara permanen dan tidak dapat dibatalkan."
        loading={isDeleting}
      />
      <RekeningPedagangModal
        isOpen={showRekeningModal}
        onClose={() => { setShowRekeningModal(false); setRekeningData(null); }}
        pedagangData={rekeningData}
        onCetak={async ({ pid, bulan, tahun, nama_alias }) => {
          try {
            const PedagangService = (await import('../../../services/pedagangService')).default;
            const result = await PedagangService.cetakRekening({ pid, bulan, tahun });
            if (result.success) {
              showNotification(`Rekening ${nama_alias} periode ${bulan}/${tahun} berhasil dicetak`);
              setShowRekeningModal(false);
              setRekeningData(null);
            } else {
              showNotification(result.message || 'Gagal mencetak rekening', 'error');
            }
          } catch {
            showNotification('Terjadi kesalahan saat mencetak rekening', 'error');
          }
        }}
      />
      <TambahTabunganModal
        isOpen={showTabunganModal}
        onClose={() => { setShowTabunganModal(false); setTabunganData(null); }}
        pedagangData={tabunganData}
        onSubmit={async ({ pid, nominal, note }) => {
          try {
            const PedagangService = (await import('../../../services/pedagangService')).default;
            const result = await PedagangService.storeTabungan({ pid, nominal, note });
            if (result.success) {
              showNotification(result.message || 'Tabungan berhasil ditambahkan');
              setShowTabunganModal(false);
              setTabunganData(null);
              fetchPedagang(pagination.currentPage, pagination.perPage);
              fetchStatistics();
            } else {
              showNotification(result.message || 'Gagal menambahkan tabungan', 'error');
            }
          } catch {
            showNotification('Terjadi kesalahan saat menambahkan tabungan', 'error');
          }
        }}
      />
      <HistorySaldoModal
        open={showHistoryModal}
        loading={historyLoading}
        data={historyData}
        onClose={() => { setShowHistoryModal(false); setHistoryData(null); }}
      />
    </div>
  );
};

export default PedagangPage;
