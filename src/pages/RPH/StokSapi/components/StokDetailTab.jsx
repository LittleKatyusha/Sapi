import React, { useState, useMemo } from 'react';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import {
  sapiMasukData,
  sapiKeluarData,
  generateDateHeaders,
  formatCurrency,
} from '../constants/dummyData';

const SUB_TABS = [
  { id: 'masuk', label: 'Sapi Masuk', icon: ArrowDownCircle },
  { id: 'keluar', label: 'Sapi Keluar', icon: ArrowUpCircle },
];

const StokDetailTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('masuk');
  const dateHeaders = useMemo(() => generateDateHeaders(), []);

  const currentData = activeSubTab === 'masuk' ? sapiMasukData : sapiKeluarData;

  // Calculate totals for the bottom row
  const totals = useMemo(() => {
    const dateKeys = dateHeaders.map((d) => d.key);
    return currentData.reduce(
      (acc, row) => {
        dateKeys.forEach((key) => {
          acc[key] = (acc[key] || 0) + (row[key] || 0);
        });
        acc.totalNilaiBeli += row.totalNilaiBeli || 0;
        return acc;
      },
      { totalNilaiBeli: 0 }
    );
  }, [currentData, dateHeaders]);

  return (
    <div className="space-y-4">
      {/* Sub-tab Bar */}
      <div className="flex border-b-2 border-gray-200">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`relative flex-1 px-8 py-4 text-base font-bold transition-all duration-300 ${
                activeSubTab === tab.id
                  ? 'text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Icon className="h-5 w-5" />
                {tab.label}
              </span>
              {activeSubTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Complex Table with horizontal scroll for mobile */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <th className="py-3 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">
                JENIS SAPI
              </th>
              <th className="py-3 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap">
                STOK AWAL
              </th>
              <th className="py-3 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap">
                SATUAN
              </th>
              {dateHeaders.map((date) => (
                <th
                  key={date.key}
                  className="py-3 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap"
                >
                  {date.label}
                </th>
              ))}
              <th className="py-3 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap">
                TOTAL NILAI BELI
              </th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, index) => (
              <tr
                key={row.id}
                className={`border-b border-gray-100 hover:bg-emerald-50/50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <td className="py-3 px-3 font-semibold text-gray-800 border border-gray-100">
                  {row.jenisSapi}
                </td>
                <td className="py-3 px-3 text-center font-medium text-gray-700 border border-gray-100">
                  {row.stokAwal}
                </td>
                <td className="py-3 px-3 text-center text-gray-600 border border-gray-100">
                  {row.satuan}
                </td>
                {dateHeaders.map((date) => {
                  const value = row[date.key] || 0;
                  return (
                    <td
                      key={date.key}
                      className={`py-3 px-3 text-center font-medium border border-gray-100 ${
                        value > 0
                          ? activeSubTab === 'masuk'
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                          : 'text-gray-400'
                      }`}
                    >
                      {value}
                    </td>
                  );
                })}
                <td
                  className={`py-3 px-3 text-right font-semibold border border-gray-100 whitespace-nowrap ${
                    row.totalNilaiBeli > 0 ? 'text-teal-700' : 'text-gray-400'
                  }`}
                >
                  {formatCurrency(row.totalNilaiBeli)}
                </td>
              </tr>
            ))}

            {/* Total Row */}
            <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 font-bold border-t-2 border-emerald-300">
              <td
                colSpan="3"
                className="py-3 px-3 text-right text-emerald-800 border border-emerald-200"
              >
                Total
              </td>
              {dateHeaders.map((date) => (
                <td
                  key={date.key}
                  className="py-3 px-3 text-center text-emerald-800 border border-emerald-200"
                >
                  {totals[date.key] || 0}
                </td>
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
