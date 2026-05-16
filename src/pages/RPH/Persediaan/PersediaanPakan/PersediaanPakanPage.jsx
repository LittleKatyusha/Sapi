import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Wheat, Package, BarChart3, Search, X, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import PersediaanPakanTab from '../PersediaanOvk/components/PersediaanPakanTab';
import PersediaanPakanService from '../../../../services/persediaanPakanService';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'stok', label: 'Stok Bahan Baku', icon: Package },
  { id: 'resep', label: 'Resep Pakan', icon: Wheat },
  { id: 'rekap', label: 'Rekap OVK RPH', icon: BarChart3 },
];

const fmt = (val) =>
  new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(val || 0);

const tableCustomStyles = {
  headRow: {
    style: { backgroundColor: '#f0fdf4', fontWeight: '700', fontSize: '13px', color: '#166534' },
  },
  rows: { style: { fontSize: '13px', '&:hover': { backgroundColor: '#f0fdf4' } } },
};

// ─── Stok Bahan Baku Tab ───────────────────────────────────────────────────────

const StokBahanBakuTab = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await PersediaanPakanService.getStokBahanBaku();
    if (res.success) {
      setData(res.data || []);
    } else {
      setError(res.message || 'Gagal memuat data stok.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.produk || '').toLowerCase().includes(q),
    );
  }, [data, search]);

  const columns = useMemo(() => [
    {
      name: 'No',
      cell: (_, i) => i + 1,
      width: '50px',
      center: true,
    },
    {
      name: 'Nama Bahan Baku',
      selector: (r) => r.name,
      sortable: true,
      cell: (r) => <span className="font-medium text-gray-800">{r.name}</span>,
      minWidth: '200px',
    },
    {
      name: 'Produk',
      selector: (r) => r.produk,
      sortable: true,
      cell: (r) => r.produk || '-',
      minWidth: '150px',
    },
    {
      name: 'Harga (Rp)',
      selector: (r) => r.harga,
      sortable: true,
      right: true,
      cell: (r) => <span className="font-semibold text-emerald-700">Rp {fmt(r.harga)}</span>,
      minWidth: '130px',
    },
    {
      name: 'Jumlah Stok',
      selector: (r) => r.jumlah,
      sortable: true,
      center: true,
      cell: (r) => {
        const stok = Number(r.jumlah);
        const cls =
          stok === 0
            ? 'bg-red-50 text-red-700 border-red-200'
            : stok < 10
            ? 'bg-orange-50 text-orange-700 border-orange-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200';
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
            {fmt(stok)}
          </span>
        );
      },
      minWidth: '120px',
    },
  ], []);

  // Summary
  const totalItems = data.length;
  const totalStok = data.reduce((a, r) => a + (Number(r.jumlah) || 0), 0);
  const habis = data.filter((r) => Number(r.jumlah) === 0).length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800">
          <p className="text-xs font-medium opacity-70">Total Item</p>
          <p className="text-2xl font-bold mt-1">{totalItems}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800">
          <p className="text-xs font-medium opacity-70">Total Stok</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalStok)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
          <p className="text-xs font-medium opacity-70">Item Habis</p>
          <p className="text-2xl font-bold mt-1">{habis}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari bahan baku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-300 outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          progressPending={loading}
          progressComponent={
            <div className="py-10 flex items-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" /> Memuat data...
            </div>
          }
          noDataComponent={
            <div className="py-10 text-gray-400 text-sm">
              {search ? 'Tidak ada hasil pencarian.' : 'Belum ada data stok bahan baku.'}
            </div>
          }
          customStyles={tableCustomStyles}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50]}
          highlightOnHover
          striped
          dense
        />
      </div>
    </div>
  );
};

// ─── Rekap OVK RPH Tab ─────────────────────────────────────────────────────────

const RekapTab = () => {
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const load = useCallback(
    async (page = currentPage, limit = perPage, q = search) => {
      setLoading(true);
      setError(null);
      const res = await PersediaanPakanService.getRekapData({
        draw: page,
        start: (page - 1) * limit,
        length: limit,
        search: q,
      });
      if (res.success) {
        setData(Array.isArray(res.data) ? res.data : []);
        setTotalRecords(res.recordsFiltered || 0);
      } else {
        setError(res.message || 'Gagal memuat data rekap.');
      }
      setLoading(false);
    },
    [currentPage, perPage, search],
  );

  useEffect(() => { load(1, perPage, ''); }, []);

  const handleSearch = () => { setCurrentPage(1); load(1, perPage, search); };
  const handleClear = () => { setSearch(''); setCurrentPage(1); load(1, perPage, ''); };

  const columns = useMemo(() => [
    { name: 'No', cell: (_, i) => (currentPage - 1) * perPage + i + 1, width: '50px', center: true },
    {
      name: 'Nama Produk',
      selector: (r) => r.nama_produk,
      sortable: true,
      cell: (r) => <span className="font-medium text-gray-800">{r.nama_produk || '-'}</span>,
      minWidth: '200px',
    },
    {
      name: 'Satuan',
      selector: (r) => r.satuan,
      center: true,
      cell: (r) => (
        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold border border-slate-200">
          {r.satuan || '-'}
        </span>
      ),
      width: '100px',
    },
    {
      name: 'Jumlah',
      selector: (r) => r.jumlah,
      sortable: true,
      center: true,
      cell: (r) => (
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
          {fmt(r.jumlah)}
        </span>
      ),
      minWidth: '100px',
    },
    {
      name: 'Nominal (Rp)',
      selector: (r) => r.nominal,
      sortable: true,
      right: true,
      cell: (r) => <span className="font-semibold text-emerald-700 text-xs">Rp {r.nominal || '0'}</span>,
      minWidth: '130px',
    },
  ], [currentPage, perPage]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-300 outline-none"
          />
          {search && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition"
        >
          Cari
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          progressPending={loading}
          progressComponent={
            <div className="py-10 flex items-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" /> Memuat data...
            </div>
          }
          noDataComponent={
            <div className="py-10 text-gray-400 text-sm">Belum ada data rekap.</div>
          }
          customStyles={tableCustomStyles}
          pagination
          paginationServer
          paginationTotalRows={totalRecords}
          paginationDefaultPage={currentPage}
          paginationPerPage={perPage}
          paginationRowsPerPageOptions={[10, 25, 50]}
          onChangePage={(p) => { setCurrentPage(p); load(p, perPage, search); }}
          onChangeRowsPerPage={(pp, p) => { setPerPage(pp); setCurrentPage(p); load(p, pp, search); }}
          highlightOnHover
          striped
          dense
        />
      </div>

      <p className="text-xs text-gray-400">
        Rekap menampilkan stok OVK yang tersedia (is_keluar = 0) di RPH ini.
      </p>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const PersediaanPakanPage = () => {
  const [activeTab, setActiveTab] = useState('stok');

  useEffect(() => {
    document.title = 'Persediaan Pakan — RPH | TernaSys';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-white to-cyan-50/30">
      <div className="mx-auto max-w-full space-y-5 p-4 md:p-6">
        {/* Header */}
        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <Wheat className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Persediaan Pakan RPH
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Kelola stok bahan baku, resep pakan, dan rekap persediaan pakan di RPH.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Panel */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b border-gray-200 flex overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px ${
                    isActive
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50/60'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-5 md:p-6">
            {activeTab === 'stok' && <StokBahanBakuTab />}
            {activeTab === 'resep' && <PersediaanPakanTab />}
            {activeTab === 'rekap' && <RekapTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersediaanPakanPage;
