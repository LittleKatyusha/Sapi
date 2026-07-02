import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import {
  Truck, PlusCircle, Search, ChevronUp, ChevronDown,
  RotateCcw, Filter, XCircle, Beef, Calendar, MapPin, Package, Tag,
  ArrowRight, AlertCircle, Scale, Wallet,
} from 'lucide-react';

import useDocumentTitle from '../../../hooks/useDocumentTitle';
import perpindahanTernakService from '../../../services/perpindahanTernakService';
import SearchableSelect from '../../../components/shared/SearchableSelect';
import { useNotification } from '../../../components/shared/Notification';
import ActionButton from './components/ActionButton';

const GOLONGAN_OPTIONS = [
  { value: '1', label: 'Boning' },
  { value: '2', label: 'Karkas' },
  { value: '3', label: 'Qurban' },
];

const PINDAH_GOLONGAN_OPTIONS = [
  { value: '1', label: 'Ya, Pindah Golongan' },
  { value: '0', label: 'Tetap' },
];

const blueStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '42px',
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none',
    borderRadius: '0.75rem',
    backgroundColor: '#ffffff',
    '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#d1d5db' },
    fontSize: '14px',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#dbeafe' : 'white',
    color: state.isSelected ? 'white' : '#374151',
    fontSize: '14px',
    '&:active': { backgroundColor: state.isSelected ? '#3b82f6' : '#bfdbfe' },
  }),
  placeholder: (provided) => ({ ...provided, color: '#9ca3af', fontSize: '14px' }),
  singleValue: (provided) => ({ ...provided, color: '#374151', fontSize: '14px' }),
  indicatorSeparator: (provided) => ({ ...provided, backgroundColor: '#e5e7eb' }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? '#3b82f6' : '#9ca3af',
    '&:hover': { color: '#3b82f6' },
  }),
  clearIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? '#3b82f6' : '#9ca3af',
    '&:hover': { color: '#3b82f6' },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    borderRadius: '0.75rem',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  }),
};

const FilterSelect = ({ options, value, onChange, placeholder }) => (
  <SearchableSelect
    options={options}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    isClearable
    isSearchable={false}
    styles={blueStyles}
    className="text-sm"
  />
);

