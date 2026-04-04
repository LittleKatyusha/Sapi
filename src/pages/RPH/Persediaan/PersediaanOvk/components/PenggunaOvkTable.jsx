import React from 'react';
import { Search, Loader2 } from 'lucide-react';

const PenggunaOvkTable = ({ columns, data, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-gray-500">Memuat data penggunaan OVK...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center">
        <Search className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 font-semibold text-gray-600">Belum ada data penggunaan OVK</p>
        <p className="mt-1 text-sm text-gray-400">
          Pilih tanggal untuk melihat data penggunaan OVK.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-gray-50">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                No
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 ${
                    col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
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
                className="transition-colors hover:bg-emerald-50/30"
              >
                <td className="px-4 py-3 text-center font-semibold text-gray-400">
                  {index + 1}
                </td>
                {columns.map((col) => {
                  const value = row[col.key];

                  if (col.align === 'center' && col.dateKey) {
                    // Date column — show usage value with badge
                    const isUsed = value && value !== '-' && value !== 0;
                    return (
                      <td key={col.key} className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ${
                            isUsed
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {value || 0}
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={col.key}
                      className={`px-4 py-3 ${
                        col.align === 'center' ? 'text-center' : ''
                      }`}
                    >
                      {col.key === 'namaOvk' ? (
                        <span className="font-semibold text-gray-800">{value}</span>
                      ) : col.key === 'satuan' ? (
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
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
