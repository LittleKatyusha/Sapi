import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { Search, XCircle, TrendingUp, Banknote, Wallet, Eye, MoreVertical, History, AlertCircle, Calendar, CalendarRange, CalendarDays } from 'lucide-react';

import useDocumentTitle from '../../../hooks/useDocumentTitle';
import feedmillKeuanganService from '../../../services/feedmillKeuanganService';
import { useNotification } from '../../../components/shared/Notification';

const formatRupiah = (v) => {
  const n = Number(v || 0);
  return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatDate = (v) => {
  if (!v) return '-';
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return v;
  }
};

const STATUS_BAYAR = {
  0: { label: 'Belum Lunas', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  1: { label: 'Lunas', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  2: { label: 'Belum Bayar', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
};

const PenerimaanFeedmillPage = () => {
  useDocumentTitle('Feedmill: Penerimaan');
  const navigate = useNavigate();
  const { showError } = useNotification();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [cardData, setCardData] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);
  const menuBtnRefs = useRef({});

  const fetchCardData = useCallback(async () => {
    setCardLoading(true);
    const res = await feedmillKeuanganService.getCardDataPenerimaan();
    setCardLoading(false);
    if (res.success) {
      const payload = res.data?.data ?? res.data;
      setCardData(payload);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = {
      draw: currentPage,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      search: searchQuery || undefined,
    };
    const res = await feedmillKeuanganService.getPenerimaan(params);
    setLoading(false);
    if (res.success) {
      const payload = res.data?.data ?? res.data;
      setData(Array.isArray(payload?.data) ? payload.data : []);
      setTotalRecords(payload?.recordsFiltered || payload?.recordsTotal || 0);
    } else {
      setError(res.message);
      setData([]);
    }
  }, [currentPage, pageSize, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchCardData();
  }, [fetchCardData]);

  useEffect(() => {
    const onFocus = () => fetchCardData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchCardData]);

  useEffect(() => {
    const onClick = () => setOpenMenuId(null);
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleDetail = async (row) => {
    setDetailLoading(true);
    setDetailData(null);
    const res = await feedmillKeuanganService.showPenerimaan(row.pid);
    setDetailLoading(false);
    if (res.success) {
      setDetailData(res.data);
    } else {
      showError(res.message || 'Gagal memuat detail');
    }
  };

  const handleBayar = (row) => {
    navigate(`/feedmil/keuangan/penerimaan/bayar/${encodeURIComponent(row.pid)}`);
  };

  const columns = [
    {
      name: 'No Faktur',
      selector: (row) => row.no_faktur,
      sortable: true,
      cell: (row) => <span className="font-mono text-xs font-semibold text-gray-800">{row.no_faktur || row.no_referensi || row.pid || '-'}</span>,
    },
    {
      name: 'Penjualan Ke',
      selector: (row) => row.penjualan_ke,
      sortable: true,
      cell: (row) => <span className="text-sm text-gray-700">{row.penjualan_ke || '-'}</span>,
    },
    {
      name: 'Tgl Jual',
      selector: (row) => row.tgl_jual,
      sortable: true,
      cell: (row) => <span className="text-sm text-gray-600">{formatDate(row.tgl_jual)}</span>,
    },
    {
      name: 'Nominal',
      selector: (row) => row.nominal,
      right: true,
      cell: (row) => <span className="text-sm font-semibold text-blue-700">{formatRupiah(row.nominal)}</span>,
    },
    {
      name: 'Diterima',
      right: true,
      cell: (row) => <span className="text-sm font-medium text-emerald-700">{formatRupiah(row.total_terbayar)}</span>,
    },
    {
      name: 'Sisa',
      right: true,
      cell: (row) => (
        <span className={`text-sm font-semibold ${(row.sisa || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
          {formatRupiah(row.sisa)}
        </span>
      ),
    },
    {
      name: 'Status',
      selector: (row) => row.payment_status,
      center: true,
      cell: (row) => {
        if (row.is_cancel === 1) {
          return <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">Dibatalkan</span>;
        }
        const s = STATUS_BAYAR[row.payment_status] || STATUS_BAYAR[2];
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}>
            {s.label}
          </span>
        );
      },
    },
    {
      name: 'Aksi',
      center: true,
      cell: (row) => (
        <div className="relative">
          <button
            ref={(el) => { menuBtnRefs.current[row.pid] = el; }}
            onClick={(e) => {
              e.stopPropagation();
              if (openMenuId === row.pid) {
                setOpenMenuId(null);
              } else {
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 4, left: rect.right - 160 });
                setOpenMenuId(row.pid);
              }
            }}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
            aria-label="Aksi"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {openMenuId === row.pid && (
            <div
              className="fixed z-[9999] w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
              style={{ top: menuPos.top, left: menuPos.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { handleDetail(row); setOpenMenuId(null); }}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" /> Detail
              </button>
              {(row.sisa || 0) > 0 && row.is_cancel === 0 && (
                <button
                  onClick={() => { handleBayar(row); setOpenMenuId(null); }}
                  className="w-full text-left px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                >
                  <Banknote className="w-3.5 h-3.5" /> Bayar
                </button>
              )}
              {row.is_cancel === 0 && (row.total_terbayar || 0) > 0 && (
                <button
                  onClick={() => { handleDetail(row); setOpenMenuId(null); }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <History className="w-3.5 h-3.5" /> Riwayat Bayar
                </button>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Penerimaan Feedmill</h1>
            <p className="text-sm text-gray-500 mt-1">Pelunasan penjualan konsentrat HO dari RPH</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              label: 'Tagihan Harus Diterima',
              count: cardData?.tagihan?.jumlah ?? 0,
              total: cardData?.tagihan?.nominal ?? 0,
              icon: AlertCircle,
              bg: 'bg-red-50', border: 'border-red-200', iconBg: 'bg-red-100', iconColor: 'text-red-600',
              labelColor: 'text-red-500', valueColor: 'text-red-700', subColor: 'text-red-600',
              subText: 'tagihan',
            },
            {
              label: 'Penerimaan Hari Ini',
              count: cardData?.masukhariini?.jumlah ?? 0,
              total: cardData?.masukhariini?.nominal ?? 0,
              icon: Calendar,
              bg: 'bg-yellow-50', border: 'border-yellow-200', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600',
              labelColor: 'text-yellow-600', valueColor: 'text-yellow-800', subColor: 'text-yellow-700',
              subText: 'penerimaan',
            },
            {
              label: 'Penerimaan Minggu Ini',
              count: cardData?.masukmingguini?.jumlah ?? 0,
              total: cardData?.masukmingguini?.nominal ?? 0,
              icon: CalendarRange,
              bg: 'bg-orange-50', border: 'border-orange-200', iconBg: 'bg-orange-100', iconColor: 'text-orange-600',
              labelColor: 'text-orange-600', valueColor: 'text-orange-800', subColor: 'text-orange-700',
              subText: 'penerimaan',
            },
            {
              label: 'Penerimaan Bulan Ini',
              count: cardData?.masukbulanini?.jumlah ?? 0,
              total: cardData?.masukbulanini?.nominal ?? 0,
              icon: CalendarDays,
              bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
              labelColor: 'text-blue-500', valueColor: 'text-blue-700', subColor: 'text-blue-600',
              subText: 'penerimaan',
            },
            {
              label: 'Penerimaan Tahun Ini',
              count: cardData?.masuktahunini?.jumlah ?? 0,
              total: cardData?.masuktahunini?.nominal ?? 0,
              icon: TrendingUp,
              bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
              labelColor: 'text-emerald-600', valueColor: 'text-emerald-700', subColor: 'text-emerald-600',
              subText: 'penerimaan',
            },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className={`rounded-xl border ${c.bg} ${c.border} p-4 shadow-sm transition-all hover:shadow-md`}>
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg ${c.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${c.iconColor}`} />
                  </div>
                  <span className={`text-xs font-medium ${c.labelColor}`}>{c.label}</span>
                </div>
                <div className="space-y-1">
                  <p className={`text-xs ${c.subColor}`}>
                    <span className="font-bold text-base">{c.count}</span> {c.subText}
                  </p>
                  <p className={`text-lg font-bold ${c.valueColor} truncate`}>
                    {cardLoading ? '...' : formatRupiah(c.total)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Cari sumber, pembayar, atau keterangan..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Cari
            </button>
            {searchQuery && (
              <button
                onClick={() => { setSearchInput(''); setSearchQuery(''); setCurrentPage(1); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <DataTable
            columns={columns}
            data={data}
            progressPending={loading}
            pagination
            paginationServer
            paginationTotalRows={totalRecords}
            paginationPerPage={pageSize}
            paginationDefaultPage={currentPage}
            onChangePage={(page) => setCurrentPage(page)}
            onChangeRowsPerPage={(size) => { setPageSize(size); setCurrentPage(1); }}
            persistTableHead
            noDataComponent={
              <div className="py-12 text-center text-gray-400">
                <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada penerimaan feedmill</p>
              </div>
            }
            customStyles={{
              headRow: { style: { backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: 600 } },
              rows: { style: { borderBottom: '1px solid #f3f4f6', '&:hover': { backgroundColor: '#f9fafb' } } },
              headCells: { style: { fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' } },
              cells: { style: { fontSize: '14px', padding: '12px 16px' } },
            }}
          />
        </div>
      </div>

      {/* Detail Modal */}
      {detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Detail Penerimaan</h2>
              <button onClick={() => setDetailData(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Tgl Jual</label>
                  <p className="text-sm text-gray-900">{formatDate(detailData.tgl_jual)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                  <p className="text-sm font-semibold text-gray-900">
                    {detailData.is_cancel === 1 ? 'Dibatalkan' : (STATUS_BAYAR[detailData.payment_status]?.label || '-')}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 uppercase">No Faktur</label>
                  <p className="text-sm font-mono font-semibold text-gray-900">{detailData.no_faktur || '-'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 uppercase">Penjualan Ke</label>
                  <p className="text-sm font-semibold text-gray-900">{detailData.penjualan_ke || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Nominal Tagihan</label>
                  <p className="text-sm font-semibold text-gray-900">{formatRupiah(detailData.nominal)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Diterima</label>
                  <p className="text-sm font-semibold text-emerald-700">{formatRupiah(detailData.total_terbayar)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Sisa</label>
                  <p className="text-sm font-semibold text-red-700">{formatRupiah(detailData.sisa)}</p>
                </div>
                {detailData.keterangan && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500 uppercase">Keterangan</label>
                    <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">{detailData.keterangan}</p>
                  </div>
                )}
              </div>

              {detailData.details && detailData.details.length > 0 && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">Riwayat Penerimaan</h3>
                  <div className="space-y-2">
                    {detailData.details.map((d, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                        <div>
                          <p className="font-medium text-gray-800">{formatRupiah(d.amount)}</p>
                          <p className="text-xs text-gray-500">{formatDate(d.payment_date)} — {d.metode_pembayaran || '-'} — {d.nama_pembayar || '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(detailData.sisa || 0) > 0 && detailData.is_cancel === 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => { handleBayar(detailData); setDetailData(null); }}
                    className="w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Banknote className="w-4 h-4" />
                    Terima Sisa {formatRupiah(detailData.sisa)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl p-6 shadow-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Memuat detail...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenerimaanFeedmillPage;
