import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, RotateCcw, AlertCircle } from 'lucide-react';
import ActionButton from './ActionButton';
import StokSapiService from '../../../../services/stokSapiService';
import { formatCurrency, formatNumber } from '../constants/dummyData';

/** Format a date string (YYYY-MM-DD) to Indonesian short format e.g. "31 Mei" */
const formatDateLabel = (dateStr) => {
  const months = [
    '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${months[d.getMonth() + 1]}`;
};

const StokRingkasTab = () => {
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const dates = useMemo(() => data?.dates || [], [data]);
  const rows = useMemo(() => data?.rows || [], [data]);

  // Calculate totals for the bottom summary row
  const totals = useMemo(() => {
    const masukTotals = dates.map(() => 0);
    const keluarTotals = dates.map(() => 0);
    let totalNilaiBeli = 0;

    rows.forEach((row) => {
      dates.forEach((date, i) => {
        const dayData = row.daily?.[date] || {};
        masukTotals[i] += Number(dayData.masuk) || 0;
        keluarTotals[i] += Number(dayData.keluar) || 0;
      });
      totalNilaiBeli += Number(row.total_nilai_beli) || 0;
    });

    return { masukTotals, keluarTotals, totalNilaiBeli };
  }, [dates, rows]);

  const fetchData = useCallback(async (opts = {}) => {
    const { explicit = false } = opts;
    const start = startDate || null;
    const end = endDate || null;

    if (explicit && !(start && end)) {
      setError('Pilih rentang tanggal terlebih dahulu');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await StokSapiService.getStokByJenis(start, end);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'Gagal memuat data');
        setData(null);
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat mengambil data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const handleSearch = () => {
    if (startDate && endDate) {
      setHasSearched(true);
      fetchData({ explicit: true });
    }
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setHasSearched(false);
    setData(null);
    setError(null);
  };

  const hasDateFilter = !!(startDate && endDate);

  return (
    <div className="space-y-4">
      <style>{`
        .stok-ringkas-table-wrapper::-webkit-scrollbar {
          height: 6px;
        }
        .stok-ringkas-table-wrapper::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .stok-ringkas-table-wrapper::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 3px;
        }
        .stok-ringkas-table-wrapper::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>

      {/* Filter Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4 text-emerald-600" />
            Filter Tanggal
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">Dari</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">Sampai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSearch}
                disabled={!startDate || !endDate || loading}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <Search className="h-4 w-4" />
                Cari
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-2 shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Gagal memuat data</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <span className="text-sm text-gray-500">Memuat data stok ringkas...</span>
          </div>
        </div>
      )}

      {!loading && !rows.length && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <svg className="h-12 w-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm font-medium text-gray-500">
            {!hasDateFilter ? 'Pilih rentang tanggal untuk melihat stok ringkas' : 'Tidak ada data stok sapi'}
          </p>
          <p className="text-xs mt-1 text-gray-400">
            {!hasDateFilter ? 'Stok ringkas menampilkan pivot harian per jenis sapi' : 'Silakan pilih rentang tanggal lain'}
          </p>
        </div>
      )}

      {/* Pivot Table with horizontal scroll for mobile */}
      <div className="stok-ringkas-table-wrapper overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm border-collapse" style={{ minWidth: '900px' }}>
          <thead>
            {/* Row 1: Main headers */}
            <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <th
                rowSpan={2}
                className="py-2.5 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap sticky left-0 z-20 bg-gradient-to-r from-emerald-600 to-teal-600"
                style={{ width: '60px', minWidth: '60px' }}
              >
                No
              </th>
              <th
                rowSpan={2}
                className="py-2.5 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap sticky z-20 bg-gradient-to-r from-emerald-600 to-teal-600"
                style={{ left: '60px', width: '80px', minWidth: '80px' }}
              >
                Aksi
              </th>
              <th
                rowSpan={2}
                className="py-2.5 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap sticky z-20 bg-gradient-to-r from-emerald-600 to-teal-600"
                style={{ left: '140px', minWidth: '140px' }}
              >
                JENIS SAPI
              </th>
              {dates.map((date) => (
                <th
                  key={date}
                  colSpan={2}
                  className="py-2.5 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap"
                >
                  {formatDateLabel(date)}
                </th>
              ))}
              <th
                rowSpan={2}
                className="py-2.5 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap"
              >
                TOTAL MASUK
              </th>
              <th
                rowSpan={2}
                className="py-2.5 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap"
              >
                TOTAL KELUAR
              </th>
              <th
                rowSpan={2}
                className="py-2.5 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap"
              >
                TOTAL NILAI BELI
              </th>
            </tr>

            {/* Row 2: Sub-headers (Masuk / Keluar) under each date */}
            <tr className="bg-emerald-700 text-white">
              {dates.map((date) => (
                <React.Fragment key={`sub-${date}`}>
                  <th className="py-2 px-2 text-center text-xs font-semibold border border-emerald-600 bg-emerald-100 text-emerald-800 whitespace-nowrap">
                    Masuk
                  </th>
                  <th className="py-2 px-2 text-center text-xs font-semibold border border-emerald-600 bg-rose-100 text-rose-800 whitespace-nowrap">
                    Keluar
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                className={`border-b border-gray-100 hover:bg-emerald-50/50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <td
                  className="py-2.5 px-3 text-center font-medium text-gray-600 border border-gray-100 sticky left-0 z-20 bg-inherit"
                  style={{ width: '60px', minWidth: '60px' }}
                >
                  {row.no_urut || index + 1}
                </td>
                <td
                  className="py-2.5 px-3 text-center border border-gray-100 sticky z-20 bg-inherit"
                  style={{ left: '60px', width: '80px', minWidth: '80px' }}
                >
                  <div className="flex items-center justify-center">
                    <ActionButton
                      row={{ id: row.action || row.no_urut, ...row }}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      onDetail={() => console.log('Detail', row)}
                      onEdit={() => navigate(`/rph/stok-sapi/edit/${row.pid}`)}
                      onDelete={() => console.log('Delete', row)}
                    />
                  </div>
                </td>
                <td
                  className="py-2.5 px-3 font-semibold text-gray-800 border border-gray-100 sticky z-20 bg-inherit"
                  style={{ left: '140px', minWidth: '140px' }}
                >
                  {row.jenis_sapi}
                </td>
                {dates.map((date) => {
                  const dayData = row.daily?.[date] || {};
                  const masuk = Number(dayData.masuk) || 0;
                  const keluar = Number(dayData.keluar) || 0;
                  return (
                    <React.Fragment key={`data-${index}-${date}`}>
                      <td
                        className={`py-2 px-2 text-center font-medium border border-gray-100 ${
                          masuk > 0 ? 'text-emerald-700' : 'text-gray-300'
                        }`}
                      >
                        {masuk}
                      </td>
                      <td
                        className={`py-2 px-2 text-center font-medium border border-gray-100 ${
                          keluar > 0 ? 'text-rose-700' : 'text-gray-300'
                        }`}
                      >
                        {keluar}
                      </td>
                    </React.Fragment>
                  );
                })}
                <td className="py-2.5 px-3 text-center font-semibold border border-gray-100 whitespace-nowrap text-emerald-700">
                  {formatNumber(Number(row.total_masuk) || 0)}
                </td>
                <td className="py-2.5 px-3 text-center font-semibold border border-gray-100 whitespace-nowrap text-rose-700">
                  {formatNumber(Number(row.total_keluar) || 0)}
                </td>
                <td
                  className={`py-2.5 px-3 text-right font-semibold border border-gray-100 whitespace-nowrap ${
                    Number(row.total_nilai_beli) > 0 ? 'text-teal-700' : 'text-gray-300'
                  }`}
                >
                  {formatCurrency(Number(row.total_nilai_beli) || 0)}
                </td>
              </tr>
            ))}

            {/* Total Row */}
            <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 font-bold border-t-2 border-emerald-300">
              <td
                colSpan={3}
                className="py-2.5 px-3 text-right text-emerald-800 border border-emerald-200"
              >
                Total
              </td>
              {dates.map((date, i) => (
                <React.Fragment key={`total-${date}`}>
                  <td className="py-2 px-2 text-center text-emerald-800 border border-emerald-200">
                    {totals.masukTotals[i]}
                  </td>
                  <td className="py-2 px-2 text-center text-rose-800 border border-emerald-200">
                    {totals.keluarTotals[i]}
                  </td>
                </React.Fragment>
              ))}
              <td className="py-2.5 px-3 text-center text-emerald-800 border border-emerald-200 whitespace-nowrap">
                {formatNumber(totals.masukTotals.reduce((a, b) => a + b, 0))}
              </td>
              <td className="py-2.5 px-3 text-center text-rose-800 border border-emerald-200 whitespace-nowrap">
                {formatNumber(totals.keluarTotals.reduce((a, b) => a + b, 0))}
              </td>
              <td className="py-2.5 px-3 text-right text-emerald-800 border border-emerald-200 whitespace-nowrap">
                {formatCurrency(totals.totalNilaiBeli)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Card */}
      {rows.length > 0 && (
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Total Masuk</p>
              <p className="text-base font-bold text-emerald-700">
                {formatNumber(totals.masukTotals.reduce((a, b) => a + b, 0))} ekor
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Total Keluar</p>
              <p className="text-base font-bold text-rose-700">
                {formatNumber(totals.keluarTotals.reduce((a, b) => a + b, 0))} ekor
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Total Nilai Beli</p>
              <p className="text-base font-bold text-teal-700">
                {formatCurrency(totals.totalNilaiBeli)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StokRingkasTab;
