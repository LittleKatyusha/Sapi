import React, { useMemo, useState } from 'react';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  SearchX,
  PlusCircle,
  Banknote
} from 'lucide-react';

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

const formatDateCompact = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short'
  });
};

const normalizeStatus = (status) => {
  if (status === null || status === undefined || status === '') return null;
  const num = Number(status);
  if (!isNaN(num)) return num;
  const str = String(status).toLowerCase();
  if (str === 'disetujui' || str === 'approved' || str === 'setuju') return 2;
  if (str === 'ditolak' || str === 'rejected' || str === 'tolak') return 3;
  if (str === 'menunggu' || str === 'pending') return 1;
  return null;
};

const getStatusStyle = (status) => {
  switch (normalizeStatus(status)) {
    case 1:
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 2:
      return 'bg-green-50 text-green-700 border-green-200';
    case 3:
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getStatusLabel = (status) => {
  switch (normalizeStatus(status)) {
    case 1:
      return 'Menunggu';
    case 2:
      return 'Disetujui';
    case 3:
      return 'Ditolak';
    default:
      return 'Unknown';
  }
};

const isWaitingStatus = (status) => {
  const n = normalizeStatus(status);
  if (n === 1) return true;
  const str = String(status ?? '').toLowerCase();
  return str.includes('menunggu');
};

const displayPendingOrValue = (value, status) => {
  if (value !== null && value !== undefined && String(value).trim() !== '') return value;
  if (isWaitingStatus(status)) return 'Sedang menunggu';
  return '-';
};

const ModernPembelianSapiTable = ({
  data,
  loading,
  serverPagination,
  onPageChange,
  onPerPageChange,
  onEdit,
  onDelete,
  onDetail,
  onAdd,
  onBayar
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const result = aVal < bVal ? -1 : 1;
      return sortConfig.direction === 'asc' ? result : -result;
    });
  }, [data, sortConfig]);

  const totalPages = Math.ceil(serverPagination.totalRecords / serverPagination.perPage) || 1;
  const startItem = (serverPagination.currentPage - 1) * serverPagination.perPage + 1;
  const endItem = Math.min(serverPagination.currentPage * serverPagination.perPage, serverPagination.totalRecords);

  const TableHeader = ({ label, sortKey, align = 'left' }) => (
    <th
      className={`py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      }`}
      onClick={sortKey ? () => handleSort(sortKey) : undefined}
    >
      <div className={`flex items-center gap-1 cursor-pointer ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
        {label}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded bg-gray-100"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                <div className="h-2 bg-gray-100 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-6 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 py-12 px-4 text-center">
        <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <SearchX className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Belum ada data pembelian sapi</h3>
        <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
          Data pembelian sapi akan muncul di sini. Coba tambahkan data baru atau ubah pencarian/filter.
        </p>
        {onAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Tambah Pembelian Sapi
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center w-10">No</th>
                <TableHeader label="PO & Nota" sortKey="no_po" />
                <TableHeader label="Tanggal" sortKey="created_at" />
                <TableHeader label="Persetujuan" sortKey="persetujuan" />
                <TableHeader label="Jumlah" sortKey="jumlah" align="right" />
                <TableHeader label="Harga" sortKey="harga" align="right" />
                <TableHeader label="Surat Jalan" />
                <TableHeader label="Faktur" />
                <TableHeader label="Status" sortKey="status" />
                <TableHeader label="Status Bayar" />
                <th className="py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {sortedData.map((row, index) => {
                const rowId = row.id || row.pid || row.encryptedPid || row.pubid;
                const rowNumber = startItem + index;
                const statusValue = row.status || row.persetujuan;
                return (
                  <tr key={rowId || index} className="group hover:bg-gray-50/60 transition-colors">
                    <td className="px-3 py-2.5 text-center text-gray-500 font-medium">
                      {rowNumber}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-900 truncate" title={row.no_po}>{row.no_po || '-'}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Sistem</span>
                        <span className={`text-xs font-mono ${row.nota_sistem ? 'text-gray-600' : 'text-gray-300'}`} title={row.nota_sistem}>
                          {row.nota_sistem || '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Nota</span>
                        <span className={`text-xs font-mono ${row.nota ? 'text-gray-600' : 'text-gray-300'}`} title={row.nota}>
                          {row.nota || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{formatDate(row.tgl_pesanan || row.created_at)}</div>
                      <div className="text-xs text-gray-500">{formatDateCompact(row.tgl_pesanan || row.created_at)}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-xs text-gray-700 truncate max-w-[140px]" title={row.persetujuan_rph || row.persetujuan_ho || row.nama_persetujuan}>
                        {row.persetujuan_rph || row.persetujuan_ho || row.nama_persetujuan || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold">
                        {row.jumlah || 0}
                        <span className="text-[10px] font-normal text-indigo-500">ekor</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <div className="font-medium text-emerald-700">{formatCurrency(row.harga || row.biaya_total || 0)}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      {(() => {
                        const sj = displayPendingOrValue(row.no_surat_jalan, statusValue);
                        const pending = sj === 'Sedang menunggu';
                        return (
                          <div className={`text-xs whitespace-nowrap ${pending ? 'text-amber-600 italic' : row.no_surat_jalan ? 'font-mono text-gray-700' : 'text-gray-300'}`}>
                            {sj}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2.5">
                      {(() => {
                        const fk = displayPendingOrValue(row.no_faktur, statusValue);
                        const pending = fk === 'Sedang menunggu';
                        return (
                          <div className={`text-xs whitespace-nowrap ${pending ? 'text-amber-600 italic' : row.no_faktur ? 'font-mono text-gray-700' : 'text-gray-300'}`}>
                            {fk}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusStyle(statusValue)}`}>
                        {getStatusLabel(statusValue)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {(() => {
                        const ps = row.payment_status;
                        const label = row.payment_status_label;
                        if (ps === null || ps === undefined) {
                          if (isWaitingStatus(statusValue)) {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                                Sedang menunggu
                              </span>
                            );
                          }
                          return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-gray-50 text-gray-400 border-gray-200">-</span>;
                        }
                        const styles = ps === 1
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : ps === 0
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200';
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${styles}`}>
                            {label || (ps === 1 ? 'Lunas' : ps === 0 ? 'Belum Lunas' : 'Belum Bayar')}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === rowId ? null : rowId)}
                          className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openMenuId === rowId && (
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-50 py-1">
                            <button
                              onClick={() => { onDetail(row); setOpenMenuId(null); }}
                              className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" /> Lihat Detail
                            </button>
                            <button
                              onClick={() => { onEdit(row); setOpenMenuId(null); }}
                              className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                            {onBayar && row.status === 'Disetujui' && (row.sisa_pembayaran || 0) > 0 && row.pembayaran_pid && (
                              <button
                                onClick={() => { onBayar(row); setOpenMenuId(null); }}
                                className="w-full px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                              >
                                <Banknote className="w-4 h-4" /> Bayar
                              </button>
                            )}
                            <button
                              onClick={() => { onDelete(row); setOpenMenuId(null); }}
                              className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Hapus
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white rounded-lg border border-gray-100 px-4 py-3">
        <div className="text-sm text-gray-600">
          Menampilkan <span className="font-semibold">{startItem}</span> sampai <span className="font-semibold">{endItem}</span> dari <span className="font-semibold">{serverPagination.totalRecords}</span> hasil
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-600">Rows:</span>
            <select
              value={serverPagination.perPage}
              onChange={(e) => onPerPageChange(parseInt(e.target.value))}
              className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(serverPagination.currentPage - 1)}
              disabled={serverPagination.currentPage === 1}
              className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium px-2">
              {serverPagination.currentPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(serverPagination.currentPage + 1)}
              disabled={serverPagination.currentPage === totalPages}
              className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernPembelianSapiTable;
