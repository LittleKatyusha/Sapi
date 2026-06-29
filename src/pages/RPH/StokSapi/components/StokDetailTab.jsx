import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Filter, Search, RotateCcw, RefreshCw, AlertCircle } from 'lucide-react';
import ActionButton from './ActionButton';
import StokDetailModal from './StokDetailModal';
import StokSapiService from '../../../../services/stokSapiService';
import { formatNumber } from '../constants/dummyData';
import { Notification } from '../../../../components/shared/NotificationComponent';

const StokDetailTab = ({ onOvk, onPotongPaksa, onPotongSapiBiasa, onSapiMati }) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const rows = useMemo(() => data?.rows || [], [data]);

  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
  }, []);

  const handleDetail = (row) => {
    setDetailRow(row);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setDetailRow(null);
  };

  const fetchData = useCallback(async (start = null, end = null) => {
    setLoading(true);
    setError(null);

    try {
      const response = await StokSapiService.getStokDetail(start, end);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'Gagal memuat data');
        showNotification('error', response.message || 'Gagal memuat data stok detail');
        setData(null);
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat mengambil data');
      showNotification('error', err?.message || 'Terjadi kesalahan saat mengambil data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Default: load all data on mount (no date filter)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    if (startDate && endDate) {
      fetchData(startDate, endDate);
    }
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    fetchData();
  };

  /** Render status badge based on status_sapi value */
  const renderStatusBadge = (status) => {
    if (!status) return <span className="text-gray-300">-</span>;
    const upper = String(status).toUpperCase();
    if (upper === 'PEMELIHARAAN') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          {status}
        </span>
      );
    }
    if (upper.includes('SIAP') || upper.includes('POTONG')) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
          {status}
        </span>
      );
    }
    // Default badge for other statuses
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-200">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .skeleton-cell {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeleton-pulse 1.5s ease-in-out infinite;
        }
        @keyframes skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .stok-detail-table-wrapper::-webkit-scrollbar {
          height: 6px;
        }
        .stok-detail-table-wrapper::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .stok-detail-table-wrapper::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 3px;
        }
        .stok-detail-table-wrapper::-webkit-scrollbar-thumb:hover {
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
              <button
                type="button"
                onClick={() => fetchData(startDate || null, endDate || null)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
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

      {!loading && !rows.length && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <svg className="h-12 w-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm font-medium text-gray-500">Tidak ada data stok sapi</p>
          <p className="text-xs mt-1 text-gray-400">Belum ada sapi yang terdaftar di stok</p>
        </div>
      )}

      {/* Detail Table with horizontal scroll */}
      {(rows.length > 0 || loading) && !error && (
      <div className="relative stok-detail-table-wrapper overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        {loading && (
          <div className="absolute top-0 left-0 right-0 z-30 h-0.5 overflow-hidden bg-emerald-100">
            <div className="h-full w-1/3 animate-[shimmer_1.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
          </div>
        )}
        <table className="w-full text-sm border-collapse" style={{ minWidth: '1300px' }}>
          <thead>
            <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              {/* Sticky columns */}
              <th
                className="py-2 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap sticky left-0 z-20 bg-gradient-to-r from-emerald-600 to-teal-600"
                style={{ width: '50px', minWidth: '50px' }}
              >
                No
              </th>
              <th
                className="py-2 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap sticky z-20 bg-gradient-to-r from-emerald-600 to-teal-600"
                style={{ left: '50px', width: '70px', minWidth: '70px' }}
              >
                Aksi
              </th>
              <th
                className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap sticky z-20 bg-gradient-to-r from-emerald-600 to-teal-600"
                style={{ left: '120px', minWidth: '160px' }}
              >
                Sapi
              </th>
              {/* Scrollable columns */}
              <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Pemeliharaan</th>
              <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">OVK</th>
              <th className="py-2 px-3 text-right font-semibold border border-emerald-500 whitespace-nowrap">Nilai</th>
              <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Status</th>
              <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Asal</th>
              <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Keterangan</th>
            </tr>
          </thead>

          <tbody className={loading && rows.length > 0 ? 'opacity-50 pointer-events-none' : ''}>
            {loading && rows.length === 0 && Array.from({ length: 8 }).map((_, i) => (
              <tr key={`skeleton-${i}`} className="border-b border-gray-100 bg-white">
                <td className="py-3 px-3 border border-gray-100 sticky left-0 z-10 bg-white" style={{ width: '50px', minWidth: '50px' }}>
                  <div className="skeleton-cell h-4 w-6 rounded mx-auto" />
                </td>
                <td className="py-3 px-3 border border-gray-100 sticky z-20 bg-white" style={{ left: '50px', width: '70px', minWidth: '70px' }}>
                  <div className="skeleton-cell h-6 w-8 rounded mx-auto" />
                </td>
                <td className="py-3 px-3 border border-gray-100 sticky z-10 bg-white" style={{ left: '120px', minWidth: '160px' }}>
                  <div className="space-y-1.5">
                    <div className="skeleton-cell h-4 w-32 rounded" />
                    <div className="skeleton-cell h-3 w-24 rounded" />
                    <div className="skeleton-cell h-3 w-20 rounded" />
                  </div>
                </td>
                <td className="py-3 px-3 border border-gray-100">
                  <div className="space-y-1.5">
                    <div className="skeleton-cell h-3 w-16 rounded" />
                    <div className="skeleton-cell h-3 w-24 rounded" />
                  </div>
                </td>
                <td className="py-3 px-3 border border-gray-100">
                  <div className="space-y-1.5">
                    <div className="skeleton-cell h-3 w-28 rounded" />
                    <div className="skeleton-cell h-3 w-16 rounded" />
                  </div>
                </td>
                <td className="py-3 px-3 border border-gray-100">
                  <div className="space-y-1.5">
                    <div className="skeleton-cell h-3 w-20 rounded ml-auto" />
                    <div className="skeleton-cell h-4 w-24 rounded ml-auto" />
                  </div>
                </td>
                <td className="py-3 px-3 border border-gray-100">
                  <div className="space-y-1.5">
                    <div className="skeleton-cell h-5 w-28 rounded-full" />
                    <div className="skeleton-cell h-3 w-16 rounded" />
                  </div>
                </td>
                <td className="py-3 px-3 border border-gray-100">
                  <div className="space-y-1.5">
                    <div className="skeleton-cell h-3 w-28 rounded" />
                    <div className="skeleton-cell h-3 w-20 rounded" />
                    <div className="skeleton-cell h-3 w-24 rounded" />
                  </div>
                </td>
                <td className="py-3 px-3 border border-gray-100">
                  <div className="skeleton-cell h-3 w-24 rounded" />
                </td>
              </tr>
            ))}
            {rows.length > 0 && rows.map((row, index) => (
              <tr
                key={row.pid || index}
                className={`border-b border-gray-100 hover:bg-emerald-50/50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                {/* Sticky: No */}
                <td
                  className={`py-2 px-3 text-center font-medium text-gray-600 border border-gray-100 sticky left-0 z-10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  style={{ width: '50px', minWidth: '50px' }}
                >
                  {row.no_urut || index + 1}
                </td>
                {/* Sticky: Aksi */}
                <td
                  className={`py-2 px-3 text-center border border-gray-100 sticky z-20 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  style={{ left: '50px', width: '70px', minWidth: '70px' }}
                >
                  <div className="flex items-center justify-center">
                    <ActionButton
                       row={{ id: row.pid || row.no_urut, ...row }}
                       openMenuId={openMenuId}
                       setOpenMenuId={setOpenMenuId}
                       onDetail={() => handleDetail(row)}
                       onEdit={() => console.log('Edit', row)}
                       onDelete={() => console.log('Delete', row)}
                        onOvk={() => onOvk(row)}
                        onPotongPaksa={() => onPotongPaksa(row)}
                        onPotongSapiBiasa={() => onPotongSapiBiasa(row)}
                        onSapiMati={() => onSapiMati(row)}
                    />
                  </div>
                </td>
                {/* Sticky: Sapi */}
                <td
                  className={`py-2 px-3 border border-gray-100 whitespace-nowrap sticky z-10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  style={{ left: '120px', minWidth: '160px' }}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-gray-800">{row.jenis_sapi}</div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Eartag:</span> {row.eartag || '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Bobot:</span> {row.bobot ? `${Number(row.bobot)} KG` : '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Lokasi:</span> {row.lokasi_sapi || '-'}
                    </div>
                  </div>
                </td>
                {/* Pemeliharaan */}
                <td className="py-2 px-3 border border-gray-100 whitespace-nowrap">
                  <div className="space-y-0.5">
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">DOF:</span> {row.dof_hari || '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Pakan:</span> {row.kg || '-'} kg · {row.nilai_pakan || 'Rp 0'}
                    </div>
                  </div>
                </td>
                {/* OVK */}
                <td className="py-2 px-3 border border-gray-100 whitespace-nowrap">
                  <div className="space-y-0.5">
                    <div className="text-xs text-gray-600 max-w-[140px] truncate" title={row.ovk}>{row.ovk || '-'}</div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Nilai:</span> {row.nilai_ovk || 'Rp 0'}
                    </div>
                  </div>
                </td>
                {/* Nilai */}
                <td className="py-2 px-3 border border-gray-100 whitespace-nowrap text-right">
                  <div className="space-y-0.5">
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Beli:</span> {row.harga_beli || 'Rp 0'}
                    </div>
                    <div className="font-semibold text-teal-700">
                      {row.total || 'Rp 0'}
                    </div>
                  </div>
                </td>
                {/* Status */}
                <td className="py-2 px-3 border border-gray-100 whitespace-nowrap">
                  <div className="space-y-0.5">
                    {renderStatusBadge(row.status_sapi)}
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Kondisi:</span> {row.kondisi_sapi || '-'}
                    </div>
                  </div>
                </td>
                {/* Asal */}
                <td className="py-2 px-3 border border-gray-100 whitespace-nowrap">
                  <div className="space-y-0.5">
                    <div className="text-xs text-gray-600 max-w-[140px] truncate" title={row.pemasok}>{row.pemasok || '-'}</div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Nota:</span> {row.nomor_nota || '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Pengirim:</span> {row.pengirim || '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Penerima:</span> {row.penerima || '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Tgl:</span> {row.tanggal_kedatangan || '-'}
                    </div>
                  </div>
                </td>
                {/* Keterangan */}
                <td className="py-2 px-3 border border-gray-100 whitespace-nowrap max-w-[160px] truncate" title={row.keterangan_kondisi}>
                  <span className="text-gray-600">{row.keterangan_kondisi || '-'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Summary footer */}
      {rows.length > 0 && !loading && (
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">
              Total {formatNumber(rows.length)} data sapi
            </p>
          </div>
        </div>
      )}

      {detailModalOpen && (
        <StokDetailModal
          row={detailRow}
          onClose={handleCloseDetail}
        />
      )}

      <Notification
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
};

export default StokDetailTab;
