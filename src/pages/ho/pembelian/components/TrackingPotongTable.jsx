import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  RefreshCw,
  Beef,
  TrendingUp,
  TrendingDown,
  Scale,
  DollarSign,
  Download,
  Loader2,
  ExternalLink,
  X
} from 'lucide-react';
import usePembelianHO from '../hooks/usePembelianHO';

const formatCurrency = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return 'Rp ' + Number(val).toLocaleString('id-ID');
};

const formatNumber = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Number(val).toLocaleString('id-ID');
};

const TrackingPotongTable = () => {
  const navigate = useNavigate();
  const { getTrackingPotong, loading: hookLoading } = usePembelianHO();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTrackingPotong({
        start_date: startDate,
        end_date: endDate,
        search: searchTerm,
      });
      if (res.success) {
        setData(res.data || []);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch tracking potong:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [getTrackingPotong, startDate, endDate, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary = useMemo(() => {
    const totalEkor = data.length;
    const totalBeratPotong = data.reduce((acc, row) => acc + (Number(row.berat_setelah_potong) || 0), 0);
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
      'Nota Pembelian HO',
      'Tgl Beli HO',
      'Supplier',
      'Sapi (Eartag)',
      'RPH',
      'Tgl Keluar RPH',
      'Pedagang Pembeli',
      'Berat Hidup (kg)',
      'Berat Potong (kg)',
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
      `"${item.nota || item.nota_sistem || '-'}"`,
      `"${item.tgl_pembelian_ho || '-'}"`,
      `"${item.supplier || '-'}"`,
      `"${item.sapi || '-'}"`,
      `"${item.rph || '-'}"`,
      `"${item.tgl_keluar || '-'}"`,
      `"${item.pedagang || '-'}"`,
      item.berat_hidup ?? 0,
      item.berat_setelah_potong ?? 0,
      item.persentase ?? 0,
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
    a.download = `tracking-potong-ho-${startDate}-sd-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nota, eartag, supplier, pedagang..."
            className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg p-1 text-xs">
            <Calendar className="h-4 w-4 text-gray-400 ml-1" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-0 bg-transparent py-0.5 text-xs text-gray-700 focus:outline-none focus:ring-0"
            />
            <span className="text-gray-300">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-0 bg-transparent py-0.5 text-xs text-gray-700 focus:outline-none focus:ring-0"
            />
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={exportCsv}
            disabled={!data.length}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            <Download className="h-3.5 w-3.5 text-gray-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/30 p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-700">Total Sapi Dipotong</span>
            <Beef className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-1 text-xl font-bold text-blue-900">{formatNumber(summary.totalEkor)} <span className="text-xs font-normal text-blue-600">ekor</span></p>
        </div>

        <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-emerald-50/30 p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-teal-700">Total Berat Karkas</span>
            <Scale className="h-4 w-4 text-teal-600" />
          </div>
          <p className="mt-1 text-xl font-bold text-teal-900">{formatNumber(summary.totalBeratPotong)} <span className="text-xs font-normal text-teal-600">kg</span></p>
        </div>

        <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50/30 p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-700">Total Penjualan Daging</span>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </div>
          <p className="mt-1 text-xl font-bold text-purple-900">{formatCurrency(summary.totalPenjualan)}</p>
        </div>

        <div className={`rounded-xl border p-3.5 shadow-sm ${summary.totalLabaRugi >= 0 ? 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50/30' : 'border-rose-100 bg-gradient-to-br from-rose-50 to-red-50/30'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${summary.totalLabaRugi >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>Total Rugi / Laba</span>
            {summary.totalLabaRugi >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-rose-600" />}
          </div>
          <p className={`mt-1 text-xl font-bold ${summary.totalLabaRugi >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
            {summary.totalLabaRugi > 0 ? '+' : ''}{formatCurrency(summary.totalLabaRugi)}
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-3 py-3 text-center font-semibold uppercase tracking-wider w-12">No</th>
                <th className="px-3 py-3 text-left font-semibold uppercase tracking-wider">Nota Pembelian HO</th>
                <th className="px-3 py-3 text-left font-semibold uppercase tracking-wider">Sapi (Eartag)</th>
                <th className="px-3 py-3 text-left font-semibold uppercase tracking-wider">RPH</th>
                <th className="px-3 py-3 text-left font-semibold uppercase tracking-wider">Tgl Keluar</th>
                <th className="px-3 py-3 text-left font-semibold uppercase tracking-wider">Pedagang</th>
                <th className="px-3 py-3 text-right font-semibold uppercase tracking-wider">Berat Hidup</th>
                <th className="px-3 py-3 text-right font-semibold uppercase tracking-wider">Berat Potong</th>
                <th className="px-3 py-3 text-right font-semibold uppercase tracking-wider">Persentase</th>
                <th className="px-3 py-3 text-right font-semibold uppercase tracking-wider">Beli Hidup HO</th>
                <th className="px-3 py-3 text-right font-semibold uppercase tracking-wider">Harga/KG</th>
                <th className="px-3 py-3 text-right font-semibold uppercase tracking-wider">Jumlah Penjualan</th>
                <th className="px-3 py-3 text-center font-semibold uppercase tracking-wider">Rugi / Laba</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={13} className="px-4 py-16 text-center">
                    <Loader2 className="h-7 w-7 animate-spin text-gray-400 mx-auto" />
                    <p className="mt-2 text-xs text-gray-500">Memuat data tracking potong...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-indigo-50 p-3 mb-2">
                        <Beef className="h-7 w-7 text-indigo-500" />
                      </div>
                      <p className="text-sm font-semibold text-gray-800">Tidak ada data pemotongan sapi</p>
                      <p className="text-xs text-gray-400 mt-0.5">Sapi yang dipotong di RPH dari nota pembelian HO akan muncul di sini.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="px-3 py-2.5 text-center text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {item.pid_pembelian ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/ho/pembelian/detail/${encodeURIComponent(item.pid_pembelian)}`)}
                          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          {item.nota || item.nota_sistem}
                          <ExternalLink size={11} />
                        </button>
                      ) : (
                        <span className="font-semibold text-gray-800">{item.nota || item.nota_sistem || '-'}</span>
                      )}
                      <span className="block text-[10px] text-gray-400">{item.tgl_pembelian_ho}</span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="font-semibold text-gray-900 block">{item.sapi}</span>
                      {item.code_eartag && <span className="text-[10px] text-gray-400">{item.code_eartag}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{item.rph}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{item.tgl_keluar}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="font-medium text-gray-900 block">{item.pedagang}</span>
                      {item.no_kwitansi && <span className="text-[10px] text-gray-400 font-mono">{item.no_kwitansi}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-700 whitespace-nowrap">
                      {formatNumber(item.berat_hidup)} kg
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-indigo-700 whitespace-nowrap">
                      {formatNumber(item.berat_setelah_potong)} kg
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-800 whitespace-nowrap">
                      {formatNumber(item.persentase)}%
                      <span className="block text-[10px] text-gray-400">({item.rasio}x)</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(item.total_beli_ho)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(item.harga_daging_per_kg)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-gray-900 whitespace-nowrap">
                      {formatCurrency(item.jumlah)}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      {item.status_laba_rugi === 'LABA' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <TrendingUp size={11} />
                          +{formatCurrency(item.laba_rugi)}
                        </span>
                      ) : item.status_laba_rugi === 'RUGI' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <TrendingDown size={11} />
                          {formatCurrency(item.laba_rugi)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                          Rp 0 (Impas)
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrackingPotongTable;
