import React, { useState, useEffect, useCallback, useRef } from 'react';
import DataTable from 'react-data-table-component';
import {
  Search, X, Loader2, Calendar, AlertTriangle, TrendingUp,
  DollarSign, Building2, Eye, RefreshCw, FileText
} from 'lucide-react';
import PiutangCabangService from '../../../services/piutangCabangService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const formatDate = (val) => {
  if (!val) return '-';
  return new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const SUMBER_OPTIONS = [
  { value: '', label: 'Semua Sumber' },
  { value: 'doka', label: 'PO Doka (Ternak)' },
  { value: 'feedmil_ovk', label: 'Feedmil / OVK' },
];

const tableCustomStyles = {
  headRow: { style: { backgroundColor: '#eff6ff', fontWeight: '700', fontSize: '13px', color: '#1e40af' } },
  rows: { style: { fontSize: '13px', '&:hover': { backgroundColor: '#f8faff' } } },
  pagination: { style: { borderTop: '1px solid #bfdbfe' } },
};

// ─── Summary Cards ─────────────────────────────────────────────────────────────

const SummaryCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className={`${color} rounded-xl p-4 shadow-sm border flex items-start gap-3`}>
    <div className="p-2 rounded-lg bg-white/60 shrink-0">
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium opacity-70 truncate">{label}</p>
      <p className="text-lg font-bold truncate">{value}</p>
      {sub && <p className="text-xs opacity-60 truncate">{sub}</p>}
    </div>
  </div>
);

// ─── Payment Badge ─────────────────────────────────────────────────────────────

const PaymentBadge = ({ status, label }) => {
  const colors = {
    0: 'bg-orange-100 text-orange-700',
    1: 'bg-green-100 text-green-700',
    2: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {label || '-'}
    </span>
  );
};

