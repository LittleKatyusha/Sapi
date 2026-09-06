import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, ShoppingCart, Eye, Edit2, CheckCircle, XCircle, MoreVertical, Truck, Beef, ChevronDown, ChevronUp, Banknote, Package, Calendar, User, FileText, Receipt, RotateCcw, AlertTriangle, Bell, Filter, Hash, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import usePenjualanSapiUtuh from '../../../hooks/usePenjualanSapiUtuh';
import DeleteConfirmationModal from '../../../components/shared/modals/DeleteConfirmationModal';
import Notification from '../../../components/shared/Notification';
import SearchableSelect from '../../../components/shared/SearchableSelect';

// Filter options for the dropdowns
const TIPE_PENGIRIMAN_FILTER_OPTIONS = [
  { value: 'dikirim', label: 'Dikirim' },
  { value: 'dipotong_rph_dikirim', label: 'Dipotong RPH & Dikirim' },
  { value: 'dipotong_rph_diambil', label: 'Dipotong RPH & Diambil' },
  { value: 'diambil', label: 'Diambil' },
  { value: 'belum_diketahui', label: 'Belum Diketahui' },
];

const STATUS_PENGIRIMAN_FILTER_OPTIONS = [
  { value: 'belum_berangkat', label: 'Belum Berangkat' },
  { value: 'sudah_berangkat', label: 'Sudah Berangkat' },
  { value: 'sudah_diterima', label: 'Sudah Diterima' },
  { value: 'return', label: 'Return Penuh' },
];

const RETURN_STATUS_FILTER_OPTIONS = [
  { value: 'none', label: 'Tidak Ada Return' },
  { value: 'partial', label: 'Return Sebagian' },
  { value: 'full', label: 'Return Penuh' },
];

const STATUS_TRANSAKSI_FILTER_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'returned', label: 'Returned' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_BAYAR_FILTER_OPTIONS = [
  { value: 'belum_bayar', label: 'Belum Bayar' },
  { value: 'dp', label: 'DP' },
  { value: 'lunas', label: 'Lunas' },
];