const PerpindahanTernakPage = () => {
  useDocumentTitle('Perpindahan Ternak');
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useNotification();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);

  // Pagination & search
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [filterPindahGolongan, setFilterPindahGolongan] = useState('');
  const [filterGolonganTujuan, setFilterGolonganTujuan] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [statsExpanded, setStatsExpanded] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        start: (currentPage - 1) * pageSize,
        length: pageSize,
        draw: currentPage,
        search: { value: searchQuery },
      };
      if (filterPindahGolongan !== '') params.is_pindah_golongan = filterPindahGolongan;
      if (filterGolonganTujuan !== '') params.golongan_tujuan = filterGolonganTujuan;

      const response = await perpindahanTernakService.getData(params);
      if (response.success) {
        setData(response.data?.data || []);
        setTotalRecords(response.data?.recordsFiltered || response.data?.recordsTotal || 0);
      } else {
        setError(response.message);
        setData([]);
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat mengambil data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, filterPindahGolongan, filterGolonganTujuan]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    fetchData();
  }, [fetchData]);

  const handleReset = useCallback(() => {
    setSearchQuery('');
    setFilterPindahGolongan('');
    setFilterGolonganTujuan('');
    setCurrentPage(1);
    setTimeout(() => fetchData(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  const handleAdd = useCallback(() => {
    navigate('/rph/perpindahan-ternak/tambah');
  }, [navigate]);

  const handleEdit = useCallback((row) => {
    setOpenMenuId(null);
    navigate(`/rph/perpindahan-ternak/edit/${row.pubid}`);
  }, [navigate]);

  const handleDelete = useCallback(async (row) => {
    setOpenMenuId(null);
    if (!window.confirm('Yakin ingin menghapus data perpindahan ternak ini?')) return;
    try {
      const response = await perpindahanTernakService.delete(row.pubid);
      if (response.success) {
        showSuccess(response.message || 'Data perpindahan ternak berhasil dihapus');
        fetchData();
      } else {
        showError(response.message || 'Gagal menghapus data');
      }
    } catch (err) {
      showError(err?.message || 'Gagal menghapus data');
    }
  }, [fetchData, showSuccess, showError]);

  const handleSuratJalan = useCallback((row) => {
    setOpenMenuId(null);
    showInfo(`Mencetak Surat Jalan untuk perpindahan ${row.lokasi_asal} → ${row.lokasi_tujuan}`);
    // TODO: implement actual print/export
  }, [showInfo]);

  const handleKwitansi = useCallback((row) => {
    setOpenMenuId(null);
    showInfo(`Mencetak Kwitansi Pengiriman untuk perpindahan ${row.lokasi_asal} → ${row.lokasi_tujuan}`);
    // TODO: implement actual print/export
  }, [showInfo]);

  const handleSsth = useCallback((row) => {
    setOpenMenuId(null);
    showInfo(`Mencetak SSTH untuk perpindahan ${row.lokasi_asal} → ${row.lokasi_tujuan}`);
    // TODO: implement actual print/export
  }, [showInfo]);

  const formatCurrency = (value) => {
    if (!value) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(value);
  };

  const stats = useMemo(() => {
    const totalEkor = data.reduce((s, r) => s + (Number(r.jumlah_ekor) || 0), 0);
    const totalBobot = data.reduce((s, r) => s + (Number(r.total_bobot) || 0), 0);
    const totalBiayaKirim = data.reduce((s, r) => s + (Number(r.biaya_kirim) || 0), 0);
    const pindahGolongan = data.filter((r) => Number(r.is_pindah_golongan) === 1).length;
    return {
      total: totalRecords,
      totalEkor,
      totalBobot: totalBobot.toFixed(1),
      totalBiayaKirim,
      pindahGolongan,
      tetap: Math.max(0, data.length - pindahGolongan),
    };
  }, [data, totalRecords]);

  const columns = useMemo(() => [
    {
      name: 'Tanggal',
      selector: (row) => row.tanggal_perpindahan,
      sortable: true,
      minWidth: '130px',
      cell: (row) => (
        <div className="flex items-center gap-2 py-1">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm font-medium text-gray-700">
            {new Date(row.tanggal_perpindahan).toLocaleDateString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </div>
        </div>
      ),
    },
    {
      name: 'Rute Perpindahan',
      selector: (row) => `${row.lokasi_asal}-${row.lokasi_tujuan}`,
      sortable: true,
      minWidth: '280px',
      cell: (row) => (
        <div className="py-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <MapPin className="w-3 h-3 text-slate-500" /> {row.lokasi_asal || '-'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 px-2 py-1 rounded-lg">
              <MapPin className="w-3 h-3" /> {row.lokasi_tujuan || '-'}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
            <Tag className="w-3 h-3" /> {row.alasan_perpindahan || '-'}
          </div>
        </div>
      ),
    },
    {
      name: 'Golongan',
      selector: (row) => row.is_pindah_golongan,
      sortable: true,
      width: '140px',
      center: true,
      cell: (row) => (
        Number(row.is_pindah_golongan) === 1 ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {row.golongan_tujuan_label || 'Pindah'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Tetap
          </span>
        )
      ),
    },
    {
      name: 'Jumlah',
      selector: (row) => Number(row.jumlah_ekor) || 0,
      sortable: true,
      width: '110px',
      center: true,
      cell: (row) => (
        <div className="flex flex-col items-center gap-0.5">
          <span className="inline-flex items-center gap-1 text-sm font-bold text-gray-800">
            <Beef className="w-4 h-4 text-blue-500" />
            {row.jumlah_ekor || 0}
          </span>
          <span className="text-[10px] text-gray-400">ekor</span>
        </div>
      ),
    },
    {
      name: 'Bobot Total',
      selector: (row) => Number(row.total_bobot) || 0,
      sortable: true,
      width: '120px',
      right: true,
      cell: (row) => (
        <div className="text-right">
          <div className="text-sm font-bold text-gray-800 flex items-center justify-end gap-1">
            <Scale className="w-3.5 h-3.5 text-slate-400" />
            {Number(row.total_bobot || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-gray-400">kg</div>
        </div>
      ),
    },
    {
      name: 'Armada',
      selector: (row) => row.armada_pengiriman,
      sortable: true,
      minWidth: '160px',
      cell: (row) => (
        <div className="py-1">
          <div className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-slate-400" />
            {row.armada_pengiriman || '-'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {row.plat_nomor ? (
              <span className="inline-block bg-slate-50 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-200">{row.plat_nomor}</span>
            ) : '-'}
            {row.sopir && <span className="ml-1.5 text-gray-500">· {row.sopir}</span>}
          </div>
        </div>
      ),
    },
    {
      name: 'Biaya Kirim',
      selector: (row) => Number(row.biaya_kirim) || 0,
      sortable: true,
      width: '140px',
      right: true,
      cell: (row) => (
        <div className="text-right">
          <div className="text-sm font-bold text-gray-800 flex items-center justify-end gap-1">
            <Wallet className="w-3.5 h-3.5 text-emerald-500" />
            {formatCurrency(row.biaya_kirim)}
          </div>
        </div>
      ),
    },
    {
      name: 'Aksi',
      center: true,
      width: '70px',
      cell: (row) => (
        <ActionButton
          row={row}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSuratJalan={handleSuratJalan}
          onKwitansi={handleKwitansi}
          onSsth={handleSsth}
          isActive={openMenuId === row.pubid}
        />
      ),
    },
  ], [handleEdit, handleDelete, handleSuratJalan, handleKwitansi, handleSsth, openMenuId]);

  const customTableStyles = {
    table: { style: { borderRadius: '16px', overflow: 'hidden' } },
    headRow: {
      style: {
        backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0',
        fontSize: '12px', fontWeight: '700', color: '#64748B',
        textTransform: 'uppercase', letterSpacing: '0.5px', minHeight: '48px',
      },
    },
    headCells: { style: { padding: '12px 16px' } },
    rows: {
      style: {
        fontSize: '14px', backgroundColor: '#ffffff', minHeight: '56px',
        cursor: 'pointer', '&:hover': { backgroundColor: '#F8FAFC' },
      },
    },
    cells: { style: { padding: '10px 16px' } },
    pagination: {
      style: {
        borderTop: '1px solid #E2E8F0', padding: '12px 16px',
        fontSize: '13px', color: '#64748B',
      },
    },
  };

  const hasActiveFilter = searchQuery || filterPindahGolongan !== '' || filterGolonganTujuan !== '';

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Perpindahan Ternak</h1>
            <p className="text-gray-500 text-sm mt-0.5">Kelola perpindahan ternak antar lokasi/RPH</p>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-sm hover:shadow-md"
          >
            <PlusCircle className="w-5 h-5" />
            Tambah Perpindahan
          </button>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Truck className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">Ringkasan Perpindahan</h3>
                <p className="text-xs text-gray-500">{stats.total} total transaksi</p>
              </div>
            </div>
            <button
              onClick={() => setStatsExpanded((v) => !v)}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
              title={statsExpanded ? 'Sembunyikan' : 'Tampilkan'}
            >
              {statsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${statsExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Total Transaksi</p>
                    <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Beef className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Total Ekor Dipindah</p>
                    <p className="text-xl font-bold text-gray-900">{stats.totalEkor}</p>
                  </div>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Total Bobot</p>
                    <p className="text-xl font-bold text-gray-900">{stats.totalBobot} <span className="text-sm font-medium text-gray-500">kg</span></p>
                  </div>
                </div>
                <div className="bg-violet-50/50 p-4 rounded-xl border border-violet-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Pindah Golongan</p>
                      <p className="text-xl font-bold text-gray-900">{stats.pindahGolongan}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {stats.pindahGolongan} Pindah
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> {stats.tetap} Tetap
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Filter className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Filter Pencarian</h3>
                  <p className="text-xs text-gray-500">Sesuaikan data yang ingin ditampilkan</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSearch}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition shadow-sm hover:shadow-md"
                >
                  <Search className="w-4 h-4" /> Cari
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-medium text-sm transition"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
                <button
                  onClick={() => setFiltersExpanded((v) => !v)}
                  className="p-2.5 hover:bg-blue-100/50 rounded-xl transition text-blue-600 border border-blue-200"
                  title={filtersExpanded ? 'Sembunyikan filter' : 'Tampilkan filter'}
                >
                  {filtersExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${filtersExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                    <Search className="w-3 h-3" /> Pencarian Umum
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari lokasi, plat nomor, sopir..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Pindah Golongan</label>
                  <FilterSelect
                    options={PINDAH_GOLONGAN_OPTIONS}
                    value={filterPindahGolongan}
                    onChange={(val) => setFilterPindahGolongan(val || '')}
                    placeholder="Semua"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Golongan Tujuan</label>
                  <FilterSelect
                    options={GOLONGAN_OPTIONS}
                    value={filterGolonganTujuan}
                    onChange={(val) => setFilterGolonganTujuan(val || '')}
                    placeholder="Semua Golongan"
                  />
                </div>
              </div>

              {hasActiveFilter && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">Filter aktif:</span>
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                      Pencarian: {searchQuery}
                      <button onClick={() => setSearchQuery('')} className="hover:text-blue-900"><XCircle className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filterPindahGolongan !== '' && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                      {PINDAH_GOLONGAN_OPTIONS.find(o => o.value === filterPindahGolongan)?.label}
                      <button onClick={() => setFilterPindahGolongan('')} className="hover:text-blue-900"><XCircle className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filterGolonganTujuan !== '' && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                      Golongan: {GOLONGAN_OPTIONS.find(o => o.value === filterGolonganTujuan)?.label}
                      <button onClick={() => setFilterGolonganTujuan('')} className="hover:text-blue-900"><XCircle className="w-3 h-3" /></button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <DataTable
            columns={columns}
            data={data}
            progressPending={loading}
            pagination
            paginationServer
            paginationTotalRows={totalRecords}
            paginationPerPage={pageSize}
            paginationRowsPerPageOptions={[10, 15, 25, 50]}
            onChangePage={(page) => setCurrentPage(page)}
            onChangeRowsPerPage={(size) => { setPageSize(size); setCurrentPage(1); }}
            highlightOnHover
            responsive
            noDataComponent={
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium">Tidak ada data perpindahan</p>
                <p className="text-gray-300 text-sm mt-1">Transaksi baru akan muncul di sini</p>
              </div>
            }
            customStyles={customTableStyles}
          />
        </div>
      </div>

    </div>
  );
};

export default PerpindahanTernakPage;