const SumberBadge = ({ sumber }) => {
  const map = {
    doka: { label: 'PO Doka', color: 'bg-amber-100 text-amber-700' },
    feedmil_ovk: { label: 'Feedmil/OVK', color: 'bg-purple-100 text-purple-700' },
  };
  const m = map[sumber] || { label: sumber || '-', color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${m.color}`}>
      {m.label}
    </span>
  );
};

// ─── Detail Modal ──────────────────────────────────────────────────────────────

const InfoRow = ({ label, value, valueClass, children }) => (
  <div className="bg-gray-50 rounded-lg px-3 py-2">
    <p className="text-xs text-gray-500">{label}</p>
    {children ? (
      <div className={`text-sm font-medium mt-0.5 ${valueClass || ''}`}>{children}</div>
    ) : (
      <p className={`text-sm font-medium mt-0.5 ${valueClass || 'text-gray-800'}`}>{value}</p>
    )}
  </div>
);

const DetailModal = ({ item, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!item) return;
    setLoading(true);
    PiutangCabangService.show(item.pubid, item.sumber || 'doka').then((res) => {
      setDetail(res.success ? res.data : null);
      setLoading(false);
    });
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-blue-800">Detail Piutang Cabang</h2>
            <p className="text-sm text-blue-600">{item.nomor_dokumen || item.jenis_piutang || '-'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : detail ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Cabang" value={detail.nama_cabang || '-'} />
                <InfoRow label="Jenis Piutang" value={detail.jenis_piutang || '-'} />
                <InfoRow label="Nomor Dokumen" value={detail.nomor_dokumen || '-'} />
                <InfoRow label="Tgl Transaksi" value={formatDate(detail.tgl_transaksi || detail.tgl_penjualan)} />
                <InfoRow label="Jatuh Tempo" value={formatDate(detail.due_date)} />
                <InfoRow label="Status">
                  <PaymentBadge status={detail.payment_status} label={detail.payment_status_label} />
                </InfoRow>
                <InfoRow label="Total Tagihan" value={formatCurrency(detail.total_tagihan)} />
                <InfoRow label="Total Terbayar" value={formatCurrency(detail.total_terbayar)} />
                <InfoRow label="Sisa Piutang" valueClass="font-bold text-blue-700">
                  {formatCurrency(detail.sisa_piutang)}
                </InfoRow>
              </div>

              {/* Riwayat pembayaran masuk (hanya untuk Doka) */}
              {detail.riwayat_pembayaran && detail.riwayat_pembayaran.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 text-sm">Riwayat Pembayaran Masuk</h3>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600 text-xs">
                        <tr>
                          <th className="px-3 py-2 text-left">Tanggal</th>
                          <th className="px-3 py-2 text-right">Jumlah</th>
                          <th className="px-3 py-2 text-left">Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.riwayat_pembayaran.map((r, i) => (
                          <tr key={r.id || i} className="border-t hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap">{formatDate(r.payment_date)}</td>
                            <td className="px-3 py-2 text-right whitespace-nowrap font-medium text-green-700">
                              {formatCurrency(r.amount)}
                            </td>
                            <td className="px-3 py-2 text-gray-500">{r.note || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {item.sumber === 'feedmil_ovk' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                  <strong>Catatan:</strong> Piutang Feedmil/OVK belum memiliki tracking pembayaran. Seluruh nilai dianggap outstanding.
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500 py-8">Gagal memuat detail</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const PiutangCabangPage = () => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [sumber, setSumber] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  // Pagination
  const [pagination, setPagination] = useState({ page: 1, perPage: 10, total: 0 });

  const searchTimerRef = useRef(null);

  const fetchData = useCallback(async (page = 1, perPage = 10, searchVal = search) => {
    setLoading(true);
    setError(null);
    const res = await PiutangCabangService.getData({
      page,
      perPage,
      search: searchVal,
      sumber: sumber || null,
      startDate: dateRange.startDate || null,
      endDate: dateRange.endDate || null,
    });
    if (res.success) {
      setData(res.data);
      setPagination((p) => ({ ...p, page, perPage, total: res.recordsFiltered }));
    } else {
      setError('Gagal memuat data piutang cabang');
    }
    setLoading(false);
  }, [search, sumber, dateRange]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    const res = await PiutangCabangService.getSummary({
      startDate: dateRange.startDate || null,
      endDate: dateRange.endDate || null,
    });
    if (res.success) setSummary(res.data);
    setSummaryLoading(false);
  }, [dateRange]);

  useEffect(() => {
    fetchData(1, pagination.perPage);
    fetchSummary();
  }, [sumber, dateRange]);

  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchData(1, pagination.perPage, val);
    }, 500);
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchData(1, pagination.perPage, '');
  };

  const handleRefresh = () => {
    fetchData(pagination.page, pagination.perPage);
    fetchSummary();
  };

  const columns = [
    {
      name: 'No',
      width: '60px',
      cell: (_, index) => (
        <span className="text-gray-500 font-medium">
          {(pagination.page - 1) * pagination.perPage + index + 1}
        </span>
      ),
    },
    {
      name: 'Nomor Dokumen',
      selector: (r) => r.nomor_dokumen,
      sortable: true,
      cell: (r) => (
        <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
          {r.nomor_dokumen || '-'}
        </span>
      ),
    },
    {
      name: 'Cabang',
      selector: (r) => r.nama_cabang,
      sortable: true,
      cell: (r) => <span className="font-medium text-gray-800">{r.nama_cabang || '-'}</span>,
    },
    {
      name: 'Jenis',
      selector: (r) => r.jenis_piutang,
      sortable: true,
      width: '140px',
      cell: (r) => <SumberBadge sumber={r.sumber} />,
    },
    {
      name: 'Tgl Transaksi',
      selector: (r) => r.tgl_transaksi,
      sortable: true,
      width: '130px',
      cell: (r) => <span className="text-sm text-gray-600">{formatDate(r.tgl_transaksi)}</span>,
    },
    {
      name: 'Jatuh Tempo',
      selector: (r) => r.due_date,
      sortable: true,
      width: '130px',
      cell: (r) => {
        const isOverdue = r.due_date && new Date(r.due_date) < new Date() && r.payment_status !== 1;
        return (
          <span className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
            {formatDate(r.due_date)}
            {isOverdue && <span className="ml-1">⚠</span>}
          </span>
        );
      },
    },
    {
      name: 'Total Tagihan',
      selector: (r) => r.total_tagihan,
      sortable: true,
      right: true,
      cell: (r) => <span className="text-sm font-medium">{formatCurrency(r.total_tagihan)}</span>,
    },
    {
      name: 'Sisa Piutang',
      selector: (r) => r.sisa_piutang,
      sortable: true,
      right: true,
      cell: (r) => (
        <span className="text-sm font-bold text-blue-700">{formatCurrency(r.sisa_piutang)}</span>
      ),
    },
    {
      name: 'Status',
      selector: (r) => r.payment_status,
      width: '130px',
      cell: (r) => <PaymentBadge status={r.payment_status} label={r.payment_status_label} />,
    },
    {
      name: 'Aksi',
      width: '80px',
      cell: (r) => (
        <button
          onClick={() => setSelectedItem(r)}
          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
          title="Lihat Detail"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
      ignoreRowClick: true,
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Piutang dari Cabang</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitoring piutang HO dari RPH dan Warehouse (PO Doka, Feedmil, OVK)</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : 'text-gray-600'}`} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          icon={FileText}
          label="Total Tagihan"
          value={summaryLoading ? '...' : String(summary.jumlah_tagihan || 0)}
          sub={`${summary.jumlah_cabang || 0} cabang`}
          color="bg-blue-50 text-blue-700 border-blue-200"
        />
        <SummaryCard
          icon={DollarSign}
          label="Total Piutang"
          value={summaryLoading ? '...' : formatCurrency(summary.total_tagihan)}
          color="bg-indigo-50 text-indigo-700 border-indigo-200"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Sisa Piutang"
          value={summaryLoading ? '...' : formatCurrency(summary.total_sisa_piutang)}
          sub={`Terbayar: ${formatCurrency(summary.total_terbayar)}`}
          color="bg-green-50 text-green-700 border-green-200"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Jatuh Tempo"
          value={summaryLoading ? '...' : formatCurrency(summary.total_jatuh_tempo)}
          sub="Sudah lewat jatuh tempo"
          color="bg-yellow-50 text-yellow-700 border-yellow-200"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            {loading && search && (
              <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
            )}
            {search && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <input
              type="text"
              placeholder="Cari nomor dokumen, cabang..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          {/* Sumber filter */}
          <select
            value={sumber}
            onChange={(e) => setSumber(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 bg-white min-w-[180px]"
          >
            {SUMBER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange((d) => ({ ...d, startDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
          />
          <span className="text-gray-400 text-sm">s/d</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange((d) => ({ ...d, endDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
          />
          {(dateRange.startDate || dateRange.endDate) && (
            <button
              onClick={() => setDateRange({ startDate: '', endDate: '' })}
              className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm flex items-center gap-2 border-b border-red-200">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        <DataTable
          columns={columns}
          data={data}
          progressPending={loading}
          progressComponent={
            <div className="py-12 flex flex-col items-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <span className="text-sm">Memuat data...</span>
            </div>
          }
          noDataComponent={
            <div className="py-12 flex flex-col items-center gap-2 text-gray-400">
              <Building2 className="w-10 h-10 opacity-30" />
              <span className="text-sm">Tidak ada data piutang cabang</span>
            </div>
          }
          pagination
          paginationServer
          paginationTotalRows={pagination.total}
          paginationDefaultPage={pagination.page}
          paginationPerPage={pagination.perPage}
          onChangePage={(page) => fetchData(page, pagination.perPage)}
          onChangeRowsPerPage={(perPage) => fetchData(1, perPage)}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          customStyles={tableCustomStyles}
          highlightOnHover
          striped
        />
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
};

export default PiutangCabangPage;
