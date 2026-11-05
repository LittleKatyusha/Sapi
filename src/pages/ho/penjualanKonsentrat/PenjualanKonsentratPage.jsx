import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { Search, XCircle, FileText, TrendingUp, Calendar, Ban, MoreVertical, History, Wallet, Plus, Trash2, AlertCircle } from 'lucide-react';

import useDocumentTitle from '../../../hooks/useDocumentTitle';
import penjualanKonsentratService from '../../../services/penjualanKonsentratService';
import { useNotification } from '../../../components/shared/Notification';

const formatRupiah = (v) => {
  const n = Number(v || 0);
  return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatNumber = (v, dec = 3) => {
  const n = Number(v || 0);
  return n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec });
};

const TABS = [
  { id: 'all', label: 'Semua Penjualan' },
  { id: 'rph', label: 'Ke RPH' },
  { id: 'external', label: 'Eksternal' },
];

const PenjualanKonsentratPage = () => {
  useDocumentTitle('Penjualan Konsentrat HO');
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [activeTab, setActiveTab] = useState('all');
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

  const [menuOpenPid, setMenuOpenPid] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null);

  // Modal Tambah Penjualan Eksternal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [pembeliList, setPembeliList] = useState([]);
  const [resepList, setResepList] = useState([]);
  const [isManualPembeli, setIsManualPembeli] = useState(false);
  const [formData, setFormData] = useState({
    tgl_jual: new Date().toISOString().split('T')[0],
    id_pembeli_ho: '',
    nama_pembeli_external: '',
    tipe_pembayaran: 1, // 1=Kas, 2=Bank, 3=Tempo
    diskon: 0,
    penambahan_harga: 0,
    nama_supir: '',
    plat_nomor: '',
    nama_penerima: '',
    keterangan: '',
    items: [],
  });

  // Modal Cancel State
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelAlasan, setCancelAlasan] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = {
      draw: currentPage,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      search: searchQuery || undefined,
      tipe_tujuan: activeTab !== 'all' ? activeTab : undefined,
    };
    const res = await penjualanKonsentratService.getData(params);
    setLoading(false);
    if (res.success) {
      const payload = res.data;
      setData(payload?.data || []);
      setTotalRecords(payload?.recordsFiltered || payload?.recordsTotal || 0);
    } else {
      setError(res.message);
      setData([]);
    }
  }, [currentPage, pageSize, searchQuery, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleDetail = async (row) => {
    setMenuOpenPid(null);
    setDetailLoading(true);
    setDetailData(null);
    const res = await penjualanKonsentratService.show(row.pid);
    setDetailLoading(false);
    if (res.success) {
      setDetailData(res.data);
    } else {
      showError(res.message || 'Gagal memuat detail');
    }
  };

  const handleHistory = async (row) => {
    setMenuOpenPid(null);
    setHistoryTarget(row);
    setHistoryData(null);
    setHistoryLoading(true);
    const res = await penjualanKonsentratService.getPaymentHistory(row.pid);
    setHistoryLoading(false);
    if (res.success) {
      setHistoryData(res.data);
    } else {
      showError(res.message || 'Gagal memuat riwayat pembayaran');
    }
  };

  const handleOpenAddModal = async () => {
    setIsAddModalOpen(true);
    const [pembeliRes, resepRes] = await Promise.all([
      penjualanKonsentratService.getPembeliOptions(),
      penjualanKonsentratService.getResepTersedia(),
    ]);
    if (pembeliRes.success) setPembeliList(pembeliRes.data || []);
    if (resepRes.success) setResepList(resepRes.data || []);

    setFormData({
      tgl_jual: new Date().toISOString().split('T')[0],
      id_pembeli_ho: '',
      nama_pembeli_external: '',
      tipe_pembayaran: 1,
      diskon: 0,
      penambahan_harga: 0,
      nama_supir: '',
      plat_nomor: '',
      nama_penerima: '',
      keterangan: '',
      items: [
        { id_resep: '', jumlah: '', harga_jual: 0, stok_tersedia: 0, hpp_per_kg: 0 },
      ],
    });
    setIsManualPembeli(false);
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id_resep: '', jumlah: '', harga_jual: 0, stok_tersedia: 0, hpp_per_kg: 0 },
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      const item = { ...updated[index], [field]: value };

      if (field === 'id_resep') {
        const foundResep = resepList.find((r) => String(r.id) === String(value));
        if (foundResep) {
          item.harga_jual = foundResep.harga_jual_per_kg || 0;
          item.stok_tersedia = foundResep.stok_kg || 0;
          item.hpp_per_kg = foundResep.hpp_per_kg || 0;
        } else {
          item.harga_jual = 0;
          item.stok_tersedia = 0;
          item.hpp_per_kg = 0;
        }
      }

      updated[index] = item;
      return { ...prev, items: updated };
    });
  };

  // Calculations for Add Modal
  const itemsSubtotal = formData.items.reduce(
    (sum, it) => sum + (Number(it.jumlah || 0) * Number(it.harga_jual || 0)),
    0
  );
  const itemsTotalKg = formData.items.reduce(
    (sum, it) => sum + Number(it.jumlah || 0),
    0
  );
  const itemsTotalHpp = formData.items.reduce(
    (sum, it) => sum + (Number(it.jumlah || 0) * Number(it.hpp_per_kg || 0)),
    0
  );
  const grandTotal = Math.max(
    0,
    itemsSubtotal - Number(formData.diskon || 0) + Number(formData.penambahan_harga || 0)
  );
  const estMargin = grandTotal - itemsTotalHpp;

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!isManualPembeli && !formData.id_pembeli_ho) {
      showError('Pilih pembeli eksternal atau centang input manual');
      return;
    }
    if (isManualPembeli && !formData.nama_pembeli_external.trim()) {
      showError('Nama pembeli eksternal wajib diisi');
      return;
    }
    if (formData.items.length === 0) {
      showError('Minimal pilih satu resep');
      return;
    }
    for (const item of formData.items) {
      if (!item.id_resep) {
        showError('Pilih resep untuk semua baris');
        return;
      }
      const qty = Number(item.jumlah || 0);
      if (qty <= 0) {
        showError('Jumlah kg harus lebih dari 0');
        return;
      }
      if (qty > item.stok_tersedia) {
        showError(`Jumlah (${qty} kg) melebihi stok tersedia (${item.stok_tersedia} kg)`);
        return;
      }
    }

    setAddLoading(true);
    const payload = {
      tgl_jual: formData.tgl_jual,
      id_pembeli_ho: !isManualPembeli && formData.id_pembeli_ho ? Number(formData.id_pembeli_ho) : null,
      nama_pembeli_external: isManualPembeli ? formData.nama_pembeli_external.trim() : null,
      tipe_pembayaran: Number(formData.tipe_pembayaran || 1),
      diskon: Number(formData.diskon || 0),
      penambahan_harga: Number(formData.penambahan_harga || 0),
      nama_supir: formData.nama_supir.trim() || null,
      plat_nomor: formData.plat_nomor.trim() || null,
      nama_penerima: formData.nama_penerima.trim() || null,
      keterangan: formData.keterangan.trim() || null,
      items: formData.items.map((it) => ({
        id_resep: Number(it.id_resep),
        jumlah: Number(it.jumlah),
        harga_jual: Number(it.harga_jual),
      })),
    };

    const res = await penjualanKonsentratService.create(payload);
    setAddLoading(false);
    if (res.success) {
      showSuccess('Penjualan konsentrat eksternal berhasil dibuat');
      setIsAddModalOpen(false);
      fetchData();
    } else {
      showError(res.message || 'Gagal menyimpan transaksi');
    }
  };

  const handleOpenCancel = (row) => {
    setMenuOpenPid(null);
    setCancelTarget(row);
    setCancelAlasan('');
  };

  const handleSubmitCancel = async () => {
    if (!cancelTarget) return;
    if (!cancelAlasan.trim()) {
      showError('Alasan pembatalan wajib diisi');
      return;
    }
    setCancelLoading(true);
    const res = await penjualanKonsentratService.cancel({
      pid: cancelTarget.pid,
      alasan: cancelAlasan.trim(),
    });
    setCancelLoading(false);
    if (res.success) {
      showSuccess('Transaksi penjualan konsentrat berhasil dibatalkan');
      setCancelTarget(null);
      fetchData();
    } else {
      showError(res.message || 'Gagal membatalkan transaksi');
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenPid(null);
      }
    };
    if (menuOpenPid) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpenPid]);

  const columns = [
    {
      name: 'No Faktur',
      selector: (row) => row.nomor_faktur,
      sortable: true,
      cell: (row) => <span className="font-mono text-xs font-semibold text-gray-800">{row.nomor_faktur}</span>,
    },
    {
      name: 'Tujuan / Pembeli',
      selector: (row) => row.nama_tujuan,
      sortable: true,
      cell: (row) => {
        const isExt = row.tipe_tujuan === 'external';
        return (
          <div className="flex items-center gap-1.5 py-1">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border shrink-0 ${
                isExt
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {isExt ? 'Eksternal' : 'RPH'}
            </span>
            <span className="text-sm font-medium text-gray-800 truncate" title={row.nama_tujuan || row.nama_rph || '-'}>
              {row.nama_tujuan || row.nama_rph || '-'}
            </span>
          </div>
        );
      },
    },
    {
      name: 'Tgl Jual',
      selector: (row) => row.tgl_jual,
      sortable: true,
      cell: (row) => <span className="text-sm text-gray-600">{row.tgl_jual}</span>,
    },
    {
      name: 'Total (kg)',
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
      name: 'HPP',
      selector: (row) => row.total_hpp,
      right: true,
      cell: (row) => <span className="text-sm text-gray-600">{formatRupiah(row.total_hpp)}</span>,
    },
    {
      name: 'Margin',
      selector: (row) => row.total_margin,
      right: true,
      cell: (row) => <span className="text-sm font-semibold text-emerald-700">{formatRupiah(row.total_margin)}</span>,
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
        <div className="relative" ref={menuOpenPid === row.pid ? menuRef : null}>
          <button
            onClick={(e) => {
              if (menuOpenPid === row.pid) {
                setMenuOpenPid(null);
              } else {
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 4, left: rect.right - 176 });
                setMenuOpenPid(row.pid);
              }
            }}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Menu aksi"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpenPid === row.pid && (
            <div
              className="fixed z-[9999] w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <button
                onClick={() => handleDetail(row)}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5" />
                Detail
              </button>
              {row.is_cancel === 0 && row.status_pembayaran !== 'lunas' && row.payment_pid && (
                <button
                  onClick={() => { setMenuOpenPid(null); navigate(`/feedmil/keuangan/penerimaan/bayar/${encodeURIComponent(row.payment_pid)}`); }}
                  className="w-full text-left px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Bayar
                </button>
              )}
              <button
                onClick={() => handleHistory(row)}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <History className="w-3.5 h-3.5" />
                Riwayat Pembayaran
              </button>
              {row.is_cancel === 0 && Number(row.total_terbayar || 0) === 0 && (
                <button
                  onClick={() => handleOpenCancel(row)}
                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Batalkan Penjualan
                </button>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  const totalAktif = data.filter((r) => r.is_cancel === 0).length;
  const totalCancel = data.filter((r) => r.is_cancel === 1).length;
  const sumHarga = data.filter((r) => r.is_cancel === 0).reduce((s, r) => s + Number(r.total_harga || 0), 0);
  const sumMargin = data.filter((r) => r.is_cancel === 0).reduce((s, r) => s + Number(r.total_margin || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-full mx-auto space-y-6">
        {/* Header Title & Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Penjualan Konsentrat HO</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola dan pantau penjualan konsentrat HO ke RPH maupun penjualan eksternal</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Penjualan Eksternal
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Total Faktur</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{totalRecords}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Total Penjualan</span>
            </div>
            <p className="text-base font-bold text-gray-900">{formatRupiah(sumHarga)}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Aktif (Hal)</span>
            </div>
            <p className="text-xl font-bold text-emerald-700">{totalAktif}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Total Margin</span>
            </div>
            <p className="text-base font-bold text-emerald-700">{formatRupiah(sumMargin)}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Ban className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Dibatalkan</span>
            </div>
            <p className="text-xl font-bold text-red-700">{totalCancel}</p>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
          <div className="flex border-b border-gray-200">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Cari nomor faktur, nama RPH, atau nama pembeli eksternal..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Cari
            </button>
            {searchQuery && (
              <button
                onClick={() => { setSearchInput(''); setSearchQuery(''); setCurrentPage(1); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
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
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada penjualan konsentrat</p>
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

      {/* Modal Tambah Penjualan Eksternal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto my-6">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Tambah Penjualan Konsentrat Eksternal</h2>
                <p className="text-xs text-gray-500">Penjualan konsentrat keluar langsung dari Feedmill ke pembeli eksternal</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tanggal Jual */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Tanggal Penjualan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tgl_jual}
                    onChange={(e) => setFormData({ ...formData, tgl_jual: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Tipe Pembayaran */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Tipe Pembayaran <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.tipe_pembayaran}
                    onChange={(e) => setFormData({ ...formData, tipe_pembayaran: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>Kas (Tunai)</option>
                    <option value={2}>Transfer Bank</option>
                    <option value={3}>Tempo / Piutang</option>
                  </select>
                </div>
              </div>

              {/* Pembeli Eksternal */}
              <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">
                    Pembeli Eksternal <span className="text-red-500">*</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isManualPembeli}
                      onChange={(e) => setIsManualPembeli(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span>Input Nama Manual</span>
                  </label>
                </div>

                {!isManualPembeli ? (
                  <select
                    value={formData.id_pembeli_ho}
                    onChange={(e) => setFormData({ ...formData, id_pembeli_ho: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Pilih Pembeli Dari Data Master --</option>
                    {pembeliList.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Masukkan nama pembeli eksternal..."
                    value={formData.nama_pembeli_external}
                    onChange={(e) => setFormData({ ...formData, nama_pembeli_external: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>

              {/* Items Resep */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">
                    Resep Konsentrat yang Dijual <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Baris
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((item, index) => {
                    const rowSubtotal = Number(item.jumlah || 0) * Number(item.harga_jual || 0);
                    return (
                      <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        <div className="flex-1 w-full sm:w-auto">
                          <select
                            value={item.id_resep}
                            onChange={(e) => handleItemChange(index, 'id_resep', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-- Pilih Resep Konsentrat --</option>
                            {resepList.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.kode} - {r.name} (Stok: {formatNumber(r.stok_kg)} kg)
                              </option>
                            ))}
                          </select>
                          {item.id_resep && (
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Tersedia: <span className="font-semibold text-gray-700">{formatNumber(item.stok_tersedia)} kg</span> | HPP: {formatRupiah(item.hpp_per_kg)}/kg
                            </p>
                          )}
                        </div>

                        <div className="w-28">
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            placeholder="Qty (kg)"
                            value={item.jumlah}
                            onChange={(e) => handleItemChange(index, 'jumlah', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-right focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div className="w-36">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="Harga Jual/kg"
                            value={item.harga_jual}
                            onChange={(e) => handleItemChange(index, 'harga_jual', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-right focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div className="w-32 text-right">
                          <span className="text-xs font-semibold text-gray-800">
                            {formatRupiah(rowSubtotal)}
                          </span>
                        </div>

                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Diskon & Penambahan Harga */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.diskon}
                    onChange={(e) => setFormData({ ...formData, diskon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Penambahan Biaya Lain (Rp)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.penambahan_harga}
                    onChange={(e) => setFormData({ ...formData, penambahan_harga: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Delivery Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">Nama Supir</label>
                  <input
                    type="text"
                    value={formData.nama_supir}
                    onChange={(e) => setFormData({ ...formData, nama_supir: e.target.value })}
                    placeholder="Opsional"
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">Plat Nomor</label>
                  <input
                    type="text"
                    value={formData.plat_nomor}
                    onChange={(e) => setFormData({ ...formData, plat_nomor: e.target.value })}
                    placeholder="Contoh: B 1234 CD"
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">Penerima</label>
                  <input
                    type="text"
                    value={formData.nama_penerima}
                    onChange={(e) => setFormData({ ...formData, nama_penerima: e.target.value })}
                    placeholder="Opsional"
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Keterangan</label>
                <textarea
                  rows="2"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Catatan tambahan transaksi..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                ></textarea>
              </div>

              {/* Summary Card */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Total Kuantitas:</span>
                  <span className="font-semibold text-gray-800">{formatNumber(itemsTotalKg)} kg</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Subtotal Resep:</span>
                  <span className="font-semibold text-gray-800">{formatRupiah(itemsSubtotal)}</span>
                </div>
                {Number(formData.diskon || 0) > 0 && (
                  <div className="flex justify-between text-xs text-red-600">
                    <span>Diskon:</span>
                    <span>- {formatRupiah(formData.diskon)}</span>
                  </div>
                )}
                {Number(formData.penambahan_harga || 0) > 0 && (
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Penambahan Harga:</span>
                    <span>+ {formatRupiah(formData.penambahan_harga)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-blue-900 border-t border-blue-200 pt-2">
                  <span>Grand Total Penjualan:</span>
                  <span>{formatRupiah(grandTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-700 pt-1">
                  <span>Estimasi Margin:</span>
                  <span className="font-semibold">{formatRupiah(estMargin)}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  disabled={addLoading}
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {addLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  Simpan Penjualan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Detail Penjualan Konsentrat</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-mono text-gray-600">{detailData.nomor_faktur}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      detailData.tipe_tujuan === 'external'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {detailData.tipe_tujuan === 'external' ? 'Eksternal' : 'RPH'}
                  </span>
                </div>
              </div>
              <button onClick={() => setDetailData(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    {detailData.tipe_tujuan === 'external' ? 'Pembeli Eksternal' : 'RPH Pembeli'}
                  </label>
                  <p className="text-sm font-semibold text-gray-900">
                    {detailData.nama_pembeli || detailData.nama_tujuan || detailData.nama_rph || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Tanggal Jual</label>
                  <p className="text-sm text-gray-900">{detailData.tgl_jual}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Total Jumlah</label>
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(detailData.total_jumlah)} kg</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                  <p className={`text-sm font-semibold ${detailData.is_cancel === 1 ? 'text-red-700' : 'text-emerald-700'}`}>
                    {detailData.is_cancel === 1 ? `Dibatalkan (${detailData.tgl_cancel || ''})` : 'Aktif'}
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
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Total Margin</label>
                  <p className="text-sm font-semibold text-emerald-700">{formatRupiah(detailData.total_margin)}</p>
                </div>
                {detailData.nama_supir && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Supir / Plat</label>
                    <p className="text-sm text-gray-700">{detailData.nama_supir} {detailData.plat_nomor ? `(${detailData.plat_nomor})` : ''}</p>
                  </div>
                )}
              </div>

              {detailData.keterangan && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Keterangan</label>
                  <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">{detailData.keterangan}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Detail Batch Resep</label>
                <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Resep</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Jumlah</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Harga Jual/kg</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">HPP/kg</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Margin</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(detailData.details || []).map((d, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-gray-800">
                            <div className="font-mono text-xs text-gray-500">{d.resep_kode}</div>
                            <div className="font-medium">{d.resep_name}</div>
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatNumber(d.jumlah)} kg</td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatRupiah(d.harga_jual)}</td>
                          <td className="px-3 py-2 text-right text-gray-600">{formatRupiah(d.hpp_per_kg)}</td>
                          <td className="px-3 py-2 text-right text-emerald-700">{formatRupiah(d.margin)}</td>
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

      {/* Modal Batalkan Transaksi */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-gray-900">Batalkan Penjualan Konsentrat</h3>
                <p className="text-xs text-gray-500 font-mono">{cancelTarget.nomor_faktur}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              Transaksi kepada <span className="font-semibold text-gray-800">{cancelTarget.nama_tujuan || cancelTarget.nama_rph}</span> senilai <span className="font-semibold text-blue-700">{formatRupiah(cancelTarget.total_harga)}</span> akan dibatalkan, stok resep dikembalikan, dan jurnal penjualan dibalikkan.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Alasan Pembatalan <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                value={cancelAlasan}
                onChange={(e) => setCancelAlasan(e.target.value)}
                placeholder="Tuliskan alasan pembatalan..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                disabled={cancelLoading}
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={handleSubmitCancel}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
              >
                {cancelLoading && <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>}
                Konfirmasi Pembatalan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" />
                  Riwayat Pembayaran
                </h2>
                <p className="text-sm text-gray-500 font-mono">{historyTarget.nomor_faktur}</p>
              </div>
              <button onClick={() => { setHistoryTarget(null); setHistoryData(null); }} className="text-gray-400 hover:text-gray-600 p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {historyLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ) : historyData ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs font-medium text-gray-500 uppercase">Total Tagihan</div>
                      <div className="text-sm font-bold text-gray-900 mt-1">{formatRupiah(historyData.total_tagihan)}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                      <div className="text-xs font-medium text-emerald-600 uppercase">Terbayar</div>
                      <div className="text-sm font-bold text-emerald-700 mt-1">{formatRupiah(historyData.total_terbayar)}</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="text-xs font-medium text-amber-600 uppercase">Sisa</div>
                      <div className="text-sm font-bold text-amber-700 mt-1">{formatRupiah(historyData.sisa_pembayaran)}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Detail Pembayaran</h3>
                    {(historyData.details || []).length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
                        Belum ada pembayaran tercatat
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Tgl</th>
                              <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Nominal</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Metode</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Pembayar</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Catatan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {historyData.details.map((d, i) => (
                              <tr key={i}>
                                <td className="px-3 py-2 text-gray-700">{d.payment_date || '-'}</td>
                                <td className="px-3 py-2 text-right font-medium text-emerald-700">{formatRupiah(d.amount)}</td>
                                <td className="px-3 py-2 text-gray-700">{d.metode_pembayaran || '-'}</td>
                                <td className="px-3 py-2 text-gray-700">{d.nama_pembayar || '-'}</td>
                                <td className="px-3 py-2 text-gray-500">{d.note || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
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

export default PenjualanKonsentratPage;
