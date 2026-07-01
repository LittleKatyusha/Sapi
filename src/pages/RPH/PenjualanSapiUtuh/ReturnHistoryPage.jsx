import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw, ArrowLeft, Search, Loader2, AlertCircle,
  SlidersHorizontal, Calendar, Weight, CircleDollarSign, Hash, X, XCircle, Tag,
} from 'lucide-react';
import HttpClient from '../../../services/httpClient';

const TIPE_RETURN_OPTIONS = [
  { value: '', label: 'Semua Tipe' },
  { value: 'PEMBELI', label: 'Pembeli' },
  { value: 'SUPPLIER', label: 'Supplier' },
  { value: 'INTERNAL', label: 'Internal' },
];

const JENIS_TRANSAKSI_OPTIONS = [
  { value: '', label: 'Semua Jenis' },
  { value: 'sapi_utuh', label: 'Sapi Utuh' },
  { value: 'qurban', label: 'Qurban' },
];

const STATUS_RETURN_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'active', label: 'Active' },
  { value: 'reverted', label: 'Reverted' },
];

const formatRupiah = (val) => {
  const num = Number(val) || 0;
  return 'Rp ' + num.toLocaleString('id-ID');
};

const ReturnHistoryPage = () => {
  const navigate = useNavigate();
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortConfig, setSortConfig] = useState({ column: 'r.tanggal_return', dir: 'desc' });

  // Filters
  const [tipeFilter, setTipeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [jenisTransaksiFilter, setJenisTransaksiFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        draw: currentPage,
        start: (currentPage - 1) * perPage,
        length: perPage,
        'search[value]': searchTerm,
        sortColumn: sortConfig.column,
        sortDir: sortConfig.dir,
      };
      if (tipeFilter) params.tipe_return = tipeFilter;
      if (statusFilter) params.status = statusFilter;
      if (jenisTransaksiFilter) params.jenis_transaksi = jenisTransaksiFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await HttpClient.get('/api/rph/return-penjualan-sapi-utuh/history', { params });
      setTableData(res?.data || []);
      setTotalRecords(res?.recordsFiltered || 0);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, sortConfig, tipeFilter, statusFilter, jenisTransaksiFilter, startDate, endDate]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 400);
    return () => clearTimeout(t);
  }, [fetchData]);

  const handleSort = (column, dir) => {
    if (column.sortField) {
      setSortConfig({ column: column.sortField, dir: dir || 'desc' });
    }
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setTipeFilter('');
    setStatusFilter('');
    setJenisTransaksiFilter('');
    setStartDate('');
    setEndDate('');
    setSearchInput('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (tipeFilter) count++;
    if (statusFilter) count++;
    if (jenisTransaksiFilter) count++;
    if (startDate) count++;
    if (endDate) count++;
    if (searchTerm) count++;
    return count;
  }, [tipeFilter, statusFilter, jenisTransaksiFilter, startDate, endDate, searchTerm]);

  const columns = [
    {
      name: 'No Return',
      sortable: true,
      sortField: 'r.no_return',
      minWidth: '160px',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
            <RotateCcw className="w-4 h-4 text-orange-600" />
          </div>
          <span className="text-sm font-mono font-semibold text-gray-800">{row.no_return || '-'}</span>
        </div>
      ),
    },
    {
      name: 'No Transaksi',
      sortable: true,
      sortField: 'p.no_transaksi',
      minWidth: '160px',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">{row.no_transaksi || '-'}</span>
          <span className="text-xs text-gray-400">{row.tanggal_transaksi || '-'}</span>
        </div>
      ),
    },
    {
      name: 'Eartag Sistem',
      sortable: false,
      minWidth: '180px',
      cell: (row) => {
        const tags = row.eartag_sistem || [];
        if (tags.length === 0) return <span className="text-xs text-gray-300">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-mono font-medium">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      name: 'Eartag Supplier',
      sortable: false,
      minWidth: '180px',
      cell: (row) => {
        const tags = row.eartag_supplier || [];
        if (tags.length === 0) return <span className="text-xs text-gray-300">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-xs font-mono font-medium">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      name: 'Pembeli',
      sortable: true,
      sortField: 'p.nama_pembeli',
      minWidth: '180px',
      cell: (row) => <span className="text-sm text-gray-700">{row.nama_pembeli || '-'}</span>,
    },
    {
      name: 'Tanggal Return',
      sortable: true,
      sortField: 'r.tanggal_return',
      minWidth: '130px',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm text-gray-700">{row.tanggal_return || '-'}</span>
        </div>
      ),
    },
    {
      name: 'Tipe',
      sortable: true,
      sortField: 'r.tipe_return',
      width: '110px',
      center: true,
      cell: (row) => {
        const cfg = {
          PEMBELI: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
          SUPPLIER: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
          INTERNAL: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
        };
        const c = cfg[row.tipe_return] || cfg.INTERNAL;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
            {row.tipe_return}
          </span>
        );
      },
    },
    {
      name: 'Ekor',
      sortable: true,
      sortField: 'r.jumlah_ekor',
      width: '70px',
      center: true,
      cell: (row) => <span className="text-sm font-semibold text-gray-800">{row.jumlah_ekor}</span>,
    },
    {
      name: 'Berat (kg)',
      sortable: true,
      sortField: 'r.total_return_berat',
      width: '110px',
      right: true,
      cell: (row) => (
        <span className="text-sm text-gray-700">{Number(row.total_return_berat || 0).toLocaleString('id-ID')}</span>
      ),
    },
    {
      name: 'Total Harga Return',
      sortable: true,
      sortField: 'r.total_return_harga',
      minWidth: '150px',
      right: true,
      cell: (row) => (
        <span className="text-sm font-bold text-red-600">{formatRupiah(row.total_return_harga)}</span>
      ),
    },
    {
      name: 'Status',
      sortable: true,
      sortField: 'r.status',
      width: '110px',
      center: true,
      cell: (row) => {
        const isActive = row.return_status === 'active';
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {isActive ? 'Active' : 'Reverted'}
          </span>
        );
      },
    },
    {
      name: 'Alasan',
      sortable: false,
      minWidth: '200px',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="text-xs text-gray-700 line-clamp-2">{row.alasan_return || '-'}</span>
          {row.catatan && <span className="text-[10px] text-gray-400 mt-0.5 italic line-clamp-1">{row.catatan}</span>}
        </div>
      ),
    },
  ];

  const customStyles = {
    headRow: { style: { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', minHeight: '44px' } },
    headCells: { style: { fontSize: '11px', fontWeight: '700', color: '#64748b', padding: '10px 12px', textTransform: 'uppercase', letterSpacing: '0.03em' } },
    rows: { style: { minHeight: '56px', borderBottom: '1px solid #f1f5f9' } },
    cells: { style: { padding: '10px 12px', fontSize: '13px', color: '#334155' } },
  };

  // Summary stats
  const stats = useMemo(() => {
    const totalHarga = tableData.reduce((s, r) => s + Number(r.total_return_harga || 0), 0);
    const totalEkor = tableData.reduce((s, r) => s + Number(r.jumlah_ekor || 0), 0);
    const totalBerat = tableData.reduce((s, r) => s + Number(r.total_return_berat || 0), 0);
    const activeCount = tableData.filter(r => r.return_status === 'active').length;
    return { totalHarga, totalEkor, totalBerat, activeCount };
  }, [tableData]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/rph/penjualan-sapi-utuh')}
              className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <RotateCcw className="w-7 h-7 text-orange-600" />
                Riwayat Return Penjualan
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Daftar semua transaksi return sapi utuh
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-3">
            <div className="flex items-center gap-2 text-orange-700">
              <RotateCcw className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Return</span>
            </div>
            <p className="text-lg font-bold text-gray-800 mt-1">{totalRecords}</p>
          </div>
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Hash className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Ekor (halaman)</span>
            </div>
            <p className="text-lg font-bold text-gray-800 mt-1">{stats.totalEkor}</p>
          </div>
          <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3">
            <div className="flex items-center gap-2 text-amber-700">
              <Weight className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Berat (halaman)</span>
            </div>
            <p className="text-lg font-bold text-gray-800 mt-1">{stats.totalBerat.toLocaleString('id-ID')} kg</p>
          </div>
          <div className="bg-red-50/60 border border-red-100 rounded-xl p-3">
            <div className="flex items-center gap-2 text-red-700">
              <CircleDollarSign className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Nilai (halaman)</span>
            </div>
            <p className="text-lg font-bold text-gray-800 mt-1">{formatRupiah(stats.totalHarga)}</p>
          </div>
        </div>
      </div>

      {/* Filter & Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filter Bar */}
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Cari no return, no transaksi, pembeli, alasan..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition ${
                  filtersOpen || activeFilterCount > 0
                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-gray-500 hover:text-red-600 transition"
                >
                  <X className="w-3.5 h-3.5" /> Reset
                </button>
              )}
            </div>
          </div>

          {filtersOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Tipe Return</label>
                <select
                  value={tipeFilter}
                  onChange={(e) => { setTipeFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  {TIPE_RETURN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Jenis Transaksi</label>
                <select
                  value={jenisTransaksiFilter}
                  onChange={(e) => { setJenisTransaksiFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  {JENIS_TRANSAKSI_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  {STATUS_RETURN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Tanggal Return Dari</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Tanggal Return Sampai</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="px-5 py-2.5 bg-gray-50/60 border-b border-gray-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Filter aktif:</span>
            {tipeFilter && (
              <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full border border-orange-100">
                Tipe: {TIPE_RETURN_OPTIONS.find(o => o.value === tipeFilter)?.label}
                <button onClick={() => setTipeFilter('')} className="hover:text-orange-900"><XCircle className="w-3 h-3" /></button>
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full border border-orange-100">
                Status: {STATUS_RETURN_OPTIONS.find(o => o.value === statusFilter)?.label}
                <button onClick={() => setStatusFilter('')} className="hover:text-orange-900"><XCircle className="w-3 h-3" /></button>
              </span>
            )}
            {jenisTransaksiFilter && (
              <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full border border-orange-100">
                Jenis: {JENIS_TRANSAKSI_OPTIONS.find(o => o.value === jenisTransaksiFilter)?.label}
                <button onClick={() => setJenisTransaksiFilter('')} className="hover:text-orange-900"><XCircle className="w-3 h-3" /></button>
              </span>
            )}
            {startDate && (
              <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full border border-orange-100">
                Dari: {startDate}
                <button onClick={() => setStartDate('')} className="hover:text-orange-900"><XCircle className="w-3 h-3" /></button>
              </span>
            )}
            {endDate && (
              <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full border border-orange-100">
                Sampai: {endDate}
                <button onClick={() => setEndDate('')} className="hover:text-orange-900"><XCircle className="w-3 h-3" /></button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full border border-orange-100">
                Cari: "{searchTerm}"
                <button onClick={() => { setSearchTerm(''); setSearchInput(''); }} className="hover:text-orange-900"><XCircle className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Table */}
        <DataTable
          columns={columns}
          data={tableData}
          progressPending={loading}
          progressComponent={
            <div className="py-20 flex items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" /> Memuat data...
            </div>
          }
          noDataComponent={
            <div className="py-20 text-center">
              <RotateCcw className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm font-medium">Belum ada riwayat return</p>
              <p className="text-gray-400 text-xs mt-1">Return yang dibuat akan muncul di sini</p>
            </div>
          }
          pagination
          paginationServer
          paginationTotalRows={totalRecords}
          paginationPerPage={perPage}
          paginationDefaultPage={currentPage}
          onChangePage={(page) => setCurrentPage(page)}
          onChangeRowsPerPage={(newPerPage) => { setPerPage(newPerPage); setCurrentPage(1); }}
          onSort={handleSort}
          sortServer
          defaultSortFieldId={4}
          defaultSortAsc={false}
          customStyles={customStyles}
          highlightOnHover
          responsive
        />
      </div>
    </div>
  );
};

export default ReturnHistoryPage;
