import React, { useMemo, useState } from 'react';
import ActionButton from './ActionButton';
import {
  stokDetailData,
  generateDateHeaders,
  formatCurrency,
} from '../constants/dummyData';

const StokDetailTab = () => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const dateHeaders = useMemo(() => generateDateHeaders(), []);

  // Calculate totals for the bottom row
  const totals = useMemo(() => {
    const masukTotals = dateHeaders.map(() => 0);
    const keluarTotals = dateHeaders.map(() => 0);
    let totalNilaiBeli = 0;

    stokDetailData.forEach((row) => {
      row.harian.forEach((day, i) => {
        masukTotals[i] += day.masuk;
        keluarTotals[i] += day.keluar;
      });
      totalNilaiBeli += row.totalNilaiBeli || 0;
    });

    return { masukTotals, keluarTotals, totalNilaiBeli };
  }, [dateHeaders]);

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

      {/* Complex Table with horizontal scroll for mobile */}
      <div className="stok-detail-table-wrapper overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm border-collapse" style={{ minWidth: '800px' }}>
          <thead>
            {/* Row 1: Main headers */}
            <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <th
                rowSpan={2}
                className="py-3 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap sticky left-0 z-20 bg-gradient-to-r from-emerald-600 to-teal-600"
                style={{ width: '60px', minWidth: '60px' }}
              >
                No
              </th>
              <th
                rowSpan={2}
                className="py-3 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap sticky z-20 bg-gradient-to-r from-emerald-600 to-teal-600"
                style={{ left: '60px', width: '80px', minWidth: '80px' }}
              >
                Aksi
              </th>
              <th
                rowSpan={2}
                className="py-3 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap"
              >
                JENIS SAPI
              </th>
              <th
                rowSpan={2}
                className="py-3 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap"
              >
                STOK AWAL
              </th>
              <th
                rowSpan={2}
                className="py-3 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap"
              >
                SATUAN
              </th>
              {dateHeaders.map((date) => (
                <th
                  key={date.key}
                  colSpan={2}
                  className="py-3 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap"
                >
                  {date.label}
                </th>
              ))}
              <th
                rowSpan={2}
                className="py-3 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap"
              >
                TOTAL NILAI BELI
              </th>
            </tr>

            {/* Row 2: Sub-headers (Masuk / Keluar) under each date */}
            <tr className="bg-emerald-700 text-white">
              {dateHeaders.map((date) => (
                <React.Fragment key={`sub-${date.key}`}>
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
            {stokDetailData.map((row, index) => (
              <tr
                key={row.id}
                className={`border-b border-gray-100 hover:bg-emerald-50/50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <td className="py-3 px-3 text-center font-medium text-gray-600 border border-gray-100 sticky left-0 z-20 bg-inherit"
                    style={{ width: '60px', minWidth: '60px' }}>
                  {index + 1}
                </td>
                <td className="py-3 px-3 text-center border border-gray-100 sticky z-20 bg-inherit"
                  style={{ left: '60px', width: '80px', minWidth: '80px' }}>
                  <div className="flex items-center justify-center">
                    <ActionButton
                      row={row}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      onDetail={() => console.log('Detail', row)}
                      onEdit={() => console.log('Edit', row)}
                      onDelete={() => console.log('Delete', row)}
                    />
                  </div>
                </td>
                <td className="py-3 px-3 font-semibold text-gray-800 border border-gray-100">
                  {row.jenisSapi}
                </td>
                <td className="py-3 px-3 text-center font-medium text-gray-700 border border-gray-100">
                  {row.stokAwal}
                </td>
                <td className="py-3 px-3 text-center text-gray-600 border border-gray-100">
                  {row.satuan}
                </td>
                {row.harian.map((day, i) => (
                  <React.Fragment key={`data-${row.id}-${i}`}>
                    <td
                      className={`py-3 px-2 text-center font-medium border border-gray-100 ${
                        day.masuk > 0
                          ? 'text-emerald-700 font-medium'
                          : 'text-gray-300'
                      }`}
                    >
                      {day.masuk}
                    </td>
                    <td
                      className={`py-3 px-2 text-center font-medium border border-gray-100 ${
                        day.keluar > 0
                          ? 'text-rose-700 font-medium'
                          : 'text-gray-300'
                      }`}
                    >
                      {day.keluar}
                    </td>
                  </React.Fragment>
                ))}
                <td
                  className={`py-3 px-3 text-right font-semibold border border-gray-100 whitespace-nowrap ${
                    row.totalNilaiBeli > 0 ? 'text-teal-700' : 'text-gray-300'
                  }`}
                >
                  {formatCurrency(row.totalNilaiBeli)}
                </td>
              </tr>
            ))}

            {/* Total Row */}
            <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 font-bold border-t-2 border-emerald-300">
              <td
                colSpan={5}
                className="py-3 px-3 text-right text-emerald-800 border border-emerald-200"
              >
                Total
              </td>
              {dateHeaders.map((date, i) => (
                <React.Fragment key={`total-${date.key}`}>
                  <td className="py-3 px-2 text-center text-emerald-800 border border-emerald-200">
                    {totals.masukTotals[i]}
                  </td>
                  <td className="py-3 px-2 text-center text-rose-800 border border-emerald-200">
                    {totals.keluarTotals[i]}
                  </td>
                </React.Fragment>
              ))}
              <td className="py-3 px-3 text-right text-emerald-800 border border-emerald-200 whitespace-nowrap">
                {formatCurrency(totals.totalNilaiBeli)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StokDetailTab;
