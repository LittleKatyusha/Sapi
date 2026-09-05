import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, XCircle, FileText, Boxes, Ban, Wallet, History, MoreVertical, AlertCircle, Calendar, CalendarRange, CalendarDays, TrendingUp } from 'lucide-react';

import useDocumentTitle from '../../../hooks/useDocumentTitle';
import pembelianOvkService from '../../../services/pembelianOvkService';
import { useNotification } from '../../../components/shared/Notification';

const formatRupiah = (v) => {
  const n = Number(v || 0);
  return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatNumber = (v, dec = 3) => {
  const n = Number(v || 0);
  return n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec });
};

const getRphId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.id_office || user?.office_id || null;
  } catch {
    return null;
  }
};

const PembelianOvkPage = () => {
  useDocumentTitle('Pembelian OVK RPH');
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();

  const idRph = getRphId();

  const [activeTab, setActiveTab] = useState('histori');
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

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelAlasan, setCancelAlasan] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const [payTarget, setPayTarget] = useState(null);
  const [payHistory, setPayHistory] = useState(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payForm, setPayForm] = useState({ nominal_pembayaran: '', metode_pembayaran: 'tunai', nama_pembayar: '', payment_date: '', note: '' });
  const [paySubmitting, setPaySubmitting] = useState(false);

  const [cardData, setCardData] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuBtnRefs = useRef({});

  const fetchCardData = useCallback(async () => {
    if (!idRph) return;
    setCardLoading(true);
    const res = await pembelianOvkService.getCardData({ id_rph: idRph });
    setCardLoading(false);
    if (res.success) {
      const payload = res.data?.data ?? res.data;
      setCardData(payload);
    }
  }, [idRph]);

  const fetchData = useCallback(async () => {
    if (!idRph) {
      setError('ID RPH tidak ditemukan di session user');
      return;
    }
    setLoading(true);
    setError(null);
    const params = {
      draw: currentPage,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      search: searchQuery || undefined,
      id_rph: idRph,
    };
    const res = activeTab === 'histori'
      ? await pembelianOvkService.getData(params)
      : await pembelianOvkService.getStok(params);
    setLoading(false);
    if (res.success) {
      const payload = res.data;
      setData(payload?.data || []);
      setTotalRecords(payload?.recordsFiltered || payload?.recordsTotal || 0);
    } else {
      setError(res.message);
      setData([]);
    }
  }, [activeTab, currentPage, pageSize, searchQuery, idRph]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchCardData();
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
    const res = await pembelianOvkService.show(row.pid);
    setDetailLoading(false);
    if (res.success) {
      setDetailData(res.data);
    } else {
      showError(res.message || 'Gagal memuat detail');
    }
  };

  const openCancel = (row) => {
    setCancelTarget(row);
    setCancelAlasan('');
  };

  const openPay = async (row) => {
    setPayTarget(row);
    setPayForm({ nominal_pembayaran: '', metode_pembayaran: 'tunai', nama_pembayar: '', payment_date: '', note: '' });
    setPayHistory(null);
    setPayLoading(true);
    const res = await pembelianOvkService.getPaymentHistory(row.pid);
    setPayLoading(false);
    if (res.success) {
      setPayHistory(res.data);
      const sisa = Number(res.data?.sisa_pembayaran || 0);
      if (sisa > 0) {
        setPayForm((f) => ({ ...f, nominal_pembayaran: String(sisa) }));
      }
    } else {
      showError(res.message || 'Gagal memuat riwayat pembayaran');
    }
  };

  const submitPayment = async () => {
    if (!payTarget) return;
    const nominal = Number(payForm.nominal_pembayaran);
    if (!nominal || nominal <= 0) {
      showError('Nominal pembayaran harus > 0');
      return;
    }
    if (!payForm.metode_pembayaran) {
      showError('Metode pembayaran wajib dipilih');
      return;
    }
    setPaySubmitting(true);
    const res = await pembelianOvkService.storePayment({
      pid: payTarget.pid,
      nominal_pembayaran: nominal,
      metode_pembayaran: payForm.metode_pembayaran,
      nama_pembayar: payForm.nama_pembayar || null,
      payment_date: payForm.payment_date || null,
      note: payForm.note || null,
    });
    setPaySubmitting(false);
    if (res.success) {
      showSuccess(res.message || 'Pembayaran berhasil dicatat');
      const hist = await pembelianOvkService.getPaymentHistory(payTarget.pid);
      if (hist.success) setPayHistory(hist.data);
      setPayForm({ nominal_pembayaran: '', metode_pembayaran: 'tunai', nama_pembayar: '', payment_date: '', note: '' });
      fetchData();
    } else {
      showError(res.message || 'Gagal mencatat pembayaran');
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    if (!cancelAlasan.trim()) {
      showError('Alasan pembatalan wajib diisi');
      return;
    }
    setCancelLoading(true);
    const res = await pembelianOvkService.cancel(cancelTarget.pid, cancelAlasan.trim());
    setCancelLoading(false);
    if (res.success) {
      setCancelTarget(null);
      setCancelAlasan('');
      fetchData();
    } else {
      showError(res.message || 'Gagal membatalkan pembelian');
    }
  };

  const historiColumns = [
    {
      name: 'No Faktur',
      selector: (row) => row.nomor_faktur,
      sortable: true,
      cell: (row) => <span className="font-mono text-xs font-semibold text-gray-800">{row.nomor_faktur}</span>,
    },
    {
      name: 'HO Penjual',
      selector: (row) => row.nama_office,
      sortable: true,
      cell: (row) => <span className="text-sm text-gray-700">{row.nama_office || '-'}</span>,
    },
    {
      name: 'Tgl Jual',
      selector: (row) => row.tgl_jual,
      sortable: true,
      cell: (row) => <span className="text-sm text-gray-600">{row.tgl_jual}</span>,
    },
    {
      name: 'Total Qty',
      selector: (row) => row.total_jumlah,
      right: true,
      cell: (row) => <span className="text-sm font-medium text-gray-700">{formatNumber(row.total_jumlah)}</span>,
    },
    {
      name: 'Total Harga',
      selector: (row) => row.total_harga,
      right: true,
      cell: (row) => <span className="text-sm font-semibold text-blue-700">{formatRupiah(row.total_harga)}</span>,
    },
    {
      name: 'Status',
      selector: (row) => row.status_pembayaran,
      center: true,
      cell: (row) => {
        const s = row.status_pembayaran || (row.is_cancel === 1 ? 'dibatalkan' : 'belum_dibayar');
        const map = {
          belum_dibayar: 'bg-amber-50 text-amber-700 border-amber-200',
          belum_lunas: 'bg-blue-50 text-blue-700 border-blue-200',
          lunas: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dibatalkan: 'bg-red-50 text-red-700 border-red-200',
        };
        const label = {
          belum_dibayar: 'Belum Dibayar',
          belum_lunas: 'Belum Lunas',
          lunas: 'Lunas',
          dibatalkan: 'Dibatalkan',
        };
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${map[s] || map.belum_dibayar}`}>
            {label[s] || 'Belum Dibayar'}
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
                <FileText className="w-3.5 h-3.5" /> Detail
              </button>
              {row.is_cancel === 0 && row.status_pembayaran !== 'lunas' && (
                <button
                  onClick={() => { setOpenMenuId(null); navigate(`/rph/keuangan/pengeluaran/bayar/${encodeURIComponent(row.payment_pid || row.pid)}?jenis=rph_feedmil`); }}
                  className="w-full text-left px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                >
                  <Wallet className="w-3.5 h-3.5" /> Bayar
                </button>
              )}
              {row.is_cancel === 0 && row.status_pembayaran !== 'belum_dibayar' && (
                <button
                  onClick={() => { openPay(row); setOpenMenuId(null); }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <History className="w-3.5 h-3.5" /> Riwayat Bayar
                </button>
              )}
              {row.is_cancel === 0 && (
                <button
                  onClick={() => { openCancel(row); setOpenMenuId(null); }}
                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Ban className="w-3.5 h-3.5" /> Batalkan
                </button>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  const stokColumns = [
    {
      name: 'Nama Item',
      selector: (row) => row.nama_item,
      sortable: true,
      wrap: true,
      cell: (row) => <span className="text-sm font-medium text-gray-800">{row.nama_item}</span>,
    },
    {
      name: 'Satuan',
      selector: (row) => row.nama_satuan,
      sortable: true,
      cell: (row) => <span className="text-sm text-gray-600">{row.nama_satuan || '-'}</span>,
    },
    {
      name: 'Tgl Terima',
      selector: (row) => row.tgl_terima,
      sortable: true,
      cell: (row) => <span className="text-sm text-gray-600">{row.tgl_terima}</span>,
    },
    {
      name: 'Harga Beli',
      selector: (row) => row.harga_beli,
      right: true,
      cell: (row) => <span className="text-sm text-gray-700">{formatRupiah(row.harga_beli)}</span>,
    },
    {
      name: 'Jumlah Awal',
      selector: (row) => row.jumlah_awal,
      right: true,
      cell: (row) => <span className="text-sm text-gray-600">{formatNumber(row.jumlah_awal)}</span>,
    },
    {
      name: 'Sisa Stok',
      selector: (row) => row.jumlah,
      right: true,
      cell: (row) => <span className="text-sm font-semibold text-emerald-700">{formatNumber(row.jumlah)}</span>,
    },
  ];

  const totalStok = activeTab === 'stok' ? data.reduce((s, r) => s + Number(r.jumlah || 0), 0) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pembelian OVK RPH</h1>
            <p className="text-sm text-gray-500 mt-1">Beli OVK dari HO & monitor stok RPH</p>
          </div>
          <button
            onClick={() => navigate('/rph/pembelian-ovk/add')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 text-sm font-medium active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            Beli OVK
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex gap-1 w-fit">
          <button
            onClick={() => { setActiveTab('histori'); setCurrentPage(1); setSearchQuery(''); setSearchInput(''); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'histori' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            Histori Pembelian
          </button>
          <button
            onClick={() => { setActiveTab('stok'); setCurrentPage(1); setSearchQuery(''); setSearchInput(''); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'stok' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            Stok OVK
          </button>
        </div>

        {/* Summary Cards (histori tab) */}
        {activeTab === 'histori' && (
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
                label: 'Pembayaran Hari Ini',
                count: cardData?.keluarhariini?.jumlah ?? 0,
                total: cardData?.keluarhariini?.nominal ?? 0,
                icon: Calendar,
                bg: 'bg-yellow-50', border: 'border-yellow-200', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600',
                labelColor: 'text-yellow-600', valueColor: 'text-yellow-800', subColor: 'text-yellow-700',
                subText: 'pembayaran',
              },
              {
                label: 'Pembayaran Minggu Ini',
                count: cardData?.keluarmingguini?.jumlah ?? 0,
                total: cardData?.keluarmingguini?.nominal ?? 0,
                icon: CalendarRange,
                bg: 'bg-orange-50', border: 'border-orange-200', iconBg: 'bg-orange-100', iconColor: 'text-orange-600',
                labelColor: 'text-orange-600', valueColor: 'text-orange-800', subColor: 'text-orange-700',
                subText: 'pembayaran',
              },
              {
                label: 'Pembayaran Bulan Ini',
                count: cardData?.keluarbulanini?.jumlah ?? 0,
                total: cardData?.keluarbulanini?.nominal ?? 0,
                icon: CalendarDays,
                bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
                labelColor: 'text-blue-500', valueColor: 'text-blue-700', subColor: 'text-blue-600',
                subText: 'pembayaran',
              },
              {
                label: 'Pembayaran Tahun Ini',
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
        )}

        {/* Stats */}
        {activeTab === 'stok' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Boxes className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-gray-500 uppercase">Total Batch</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{totalRecords}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Boxes className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-gray-500 uppercase">Total Sisa Stok</span>
              </div>
              <p className="text-xl font-bold text-emerald-700">{formatNumber(totalStok)}</p>
            </div>
          </div>
        )}

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
                placeholder={activeTab === 'histori' ? 'Cari nomor faktur atau HO...' : 'Cari nama item OVK...'}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
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
            columns={activeTab === 'histori' ? historiColumns : stokColumns}
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
                {activeTab === 'histori' ? <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" /> : <Boxes className="w-10 h-10 mx-auto mb-2 opacity-50" />}
                <p className="text-sm">{activeTab === 'histori' ? 'Belum ada pembelian OVK' : 'Belum ada stok OVK'}</p>
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
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Detail Pembelian</h2>
                <p className="text-sm text-gray-500 font-mono">{detailData.nomor_faktur}</p>
              </div>
              <button onClick={() => setDetailData(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">HO Penjual</label>
                  <p className="text-sm font-semibold text-gray-900">{detailData.nama_office || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Tanggal</label>
                  <p className="text-sm text-gray-900">{detailData.tgl_jual}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Total Jumlah</label>
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(detailData.total_jumlah)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                  <p className={`text-sm font-semibold ${detailData.is_cancel === 1 ? 'text-red-700' : 'text-emerald-700'}`}>
                    {detailData.is_cancel === 1 ? `Dibatalkan` : 'Aktif'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Total Harga</label>
                  <p className="text-sm font-semibold text-blue-700">{formatRupiah(detailData.total_harga)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Total HPP</label>
                  <p className="text-sm text-gray-700">{formatRupiah(detailData.total_hpp)}</p>
                </div>
              </div>

              {detailData.keterangan && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Keterangan</label>
                  <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">{detailData.keterangan}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Detail Item OVK</label>
                <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Item</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Jumlah</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Harga/unit</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(detailData.details || []).map((d, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-gray-800">
                            <div className="font-medium">{d.nama_item}</div>
                            <div className="text-xs text-gray-500">{d.nama_satuan || '-'}</div>
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatNumber(d.jumlah)}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatRupiah(d.harga_jual)}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900">{formatRupiah(d.harga_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-600" />
                Batalkan Pembelian
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Faktur <span className="font-mono font-semibold">{cancelTarget.nomor_faktur}</span>
              </p>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                Pembatalan akan: restore stok OVK warehouse HO, hapus stok RPH, reverse 2 jurnal (SALES + PURCHASE), dan menonaktifkan faktur. Pembelian yang stok RPH-nya sudah dipakai tidak dapat dibatalkan.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Pembatalan <span className="text-red-500">*</span></label>
                <textarea
                  value={cancelAlasan}
                  onChange={(e) => setCancelAlasan(e.target.value)}
                  rows={3}
                  maxLength={255}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Tulis alasan pembatalan..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
              <button
                onClick={() => { setCancelTarget(null); setCancelAlasan(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {cancelLoading ? 'Memproses...' : 'Konfirmasi Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  Pembayaran OVK
                </h2>
                <p className="text-sm text-gray-500 font-mono">{payTarget.nomor_faktur}</p>
              </div>
              <button onClick={() => { setPayTarget(null); setPayHistory(null); }} className="text-gray-400 hover:text-gray-600 p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {payLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ) : payHistory ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="text-xs font-medium text-gray-500 uppercase">Total Tagihan</div>
                    <div className="text-sm font-bold text-gray-900 mt-1">{formatRupiah(payHistory.total_tagihan)}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                    <div className="text-xs font-medium text-emerald-600 uppercase">Terbayar</div>
                    <div className="text-sm font-bold text-emerald-700 mt-1">{formatRupiah(payHistory.total_terbayar)}</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <div className="text-xs font-medium text-amber-600 uppercase">Sisa</div>
                    <div className="text-sm font-bold text-amber-700 mt-1">{formatRupiah(payHistory.sisa_pembayaran)}</div>
                  </div>
                </div>
              ) : null}

              {payHistory && Number(payHistory.sisa_pembayaran) > 0 && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-800">Form Pembayaran</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nominal <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={payForm.nominal_pembayaran}
                        onChange={(e) => setPayForm((f) => ({ ...f, nominal_pembayaran: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Metode <span className="text-red-500">*</span></label>
                      <select
                        value={payForm.metode_pembayaran}
                        onChange={(e) => setPayForm((f) => ({ ...f, metode_pembayaran: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="tunai">Tunai</option>
                        <option value="transfer_bank">Transfer Bank</option>
                        <option value="transfer_cash">Transfer Cash</option>
                        <option value="cek">Cek</option>
                        <option value="giro">Giro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nama Pembayar</label>
                      <input
                        type="text"
                        value={payForm.nama_pembayar}
                        onChange={(e) => setPayForm((f) => ({ ...f, nama_pembayar: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Opsional"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tgl Pembayaran</label>
                      <input
                        type="date"
                        value={payForm.payment_date}
                        onChange={(e) => setPayForm((f) => ({ ...f, payment_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Catatan</label>
                      <input
                        type="text"
                        value={payForm.note}
                        onChange={(e) => setPayForm((f) => ({ ...f, note: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Opsional"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={submitPayment}
                      disabled={paySubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      {paySubmitting ? 'Memproses...' : 'Bayar'}
                    </button>
                  </div>
                </div>
              )}

              {payHistory && (payHistory.details || []).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Riwayat Pembayaran
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Tgl</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Nominal</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Metode</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Pembayar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {payHistory.details.map((d, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-gray-700">{d.payment_date || '-'}</td>
                            <td className="px-3 py-2 text-right font-medium text-emerald-700">{formatRupiah(d.amount)}</td>
                            <td className="px-3 py-2 text-gray-700">{d.metode_pembayaran || '-'}</td>
                            <td className="px-3 py-2 text-gray-700">{d.nama_pembayar || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
    </div>
  );
};

export default PembelianOvkPage;
