import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, ShoppingCart, Eye, Edit2, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import usePenjualanSapiUtuh from '../../../hooks/usePenjualanSapiUtuh';
import DeleteConfirmationModal from '../../../components/shared/modals/DeleteConfirmationModal';
import Notification from '../../../components/shared/Notification';

// Standalone action menu cell with portal to escape table overflow clipping
const ActionMenuCell = ({ row, setDeleteData, handleConfirm, handleCancel }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX - 160,
      });
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      const isInsideButton = buttonRef.current && buttonRef.current.contains(e.target);
      const isInsideMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!isInsideButton && !isInsideMenu) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-1 w-44 z-[99999]"
      style={{ top: menuPos.top, left: menuPos.left }}
    >
      <button
        onClick={() => { setIsOpen(false); navigate(`/rph/penjualan-sapi-utuh/detail/${row.pid}`); }}
        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition"
      >
        <Eye className="w-4 h-4 text-blue-500" /> Detail
      </button>
      {row.status_transaksi === 'draft' && (
        <>
          <button
            onClick={() => { setIsOpen(false); navigate(`/rph/penjualan-sapi-utuh/edit/${row.pid}`); }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-yellow-50 flex items-center gap-2 transition"
          >
            <Edit2 className="w-4 h-4 text-yellow-500" /> Edit
          </button>
          <button
            onClick={() => { setIsOpen(false); setDeleteData(row); }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2 transition"
          >
            <XCircle className="w-4 h-4 text-red-500" /> Batal
          </button>
          <button
            onClick={() => { setIsOpen(false); handleConfirm(row); }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2 transition"
          >
            <CheckCircle className="w-4 h-4 text-green-500" /> Konfirmasi
          </button>
        </>
      )}
      {row.status_transaksi === 'confirmed' && (row.nominal_pembayaran || 0) === 0 && (
        <button
          onClick={() => { setIsOpen(false); handleCancel(row); }}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2 transition"
        >
          <XCircle className="w-4 h-4 text-red-500" /> Batalkan
        </button>
      )}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className={`p-2 rounded-lg transition ${isOpen ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
        title="Menu"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      {isOpen && createPortal(menuContent, document.body)}
    </div>
  );
};

const PenjualanSapiUtuhPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ isVisible: false, type: 'info', message: '' });
  const [tableData, setTableData] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  const { loading, error, fetchData, remove, confirm, cancel } = usePenjualanSapiUtuh();

  const loadData = useCallback(async () => {
    const result = await fetchData({ 
      length: 1000,
      ...(statusFilter && { status_transaksi: statusFilter })
    });
    if (result.success && result.data) {
      setTableData(result.data);
    }
  }, [fetchData, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showNotif = useCallback((type, message) => {
    setNotification({ isVisible: true, type, message });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteData) return;
    setIsDeleting(true);
    try {
      const result = await remove(deleteData.pid);
      if (result.success) {
        setDeleteData(null);
        showNotif('success', 'Transaksi berhasil dihapus');
        loadData();
      } else {
        showNotif('error', result.message || 'Gagal menghapus transaksi');
      }
    } catch (err) {
      showNotif('error', err.message || 'Gagal menghapus transaksi');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteData, remove, showNotif, loadData]);

  const handleConfirm = useCallback(async (item) => {
    const result = await confirm(item.pid);
    if (result.success) {
      showNotif('success', 'Transaksi berhasil dikonfirmasi');
      loadData();
    } else {
      showNotif('error', result.message || 'Gagal mengkonfirmasi transaksi');
    }
  }, [confirm, showNotif, loadData]);

  const handleCancel = useCallback(async (item) => {
    const result = await cancel(item.pid);
    if (result.success) {
      showNotif('success', 'Transaksi berhasil dibatalkan');
      loadData();
    } else {
      showNotif('error', result.message || 'Gagal membatalkan transaksi');
    }
  }, [cancel, showNotif, loadData]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return tableData;
    const lower = searchTerm.toLowerCase();
    return tableData.filter((item) =>
      item.no_transaksi?.toLowerCase().includes(lower) ||
      item.reseller?.nama?.toLowerCase().includes(lower) ||
      item.nama_pembeli?.toLowerCase().includes(lower) ||
      item.pic?.toLowerCase().includes(lower)
    );
  }, [tableData, searchTerm]);

  const columns = useMemo(() => [
    {
      name: 'Transaksi',
      selector: (row) => row.no_transaksi,
      sortable: true,
      minWidth: '220px',
      cell: (row) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(row.pic || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">No.</span>
              <span className="inline-block bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide border border-indigo-100">
                {row.no_transaksi}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Tgl</span>
              <span className="text-xs text-gray-500">{row.tanggal_transaksi}</span>
              <span className="text-gray-300">|</span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">PIC</span>
              <span className="text-xs text-gray-500">{row.pic || '-'}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      name: 'Pihak',
      selector: (row) => row.nama_pembeli,
      sortable: true,
      minWidth: '200px',
      cell: (row) => {
        const penjualLabels = { cv_puput: 'CV Puput', reseller: 'Reseller' };
        return (
          <div className="py-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider shrink-0">Pembeli</span>
              <span className="text-sm font-semibold text-gray-800 truncate">{row.nama_pembeli || '-'}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {row.reseller ? (
                <>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider shrink-0">Reseller</span>
                  <span className="text-[11px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 truncate max-w-[100px]">
                    {row.reseller.nama}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider shrink-0">Reseller</span>
                  <span className="text-[11px] text-gray-300 italic">—</span>
                </>
              )}
              <span className="text-gray-300">|</span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider shrink-0">Dari</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                row.penjual === 'reseller' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-violet-50 text-violet-600 border border-violet-100'
              }`}>
                {penjualLabels[row.penjual] || row.penjual}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      name: 'Detail',
      selector: (row) => row.total_harga,
      sortable: true,
      minWidth: '160px',
      right: true,
      cell: (row) => {
        const grandTotal = (row.total_harga || 0) + (row.biaya_kirim || 0) + (row.biaya_potong || 0);
        return (
          <div className="text-right py-1 space-y-1.5">
            {/* Row 1: Total + Costs + Grand Total */}
            <div className="flex items-center justify-end gap-2">
              <span className="text-[10px] text-gray-400">Harga Sapi <span className="text-gray-700 font-semibold">Rp {row.total_harga?.toLocaleString('id-ID')}</span></span>
              <span className="text-gray-300">|</span>
              <span className="text-[10px] text-gray-400">Kirim <span className="text-gray-500 font-medium">Rp {row.biaya_kirim?.toLocaleString('id-ID') || 0}</span></span>
              <span className="text-gray-300">|</span>
              <span className="text-[10px] text-gray-400">Potong <span className="text-gray-500 font-medium">Rp {row.biaya_potong?.toLocaleString('id-ID') || 0}</span></span>
              <span className="text-gray-300">|</span>
              <span className="text-[10px] text-gray-500 font-bold">Grand <span className="text-gray-800 font-bold">Rp {grandTotal.toLocaleString('id-ID')}</span></span>
            </div>
            {/* Row 2: Payment method + Nominal + Sisa */}
            <div className="flex items-center justify-end gap-3">
              <span className="text-[10px] text-gray-400">{row.metode_pembayaran ? (row.metode_pembayaran === 'transfer' ? 'Transfer' : 'Tunai') : 'Bayar'} <span className="text-emerald-500 font-medium">Rp {row.nominal_pembayaran?.toLocaleString('id-ID') || 0}</span></span>
              <span className="text-gray-300">|</span>
              <span className="text-[10px] text-gray-400">Sisa <span className={`font-medium ${(row.sisa_pembayaran || 0) > 0 ? 'text-red-500' : 'text-gray-500'}`}>Rp {row.sisa_pembayaran?.toLocaleString('id-ID') || 0}</span></span>
            </div>
          </div>
        );
      },
    },
    {
      name: 'Tipe / Bayar',
      selector: (row) => row.tipe_penjualan,
      sortable: true,
      width: '210px',
      center: true,
      cell: (row) => {
        const bayarConfigs = {
          lunas: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Lunas' },
          dp: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100', label: 'DP' },
          belum_bayar: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', label: 'Belum' },
        };
        const b = bayarConfigs[row.status_pembayaran] || bayarConfigs.belum_bayar;
        const metodeLabel = row.metode_pembayaran === 'transfer' ? 'Transfer' : row.metode_pembayaran === 'tunai' ? 'Tunai' : null;
        return (
          <div className="flex items-center justify-center gap-3 py-1">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-gray-400">Tipe</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                row.tipe_penjualan === 'tunai'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-sky-50 text-sky-700 border border-sky-100'
              }`}>
                {row.tipe_penjualan?.toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-gray-400">Bayar</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${b.bg} ${b.text} border ${b.border}`}>
                {b.label}
              </span>
            </div>
            {metodeLabel && (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] text-gray-400">Metode</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100">
                  {metodeLabel}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      name: 'Status',
      selector: (row) => row.status_transaksi,
      sortable: true,
      width: '125px',
      center: true,
      cell: (row) => {
        const configs = {
          draft: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-400', label: 'Draft' },
          confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-400', label: 'Confirmed' },
          cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-400', label: 'Batal' },
        };
        const c = configs[row.status_transaksi] || configs.draft;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${c.bg} ${c.text} border ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
          </span>
        );
      },
    },
    {
      name: '',
      center: true,
      width: '50px',
      cell: (row) => (
        <ActionMenuCell
          row={row}
          setDeleteData={setDeleteData}
          handleConfirm={handleConfirm}
          handleCancel={handleCancel}
        />
      ),
    },
  ], [handleConfirm, handleCancel]);

  const customTableStyles = {
    table: {
      style: {
        borderRadius: '16px',
        overflow: 'hidden',
      },
    },
    headRow: {
      style: {
        backgroundColor: '#F8FAFC',
        borderBottom: '2px solid #E2E8F0',
        fontSize: '12px',
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        minHeight: '48px',
      },
    },
    headCells: {
      style: {
        padding: '12px 16px',
      },
    },
    rows: {
      style: {
        fontSize: '14px',
        backgroundColor: '#ffffff',
        minHeight: '64px',
        '&:hover': {
          backgroundColor: '#F8FAFC',
        },
      },
    },
    cells: {
      style: {
        padding: '12px 16px',
      },
    },
    pagination: {
      style: {
        borderTop: '1px solid #E2E8F0',
        padding: '12px 16px',
        fontSize: '13px',
        color: '#64748B',
      },
    },
  };

  const stats = useMemo(() => ({
    total: tableData.length,
    draft: tableData.filter(r => r.status_transaksi === 'draft').length,
    confirmed: tableData.filter(r => r.status_transaksi === 'confirmed').length,
  }), [tableData]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Penjualan Sapi Utuh</h1>
            <p className="text-gray-500 text-sm mt-0.5">Kelola transaksi penjualan sapi utuh ke reseller</p>
          </div>
          <button
            onClick={() => navigate('/rph/penjualan-sapi-utuh/add')}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-sm hover:shadow-md"
          >
            <PlusCircle className="w-5 h-5" />
            Tambah Penjualan
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Transaksi</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Draft</p>
              <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
            </div>
          </div>
        </div>

        {/* Filters & Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nomor transaksi, reseller, pembeli, atau PIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 hidden sm:inline">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition cursor-pointer"
              >
                <option value="">Semua</option>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <DataTable
            columns={columns}
            data={filteredData}
            progressPending={loading}
            pagination
            paginationPerPage={15}
            paginationRowsPerPageOptions={[10, 15, 25, 50]}
            highlightOnHover
            responsive
            noDataComponent={
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium">Tidak ada data penjualan</p>
                <p className="text-gray-300 text-sm mt-1">Transaksi baru akan muncul di sini</p>
              </div>
            }
            customStyles={customTableStyles}
          />
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Hapus Transaksi?"
        description={`Apakah Anda yakin ingin menghapus transaksi "${deleteData?.no_transaksi}"? Tindakan ini tidak dapat dibatalkan.`}
      />

      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification((n) => ({ ...n, isVisible: false }))}
      />
    </div>
  );
};

export default PenjualanSapiUtuhPage;
