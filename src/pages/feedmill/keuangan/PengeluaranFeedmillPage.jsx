import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, Search, RotateCcw, TrendingUp, Calendar, CalendarDays, CalendarRange, AlertCircle,
} from 'lucide-react';

import useDocumentTitle from '../../../hooks/useDocumentTitle';
import feedmillKeuanganService from '../../../services/feedmillKeuanganService';
import { useNotification } from '../../../components/shared/Notification';

import ModernKeuanganTable from '../../ho/keuangan/components/ModernKeuanganTable';
import SearchableSelect from '../../../components/shared/SearchableSelect';
import DetailModal from '../../ho/keuanganKas/modals/DetailModal';

const formatRupiah = (v) => {
  const n = Number(v || 0);
  return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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

const JENIS_PEMBELIAN_OPTIONS = [
  { value: '', label: 'Semua Jenis' },
  { value: 'feedmill', label: 'Feedmill' },
  { value: 'ovk', label: 'OVK' },
  { value: 'lain_lain', label: 'Lain-Lain' },
];

const EMPTY_FILTERS = { payment_status: '', tipe_pembayaran: '', jenis_pembelian: '', start_date: '', end_date: '' };

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

  const fetchCardData = useCallback(async (filt = filters) => {
    setCardLoading(true);
    const res = await feedmillKeuanganService.getCardData({
      tipe_pembayaran: filt.tipe_pembayaran || undefined,
      jenis_pembelian: filt.jenis_pembelian || undefined,
    });
    setCardLoading(false);
    if (res.success) {
      const payload = res.data?.data ?? res.data;
      setCardData(payload);
    }
  }, [filters]);

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
      jenis_pembelian: filt.jenis_pembelian || undefined,
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
    fetchCardData(filterInput);
  };

  const handleResetFilter = () => {
    setFilterInput(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
    fetchData(1, perPage, searchTerm, EMPTY_FILTERS);
    fetchCardData(EMPTY_FILTERS);
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
      { state: { from: '/feedmil/keuangan/pengeluaran' } }
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

                <div className="flex flex-col gap-1 min-w-[160px]">
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Jenis Pembelian</label>
                  <SearchableSelect
                    options={JENIS_PEMBELIAN_OPTIONS}
                    value={filterInput.jenis_pembelian}
                    onChange={(val) => handleFilterChange('jenis_pembelian', val ?? '')}
                    placeholder="Semua Jenis"
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

      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailData(null);
        }}
        data={detailData}
        onBayar={handleBayar}
        historyOverride={detailData?.details}
      />

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
