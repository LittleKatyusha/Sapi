import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const formatCurrency = (value) => {
  if (!value || value === 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const ModernDataTable = ({
  columns,
  data,
  loading,
  error,
  emptyMessage = 'Tidak ada data ditemukan',
  pagination,
  onPageChange,
  onPerPageChange,
  color = 'blue'
}) => {
  const totalPages = Math.ceil(pagination.totalItems / pagination.perPage) || 1;
  const startItem = (pagination.currentPage - 1) * pagination.perPage + 1;
  const endItem = Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems);

  const colorClasses = {
    blue: 'focus:ring-blue-500 focus:border-blue-500',
    emerald: 'focus:ring-emerald-500 focus:border-emerald-500',
    amber: 'focus:ring-amber-500 focus:border-amber-500'
  };

  const renderCell = (col, row, index) => {
    if (col.cell) return col.cell(row, index);
    if (col.selector) return col.selector(row, index);
    return row[col.name] || '-';
  };

  const getWidth = (col) => col.minWidth || col.width || col.maxWidth || 'auto';
  const getKey = (col, index) => col.key || col.name || `col-${index}`;

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                {columns.map((col, colIndex) => (
                  <th
                    key={getKey(col, colIndex)}
                    className="px-3 py-2 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                    style={{ width: getWidth(col), minWidth: getWidth(col) }}
                  >
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-10 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 text-xs mt-2">Memuat data...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-10 text-center">
                    <div className="text-red-600">
                      <p className="text-base font-semibold">Error</p>
                      <p className="text-xs">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-10 text-center">
                    <p className="text-gray-500 text-base">{emptyMessage}</p>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => {
                  const rowId = row.id || row.encryptedPid || row.pid || row.pb_id || `row-${index}`;
                  return (
                    <tr key={rowId} className="hover:bg-gray-50/50 transition-colors">
                      {columns.map((col, colIndex) => (
                        <td
                          key={`${rowId}-${getKey(col, colIndex)}`}
                          className="px-3 py-2 text-sm text-gray-700"
                          style={{ width: getWidth(col), minWidth: getWidth(col) }}
                        >
                          {renderCell(col, row, index)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-red-600">
            <p className="text-lg font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500 text-lg">{emptyMessage}</p>
          </div>
        ) : (
          data.map((row, index) => {
            const rowId = row.id || row.encryptedPid || row.pid || row.pb_id || `row-${index}`;
            const visibleCols = columns.filter(col => {
              const name = (col.name || '').toLowerCase();
              return name !== 'pilih' && name !== 'aksi' && name !== '';
            }).slice(0, 4);
            return (
              <div key={rowId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 space-y-2">
                    {visibleCols.map((col, colIndex) => (
                      <div key={getKey(col, colIndex)} className="flex justify-between items-start gap-2">
                        <span className="text-xs text-gray-500">{col.name}</span>
                        <span className="text-sm text-gray-900 text-right">{renderCell(col, row, index)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="ml-2">
                    {columns.find(col => {
                      const name = (col.name || '').toLowerCase();
                      return name === 'pilih' || name === 'aksi';
                    })?.cell(row, index)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          Menampilkan <span className="font-semibold">{startItem}</span> sampai <span className="font-semibold">{endItem}</span> dari <span className="font-semibold">{pagination.totalItems}</span> data
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pagination.perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className={`px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none ${colorClasses[color] || colorClasses.blue}`}
          >
            {[10, 25, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <button
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage <= 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 px-2">
            <span className="font-semibold">{pagination.currentPage}</span> / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage >= totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModernDataTable;
export { formatCurrency, formatDate };