// Expandable row component for detailed view
const ExpandableRow = ({ data }) => {
  const grandTotal = (data.total_harga || 0) + (data.biaya_kirim || 0) + (data.biaya_potong || 0);
  const sisa = data.sisa_pembayaran || 0;

  return (
    <div className="bg-slate-50/80 border-b border-gray-100">
      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-[1400px]">
        {/* Rincian Harga */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Package className="w-3.5 h-3.5" /> Rincian Harga
          </h4>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Harga Sapi</span>
              <span className="font-semibold text-gray-800">Rp {(data.total_harga || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Biaya Kirim</span>
              <span className="font-medium text-gray-600">Rp {(data.biaya_kirim || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Biaya Potong</span>
              <span className="font-medium text-gray-600">Rp {(data.biaya_potong || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="border-t border-gray-100 pt-2.5 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">Grand Total</span>
              <span className="text-base font-bold text-emerald-600">Rp {grandTotal.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Pembayaran */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Banknote className="w-3.5 h-3.5" /> Pembayaran
          </h4>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Metode</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                data.metode_pembayaran === 'transfer'
                  ? 'bg-violet-50 text-violet-700'
                  : data.metode_pembayaran === 'tunai'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-gray-50 text-gray-500'
              }`}>
                {data.metode_pembayaran === 'transfer' ? 'Transfer' : data.metode_pembayaran === 'tunai' ? 'Tunai' : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Nominal Dibayar</span>
              <span className="font-semibold text-emerald-600">Rp {(data.nominal_pembayaran || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Sisa Pembayaran</span>
              <span className={`font-bold ${sisa > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                Rp {sisa.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Tipe Penjualan</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                data.tipe_penjualan === 'tunai'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-sky-50 text-sky-700 border border-sky-100'
              }`}>
                {data.tipe_penjualan?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Status Pengiriman */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Truck className="w-3.5 h-3.5" /> Status Pengiriman
          </h4>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Status</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                data.status_pengiriman === 'sudah_diterima' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                data.status_pengiriman === 'sudah_berangkat' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                data.status_pengiriman === 'return' ? 'bg-red-50 text-red-700 border border-red-100' :
                'bg-gray-50 text-gray-500 border border-gray-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  data.status_pengiriman === 'sudah_diterima' ? 'bg-emerald-500' :
                  data.status_pengiriman === 'sudah_berangkat' ? 'bg-sky-500' :
                  data.status_pengiriman === 'return' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                {data.status_pengiriman === 'sudah_diterima' ? 'Diterima' :
                 data.status_pengiriman === 'sudah_berangkat' ? 'Berangkat' :
                 data.status_pengiriman === 'return' ? 'Return' : 'Belum Berangkat'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Tipe Pengiriman</span>
              <span className="font-medium text-gray-700">
                {data.pengiriman === 'dikirim' ? 'Dikirim' :
                 data.pengiriman === 'dipotong_rph_dikirim' ? 'Dipotong RPH & Dikirim' :
                 data.pengiriman === 'dipotong_rph_diambil' ? 'Dipotong RPH & Diambil' :
                 data.pengiriman === 'diambil' ? 'Diambil' :
                 data.pengiriman === 'belum_diketahui' ? 'Belum Diketahui' : '-'}
              </span>
            </div>
            {data.tanggal_berangkat && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Tanggal Berangkat</span>
                <span className="font-medium text-gray-700">{data.tanggal_berangkat}</span>
              </div>
            )}
            {data.tanggal_diterima && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Tanggal Diterima</span>
                <span className="font-medium text-gray-700">{data.tanggal_diterima}</span>
              </div>
            )}
            {data.tanggal_terima && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Tanggal Terima</span>
                <span className="font-medium text-gray-700">{data.tanggal_terima}</span>
              </div>
            )}
            {data.tempat_terima && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Tempat Terima</span>
                <span className="font-medium text-gray-700">{data.tempat_terima}</span>
              </div>
            )}
            {data.alamat_pengiriman && (
              <div className="flex justify-between items-start text-sm">
                <span className="text-gray-500 shrink-0">Alamat Pengiriman</span>
                <span className="font-medium text-gray-700 text-right text-xs leading-relaxed max-w-[200px]">{data.alamat_pengiriman}</span>
              </div>
            )}
            {data.nama_penerima && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Nama Penerima</span>
                <span className="font-medium text-gray-700">{data.nama_penerima}</span>
              </div>
            )}
            {data.no_hp_penerima && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">No HP Penerima</span>
                <span className="font-medium text-gray-700">{data.no_hp_penerima}</span>
              </div>
            )}
            {data.nama_pengirim && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Nama Pengirim</span>
                <span className="font-medium text-gray-700">{data.nama_pengirim}</span>
              </div>
            )}
            {data.biaya_kirim > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Biaya Kirim</span>
                <span className="font-medium text-gray-700">Rp {Number(data.biaya_kirim).toLocaleString('id-ID')}</span>
              </div>
            )}
            {data.status_pengiriman === 'return' && data.alasan_return && (
              <div className="flex justify-between items-start text-sm">
                <span className="text-gray-500 shrink-0">Alasan Return</span>
                <span className="font-medium text-red-600 text-right text-xs leading-relaxed max-w-[200px]">{data.alasan_return}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Standalone action menu cell with portal to escape table overflow clipping
const ActionMenuCell = ({ row, setDeleteData, handleConfirm, handleCancel, handlePrintFaktur, handlePrintInvoice, handlePrintSuratJalan, handleReturnClick, confirmingPid }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 208; // w-52 = 13rem = 208px
      const menuHeight = 320; // approx max height for clamping
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Default: align menu's left edge to button's left edge, below button
      let left = rect.left;
      let top = rect.bottom + 4;

      // Shift left if menu would overflow right edge
      if (left + menuWidth > viewportWidth - 8) {
        left = viewportWidth - menuWidth - 8;
      }
      // Clamp left if still too far left
      if (left < 8) left = 8;

      // If not enough space below, open above the button
      if (top + menuHeight > viewportHeight - 8) {
        top = rect.top - menuHeight - 4;
        if (top < 8) top = 8;
      }

      setMenuPos({ top, left });
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
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-1 w-52 z-[99999]"
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
            disabled={confirmingPid === row.pid}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirmingPid === row.pid ? (
              <>
                <svg className="animate-spin w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-gray-500">Memproses...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" /> Konfirmasi
              </>
            )}
          </button>
        </>
      )}
      {row.status_transaksi === 'confirmed' && (
        <>
          <button
            onClick={() => { setIsOpen(false); navigate(`/rph/penjualan-sapi-utuh/pengiriman/${row.pid}`); }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 flex items-center gap-2 transition"
          >
            <Truck className="w-4 h-4 text-orange-500" /> Pengiriman
          </button>
          {Number(row.sisa_pembayaran || 0) > 0 && (
            <button
              onClick={() => { setIsOpen(false); navigate(`/rph/keuangan/penerimaan/bayar/${row.pid}`); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 flex items-center gap-2 transition"
            >
              <Banknote className="w-4 h-4 text-emerald-500" /> Bayar
            </button>
          )}
          <button
            onClick={() => { setIsOpen(false); handlePrintFaktur(row); }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 flex items-center gap-2 transition"
          >
            <FileText className="w-4 h-4 text-indigo-500" /> Faktur
          </button>
          <button
            onClick={() => { setIsOpen(false); handlePrintInvoice(row); }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 flex items-center gap-2 transition"
          >
            <Receipt className="w-4 h-4 text-violet-500" /> Invoice
          </button>
          <button
            onClick={() => { setIsOpen(false); handlePrintSuratJalan(row); }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 flex items-center gap-2 transition"
          >
            <Truck className="w-4 h-4 text-teal-500" /> Surat Jalan
          </button>
          <button
            onClick={() => { setIsOpen(false); handleReturnClick(row); }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2 transition"
          >
            <RotateCcw className="w-4 h-4 text-red-500" /> Return
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

// Emerald-themed filter select wrapper
const FilterSelect = ({ options, value, onChange, placeholder, className = '' }) => {
  const emeraldStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '42px',
      borderColor: state.isFocused ? '#10b981' : '#e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(16, 185, 129, 0.15)' : 'none',
      borderRadius: '0.75rem',
      backgroundColor: '#ffffff',
      '&:hover': {
        borderColor: state.isFocused ? '#10b981' : '#d1d5db',
      },
      fontSize: '14px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#10b981'
        : state.isFocused
        ? '#d1fae5'
        : 'white',
      color: state.isSelected ? 'white' : '#374151',
      fontSize: '14px',
      '&:active': {
        backgroundColor: state.isSelected ? '#10b981' : '#a7f3d0',
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '14px',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#374151',
      fontSize: '14px',
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      backgroundColor: '#e5e7eb',
    }),
    dropdownIndicator: (provided, state) => ({
      ...provided,
      color: state.isFocused ? '#10b981' : '#9ca3af',
      '&:hover': {
        color: '#10b981',
      },
    }),
    clearIndicator: (provided, state) => ({
      ...provided,
      color: state.isFocused ? '#10b981' : '#9ca3af',
      '&:hover': {
        color: '#10b981',
      },
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      borderRadius: '0.75rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
    }),
  };
  return (
    <div className={className}>
      <SearchableSelect
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isClearable={true}
        isSearchable={false}
        styles={emeraldStyles}
        className="text-sm"
      />
    </div>
  );
};

const PenjualanSapiUtuhPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmingPid, setConfirmingPid] = useState(null);
  const [soldCattlePopup, setSoldCattlePopup] = useState(null);
  const [notification, setNotification] = useState({ isVisible: false, type: 'info', message: '' });
  const [tableData, setTableData] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [rowExpanded, setRowExpanded] = useState({});

  // Advanced filter states
  const [noTransaksiFilter, setNoTransaksiFilter] = useState('');
  const [tipePengirimanFilter, setTipePengirimanFilter] = useState('');
  const [statusPengirimanFilter, setStatusPengirimanFilter] = useState('');
  const [returnStatusFilter, setReturnStatusFilter] = useState('');
  const [statusBayarFilter, setStatusBayarFilter] = useState('');
  const [picFilter, setPicFilter] = useState('');

  // Section visibility states
  const [statsExpanded, setStatsExpanded] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const { loading, error, fetchData, remove, confirm, cancel, printFaktur, printInvoice, printSuratJalan } = usePenjualanSapiUtuh();

  const loadData = useCallback(async () => {
    const params = { length: 1000 };
    if (statusFilter) params.status_transaksi = statusFilter;
    if (statusBayarFilter) params.status_pembayaran = statusBayarFilter;
    if (tipePengirimanFilter) params.pengiriman = tipePengirimanFilter;
    if (statusPengirimanFilter) params.status_pengiriman = statusPengirimanFilter;
    if (returnStatusFilter) params.return_status = returnStatusFilter;
    if (noTransaksiFilter) params.no_transaksi = noTransaksiFilter;
    if (picFilter) params.pic = picFilter;
    if (searchTerm) params.search = searchTerm;
    const result = await fetchData(params);
    if (result.success && result.data) {
      setTableData(result.data);
    }
  }, [fetchData, statusFilter, statusBayarFilter, tipePengirimanFilter, statusPengirimanFilter, returnStatusFilter, noTransaksiFilter, picFilter, searchTerm]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setConfirmingPid(item.pid);
    try {
      const result = await confirm(item.pid);
      if (result.success) {
        const soldCattle = result.data?.sold_cattle || [];
        const eartagList = result.data?.eartag_list || [];
        const totalSold = result.data?.total_sold || soldCattle.length;

        if (totalSold > 0) {
          setSoldCattlePopup({
            no_transaksi: item.no_transaksi,
            total_sold: totalSold,
            eartag_list: eartagList,
            sold_cattle: soldCattle,
          });
        } else {
          showNotif('success', result.message || 'Transaksi berhasil dikonfirmasi');
        }
        loadData();
      } else {
        showNotif('error', result.message || 'Gagal mengkonfirmasi transaksi');
      }
    } catch (err) {
      showNotif('error', err?.message || 'Gagal mengkonfirmasi transaksi');
    } finally {
      setConfirmingPid(null);
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

  const handlePrintFaktur = useCallback(async (item) => {
    showNotif('info', 'Memproses faktur penjualan...');
    const result = await printFaktur(item.pid);
    if (result.success) {
      const url = window.URL.createObjectURL(result.data); const link = document.createElement('a'); link.href = url; link.download = `Faktur_${item.no_transaksi || item.pid}.pdf`; link.click(); window.URL.revokeObjectURL(url);
      showNotif('success', 'Faktur berhasil diunduh');
    } else {
      showNotif('error', result.message || 'Gagal memuat data faktur');
    }
  }, [printFaktur, showNotif]);

  const handlePrintInvoice = useCallback(async (item) => {
    showNotif('info', 'Memproses invoice penjualan...');
    const result = await printInvoice(item.pid);
    if (result.success) {
      const url = window.URL.createObjectURL(result.data); const link = document.createElement('a'); link.href = url; link.download = `Invoice_${item.no_transaksi || item.pid}.pdf`; link.click(); window.URL.revokeObjectURL(url);
      showNotif('success', 'Invoice berhasil diunduh');
    } else {
      showNotif('error', result.message || 'Gagal memuat data invoice');
    }
  }, [printInvoice, showNotif]);

  const handlePrintSuratJalan = useCallback(async (item) => {
    showNotif('info', 'Memproses surat jalan...');
    const result = await printSuratJalan(item.pid);
    if (result.success) {
      const url = window.URL.createObjectURL(result.data); const link = document.createElement('a'); link.href = url; link.download = `Surat_Jalan_${item.no_transaksi || item.pid}.pdf`; link.click(); window.URL.revokeObjectURL(url);
      showNotif('success', 'Surat jalan berhasil diunduh');
    } else {
      showNotif('error', result.message || 'Gagal memuat data surat jalan');
    }
  }, [printSuratJalan, showNotif]);

  const handleReturnClick = useCallback((row) => {
    navigate(`/rph/penjualan-sapi-utuh/return/${row.pid}`);
  }, [navigate]);

  const columns = useMemo(() => [
    {
      name: '',
      center: true,
      width: '40px',
      cell: (row) => (
        <div className="flex items-center justify-center">
          {rowExpanded[row.pid] ? (
            <ChevronUp className="w-4 h-4 text-emerald-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      ),
    },
    {
      name: '',
      center: true,
      width: '56px',
      cell: (row) => (
        <ActionMenuCell
          row={row}
          setDeleteData={setDeleteData}
          handleConfirm={handleConfirm}
          handleCancel={handleCancel}
          handlePrintFaktur={handlePrintFaktur}
          handlePrintInvoice={handlePrintInvoice}
          handlePrintSuratJalan={handlePrintSuratJalan}
          handleReturnClick={handleReturnClick}
          confirmingPid={confirmingPid}
        />
      ),
    },
    {
      name: 'Transaksi',
      selector: (row) => row.no_transaksi,
      sortable: true,
      minWidth: '220px',
      cell: (row) => {
        const isShipping = row.pengiriman === 'dikirim' || row.pengiriman === 'dipotong_rph_dikirim';
        const today = new Date().toISOString().split('T')[0];
        const isFailedDelivery = isShipping && row.tanggal_diterima && row.tanggal_diterima < today && row.status_pengiriman !== 'sudah_diterima';
        const isCredit = row.jenis_transaksi === 'kredit' || row.tipe_penjualan === 'kredit';
        const dueDate = row.jangka_waktu;
        const daysUntilDue = dueDate ? Math.ceil((new Date(dueDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)) : null;
        const isDueSoon = isCredit && dueDate && (daysUntilDue <= 5) && (row.sisa_pembayaran > 0);

        const tipeConfig = {
          dikirim: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', label: 'Dikirim' },
          dipotong_rph_dikirim: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', label: 'Dipotong RPH & Dikirim' },
          dipotong_rph_diambil: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', label: 'Dipotong RPH & Diambil' },
          diambil: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', label: 'Diambil' },
          belum_diketahui: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', label: 'Belum Diketahui' },
        };
        const statusConfig = {
          belum_berangkat: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: <Bell className="w-3 h-3" />, label: 'Belum Berangkat' },
          sudah_berangkat: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100', icon: <Truck className="w-3 h-3" />, label: 'Sudah Berangkat' },
          sudah_diterima: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: <CheckCircle className="w-3 h-3" />, label: 'Sudah Diterima' },
          return: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', icon: <XCircle className="w-3 h-3" />, label: 'Return' },
        };
        const tipe = tipeConfig[row.pengiriman] || tipeConfig.belum_diketahui;
        const status = isShipping ? (statusConfig[row.status_pengiriman] || statusConfig.belum_berangkat) : null;

        return (
          <div className="flex items-center gap-3 py-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
              {(row.pic || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-block bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide border border-indigo-100">
                  {row.no_transaksi}
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${tipe.bg} ${tipe.text} ${tipe.border}`} title="Tipe Pengiriman">
                  {tipe.label}
                </span>
                {status && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${status.bg} ${status.text} ${status.border}`} title="Status Pengiriman">
                    {status.icon} {status.label}
                  </span>
                )}
                {isFailedDelivery && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-md border border-red-100">
                    <AlertTriangle className="w-3 h-3" /> Gagal Kirim
                  </span>
                )}
                {row.return_status === 'partial' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md border border-orange-100" title={`Return sebagian: ${row.returned_ekor} dari ${row.total_ekor} sapi`}>
                    <RotateCcw className="w-3 h-3" /> Return Sebagian ({row.returned_ekor}/{row.total_ekor})
                  </span>
                )}
                {row.return_status === 'full' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-md border border-red-100" title={`Return penuh: ${row.returned_ekor} dari ${row.total_ekor} sapi`}>
                    <RotateCcw className="w-3 h-3" /> Return Penuh ({row.returned_ekor}/{row.total_ekor})
                  </span>
                )}
                {isDueSoon && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-md border border-red-100"
                    title={`Jatuh tempo ${daysUntilDue <= 0 ? 'hari ini' : `${daysUntilDue} hari lagi`} (${dueDate})`}
                  >
                    <AlertTriangle className="w-3 h-3" /> {daysUntilDue <= 0 ? 'Jatuh Tempo' : 'Harus Lunas'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{row.tanggal_transaksi}</span>
                <span className="text-gray-300 mx-1">·</span>
                <User className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{row.pic || '-'}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      name: 'RPH',
      selector: (row) => row.nama_rph,
      sortable: true,
      minWidth: '150px',
      cell: (row) => <span className="text-sm font-medium text-gray-700">{row.nama_rph || '-'}</span>,
    },
    {
      name: 'Jenis',
      selector: (row) => row.jenis_transaksi,
      sortable: true,
      width: '85px',
      center: true,
      cell: (row) => {
        const j = {
          qurban: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'Qurban' },
          sapi_utuh: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', label: 'Utuh' },
        };
        const c = j[row.jenis_transaksi] || j.sapi_utuh;
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${c.bg} ${c.text} border ${c.border}`}>
            {c.label}
          </span>
        );
      },
    },
    {
      name: 'Pihak',
      selector: (row) => row.nama_pembeli,
      sortable: true,
      minWidth: '180px',
      cell: (row) => {
        const penjualLabels = { cv_puput: 'CV Puput', reseller: 'Reseller' };
        return (
          <div className="py-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-800 truncate">{row.nama_pembeli || '-'}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              {row.reseller ? (
                <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 truncate max-w-[120px]">
                  {row.reseller.nama}
                </span>
              ) : (
                <span className="text-[11px] text-gray-300 italic">—</span>
              )}
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
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
      name: 'Total',
      selector: (row) => (row.total_harga || 0) + (row.biaya_kirim || 0) + (row.biaya_potong || 0),
      sortable: true,
      minWidth: '150px',
      right: true,
      cell: (row) => {
        const grandTotal = (row.total_harga || 0) + (row.biaya_kirim || 0) + (row.biaya_potong || 0);
        return (
          <div className="text-right py-1">
            <div className="text-base font-bold text-gray-900">Rp {grandTotal.toLocaleString('id-ID')}</div>
            <div className="flex items-center justify-end gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-100">
                <Beef className="w-3 h-3" />
                {row.jumlah_ekor || 0} Ekor
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-[10px] text-gray-400">
                Sisa <span className={`font-semibold ${(row.sisa_pembayaran || 0) > 0 ? 'text-red-500' : 'text-emerald-600'}`}>Rp {(row.sisa_pembayaran || 0).toLocaleString('id-ID')}</span>
              </span>
            </div>
          </div>
        );
      },
    },
    {
      name: 'Pembayaran',
      selector: (row) => (row.status_pembayaran === 'lunas' || Number(row.sisa_pembayaran || 0) === 0 ? 'lunas' : 'belum'),
      sortable: true,
      width: '140px',
      center: true,
      cell: (row) => {
        const isPaid = row.status_pembayaran === 'lunas' || Number(row.sisa_pembayaran || 0) === 0;
        return (
          <div className="flex flex-col items-center gap-1 py-1">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
              isPaid
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {isPaid ? 'Sudah Lunas' : 'Belum Lunas'}
            </span>
            <span className="text-[10px] text-gray-400">
              {isPaid ? 'Tidak ada sisa' : `Sisa Rp ${(row.sisa_pembayaran || 0).toLocaleString('id-ID')}`}
            </span>
          </div>
        );
      },
    },
    {
      name: 'Status',
      selector: (row) => row.status_transaksi,
      sortable: true,
      width: '140px',
      center: true,
      cell: (row) => {
        const txConfigs = {
          draft: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-400', label: 'Draft' },
          confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-400', label: 'Confirmed' },
          cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-400', label: 'Batal' },
          returned: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', dot: 'bg-orange-400', label: 'Returned' },
        };
        const tx = txConfigs[row.status_transaksi] || txConfigs.draft;
        return (
          <div className="flex flex-col items-center gap-1 py-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.bg} ${tx.text} border ${tx.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${tx.dot}`} />
              {tx.label}
            </span>
          </div>
        );
      },
    },
  ], [handleConfirm, handleCancel, handlePrintFaktur, handlePrintInvoice, handlePrintSuratJalan, handleReturnClick, rowExpanded, confirmingPid]);

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
        minHeight: '56px',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: '#F8FAFC',
        },
      },
    },
    cells: {
      style: {
        padding: '10px 16px',
      },
    },
    expandableRows: {
      style: {
        backgroundColor: '#F8FAFC',
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

  const stats = useMemo(() => {
    const shippingRows = tableData.filter(r => r.pengiriman === 'dikirim' || r.pengiriman === 'dipotong_rph_dikirim');
    return {
      total: tableData.length,
      draft: tableData.filter(r => r.status_transaksi === 'draft').length,
      confirmed: tableData.filter(r => r.status_transaksi === 'confirmed').length,
      shippingTotal: shippingRows.length,
      belumBerangkat: shippingRows.filter(r => r.status_pengiriman === 'belum_berangkat').length,
      sudahBerangkat: shippingRows.filter(r => r.status_pengiriman === 'sudah_berangkat').length,
      sudahDiterima: shippingRows.filter(r => r.status_pengiriman === 'sudah_diterima').length,
      returnCount: shippingRows.filter(r => r.status_pengiriman === 'return').length,
    };
  }, [tableData]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Penjualan Sapi Utuh</h1>
            <p className="text-gray-500 text-sm mt-0.5">Kelola transaksi penjualan sapi utuh ke reseller</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/rph/penjualan-sapi-utuh/return-history')}
              className="inline-flex items-center gap-2 bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 px-4 py-2.5 rounded-xl font-medium transition shadow-sm"
              title="Lihat riwayat semua return"
            >
              <RotateCcw className="w-5 h-5" />
              Riwayat Return
            </button>
            <button
              onClick={() => navigate('/rph/penjualan-sapi-utuh/add')}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-sm hover:shadow-md"
            >
              <PlusCircle className="w-5 h-5" />
              Tambah Penjualan
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">Ringkasan Transaksi</h3>
                <p className="text-xs text-gray-500">{stats.total} total transaksi</p>
              </div>
            </div>
            <button
              onClick={() => setStatsExpanded((v) => !v)}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
              title={statsExpanded ? 'Sembunyikan ringkasan' : 'Tampilkan ringkasan'}
            >
              {statsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${statsExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Total Transaksi</p>
                    <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Draft</p>
                    <p className="text-xl font-bold text-gray-900">{stats.draft}</p>
                  </div>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Confirmed</p>
                    <p className="text-xl font-bold text-gray-900">{stats.confirmed}</p>
                  </div>
                </div>
                <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Pengiriman</p>
                      <p className="text-xl font-bold text-gray-900">{stats.shippingTotal}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {stats.belumBerangkat} Belum
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> {stats.sudahBerangkat} Berangkat
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {stats.sudahDiterima} Diterima
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {stats.returnCount} Return
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 to-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Filter className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Filter Pencarian</h3>
                  <p className="text-xs text-gray-500">Sesuaikan data yang ingin ditampilkan</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadData}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition shadow-sm hover:shadow-md"
                >
                  <Search className="w-4 h-4" /> Cari
                </button>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setNoTransaksiFilter('');
                    setTipePengirimanFilter('');
                    setStatusPengirimanFilter('');
                    setReturnStatusFilter('');
                    setStatusFilter('');
                    setStatusBayarFilter('');
                    setPicFilter('');
                    setTimeout(() => loadData(), 0);
                  }}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-medium text-sm transition"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
                <button
                  onClick={() => setFiltersExpanded((v) => !v)}
                  className="p-2.5 hover:bg-emerald-100/50 rounded-xl transition text-emerald-600 border border-emerald-200"
                  title={filtersExpanded ? 'Sembunyikan filter' : 'Tampilkan filter'}
                >
                  {filtersExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${filtersExpanded ? 'max-h-[600px] opacity-100 mt-0' : 'max-h-0 opacity-0 mt-0'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                  <Search className="w-3 h-3" /> Pencarian Umum
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari no transaksi, reseller, pembeli, PIC..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadData()}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">No. Transaksi</label>
                <input
                  type="text"
                  placeholder="No. Transaksi..."
                  value={noTransaksiFilter}
                  onChange={(e) => setNoTransaksiFilter(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadData()}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">PIC</label>
                <input
                  type="text"
                  placeholder="PIC..."
                  value={picFilter}
                  onChange={(e) => setPicFilter(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadData()}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Tipe Pengiriman</label>
                <FilterSelect
                  options={TIPE_PENGIRIMAN_FILTER_OPTIONS}
                  value={tipePengirimanFilter}
                  onChange={(val) => setTipePengirimanFilter(val || '')}
                  placeholder="Pilih tipe"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Status Pengiriman</label>
                <FilterSelect
                  options={STATUS_PENGIRIMAN_FILTER_OPTIONS}
                  value={statusPengirimanFilter}
                  onChange={(val) => setStatusPengirimanFilter(val || '')}
                  placeholder="Pilih status"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Status Return</label>
                <FilterSelect
                  options={RETURN_STATUS_FILTER_OPTIONS}
                  value={returnStatusFilter}
                  onChange={(val) => setReturnStatusFilter(val || '')}
                  placeholder="Pilih status return"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Status Transaksi</label>
                <FilterSelect
                  options={STATUS_TRANSAKSI_FILTER_OPTIONS}
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val || '')}
                  placeholder="Pilih status"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Status Bayar</label>
                <FilterSelect
                  options={STATUS_BAYAR_FILTER_OPTIONS}
                  value={statusBayarFilter}
                  onChange={(val) => setStatusBayarFilter(val || '')}
                  placeholder="Pilih status"
                />
              </div>
            </div>

            {(searchTerm || noTransaksiFilter || tipePengirimanFilter || statusPengirimanFilter || returnStatusFilter || statusFilter || statusBayarFilter || picFilter) && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Filter aktif:</span>
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                    Pencarian: {searchTerm}
                    <button onClick={() => setSearchTerm('')} className="hover:text-emerald-900"><XCircle className="w-3 h-3" /></button>
                  </span>
                )}
                {noTransaksiFilter && (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                    No. Transaksi: {noTransaksiFilter}
                    <button onClick={() => setNoTransaksiFilter('')} className="hover:text-emerald-900"><XCircle className="w-3 h-3" /></button>
                  </span>
                )}
                {tipePengirimanFilter && (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                    Tipe: {TIPE_PENGIRIMAN_FILTER_OPTIONS.find(o => o.value === tipePengirimanFilter)?.label}
                    <button onClick={() => setTipePengirimanFilter('')} className="hover:text-emerald-900"><XCircle className="w-3 h-3" /></button>
                  </span>
                )}
                {statusPengirimanFilter && (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                    Pengiriman: {STATUS_PENGIRIMAN_FILTER_OPTIONS.find(o => o.value === statusPengirimanFilter)?.label}
                    <button onClick={() => setStatusPengirimanFilter('')} className="hover:text-emerald-900"><XCircle className="w-3 h-3" /></button>
                  </span>
                )}
                {returnStatusFilter && (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                    Return: {RETURN_STATUS_FILTER_OPTIONS.find(o => o.value === returnStatusFilter)?.label}
                    <button onClick={() => setReturnStatusFilter('')} className="hover:text-emerald-900"><XCircle className="w-3 h-3" /></button>
                  </span>
                )}
                {statusFilter && (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                    Status: {STATUS_TRANSAKSI_FILTER_OPTIONS.find(o => o.value === statusFilter)?.label}
                    <button onClick={() => setStatusFilter('')} className="hover:text-emerald-900"><XCircle className="w-3 h-3" /></button>
                  </span>
                )}
                {statusBayarFilter && (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                    Bayar: {STATUS_BAYAR_FILTER_OPTIONS.find(o => o.value === statusBayarFilter)?.label}
                    <button onClick={() => setStatusBayarFilter('')} className="hover:text-emerald-900"><XCircle className="w-3 h-3" /></button>
                  </span>
                )}
                {picFilter && (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                    PIC: {picFilter}
                    <button onClick={() => setPicFilter('')} className="hover:text-emerald-900"><XCircle className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}
            </div>
          </div>

          {error && (
            <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <DataTable
            columns={columns}
            data={tableData}
            progressPending={loading}
            pagination
            paginationPerPage={15}
            paginationRowsPerPageOptions={[10, 15, 25, 50]}
            highlightOnHover
            responsive
            expandableRows
            expandableRowsComponent={({ data }) => <ExpandableRow data={data} />}
            expandOnRowClicked
            expandableRowExpanded={(row) => rowExpanded[row.pid]}
            onRowExpandToggled={(expanded, row) => {
              setRowExpanded((prev) => ({ ...prev, [row.pid]: expanded }));
            }}
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

      {soldCattlePopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Transaksi Dikonfirmasi</h3>
                  <p className="text-emerald-50 text-sm">{soldCattlePopup.no_transaksi}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-emerald-800 leading-relaxed">
                  <span className="font-bold text-emerald-900">{soldCattlePopup.total_sold} sapi</span> telah terjual dan tidak lagi tersedia di stok.
                </p>
              </div>

              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Daftar Sapi Terjual</p>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {soldCattlePopup.sold_cattle.map((cattle, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Beef className="w-4 h-4 text-emerald-600" />
                          </div>
                          <p className="text-sm font-bold text-gray-800">
                            {cattle.eartag_display || cattle.eartag_asli || cattle.no_eartag || '-'}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-gray-500">{cattle.berat} kg</span>
                      </div>
                      <div className="ml-10 flex flex-wrap items-center gap-1.5">
                        {cattle.code_eartag && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 text-[10px] font-mono">
                            <Hash className="w-2.5 h-2.5" />{cattle.code_eartag}
                          </span>
                        )}
                        {cattle.eartag_asli && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-mono">
                            <Tag className="w-2.5 h-2.5" />{cattle.eartag_asli}
                          </span>
                        )}
                        {cattle.eartag_supplier && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-mono">
                            <Package className="w-2.5 h-2.5" />{cattle.eartag_supplier}
                          </span>
                        )}
                        {cattle.merk && (
                          <span className="text-[10px] text-gray-500">{cattle.merk}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSoldCattlePopup(null)}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-2.5 rounded-xl transition shadow-sm"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenjualanSapiUtuhPage;
