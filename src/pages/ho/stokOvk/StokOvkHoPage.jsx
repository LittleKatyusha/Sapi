import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import {
  Search, X, Loader2, FlaskConical, RefreshCw, Layers, DollarSign, BarChart2, Package
} from 'lucide-react';
import StokOvkHoService from '../../../services/stokOvkHoService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const formatNumber = (val) =>
  new Intl.NumberFormat('id-ID').format(val || 0);

const tableCustomStyles = {
  headRow: {
    style: {
      backgroundColor: '#eff6ff',
      fontWeight: '700',
      fontSize: '13px',
      color: '#1e40af',
    },
  },
  rows: {
    style: {
      fontSize: '13px',
      '&:hover': { backgroundColor: '#eff6ff' },
    },
  },
  pagination: {
    style: { borderTop: '1px solid #93c5fd' },
  },
};

// ─── Summary Cards ─────────────────────────────────────────────────────────────

const SummaryCard = ({ icon: Icon, label, value, color }) => (
  <div className={`${color} rounded-xl p-4 shadow-sm border flex items-start gap-3`}>
    <div className="p-2 rounded-lg bg-white/60 shrink-0">
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium opacity-70 truncate">{label}</p>
      <p className="text-lg font-bold truncate">{value}</p>
    </div>
  </div>
);

// ─── Stock Level Badge ─────────────────────────────────────────────────────────

const StockBadge = ({ jumlah }) => {
  if (jumlah <= 0)
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Habis</span>;
  if (jumlah <= 10)
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Menipis</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Tersedia</span>;
};

// ─── Page Component ────────────────────────────────────────────────────────────

const StokOvkHoPage = () => {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dataRes] = await Promise.all([
        StokOvkHoService.getData(),
        StokOvkHoService.getSummary(),
      ]);
      const rows = dataRes?.data ?? dataRes ?? [];
      setAllData(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data stok OVK.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Client-side filtering ──
  const filteredData = useMemo(() => {
    if (!search.trim()) return allData;
    const q = search.toLowerCase();
    return allData.filter((r) =>
      (r.NAME || '').toLowerCase().includes(q) ||
      (r.produk || '').toLowerCase().includes(q)
    );
  }, [allData, search]);

  // ── Summary stats from loaded data ──
  const stats = useMemo(() => {
    const totalItem = allData.length;
    const totalStok = allData.reduce((acc, r) => acc + (Number(r.jumlah) || 0), 0);
    const totalNilai = allData.reduce((acc, r) => acc + (Number(r.harga_jual) || 0) * (Number(r.jumlah) || 0), 0);
    const habis = allData.filter((r) => (Number(r.jumlah) || 0) <= 0).length;
    return { totalItem, totalStok, totalNilai, habis };
  }, [allData]);

  // ── Columns ──
  const columns = useMemo(() => [
    {
      name: 'No',
      selector: (_, i) => i + 1,
      width: '56px',
      center: true,
    },
    {
      name: 'Nama Item',
      selector: (r) => r.NAME,
      sortable: true,
      wrap: true,
      minWidth: '200px',
    },
    {
      name: 'Produk',
      cell: () => (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          OVK
        </span>
      ),
      center: true,
      width: '80px',
    },
    {
      name: 'Harga Beli',
      selector: (r) => r.harga_beli,
      sortable: true,
      right: true,
      cell: (r) => formatCurrency(r.harga_beli),
      minWidth: '130px',
    },
    {
      name: 'Markup (%)',
      selector: (r) => r.persentase,
      sortable: true,
      right: true,
      cell: (r) => `${Number(r.persentase || 0).toFixed(2)}%`,
      width: '110px',
    },
    {
      name: 'Harga Jual (HPP)',
      selector: (r) => r.harga_jual,
      sortable: true,
      right: true,
      cell: (r) => formatCurrency(r.harga_jual),
      minWidth: '150px',
    },
    {
      name: 'Stok',
      selector: (r) => r.jumlah,
      sortable: true,
      right: true,
      cell: (r) => formatNumber(r.jumlah),
      width: '80px',
    },
    {
      name: 'Status',
      cell: (r) => <StockBadge jumlah={Number(r.jumlah)} />,
      center: true,
      width: '100px',
    },
  ], []);

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-blue-600" />
            Stok OVK HO
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitoring sisa stok obat & vitamin ternak Head Office</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 text-sm font-medium transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          icon={Layers}
          label="Total Item"
          value={formatNumber(stats.totalItem)}
          color="bg-blue-50 border-blue-200 text-blue-800"
        />
        <SummaryCard
          icon={Package}
          label="Total Stok"
          value={formatNumber(stats.totalStok)}
          color="bg-indigo-50 border-indigo-200 text-indigo-800"
        />
        <SummaryCard
          icon={DollarSign}
          label="Nilai Stok (HPP)"
          value={formatCurrency(stats.totalNilai)}
          color="bg-sky-50 border-sky-200 text-sky-800"
        />
        <SummaryCard
          icon={BarChart2}
          label="Item Habis"
          value={formatNumber(stats.habis)}
          color={stats.habis > 0 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-700'}
        />
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama item atau produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
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
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* DataTable */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredData}
          progressPending={loading}
          progressComponent={
            <div className="py-10 flex items-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              Memuat data stok OVK...
            </div>
          }
          noDataComponent={
            <div className="py-10 text-gray-400 text-sm">
              {search ? 'Tidak ada item yang cocok dengan pencarian.' : 'Belum ada data stok OVK.'}
            </div>
          }
          customStyles={tableCustomStyles}
          pagination
          paginationPerPage={20}
          paginationRowsPerPageOptions={[10, 20, 50, 100]}
          highlightOnHover
          striped
          dense
        />
      </div>
    </div>
  );
};

export default StokOvkHoPage;
