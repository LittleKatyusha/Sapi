import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, XCircle, Banknote, Search, RotateCcw, TrendingUp, Calendar, CalendarDays, CalendarRange, AlertCircle } from 'lucide-react';

import useDocumentTitle from '../../../hooks/useDocumentTitle';
import feedmillKeuanganService from '../../../services/feedmillKeuanganService';
import { useNotification } from '../../../components/shared/Notification';

import ModernKeuanganTable from '../../ho/keuangan/components/ModernKeuanganTable';
import SearchableSelect from '../../../components/shared/SearchableSelect';

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

const STATUS_BAYAR_TEXT = {
  0: 'Belum Lunas',
  1: 'Lunas',
  2: 'Belum Bayar',
};

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: '2', label: 'Belum Bayar' },
  { value: '0', label: 'Belum Lunas' },
  { value: '1', label: 'Lunas' },
];

const TIPE_OPTIONS = [
  { value: '', label: 'Semua Metode' },
  { value: '1', label: 'KAS' },
  { value: '2', label: 'BANK' },
];

const EMPTY_FILTERS = { payment_status: '', tipe_pembayaran: '', start_date: '', end_date: '' };

const PengeluaranFeedmillPage = () => {
  useDocumentTitle('Feedmill: Pengeluaran');
  const navigate = useNavigate();
  const { showError } = useNotification();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);

  const [searchTerm] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterInput, setFilterInput] = useState(EMPTY_FILTERS);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [cardData, setCardData] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);

  const fetchCardData = useCallback(async () => {
    setCardLoading(true);
    const res = await feedmillKeuanganService.getCardData();
    setCardLoading(false);
    if (res.success) {
      const payload = res.data?.data ?? res.data;
      setCardData(payload);
    }
  }, []);

  const fetchData = useCallback(async (page = currentPage, size = perPage, search = searchTerm, filt = filters) => {
    setLoading(true);
    setError(null);
    const params = {
      draw: page,
      start: (page - 1) * size,
      length: size,
      search: search || undefined,
      payment_status: filt.payment_status || undefined,
      tipe_pembayaran: filt.tipe_pembayaran || undefined,
      start_date: filt.start_date || undefined,
      end_date: filt.end_date || undefined,
    };
    const res = await feedmillKeuanganService.getPengeluaran(params);
    setLoading(false);
    if (res.success) {
      const payload = res.data?.data ?? res.data;
      setData(Array.isArray(payload?.data) ? payload.data : []);
      setTotalItems(payload?.recordsFiltered || payload?.recordsTotal || 0);
    } else {
      setError(res.message);
      setData([]);
      setTotalItems(0);
    }
  }, [currentPage, perPage, searchTerm, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchCardData();
  }, [fetchCardData]);

  // Refresh cards after a payment is recorded (user returns from bayar page)
  useEffect(() => {
    const onFocus = () => fetchCardData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchCardData]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchData(page, perPage, searchTerm, filters);
  };

  const handlePerPageChange = (size) => {
    setPerPage(size);
    setCurrentPage(1);
    fetchData(1, size, searchTerm, filters);
  };

  const handleFilterChange = (field, value) => {
    setFilterInput((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = () => {
    setFilters(filterInput);
    setCurrentPage(1);
    fetchData(1, perPage, searchTerm, filterInput);
  };

  const handleResetFilter = () => {
    setFilterInput(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
    fetchData(1, perPage, searchTerm, EMPTY_FILTERS);
  };

  const handleDetail = async (row) => {
    setDetailLoading(true);
    setDetailData(null);
    const res = await feedmillKeuanganService.showPengeluaran(row.pid);
    setDetailLoading(false);
    if (res.success) {
      setDetailData(res.data);
      setIsDetailModalOpen(true);
    } else {
      showError(res.message || 'Gagal memuat detail');
    }
    setOpenMenuId(null);
  };

  const handleBayar = (row) => {
    navigate(
      `/feedmil/keuangan/pengeluaran/bayar/${encodeURIComponent(row.pid)}`,
      { state: { from: '/feedmil/pembelian-feedmil' } }
    );
    setOpenMenuId(null);
  };

  const dateClass = "px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="w-full max-w-none mx-0 space-y-4 md:space-y-5">
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Wallet size={20} className="text-blue-500" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Pengeluaran Feedmill</h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Tagihan &amp; pembayaran pembelian feedmill ke supplier
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              {
                label: 'Tagihan Harus Dibayar',
                count: cardData?.tagihan?.jumlah ?? 0,
                total: cardData?.tagihan?.nominal ?? 0,
                icon: AlertCircle,
                bg: 'bg-red-50', border: 'border-red-200', iconBg: 'bg-red-100', iconColor: 'text-red-600',
                labelColor: 'text-red-500', valueColor: 'text-red-700', subColor: 'text-red-600',
                subText: 'tagihan',
              },
              {
                label: 'Pengeluaran Hari Ini',
                count: cardData?.keluarhariini?.jumlah ?? 0,
                total: cardData?.keluarhariini?.nominal ?? 0,
                icon: Calendar,
                bg: 'bg-yellow-50', border: 'border-yellow-200', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600',
                labelColor: 'text-yellow-600', valueColor: 'text-yellow-800', subColor: 'text-yellow-700',
                subText: 'pembayaran',
              },
              {
                label: 'Pengeluaran Minggu Ini',
                count: cardData?.keluarmingguini?.jumlah ?? 0,
                total: cardData?.keluarmingguini?.nominal ?? 0,
                icon: CalendarRange,
                bg: 'bg-orange-50', border: 'border-orange-200', iconBg: 'bg-orange-100', iconColor: 'text-orange-600',
                labelColor: 'text-orange-600', valueColor: 'text-orange-800', subColor: 'text-orange-700',
                subText: 'pembayaran',
              },
              {
                label: 'Pengeluaran Bulan Ini',
                count: cardData?.keluarbulanini?.jumlah ?? 0,
                total: cardData?.keluarbulanini?.nominal ?? 0,
                icon: CalendarDays,
                bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
                labelColor: 'text-blue-500', valueColor: 'text-blue-700', subColor: 'text-blue-600',
                subText: 'pembayaran',
              },
              {
                label: 'Pengeluaran Tahun Ini',
                count: cardData?.keluartahunini?.jumlah ?? 0,
                total: cardData?.keluartahunini?.nominal ?? 0,
                icon: TrendingUp,
                bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
                labelColor: 'text-emerald-600', valueColor: 'text-emerald-700', subColor: 'text-emerald-600',
                subText: 'pembayaran',
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

          {/* Filter + Table */}
          <div className="space-y-4">
            {/* Inline Filter - 1 baris */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
              <div className="flex flex-wrap items-end gap-2.5">
                <div className="flex flex-col gap-1 min-w-[160px]">
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Status</label>
                  <SearchableSelect
                    options={STATUS_OPTIONS}
                    value={filterInput.payment_status}
                    onChange={(val) => handleFilterChange('payment_status', val ?? '')}
                    placeholder="Semua Status"
                    isClearable={false}
                    isSearchable={false}
                    accentColor="blue"
                    className="w-full"
                  />
                </div>

                <div className="flex flex-col gap-1 min-w-[160px]">
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Metode</label>
                  <SearchableSelect
                    options={TIPE_OPTIONS}
                    value={filterInput.tipe_pembayaran}
                    onChange={(val) => handleFilterChange('tipe_pembayaran', val ?? '')}
                    placeholder="Semua Metode"
                    isClearable={false}
                    isSearchable={false}
                    accentColor="blue"
                    className="w-full"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Jatuh Tempo Mulai</label>
                  <input
                    type="date"
                    value={filterInput.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    className={dateClass}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Jatuh Tempo Akhir</label>
                  <input
                    type="date"
                    value={filterInput.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    className={dateClass}
                  />
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={handleApplyFilter}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    <Search className="w-4 h-4" />
                    Cari
                  </button>
                  <button
                    onClick={handleResetFilter}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <ModernKeuanganTable
              data={data}
              loading={loading}
              error={error}
              pagination={{ currentPage, perPage, totalItems }}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              onBayar={handleBayar}
              onDetail={handleDetail}
            />
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Detail Pengeluaran</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Tanggal</label>
                  <p className="text-sm text-gray-900">{formatDate(detailData.tgl_pengeluaran)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                  <p className="text-sm font-semibold text-gray-900">
                    {STATUS_BAYAR_TEXT[detailData.payment_status] || '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 uppercase">Kategori</label>
                  <p className="text-sm font-semibold text-gray-900">{detailData.kategori || 'Pembelian Feedmil'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 uppercase">Penerima / Supplier</label>
                  <p className="text-sm text-gray-900">{detailData.penerima || detailData.nama_supplier || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Nominal Tagihan</label>
                  <p className="text-sm font-semibold text-gray-900">{formatRupiah(detailData.nominal ?? detailData.total_tagihan)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Terbayar</label>
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
                  <h3 className="text-sm font-bold text-gray-800 mb-2">Riwayat Pembayaran</h3>
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

              {(detailData.sisa || 0) > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => { handleBayar(detailData); setIsDetailModalOpen(false); }}
                    className="w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Banknote className="w-4 h-4" />
                    Bayar Sisa {formatRupiah(detailData.sisa)}
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Memuat detail...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default PengeluaranFeedmillPage;
