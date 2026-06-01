import React, { useMemo, useState } from 'react';
import ActionButton from './ActionButton';
import { formatNumber } from '../constants/dummyData';

const StokDetailTab = ({ data, loading }) => {
  const [openMenuId, setOpenMenuId] = useState(null);

  const rows = useMemo(() => data?.rows || [], [data]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span className="text-sm text-gray-500">Memuat data stok detail...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <svg className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-lg font-medium">Tidak ada data stok sapi</p>
        <p className="text-sm mt-1">Silakan pilih rentang tanggal lain</p>
      </div>
    );
  }

  /** Render status badge based on status_sapi value */
  const renderStatusBadge = (status) => {
    if (!status) return <span className="text-gray-300">-</span>;
    const upper = String(status).toUpperCase();
    if (upper === 'PEMELIHARAAN') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          {status}
        </span>
      );
    }
    if (upper.includes('SIAP') || upper.includes('POTONG')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
          {status}
        </span>
      );
    }
    // Default badge for other statuses
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <style>{`
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

      {/* Detail Table with horizontal scroll */}
      <div className="stok-detail-table-wrapper overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm border-collapse" style={{ minWidth: '2000px' }}>
          <thead>
            <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              {/* Sticky columns */}
              <th
                className="py-3 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap sticky left-0 z-20 bg-gradient-to-r from-emerald-600 to-teal-600"
                style={{ width: '50px', minWidth: '50px' }}
              >
                No
              </th>
              <th
                className="py-3 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap sticky z-20 bg-gradient-to-r from-emerald-600 to-teal-600"
                style={{ left: '50px', width: '70px', minWidth: '70px' }}
              >
                Aksi
              </th>
              <th
                className="py-3 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap sticky z-20 bg-gradient-to-r from-emerald-600 to-teal-600"
                style={{ left: '120px', minWidth: '120px' }}
              >
                Jenis Sapi
              </th>
              {/* Scrollable columns */}
              <th className="py-3 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Eartag</th>
              <th className="py-3 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap">Bobot</th>
              <th className="py-3 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Lokasi Sapi</th>
              <th className="py-3 px-3 text-right font-semibold border border-emerald-500 whitespace-nowrap">Harga Beli</th>
              <th className="py-3 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap">DOF</th>
              <th className="py-3 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap">Kg Pakan</th>
              <th className="py-3 px-3 text-right font-semibold border border-emerald-500 whitespace-nowrap">Nilai Pakan</th>
              <th className="py-3 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">OVK</th>
              <th className="py-3 px-3 text-right font-semibold border border-emerald-500 whitespace-nowrap">Nilai OVK</th>
              <th className="py-3 px-3 text-right font-semibold border border-emerald-500 whitespace-nowrap">Total</th>
              <th className="py-3 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap">Status Sapi</th>
              <th className="py-3 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Pemasok</th>
              <th className="py-3 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Nomor Nota</th>
              <th className="py-3 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Pengirim</th>
              <th className="py-3 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Tgl Kedatangan</th>
              <th className="py-3 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Penerima</th>
              <th className="py-3 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Kondisi Sapi</th>
              <th className="py-3 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Keterangan</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.pid || index}
                className={`border-b border-gray-100 hover:bg-emerald-50/50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                {/* Sticky: No */}
                <td
                  className="py-3 px-3 text-center font-medium text-gray-600 border border-gray-100 sticky left-0 z-10 bg-inherit"
                  style={{ width: '50px', minWidth: '50px' }}
                >
                  {row.no_urut || index + 1}
                </td>
                {/* Sticky: Aksi */}
                <td
                  className="py-3 px-3 text-center border border-gray-100 sticky z-10 bg-inherit"
                  style={{ left: '50px', width: '70px', minWidth: '70px' }}
                >
                  <div className="flex items-center justify-center">
                    <ActionButton
                      row={{ id: row.pid || row.no_urut, ...row }}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      onDetail={() => console.log('Detail', row)}
                      onEdit={() => console.log('Edit', row)}
                      onDelete={() => console.log('Delete', row)}
                    />
                  </div>
                </td>
                {/* Sticky: Jenis Sapi */}
                <td
                  className="py-3 px-3 font-semibold text-gray-800 border border-gray-100 whitespace-nowrap sticky z-10 bg-inherit"
                  style={{ left: '120px', minWidth: '120px' }}
                >
                  {row.jenis_sapi}
                </td>
                {/* Eartag */}
                <td className="py-3 px-3 text-gray-700 border border-gray-100 whitespace-nowrap">
                  {row.eartag || '-'}
                </td>
                {/* Bobot */}
                <td className="py-3 px-3 text-center text-gray-700 border border-gray-100 whitespace-nowrap">
                  {row.bobot ? `${Number(row.bobot)} KG` : '-'}
                </td>
                {/* Lokasi Sapi */}
                <td className="py-3 px-3 text-gray-700 border border-gray-100 whitespace-nowrap">
                  {row.lokasi_sapi || '-'}
                </td>
                {/* Harga Beli */}
                <td className="py-3 px-3 text-right font-medium text-gray-700 border border-gray-100 whitespace-nowrap">
                  {row.harga_beli || '-'}
                </td>
                {/* DOF */}
                <td className="py-3 px-3 text-center text-gray-700 border border-gray-100 whitespace-nowrap">
                  {row.dof_hari || '-'}
                </td>
                {/* Kg Pakan */}
                <td className="py-3 px-3 text-center text-gray-700 border border-gray-100 whitespace-nowrap">
                  {row.kg || '-'}
                </td>
                {/* Nilai Pakan */}
                <td className="py-3 px-3 text-right text-gray-700 border border-gray-100 whitespace-nowrap">
                  {row.nilai_pakan || '-'}
                </td>
                {/* OVK */}
                <td className="py-3 px-3 text-gray-700 border border-gray-100 whitespace-nowrap max-w-[150px] truncate" title={row.ovk}>
                  {row.ovk || '-'}
                </td>
                {/* Nilai OVK */}
                <td className="py-3 px-3 text-right text-gray-700 border border-gray-100 whitespace-nowrap">
                  {row.nilai_ovk || '-'}
                </td>
                {/* Total */}
                <td className="py-3 px-3 text-right font-semibold text-teal-700 border border-gray-100 whitespace-nowrap">
                  {row.total || '-'}
                </td>
                {/* Status Sapi */}
                <td className="py-3 px-3 text-center border border-gray-100 whitespace-nowrap">
                  {renderStatusBadge(row.status_sapi)}
                </td>
                {/* Pemasok */}
                <td className="py-3 px-3 text-gray-700 border border-gray-100 whitespace-nowrap">
                  {row.pemasok || '-'}
                </td>
                {/* Nomor Nota */}
                <td className="py-3 px-3 text-gray-700 border border-gray-100 whitespace-nowrap">
                  {row.nomor_nota || '-'}
                </td>
                {/* Pengirim */}
                <td className="py-3 px-3 text-gray-700 border border-gray-100 whitespace-nowrap">
                  {row.pengirim || '-'}
                </td>
                {/* Tanggal Kedatangan */}
                <td className="py-3 px-3 text-gray-700 border border-gray-100 whitespace-nowrap">
                  {row.tanggal_kedatangan || '-'}
                </td>
                {/* Penerima */}
                <td className="py-3 px-3 text-gray-700 border border-gray-100 whitespace-nowrap">
                  {row.penerima || '-'}
                </td>
                {/* Kondisi Sapi */}
                <td className="py-3 px-3 text-gray-700 border border-gray-100 whitespace-nowrap">
                  {row.kondisi_sapi || '-'}
                </td>
                {/* Keterangan */}
                <td className="py-3 px-3 text-gray-600 border border-gray-100 whitespace-nowrap max-w-[150px] truncate" title={row.keterangan_kondisi}>
                  {row.keterangan_kondisi || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      {rows.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">
              Total {formatNumber(rows.length)} data sapi
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StokDetailTab;
