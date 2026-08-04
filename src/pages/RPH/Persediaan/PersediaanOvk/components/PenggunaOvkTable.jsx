import React from 'react';
import { ClipboardList, CalendarDays } from 'lucide-react';

const SkeletonRows = ({ colCount = 4 }) => (
  <>
    {Array.from({ length: 6 }).map((_, i) => (
      <tr key={i} className="border-b border-slate-100">
        <td className="px-3 py-3 border-r border-slate-100">
          <div className="w-6 h-4 rounded bg-slate-100 animate-pulse mx-auto" />
        </td>
        {Array.from({ length: colCount }).map((__, j) => (
          <td key={j} className="px-3 py-3 border-r border-slate-100 last:border-r-0">
            <div className="space-y-1.5">
              <div className="w-20 h-4 rounded bg-slate-100 animate-pulse" />
              <div className="w-16 h-3 rounded bg-slate-100 animate-pulse" />
            </div>
          </td>
        ))}
      </tr>
    ))}
  </>
);

const PenggunaOvkTable = ({ columns, data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-600 tracking-wide uppercase">No</th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 py-2.5 text-center text-xs font-bold text-slate-600 tracking-wide uppercase border-r border-slate-200 last:border-r-0 ${col.isSummary ? ' bg-slate-100' : ''}`}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SkeletonRows colCount={columns.length} />
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <ClipboardList className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-700 text-base font-bold">Belum ada riwayat stok</p>
          <p className="text-slate-500 text-sm mt-1 text-center max-w-xs">
            Pilih rentang tanggal di atas untuk melihat pergerakan stok OVK (masuk/keluar) pada periode tersebut.
          </p>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Data ditampilkan berdasarkan filter tanggal
          </p>
        </div>
      </div>
    );
  }

  const totalColumns = columns.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-600 tracking-wide uppercase">No</th>
              {columns.map((col, colIndex) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-center text-xs font-bold text-slate-600 tracking-wide uppercase${colIndex < totalColumns - 1 ? ' border-r border-slate-200' : ''}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, index) => (
              <tr
                key={row.id || index}
                className="transition-colors hover:bg-emerald-50/40"
              >
                <td className="px-3 py-2.5 text-center text-xs text-slate-500 border-r border-slate-100 font-medium">
                  {index + 1}
                </td>
                {columns.map((col, colIndex) => {
                  const value = row[col.key];

                  if (col.align === 'center' && col.dateKey) {
                    const masuk = value?.masuk ?? 0;
                    const keluar = value?.keluar ?? 0;
                    return (
                      <td key={col.key} className={`px-3 py-2.5 text-center text-xs text-slate-700${colIndex < totalColumns - 1 ? ' border-r border-slate-100' : ''}`}>
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                              masuk > 0
                                ? 'border-sky-200 bg-sky-50 text-sky-700'
                                : 'border-slate-200 bg-slate-50 text-slate-400'
                            }`}
                          >
                            <span>↑</span> {masuk}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                              keluar > 0
                                ? 'border-rose-200 bg-rose-50 text-rose-700'
                                : 'border-slate-200 bg-slate-50 text-slate-400'
                            }`}
                          >
                            <span>↓</span> {keluar}
                          </span>
                        </div>
                      </td>
                    );
                  }

                  if (col.isSummary) {
                    const isSaldo = col.key === 'saldoAkhir';
                    const isMasuk = col.key === 'totalMasuk';
                    const isKeluar = col.key === 'totalKeluar';
                    const saldoNegatif = isSaldo && (value || 0) < 0;
                    return (
                      <td key={col.key} className={`px-3 py-2.5 text-center${colIndex < totalColumns - 1 ? ' border-r border-slate-100' : ''} ${isSaldo ? ' bg-slate-50' : ''}`}>
                        <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-md text-xs font-bold ${
                          saldoNegatif
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isMasuk
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : isKeluar
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {value || 0}
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={col.key}
                      className={`px-3 py-2.5 text-center text-xs text-slate-700${colIndex < totalColumns - 1 ? ' border-r border-slate-100' : ''}`}
                    >
                      {col.key === 'namaOvk' ? (
                        <span className="font-bold text-slate-900">{value}</span>
                      ) : col.key === 'satuan' ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-600">
                          {value}
                        </span>
                      ) : col.key === 'pemasok' ? (
                        <span className="text-xs text-slate-600 font-medium">{value}</span>
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
      {/* Compact footer info */}
      <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-2.5 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Menampilkan <b className="text-slate-700">{data.length}</b> produk
        </div>
        <div className="text-xs text-slate-400">
          Periode: <b className="text-slate-600">{columns.filter(c => c.dateKey).length}</b> hari
        </div>
      </div>
    </div>
  );
};

export default PenggunaOvkTable;
