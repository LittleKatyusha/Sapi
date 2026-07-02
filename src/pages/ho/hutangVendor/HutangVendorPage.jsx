import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import {
  X, Loader2, Calendar, AlertTriangle, TrendingDown,
  DollarSign, Eye, RefreshCw, FileText, Wallet, Banknote
} from 'lucide-react';
import HutangVendorService from '../../../services/hutangVendorService';
import HutangVendorFilterPanel, {
  EMPTY_FILTERS,
} from './components/HutangVendorFilterPanel';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const formatDate = (val) => {
  if (!val) return '-';
  return new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const tableCustomStyles = {
  headRow: { style: { backgroundColor: '#fef2f2', fontWeight: '700', fontSize: '13px', color: '#991b1b' } },
  rows: { style: { fontSize: '13px', '&:hover': { backgroundColor: '#fff7f7' } } },
  pagination: { style: { borderTop: '1px solid #fca5a5' } },
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

// ─── Detail Modal ──────────────────────────────────────────────────────────────

const DetailModal = ({ item, onClose, onBayar }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!item) return;
    setLoading(true);
    HutangVendorService.show(item.pubid).then((res) => {
      setDetail(res.success ? res.data : null);
      setLoading(false);
    });
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-red-50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-red-800">Detail Hutang Vendor</h2>
            <p className="text-sm text-red-600">{item.nota || '-'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          ) : detail ? (
            <>
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Vendor" value={detail.nama_supplier || '-'} />
                <InfoRow label="Jenis" value={detail.purchase_type_label || '-'} />
                <InfoRow label="Nota" value={detail.nota || '-'} />
                <InfoRow label="Tgl Transaksi" value={formatDate(detail.tgl_transaksi)} />
                <InfoRow label="Jatuh Tempo" value={formatDate(detail.due_date)} />
                <InfoRow label="Status">
                  <PaymentBadge status={detail.payment_status} label={detail.payment_status_label} />
                </InfoRow>
                <InfoRow label="Total Tagihan" value={formatCurrency(detail.total_tagihan)} />
                <InfoRow label="Total Terbayar" value={formatCurrency(detail.total_terbayar)} />
                <InfoRow label="Sisa Hutang" valueClass="font-bold text-red-700">
                  {formatCurrency(detail.sisa_hutang)}
                </InfoRow>
              </div>

              {/* Riwayat Cicilan */}
              {detail.riwayat_cicilan && detail.riwayat_cicilan.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 text-sm">Riwayat Cicilan</h3>
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
                        {detail.riwayat_cicilan.map((r, i) => (
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
            </>
          ) : (
            <p className="text-center text-gray-500 py-8">Gagal memuat detail</p>
          )}
        </div>

        {/* Footer actions */}
        {!loading && detail && detail.payment_status !== 1 && (
          <div className="px-6 py-3 border-t bg-gray-50 rounded-b-2xl flex items-center justify-end gap-2">
            <button
              onClick={() => onBayar && onBayar(detail, 'kas')}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
            >
              <Wallet className="w-4 h-4" />
              Bayar via Kas
            </button>
            <button
              onClick={() => onBayar && onBayar(detail, 'bank')}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Banknote className="w-4 h-4" />
              Bayar via Bank
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

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

// ─── Main Page ─────────────────────────────────────────────────────────────────

const HutangVendorPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Advanced filters (single source of truth)
  const [advancedFilters, setAdvancedFilters] = useState(EMPTY_FILTERS);
  const [suppliers, setSuppliers] = useState([]);

  // Pagination
  const [pagination, setPagination] = useState({ page: 1, perPage: 10, total: 0 });

  const fetchData = useCallback(async (page = 1, perPage = 10, searchVal = advancedFilters.search) => {
    setLoading(true);
    setError(null);
    const res = await HutangVendorService.getData({
      page,
      perPage,
      search: searchVal,
      purchaseType: advancedFilters.purchase_type || null,
      paymentStatus: advancedFilters.payment_status === '' ? null : advancedFilters.payment_status,
      idSupplier: advancedFilters.id_supplier || null,
      startDate: advancedFilters.startDate || null,
      endDate: advancedFilters.endDate || null,
    });
    if (res.success) {
      setData(res.data);
      setPagination((p) => ({ ...p, page, perPage, total: res.recordsFiltered }));
    } else {
      setError('Gagal memuat data hutang vendor');
    }
    setLoading(false);
  }, [advancedFilters]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    const res = await HutangVendorService.getSummary({
      purchaseType: advancedFilters.purchase_type || null,
      paymentStatus: advancedFilters.payment_status === '' ? null : advancedFilters.payment_status,
      idSupplier: advancedFilters.id_supplier || null,
      startDate: advancedFilters.startDate || null,
      endDate: advancedFilters.endDate || null,
    });
    if (res.success) setSummary(res.data);
    setSummaryLoading(false);
  }, [advancedFilters]);

  useEffect(() => {
    fetchData(1, pagination.perPage);
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advancedFilters]);

  // Fetch supplier list once for vendor filter dropdown
  useEffect(() => {
    HutangVendorService.getSuppliers().then((res) => {
      if (res.success) setSuppliers(res.data);
    });
  }, []);

  const handleAdvancedFilters = useCallback((newFilters) => {
    setAdvancedFilters(newFilters);
  }, []);

  const clearAdvancedFilters = useCallback((filters = null) => {
    setAdvancedFilters(filters || EMPTY_FILTERS);
  }, []);

  const handleRefresh = () => {
    fetchData(pagination.page, pagination.perPage);
    fetchSummary();
  };

  const handleBayar = (detail, via) => {
    setSelectedItem(null);
    const route = via === 'bank' ? '/ho/keuangan-bank' : '/ho/keuangan-kas';
    navigate(route, {
      state: {
        id_pembayaran: detail.id_pembayaran,
        pubid: detail.pubid,
        nota: detail.nota,
        nama_supplier: detail.nama_supplier,
        sisa_hutang: detail.sisa_hutang,
        source: 'hutang-vendor',
      },
    });
  };

  const columns = [
    {
      name: 'No',
      width: '50px',
      cell: (_, index) => (
        <span className="text-gray-400 font-medium text-xs">
          {(pagination.page - 1) * pagination.perPage + index + 1}
        </span>
      ),
    },
    {
      name: 'Transaksi',
      selector: (r) => r.nota,
      sortable: true,
      minWidth: '200px',
      cell: (r) => (
        <div className="py-2 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              {r.nota || '-'}
            </span>
            <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-medium">
              {r.purchase_type_label || '-'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(r.tgl_transaksi)}</span>
          </div>
        </div>
      ),
    },
    {
      name: 'Vendor',
      selector: (r) => r.nama_supplier,
      sortable: true,
      minWidth: '160px',
      cell: (r) => (
        <div className="py-2">
          <p className="text-sm font-semibold text-gray-800 leading-tight">
            {r.nama_supplier || '-'}
          </p>
          {r.jenis_supplier && (
            <p className="text-xs text-gray-500 mt-0.5">{r.jenis_supplier}</p>
          )}
        </div>
      ),
    },
    {
      name: 'Jatuh Tempo',
      selector: (r) => r.due_date,
      sortable: true,
      width: '120px',
      cell: (r) => {
        const isOverdue = r.due_date && new Date(r.due_date) < new Date() && r.payment_status !== 1;
        const daysOverdue = isOverdue
          ? Math.floor((new Date() - new Date(r.due_date)) / (1000 * 60 * 60 * 24))
          : 0;
        return (
          <div className="py-2">
            <p className={`text-sm ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
              {formatDate(r.due_date)}
            </p>
            {isOverdue && (
              <p className="text-xs text-red-500 font-medium mt-0.5 flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" />
                {daysOverdue} hari
              </p>
            )}
          </div>
        );
      },
    },
    {
      name: 'Pembayaran',
      minWidth: '220px',
      cell: (r) => {
        const percent = r.total_tagihan > 0
          ? Math.min(100, Math.round((r.total_terbayar / r.total_tagihan) * 100))
          : 0;
        const isLunas = r.payment_status === 1;
        return (
          <div className="py-2 w-full space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Tagihan:</span>
              <span className="font-semibold text-gray-800">{formatCurrency(r.total_tagihan)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Terbayar:</span>
              <span className="font-semibold text-green-700">{formatCurrency(r.total_terbayar)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Sisa:</span>
              <span className={`font-bold ${isLunas ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(r.sisa_hutang)}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isLunas ? 'bg-green-500' : 'bg-gradient-to-r from-orange-400 to-red-500'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 text-right">{percent}% terbayar</p>
          </div>
        );
      },
    },
    {
      name: 'Status',
      selector: (r) => r.payment_status,
      width: '110px',
      cell: (r) => <PaymentBadge status={r.payment_status} label={r.payment_status_label} />,
    },
    {
      name: 'Aksi',
      width: '70px',
      cell: (r) => (
        <button
          onClick={() => setSelectedItem(r)}
          className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors border border-gray-200 hover:border-red-200"
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
          <h1 className="text-2xl font-bold text-gray-800">Hutang ke Vendor</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitoring hutang HO kepada vendor (DOKA, Feedmil, OVK, Kulit, Lain-lain)</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : 'text-gray-600'}`} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          icon={FileText}
          label="Total Tagihan"
          value={summaryLoading ? '...' : String(summary.jumlah_tagihan || 0)}
          sub={`${summary.jumlah_vendor || 0} vendor`}
          color="bg-blue-50 text-blue-700 border-blue-200"
        />
        <SummaryCard
          icon={DollarSign}
          label="Nilai Tagihan"
          value={summaryLoading ? '...' : formatCurrency(summary.total_tagihan)}
          color="bg-orange-50 text-orange-700 border-orange-200"
        />
        <SummaryCard
          icon={TrendingDown}
          label="Sisa Hutang"
          value={summaryLoading ? '...' : formatCurrency(summary.total_sisa_hutang)}
          sub={`Terbayar: ${formatCurrency(summary.total_terbayar)}`}
          color="bg-red-50 text-red-700 border-red-200"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Jatuh Tempo"
          value={summaryLoading ? '...' : formatCurrency(summary.total_jatuh_tempo)}
          sub="Sudah lewat jatuh tempo"
          color="bg-yellow-50 text-yellow-700 border-yellow-200"
        />
      </div>

      {/* Filter & Pencarian Lanjutan */}
      <HutangVendorFilterPanel
        filters={advancedFilters}
        onApply={handleAdvancedFilters}
        onReset={clearAdvancedFilters}
        supplierOptions={suppliers.map((s) => ({ value: String(s.id), label: s.name }))}
      />

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
              <Loader2 className="w-8 h-8 animate-spin text-red-400" />
              <span className="text-sm">Memuat data...</span>
            </div>
          }
          noDataComponent={
            <div className="py-12 flex flex-col items-center gap-2 text-gray-400">
              <FileText className="w-10 h-10 opacity-30" />
              <span className="text-sm">Tidak ada data hutang vendor</span>
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
        <DetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onBayar={handleBayar}
        />
      )}
    </div>
  );
};

export default HutangVendorPage;
