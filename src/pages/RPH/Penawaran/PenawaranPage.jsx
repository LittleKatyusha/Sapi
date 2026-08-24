import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  PlusCircle, Search, Eye, Edit2, Trash2, Send, CheckCircle, XCircle,
  Handshake, Filter, Loader2, FileText, AlertCircle, MoreVertical,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowUpDown,
  Calendar, Users, Wallet, FileCheck,
  RotateCcw, Info, Clock
} from 'lucide-react';
import usePenawaranPenjualan from '../../../hooks/usePenawaranPenjualan';
import SearchableSelect from '../../../components/shared/SearchableSelect';

const ActionMenuPortal = ({ row, menuPos, onClose, onDetail, onEdit, onAjukan, onSetujui, onDelete }) => (
  <>
    <div className="fixed inset-0 z-[99998]" onClick={onClose} />
    <div
      style={{ position: 'fixed', left: menuPos.left, top: menuPos.top, zIndex: 99999 }}
      className="w-44 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden"
    >
      <button
        onClick={() => onDetail(row.pid)}
        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
      >
        <Eye className="w-3.5 h-3.5 text-blue-500" /> Lihat Detail
      </button>
      {row.status === 'draft' && (
        <button
          onClick={() => onEdit(row.pid)}
          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
        >
          <Edit2 className="w-3.5 h-3.5 text-amber-500" /> Edit
        </button>
      )}
      {row.status === 'draft' && (
        <button
          onClick={() => onAjukan(row)}
          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
        >
          <Send className="w-3.5 h-3.5 text-sky-500" /> Ajukan
        </button>
      )}
      {row.status === 'diajukan' && (
        <button
          onClick={() => onSetujui(row)}
          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Setujui / Tolak
        </button>
      )}
      {row.status === 'draft' && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => onDelete(row)}
            className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Hapus
          </button>
        </>
      )}
    </div>
  </>
);

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' },
  diajukan: { label: 'Diajukan', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-400' },
  disetujui: { label: 'Disetujui', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-400' },
  ditolak: { label: 'Ditolak', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-400' },
};

const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const formatDate = (str) => str ? new Date(str).toLocaleDateString('id-ID') : '-';
const formatDateCompact = (str) => str ? new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'diajukan', label: 'Diajukan' },
  { value: 'disetujui', label: 'Disetujui' },
  { value: 'ditolak', label: 'Ditolak' },
];

const PenawaranPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState({ startDate: '', endDate: '', nomor_spp: '' });
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(advancedFilters);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [ajukanConfirm, setAjukanConfirm] = useState(null);
  const [setujuiModal, setSetujuiModal] = useState(null);
  const [setujuiDetail, setSetujuiDetail] = useState(null);
  const [setujuiLoading, setSetujuiLoading] = useState(false);
  const [setujuiError, setSetujuiError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedApprover, setSelectedApprover] = useState('');
  const [selectedApproverSetujui, setSelectedApproverSetujui] = useState(null);
  const [ajukanDetail, setAjukanDetail] = useState(null);
  const [ajukanLoading, setAjukanLoading] = useState(false);
  const [ajukanError, setAjukanError] = useState('');
  const [approvers, setApprovers] = useState([]);
  const [notification, setNotification] = useState(null);
  const { loading, error, fetchData, hapus, ajukan, setujui, fetchApprovers, fetchDetail } = usePenawaranPenjualan();

  const loadData = useCallback(async (page = 1, limit = perPage) => {
    const result = await fetchData({
      start: (page - 1) * limit,
      length: limit,
      search: searchTerm,
      status: statusFilter,
      startDate: advancedFilters.startDate,
      endDate: advancedFilters.endDate,
      nomor_spp: advancedFilters.nomor_spp,
    });
    if (result.success) {
      setTableData(result.data || []);
      setTotalRecords(result.recordsTotal || 0);
    }
  }, [searchTerm, statusFilter, perPage, fetchData, advancedFilters]);

  useEffect(() => { loadData(currentPage); }, [loadData, currentPage]);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Refresh when returning from add/edit page
  useEffect(() => {
    if (location.state?.fromForm) {
      loadData(currentPage);
      const action = location.state.action;
      setNotification({
        type: 'success',
        message: action === 'edit' ? 'Penawaran berhasil diperbarui' : 'Penawaran berhasil disimpan',
      });
      window.history.replaceState({}, document.title);
    }
  }, [location.state, loadData, currentPage]);

  useEffect(() => {
    const loadApprovers = async () => {
      const result = await fetchApprovers();
      if (result.success) setApprovers(result.data || []);
    };
    loadApprovers();
  }, [fetchApprovers]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const result = await hapus(deleteConfirm.pid);
    if (result.success) {
      setDeleteConfirm(null);
      setNotification({ type: 'success', message: result.message || 'Penawaran berhasil dihapus' });
      loadData(currentPage);
    } else {
      setNotification({ type: 'error', message: result.message || 'Gagal menghapus penawaran' });
    }
  };

  const handleAjukan = async () => {
    if (!ajukanConfirm || !selectedApprover) return;
    const result = await ajukan(ajukanConfirm.pid, selectedApprover);
    if (result.success) {
      setAjukanConfirm(null);
      setSelectedApprover('');
      setAjukanDetail(null);
      setAjukanError('');
      setNotification({ type: 'success', message: result.message || 'Penawaran berhasil diajukan untuk persetujuan' });
      loadData(currentPage);
    } else {
      setNotification({ type: 'error', message: result.message || 'Gagal mengajukan penawaran' });
    }
  };

  const openAjukanModal = useCallback(async (row) => {
    setAjukanConfirm(row);
    setSelectedApprover('');
    setAjukanDetail(null);
    setAjukanError('');
    setAjukanLoading(true);
    const result = await fetchDetail(row.pid);
    if (result.success) {
      setAjukanDetail(result.data);
    } else {
      setAjukanError(result.message || 'Gagal memuat data');
    }
    setAjukanLoading(false);
  }, [fetchDetail]);

  const handleSetujui = async (approved) => {
    if (!setujuiModal) return;
    const approverId = selectedApproverSetujui || null;
    const result = await setujui(setujuiModal.pid, approved, approverId);
    if (result.success) {
      setSetujuiModal(null);
      setSetujuiDetail(null);
      setSelectedApproverSetujui(null);
      setSetujuiError('');
      setNotification({ type: 'success', message: result.message || (approved ? 'Penawaran berhasil disetujui' : 'Penawaran ditolak') });
      loadData(currentPage);
    } else {
      setNotification({ type: 'error', message: result.message || 'Gagal memproses persetujuan' });
    }
  };

  const openSetujuiModal = useCallback(async (row) => {
    setSetujuiModal(row);
    setSelectedApproverSetujui(null);
    setSetujuiDetail(null);
    setSetujuiError('');
    setSetujuiLoading(true);
    const result = await fetchDetail(row.pid);
    if (result.success) {
      setSetujuiDetail(result.data);
    } else {
      setSetujuiError(result.message || 'Gagal memuat data');
    }
    setSetujuiLoading(false);
  }, [fetchDetail]);

  const toggleExpand = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return tableData;
    return [...tableData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const result = aVal < bVal ? -1 : 1;
      return sortConfig.direction === 'asc' ? result : -result;
    });
  }, [tableData, sortConfig]);

  const handleApplyFilters = () => {
    setAdvancedFilters(localFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    const empty = { startDate: '', endDate: '', nomor_spp: '' };
    setLocalFilters(empty);
    setAdvancedFilters(empty);
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const removeFilter = (field) => {
    const newFilters = { ...advancedFilters, [field]: '' };
    setAdvancedFilters(newFilters);
    setLocalFilters(newFilters);
    setCurrentPage(1);
  };

  const activeFilterCount = Object.entries(advancedFilters).filter(([, v]) => v && v.toString().trim() !== '').length
    + (searchTerm ? 1 : 0) + (statusFilter ? 1 : 0);

  const totalPages = Math.ceil(totalRecords / perPage) || 1;
  const startItem = totalRecords === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalRecords);

  // Stats from current page data
  const stats = useMemo(() => {
    const total = totalRecords;
    const draft = tableData.filter(r => r.status === 'draft').length;
    const diajukan = tableData.filter(r => r.status === 'diajukan').length;
    const disetujui = tableData.filter(r => r.status === 'disetujui').length;
    const totalSaldo = tableData.reduce((sum, r) => sum + (Number(r.total_saldo) || 0), 0);
    return { total, draft, diajukan, disetujui, totalSaldo };
  }, [tableData, totalRecords]);

  const StatCard = React.memo(({ title, value, icon: Icon, accentColor, subtitle }) => (
    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${accentColor}`}>
          {Icon && <Icon className="w-4 h-4 text-white" />}
        </div>
        <h3 className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900">{value ?? 0}</p>
      {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  ));

  const TableHeader = ({ label, caption, sortKey, align = 'left' }) => (
    <th
      className={`pb-3 pt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition-colors ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      }`}
      onClick={sortKey ? () => handleSort(sortKey) : undefined}
    >
      <div className={`flex flex-col ${align === 'right' ? 'items-end' : align === 'center' ? 'items-center' : 'items-start'}`}>
        <div className="flex items-center gap-1">
          {label}
          {sortKey && (
            <ArrowUpDown className={`w-3.5 h-3.5 transition-colors ${sortConfig.key === sortKey ? 'text-emerald-600' : 'text-gray-300'}`} />
          )}
        </div>
        {caption && <span className="text-[10px] font-normal normal-case text-gray-400 mt-0.5">{caption}</span>}
      </div>
    </th>
  );

  const actionMenuPortal = (openMenuId && menuPos && tableData.find(r => r.pid === openMenuId))
    ? createPortal(
        <ActionMenuPortal
          row={tableData.find(r => r.pid === openMenuId)}
          menuPos={menuPos}
          onClose={() => { setOpenMenuId(null); setMenuPos(null); }}
          onDetail={(pid) => { navigate(`/rph/penawaran/detail/${pid}`); setOpenMenuId(null); setMenuPos(null); }}
          onEdit={(pid) => { navigate(`/rph/penawaran/edit/${pid}`); setOpenMenuId(null); setMenuPos(null); }}
          onAjukan={(row) => { openAjukanModal(row); setOpenMenuId(null); setMenuPos(null); }}
          onSetujui={(row) => { openSetujuiModal(row); setOpenMenuId(null); setMenuPos(null); }}
          onDelete={(row) => { setDeleteConfirm(row); setOpenMenuId(null); setMenuPos(null); }}
        />,
        document.body
      )
    : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="w-full space-y-6">
        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-4 right-4 z-[100001] animate-slide-in-right">
            <div className={`max-w-md w-full bg-white shadow-2xl rounded-xl pointer-events-auto overflow-hidden transform transition-all duration-300 hover:scale-105 ${
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
                  <div className="ml-4 flex-shrink-0">
                    <button
                      onClick={() => setNotification(null)}
                      className={`rounded-lg p-1.5 inline-flex items-center justify-center transition-all duration-200 ${
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
              <div className={`h-1 ${
                notification.type === 'success' ? 'bg-emerald-200' :
                notification.type === 'info' ? 'bg-blue-200' :
                'bg-red-200'
              }`}>
                <div className={`h-full ${
                  notification.type === 'success' ? 'bg-emerald-500' :
                  notification.type === 'info' ? 'bg-blue-500' :
                  'bg-red-500'
                }`} style={{ width: '100%', transition: 'width 5s linear' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard title="Total Penawaran" value={stats.total} icon={Handshake} accentColor="bg-emerald-500" subtitle="Seluruh data" />
          <StatCard title="Draft" value={stats.draft} icon={FileText} accentColor="bg-gray-500" subtitle="Belum diajukan" />
          <StatCard title="Diajukan" value={stats.diajukan} icon={Clock} accentColor="bg-amber-500" subtitle="Menunggu approve" />
          <StatCard title="Disetujui" value={stats.disetujui} icon={FileCheck} accentColor="bg-green-600" subtitle="Sudah disetujui" />
          <StatCard title="Total Saldo" value={formatRupiah(stats.totalSaldo)} icon={Wallet} accentColor="bg-indigo-500" subtitle="Halaman ini" />
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => { loadData(currentPage); setNotification({ type: 'info', message: 'Data berhasil dimuat ulang' }); }}
            className="bg-white hover:bg-gray-50 text-gray-600 px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 hover:shadow transition-all duration-200 flex items-center gap-2 text-sm font-medium active:scale-[0.98]"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/rph/penawaran/add')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 text-sm font-medium active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            Buat Penawaran
          </button>
        </div>

        {/* Filter Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Filter className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-gray-900">Filter & Pencarian Lanjutan</h3>
                <p className="text-xs text-gray-500">
                  {activeFilterCount > 0
                    ? `${activeFilterCount} filter aktif`
                    : 'Cari berdasarkan nomor SPP, status, tanggal, dll'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                  {activeFilterCount}
                </span>
              )}
              {isFilterExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>
          </button>

          {isFilterExpanded && (
            <div className="px-5 pb-5 border-t border-gray-100">
              {/* Active filter badges */}
              {activeFilterCount > 0 && (
                <div className="py-4 flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-gray-500 mr-1">Filter aktif:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-md border border-emerald-100">
                      Cari: <span className="font-medium">{searchTerm}</span>
                      <button onClick={() => setSearchTerm('')} className="hover:text-emerald-900 ml-1">×</button>
                    </span>
                  )}
                  {statusFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-md border border-emerald-100">
                      Status: <span className="font-medium">{STATUS_OPTIONS.find(o => o.value === statusFilter)?.label || statusFilter}</span>
                      <button onClick={() => setStatusFilter('')} className="hover:text-emerald-900 ml-1">×</button>
                    </span>
                  )}
                  {advancedFilters.nomor_spp && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-md border border-emerald-100">
                      No. SPP: <span className="font-medium">{advancedFilters.nomor_spp}</span>
                      <button onClick={() => removeFilter('nomor_spp')} className="hover:text-emerald-900 ml-1">×</button>
                    </span>
                  )}
                  {(advancedFilters.startDate || advancedFilters.endDate) && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-md border border-emerald-100">
                      Tanggal: <span className="font-medium">{advancedFilters.startDate || '...'} s/d {advancedFilters.endDate || '...'}</span>
                      <button onClick={() => { setAdvancedFilters(p => ({...p, startDate: '', endDate: ''})); setLocalFilters(p => ({...p, startDate: '', endDate: ''})); }} className="hover:text-emerald-900 ml-1">×</button>
                    </span>
                  )}
                </div>
              )}

              {/* Filter inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                    <Search className="w-3.5 h-3.5 text-gray-400" />
                    Pencarian
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadData(1)}
                    placeholder="Cari no. penawaran..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white hover:border-gray-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    No. SPP
                  </label>
                  <input
                    type="text"
                    value={localFilters.nomor_spp || ''}
                    onChange={(e) => setLocalFilters(p => ({ ...p, nomor_spp: e.target.value }))}
                    placeholder="Cari nomor SPP..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white hover:border-gray-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                    <Filter className="w-3.5 h-3.5 text-gray-400" />
                    Status
                  </label>
                  <SearchableSelect
                    options={STATUS_OPTIONS}
                    value={statusFilter}
                    onChange={(v) => { setStatusFilter(v || ''); setCurrentPage(1); }}
                    placeholder="Semua status"
                    isClearable
                    isSearchable={false}
                    accentColor="green"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={localFilters.startDate || ''}
                    onChange={(e) => setLocalFilters(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white hover:border-gray-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    Tanggal Akhir
                  </label>
                  <input
                    type="date"
                    value={localFilters.endDate || ''}
                    onChange={(e) => setLocalFilters(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white hover:border-gray-300"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-5 mt-4 border-t border-gray-100">
                <button
                  onClick={handleResetFilters}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Filter
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  Cari Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="space-y-4">
          {error && (
            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4 flex items-center gap-3 text-red-700">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Gagal memuat data</div>
                <div className="text-xs text-red-600">{error}</div>
              </div>
            </div>
          )}

          {loading && tableData.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="h-4 bg-gray-100 rounded w-1/4 animate-pulse"></div>
              </div>
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-gray-100"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    </div>
                    <div className="w-24 h-8 bg-gray-100 rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : tableData.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 px-4 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Belum ada data penawaran</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                Data penawaran akan muncul di sini. Coba tambahkan data baru atau ubah pencarian/filter.
              </p>
              <button
                onClick={() => navigate('/rph/penawaran/add')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Buat Penawaran
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                      <tr>
                        <th className="pb-3 pt-4 pl-4 pr-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center w-14">No</th>
                        <TableHeader label="Penawaran" caption="No. SPP" sortKey="nomor_spp" />
                        <TableHeader label="Tanggal" caption="Tgl pengajuan" sortKey="tgl_pengajuan" />
                        <TableHeader label="Pedagang" caption="Jumlah pedagang" sortKey="total_pedagang" align="right" />
                        <TableHeader label="Total Saldo" caption="Total saldo dispensasi" align="right" />
                        <th className="pb-3 pt-4 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Status</th>
                        <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sortedData.map((row, index) => {
                        const isExpanded = expandedRows.has(row.pid);
                        const rowNumber = startItem + index;
                        const s = STATUS_CONFIG[row.status] || STATUS_CONFIG.draft;
                        return (
                          <React.Fragment key={row.pid || index}>
                            <tr className="group hover:bg-gray-50/60 transition-colors">
                              <td className="pl-4 pr-2 py-3.5 text-center">
                                <button
                                  onClick={() => toggleExpand(row.pid)}
                                  className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                  <span className="text-xs font-medium text-gray-400 w-5">{rowNumber}</span>
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    {row.nomor_spp || '-'}
                                  </span>
                                </div>
                                <div className="mt-1 text-xs font-medium text-gray-600">{row.nama_rph || '-'}</div>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="text-sm font-medium text-gray-900">{formatDate(row.tgl_pengajuan)}</div>
                                <div className="text-xs text-gray-500">{formatDateCompact(row.tgl_pengajuan)}</div>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <div className="text-sm font-semibold text-gray-900">{row.total_pedagang || 0}</div>
                                <div className="text-xs text-gray-500">pedagang</div>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <div className="text-sm font-semibold text-gray-900">{formatRupiah(row.total_saldo)}</div>
                              </td>
                              <td className="px-2 py-3.5">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.text} ${s.border} whitespace-nowrap`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                  {s.label}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <button
                                  onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    if (openMenuId === row.pid) {
                                      setOpenMenuId(null);
                                      setMenuPos(null);
                                    } else {
                                      setOpenMenuId(row.pid);
                                      setMenuPos({ left: rect.right - 176, top: rect.bottom + 6 });
                                    }
                                  }}
                                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-gray-50/50">
                                <td colSpan={7} className="px-4 py-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                      </div>
                                      <div>
                                        <div className="text-xs text-gray-500 mb-0.5">Tanggal Pengajuan</div>
                                        <div className="text-sm font-medium text-gray-900">{formatDate(row.tgl_pengajuan)}</div>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <Users className="w-4 h-4 text-gray-500" />
                                      </div>
                                      <div>
                                        <div className="text-xs text-gray-500 mb-0.5">Total Pedagang</div>
                                        <div className="text-sm font-medium text-gray-900">{row.total_pedagang || 0} pedagang</div>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <Wallet className="w-4 h-4 text-gray-500" />
                                      </div>
                                      <div>
                                        <div className="text-xs text-gray-500 mb-0.5">Total Saldo</div>
                                        <div className="text-sm font-medium text-emerald-700">{formatRupiah(row.total_saldo)}</div>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <Info className="w-4 h-4 text-gray-500" />
                                      </div>
                                      <div>
                                        <div className="text-xs text-gray-500 mb-0.5">Catatan</div>
                                        <div className="text-sm font-medium text-gray-900 truncate">{row.notes || '-'}</div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {sortedData.map((row, index) => {
                  const isExpanded = expandedRows.has(row.pid);
                  const rowNumber = startItem + index;
                  const s = STATUS_CONFIG[row.status] || STATUS_CONFIG.draft;
                  return (
                    <div key={row.pid || index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-400">#{rowNumber}</span>
                              <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                {row.nomor_spp || '-'}
                              </span>
                            </div>
                            <div className="text-sm font-semibold text-gray-900">{formatDate(row.tgl_pengajuan)}</div>
                            <div className="text-xs text-gray-500 mt-1">RPH: {row.nama_rph || '-'}</div>
                          </div>
                          <button
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              if (openMenuId === row.pid) {
                                setOpenMenuId(null);
                                setMenuPos(null);
                              } else {
                                setOpenMenuId(row.pid);
                                setMenuPos({ left: rect.right - 176, top: rect.bottom + 6 });
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                          <div>
                            <div className="text-xs text-gray-500">Pedagang</div>
                            <div className="font-medium text-gray-900">{row.total_pedagang || 0}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Total Saldo</div>
                            <div className="font-medium text-emerald-700">{formatRupiah(row.total_saldo)}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                          <button
                            onClick={() => toggleExpand(row.pid)}
                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                          >
                            {isExpanded ? 'Sembunyikan' : 'Lihat detail'}
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50">
                          <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                            <div>
                              <div className="text-xs text-gray-500">Tanggal</div>
                              <div className="font-medium text-gray-900">{formatDate(row.tgl_pengajuan)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Catatan</div>
                              <div className="font-medium text-gray-900">{row.notes || '-'}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Menampilkan <span className="font-semibold">{startItem}</span> sampai <span className="font-semibold">{endItem}</span> dari <span className="font-semibold">{totalRecords}</span> data
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={perPage}
                    onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    {[10, 25, 50, 100].map(size => (
                      <option key={size} value={size}>{size} / halaman</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600 px-2">
                    <span className="font-semibold">{currentPage}</span> / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Delete Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <Trash2 className="w-6 h-6" />
                <h3 className="text-lg font-bold">Hapus Penawaran</h3>
              </div>
              <p className="text-gray-600 text-sm">Yakin ingin menghapus penawaran <strong>{deleteConfirm.nomor_spp || deleteConfirm.no_penawaran}</strong>? Aksi ini tidak dapat dibatalkan.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">Batal</button>
                <button onClick={handleDelete} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition">Hapus</button>
              </div>
            </div>
          </div>
        )}

        {/* Ajukan Modal */}
        {ajukanConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sky-600">
                  <Send className="w-6 h-6" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Ajukan Penawaran</h3>
                    <p className="text-xs text-gray-500">{ajukanConfirm.nomor_spp || '-'} · {ajukanConfirm.total_pedagang || 0} pedagang · {formatRupiah(ajukanConfirm.total_saldo)}</p>
                  </div>
                </div>
                <button onClick={() => { setAjukanConfirm(null); setSelectedApprover(''); setAjukanDetail(null); setAjukanError(''); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-4">
                {ajukanLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Loader2 className="w-7 h-7 animate-spin mb-2" />
                    <p className="text-sm">Memuat data...</p>
                  </div>
                ) : ajukanError ? (
                  <div className="flex flex-col items-center justify-center py-12 text-red-500">
                    <AlertCircle className="w-8 h-8 mb-2" />
                    <p className="text-sm">{ajukanError}</p>
                  </div>
                ) : ajukanDetail ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Tanggal</p>
                        <p className="text-gray-700 font-semibold">{formatDate(ajukanDetail.tgl_pengajuan)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Catatan</p>
                        <p className="text-gray-700">{ajukanDetail.notes || '-'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase mb-2">Daftar Pedagang Dispensasi</p>
                      <div className="border border-gray-100 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr className="text-[10px] font-bold text-gray-500 uppercase">
                              <th className="text-left py-2 px-3">Pedagang</th>
                              <th className="text-right py-2 px-3">Saldo Awal</th>
                              <th className="text-right py-2 px-3">Saldo Akhir</th>
                              <th className="text-center py-2 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(ajukanDetail.detail || []).length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-6 text-center text-sm text-gray-400">Tidak ada data detail</td>
                              </tr>
                            ) : (ajukanDetail.detail || []).map((item, i) => {
                              const p = item.pedagang || {};
                              const hasDisp = p.is_dispensasi === 1 || item.status_dispensasi === 'belum_digunakan';
                              return (
                                <tr key={i} className="border-t border-gray-50">
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700 text-[10px] font-bold">
                                        {(p.nama_alias || p.nama_identitas || '?').charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-gray-800">{p.nama_alias || p.nama_identitas || '-'}</p>
                                        <p className="text-[10px] text-gray-400 font-mono">{p.id_pedagang || '-'}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-sm text-gray-600 tabular-nums">{formatRupiah(item.saldo_awal)}</td>
                                  <td className="py-2.5 px-3 text-right text-sm font-bold text-gray-800 tabular-nums">{formatRupiah(item.saldo_akhir)}</td>
                                  <td className="py-2.5 px-3 text-center">
                                    {hasDisp ? (
                                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">Aktif</span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-500">OK</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          {(ajukanDetail.detail || []).length > 0 && (
                            <tfoot>
                              <tr className="border-t-2 border-gray-100 bg-gray-50">
                                <td colSpan={2} className="py-2.5 px-3 text-right text-xs font-bold text-gray-600 uppercase">Total Saldo</td>
                                <td className="py-2.5 px-3 text-right text-sm font-bold text-sky-600 tabular-nums">{formatRupiah(ajukanDetail.total_saldo)}</td>
                                <td></td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">Tidak ada data</p>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Persetujuan RPH <span className="text-red-500">*</span></label>
                  <SearchableSelect
                    options={approvers.map(a => ({ value: a.id, label: a.name, description: a.description }))}
                    value={selectedApprover}
                    onChange={(val) => setSelectedApprover(val || '')}
                    placeholder="-- Pilih Approver --"
                    isSearchable={true}
                    isClearable={true}
                    accentColor="green"
                    menuZIndex={100000}
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => { setAjukanConfirm(null); setSelectedApprover(''); setAjukanDetail(null); setAjukanError(''); }} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">Batal</button>
                  <button onClick={handleAjukan} disabled={!selectedApprover} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed">Ajukan</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Setujui/Tolak Modal */}
        {setujuiModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-emerald-600">
                  <CheckCircle className="w-6 h-6" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Persetujuan Penawaran</h3>
                    <p className="text-xs text-gray-500">{setujuiModal.nomor_spp || '-'} · {setujuiModal.total_pedagang || 0} pedagang · {formatRupiah(setujuiModal.total_saldo)}</p>
                  </div>
                </div>
                <button onClick={() => { setSetujuiModal(null); setSetujuiDetail(null); setSelectedApproverSetujui(null); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-4">
                {setujuiLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Loader2 className="w-7 h-7 animate-spin mb-2" />
                    <p className="text-sm">Memuat data...</p>
                  </div>
                ) : setujuiError ? (
                  <div className="flex flex-col items-center justify-center py-12 text-red-500">
                    <AlertCircle className="w-8 h-8 mb-2" />
                    <p className="text-sm">{setujuiError}</p>
                  </div>
                ) : setujuiDetail ? (
                  <>
                    {/* Info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Tanggal</p>
                        <p className="text-gray-700 font-semibold">{formatDate(setujuiDetail.tgl_pengajuan)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Catatan</p>
                        <p className="text-gray-700">{setujuiDetail.notes || '-'}</p>
                      </div>
                    </div>

                    {/* Pedagang list preview */}
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase mb-2">Daftar Pedagang Dispensasi</p>
                      <div className="border border-gray-100 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr className="text-[10px] font-bold text-gray-500 uppercase">
                              <th className="text-left py-2 px-3">Pedagang</th>
                              <th className="text-right py-2 px-3">Saldo Awal</th>
                              <th className="text-right py-2 px-3">Saldo Akhir</th>
                              <th className="text-center py-2 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(setujuiDetail.detail || []).length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-6 text-center text-sm text-gray-400">Tidak ada data detail</td>
                              </tr>
                            ) : (setujuiDetail.detail || []).map((item, i) => {
                              const p = item.pedagang || {};
                              const hasDisp = p.is_dispensasi === 1 || item.status_dispensasi === 'belum_digunakan';
                              return (
                                <tr key={i} className="border-t border-gray-50">
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] font-bold">
                                        {(p.nama_alias || p.nama_identitas || '?').charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-gray-800">{p.nama_alias || p.nama_identitas || '-'}</p>
                                        <p className="text-[10px] text-gray-400 font-mono">{p.id_pedagang || '-'}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-sm text-gray-600 tabular-nums">{formatRupiah(item.saldo_awal)}</td>
                                  <td className="py-2.5 px-3 text-right text-sm font-bold text-gray-800 tabular-nums">{formatRupiah(item.saldo_akhir)}</td>
                                  <td className="py-2.5 px-3 text-center">
                                    {hasDisp ? (
                                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">Aktif</span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-500">OK</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          {(setujuiDetail.detail || []).length > 0 && (
                            <tfoot>
                              <tr className="border-t-2 border-gray-100 bg-gray-50">
                                <td colSpan={2} className="py-2.5 px-3 text-right text-xs font-bold text-gray-600 uppercase">Total Saldo</td>
                                <td className="py-2.5 px-3 text-right text-sm font-bold text-emerald-600 tabular-nums">{formatRupiah(setujuiDetail.total_saldo)}</td>
                                <td></td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">Tidak ada data</p>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Persetujuan RPH <span className="text-red-500">*</span></label>
                  <SearchableSelect
                    options={approvers.map(a => ({ value: a.id, label: a.name, description: a.description }))}
                    value={selectedApproverSetujui}
                    onChange={setSelectedApproverSetujui}
                    placeholder="Pilih persetujuan..."
                    isSearchable={true}
                    isClearable={true}
                    accentColor="green"
                    menuZIndex={100000}
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleSetujui(false)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition">
                    <XCircle className="w-4 h-4" />
                    Tolak
                  </button>
                  <button onClick={() => handleSetujui(true)} disabled={!selectedApproverSetujui} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <CheckCircle className="w-4 h-4" />
                    Setujui
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Portal Action Menu */}
      {actionMenuPortal}
      </div>
    </div>
  );
};

export default PenawaranPage;
