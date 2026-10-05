import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Beef,
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  Scale,
  DollarSign,
  Download,
} from 'lucide-react';
import StokSapiService from '../../../../services/stokSapiService';
import ActionButton from './ActionButton';

const formatRupiah = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return 'Rp ' + Number(val).toLocaleString('id-ID');
};

const formatNumber = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Number(val).toLocaleString('id-ID');
};

const formatPercent = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0,00';
  return Number(val).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const PotongSapiBiasaTab = ({ onRefresh, officeSelector }) => {
  const [jenis, setJenis] = useState('karkas'); // default 'karkas' karena sesuai instruksi user
  const [openMenuId, setOpenMenuId] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [detailModal, setDetailModal] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await StokSapiService.getPotongSapiBiasaData({
        start_date: startDate,
        end_date: endDate,
        jenis: jenis,
        start: 0,
        length: 500,
        _t: Date.now(),
      });

      if (response.success) {
        if (Array.isArray(response.data)) {
          setData(response.data);
        } else if (response.data && Array.isArray(response.data.data)) {
          setData(response.data.data);
        } else {
          setData([]);
        }
      } else {
        setError(response.message || 'Gagal memuat data');
        setData([]);
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat mengambil data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, jenis]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData();
    if (onRefresh) onRefresh();
  };

  const handleShowDetail = async (record) => {
    if (!record.pid) return;
    try {
      const response = await StokSapiService.showPotongSapiBiasa(record.pid);
      if (response.success && response.data) {
        setDetailModal({
          ...response.data,
          enrichedRow: record,
        });
      } else {
        setError(response.message || 'Gagal memuat detail');
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat memuat detail');
    }
  };

  const handleDelete = async (pid) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data potong sapi ini?')) {
      return;
    }

    try {
      setLoading(true);
      const res = await StokSapiService.deletePotongSapiBiasa(pid);
      if (res.success) {
        handleRefresh();
      } else {
        setError(res.message || 'Gagal menghapus data');
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat menghapus data');
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const totalEkor = data.length;
    const totalBeratPotong = data.reduce((acc, row) => acc + (Number(row.berat_setelah_potong || row.total_berat) || 0), 0);
    const totalPenjualan = data.reduce((acc, row) => acc + (Number(row.jumlah) || 0), 0);
    const totalBeliHo = data.reduce((acc, row) => acc + (Number(row.total_beli_ho) || 0), 0);
    const totalLabaRugi = data.reduce((acc, row) => {
      if (row.laba_rugi !== null && row.laba_rugi !== undefined) {
        return acc + Number(row.laba_rugi);
      }
      return acc;
    }, 0);

    return { totalEkor, totalBeratPotong, totalPenjualan, totalBeliHo, totalLabaRugi };
  }, [data]);

  const exportCsv = () => {
    if (!data.length) return;
    const headers = [
      'No',
      'Sapi (Eartag)',
      'RPH',
      'Tanggal Potong',
      'Tanggal Keluar RPH',
      'Berat Hidup (kg)',
      'Berat Setelah Potong (kg)',
      'Persentase (%)',
      'Rasio',
      'Beli Hidup HO (Rp)',
      'Harga Daging/KG (Rp)',
      'Jumlah Penjualan (Rp)',
      'Laba/Rugi (Rp)',
      'Status',
    ];

    const rows = data.map((item, idx) => [
      idx + 1,
      `"${item.sapi || '-'}"`,
      `"${item.rph || '-'}"`,
      `"${item.tgl_potong_raw || item.tgl_potong || '-'}"`,
      `"${item.tgl_keluar_raw || item.tgl_keluar || '-'}"`,
      item.berat_hidup ?? item.berat_sapi ?? 0,
      item.berat_setelah_potong ?? item.total_berat ?? 0,
      Number(item.persentase ?? 0).toFixed(2),
      item.rasio ?? 0,
      item.total_beli_ho ?? 0,
      item.harga_daging_per_kg ?? 0,
      item.jumlah ?? 0,
      item.laba_rugi ?? '-',
      `"${item.status_laba_rugi || '-'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-sapi-potong-${startDate}-sd-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Beef className="h-5 w-5 text-indigo-600" />
            Data Sapi Potong & Penjualan RPH
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring berat sapi keluar setelah potong, persentase penurunan berat, harga jual daging, dan analisa Laba/Rugi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Tipe Transaksi */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setJenis('karkas')}
              className="px-3 py-1.5 rounded-md bg-white text-indigo-700 shadow-sm"
            >
              Karkas (Pedagang)
            </button>
          </div>

          {officeSelector && <div className="min-w-[180px]">{officeSelector}</div>}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <Calendar className="h-4 w-4 text-gray-400 ml-1.5" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-0 bg-transparent py-1 text-xs text-gray-700 focus:outline-none focus:ring-0"
            />
            <span className="text-gray-300 text-xs">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-0 bg-transparent py-1 text-xs text-gray-700 focus:outline-none focus:ring-0"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Memuat...' : 'Refresh'}
          </button>
          <button
            onClick={exportCsv}
            disabled={!data.length}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/30 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-700">Total Sapi Dipotong</span>
            <Beef className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-1 text-xl font-bold text-blue-900">{formatNumber(summary.totalEkor)} <span className="text-xs font-normal text-blue-600">ekor</span></p>
        </div>

        <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-emerald-50/30 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-teal-700">Total Berat Daging</span>
            <Scale className="h-4 w-4 text-teal-600" />
          </div>
          <p className="mt-1 text-xl font-bold text-teal-900">{formatNumber(summary.totalBeratPotong)} <span className="text-xs font-normal text-teal-600">kg</span></p>
        </div>

        <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50/30 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-700">Total Penjualan Daging</span>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </div>
          <p className="mt-1 text-xl font-bold text-purple-900">{formatRupiah(summary.totalPenjualan)}</p>
        </div>

        <div className={`rounded-xl border p-3.5 ${summary.totalLabaRugi >= 0 ? 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50/30' : 'border-rose-100 bg-gradient-to-br from-rose-50 to-red-50/30'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${summary.totalLabaRugi >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>Total Rugi / Laba</span>
            {summary.totalLabaRugi >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-rose-600" />}
          </div>
          <p className={`mt-1 text-xl font-bold ${summary.totalLabaRugi >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
            {summary.totalLabaRugi > 0 ? '+' : ''}{formatRupiah(summary.totalLabaRugi)}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 flex items-start gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-800">Gagal memuat data</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-3 text-center font-semibold uppercase tracking-wider w-12">No</th>
              <th className="px-3 py-3 text-center font-semibold uppercase tracking-wider w-16">Aksi</th>
              <th className="px-3 py-3 text-left font-semibold uppercase tracking-wider">Tipe</th>
              <th className="px-3 py-3 text-left font-semibold uppercase tracking-wider">Sapi (Eartag)</th>
              <th className="px-3 py-3 text-left font-semibold uppercase tracking-wider">Pedagang</th>
              <th className="px-3 py-3 text-left font-semibold uppercase tracking-wider">RPH</th>
              <th className="px-3 py-3 text-left font-semibold uppercase tracking-wider">Tgl Potong</th>
              <th className="px-3 py-3 text-left font-semibold uppercase tracking-wider">Tgl Keluar</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wider">Berat Hidup</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wider">Berat Potong</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wider">Persentase</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wider">Beli Hidup HO</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wider">Harga/KG</th>
              <th className="px-3 py-3 text-right font-semibold uppercase tracking-wider">Jumlah Penjualan</th>
              <th className="px-3 py-3 text-center font-semibold uppercase tracking-wider">Rugi / Laba</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={15} className="px-4 py-12 text-center">
                  <Loader2 className="h-7 w-7 animate-spin text-slate-400 mx-auto" />
                  <p className="mt-2 text-xs text-slate-500">Memuat data sapi potong...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={15} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="rounded-full bg-indigo-50 p-3 mb-2">
                      <Beef className="h-8 w-8 text-indigo-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Belum Ada Data Sapi Potong</p>
                    <p className="text-xs text-slate-500">Data pemotongan sapi dan penjualan daging akan muncul di sini.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const isLaba = item.status_laba_rugi === 'LABA';
                const isRugi = item.status_laba_rugi === 'RUGI';
                const isImpas = item.status_laba_rugi === 'IMPAS';
                const isBelumTerjual = !item.status_laba_rugi || item.status_laba_rugi === 'BELUM_TERJUAL';

                return (
                  <tr key={item.pubid || index} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3 py-2.5 text-center text-slate-600 whitespace-nowrap">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <ActionButton
                          row={{ id: item.pid || index, ...item }}
                          openMenuId={openMenuId}
                          setOpenMenuId={setOpenMenuId}
                          onDetail={() => handleShowDetail(item)}
                          onDelete={() => handleDelete(item.pid)}
                          onEdit={null}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.tipe_potong === 'KARKAS'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}>
                        {item.tipe_potong === 'KARKAS' ? 'Karkas' : 'Boning'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                      {item.sapi || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
                      {item.pedagang || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                      {item.rph || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
                      {item.tgl_potong_raw || item.tgl_potong || '-'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {item.tgl_keluar && item.tgl_keluar !== '-' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {item.tgl_keluar_raw || item.tgl_keluar}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                          Belum Keluar
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-800 whitespace-nowrap">
                      {formatNumber(item.berat_hidup ?? item.berat_sapi ?? 0)} kg
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-indigo-700 whitespace-nowrap">
                      {formatNumber(item.berat_setelah_potong ?? item.total_berat ?? 0)} kg
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-700 whitespace-nowrap">
                      {formatPercent(item.persentase ?? 0)}%
                      <span className="block text-[10px] text-slate-400">({item.rasio ?? 0}x)</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-700 whitespace-nowrap">
                      {formatRupiah(item.total_beli_ho ?? 0)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-800 whitespace-nowrap">
                      {item.harga_daging_per_kg > 0 ? formatRupiah(item.harga_daging_per_kg) : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {item.jumlah > 0 ? formatRupiah(item.jumlah) : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      {isLaba && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <TrendingUp className="h-3 w-3" />
                          +{formatRupiah(item.laba_rugi)} (Laba)
                        </span>
                      )}
                      {isRugi && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <TrendingDown className="h-3 w-3" />
                          {formatRupiah(item.laba_rugi)} (Rugi)
                        </span>
                      )}
                      {isImpas && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Rp 0 (Impas)
                        </span>
                      )}
                      {isBelumTerjual && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                          Belum Terjual
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />

            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 p-2.5 text-white">
                  <Beef className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Detail Potong & Penjualan Sapi</h2>
                  <p className="text-xs text-slate-500">
                    Sapi: <span className="font-semibold text-indigo-600">{detailModal.header?.sapi || '-'}</span> | RPH: <span className="font-semibold text-slate-700">{detailModal.header?.rph || '-'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-slate-600" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-160px)] text-xs">
              {/* Financial & Weight Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-[11px] text-slate-500 font-semibold">Tgl Potong</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">{detailModal.header?.tgl_potong || '-'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-[11px] text-slate-500 font-semibold">Tgl Keluar (Penjualan)</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">{detailModal.header?.tgl_keluar || detailModal.enrichedRow?.tgl_keluar || '-'}</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                  <p className="text-[11px] text-indigo-600 font-semibold">Berat Hidup</p>
                  <p className="text-xs font-bold text-indigo-900 mt-1">{formatNumber(detailModal.header?.berat_hidup ?? detailModal.header?.berat_sapi ?? 0)} kg</p>
                </div>
                <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                  <p className="text-[11px] text-teal-600 font-semibold">Berat Setelah Potong</p>
                  <p className="text-xs font-bold text-teal-900 mt-1">{formatNumber(detailModal.header?.berat_setelah_potong ?? detailModal.header?.total_berat ?? 0)} kg</p>
                </div>
              </div>

              {/* Formula & Financial Analysis */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5">
                <h4 className="font-bold text-slate-800 text-xs">Kalkulasi Persentase & Rugi / Laba</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500">Persentase Penurunan</span>
                    <p className="text-base font-bold text-indigo-700 mt-1">
                      {formatPercent(detailModal.header?.persentase ?? detailModal.enrichedRow?.persentase ?? 0)}%
                    </p>
                    <span className="text-[10px] text-slate-400">Rasio: {detailModal.header?.rasio ?? detailModal.enrichedRow?.rasio ?? 0}x</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500">Harga Daging / KG & Jumlah</span>
                    <p className="text-base font-bold text-slate-800 mt-1">
                      {formatRupiah(detailModal.header?.jumlah ?? detailModal.enrichedRow?.jumlah ?? 0)}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      @ {formatRupiah(detailModal.header?.harga_daging_per_kg ?? detailModal.enrichedRow?.harga_daging_per_kg ?? 0)} / kg
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500">Beli HO vs Rugi / Laba</span>
                    <p className={`text-base font-bold mt-1 ${
                      (detailModal.header?.laba_rugi ?? detailModal.enrichedRow?.laba_rugi ?? 0) >= 0
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}>
                      {formatRupiah(detailModal.header?.laba_rugi ?? detailModal.enrichedRow?.laba_rugi ?? 0)}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Beli HO: {formatRupiah(detailModal.header?.total_beli_ho ?? detailModal.enrichedRow?.total_beli_ho ?? 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meat Parts Breakdown */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs mb-2">Rincian Hasil Pemotongan</h4>
                {detailModal.detail && detailModal.detail.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-slate-600">No</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-600">Jenis Potong</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-600">Item Potong</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-600">Berat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {detailModal.detail.map((d, i) => (
                          <tr key={d.pubid || i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2 font-medium text-slate-700">{i + 1}</td>
                            <td className="px-3 py-2 text-slate-700">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                d.id_jenis_potong === 1 ? 'bg-blue-100 text-blue-800' :
                                d.id_jenis_potong === 2 ? 'bg-emerald-100 text-emerald-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {d.jenis_potong || '-'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{d.item_potong_name || '-'}</td>
                            <td className="px-3 py-2 text-right font-semibold text-indigo-700 whitespace-nowrap">{d.berat} kg</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-xl">Tidak ada rincian item potong</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end p-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PotongSapiBiasaTab;
