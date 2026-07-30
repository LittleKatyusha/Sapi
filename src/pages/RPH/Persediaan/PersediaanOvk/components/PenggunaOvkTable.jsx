import React from 'react';
import { Search, Loader2 } from 'lucide-react';

const PenggunaOvkTable = ({ columns, data, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        <span className="ml-2 text-sm text-gray-500">Memuat data penggunaan OVK...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center">
        <Search className="mx-auto h-8 w-8 text-gray-300" />
        <p className="mt-2 font-medium text-sm text-gray-600">Belum ada data penggunaan OVK</p>
        <p className="mt-0.5 text-xs text-gray-400">
          Pilih tanggal untuk melihat data penggunaan OVK.
        </p>
      </div>
    );
  }

  const totalColumns = columns.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 tracking-wide">
                No
              </th>
              {columns.map((col, colIndex) => (
                <th
                  key={col.key}
                  className={`px-3 py-2 text-center text-xs font-semibold text-gray-600 tracking-wide${colIndex < totalColumns - 1 ? ' border-r border-gray-200' : ''}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, index) => (
              <tr
                key={row.id}
                className="transition-colors hover:bg-gray-50"
              >
                <td className="px-3 py-2 text-center text-xs text-gray-500 border-r border-gray-100">
                  {index + 1}
                </td>
                {columns.map((col, colIndex) => {
                  const value = row[col.key];

                  if (col.align === 'center' && col.dateKey) {
                    const masuk = value?.masuk ?? 0;
                    const keluar = value?.keluar ?? 0;
                    return (
                      <td key={col.key} className={`px-3 py-2 text-center text-xs text-gray-700${colIndex < totalColumns - 1 ? ' border-r border-gray-100' : ''}`}>
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                              masuk > 0
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-gray-50 text-gray-400'
                            }`}
                          >
                            ↑ {masuk}
                          </span>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                              keluar > 0
                                ? 'border-orange-200 bg-orange-50 text-orange-700'
                                : 'border-gray-200 bg-gray-50 text-gray-400'
                            }`}
                          >
                            ↓ {keluar}
                          </span>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={col.key}
                      className={`px-3 py-2 text-center text-xs text-gray-700${colIndex < totalColumns - 1 ? ' border-r border-gray-100' : ''}`}
                    >
                      {col.key === 'namaOvk' ? (
                        <span className="font-medium text-gray-900">{value}</span>
                      ) : col.key === 'satuan' ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium border border-slate-200 bg-slate-50 text-slate-600">
                          {value}
                        </span>
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PenggunaOvkTable;
