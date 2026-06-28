import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  SearchX,
  Truck,
  Banknote,
  Package,
  Wallet,
  Info
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

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getSupplierColor = (name) => {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-violet-100 text-violet-700'
  ];
  const index = name ? name.length % colors.length : 0;
  return colors[index];
};

const getJenisPembelianStyle = (label) => {
  const text = (label || '').toLowerCase();
  if (text.includes('perorangan')) return 'bg-orange-50 text-orange-700 border-orange-200';
  if (text.includes('perusahaan')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (text.includes('qurban')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (text.includes('doka')) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-purple-50 text-purple-700 border-purple-200';
};

const Tooltip = ({ children, text }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
        {children}
      </div>
      {show && text && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value, valueClass = 'text-gray-900' }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-gray-500" />
    </div>
    <div className="min-w-0">
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className={`text-sm font-medium ${valueClass} truncate`}>{value || '-'}</div>
    </div>
  </div>
);

const ModernPembelianTable = ({
  data,
  loading,
  serverPagination,
  onPageChange,
  onPerPageChange,
  onEdit,
  onDelete,
  onDetail,
  getJenisPembelianLabel
}) => {
  const navigate = useNavigate();
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [openMenuId, setOpenMenuId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const toggleExpand = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  const TableHeader = ({ label, caption, sortKey, align = 'left' }) => (
    <th
      className={`pb-3 pt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition-colors ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      }`}
      onClick={sortKey ? () => handleSort(sortKey) : undefined}
    >
      <div className={`flex flex-col ${align === 'right' ? 'items-end' : align === 'center' ? 'items-center' : 'items-start'}`}>
        <div className="flex items-center gap-1">
          {label}
          {sortKey && (
            <ArrowUpDown className={`w-3.5 h-3.5 transition-colors ${sortConfig.key === sortKey ? 'text-red-500' : 'text-gray-300'}`} />
          )}
        </div>
        {caption && <span className="text-[10px] font-normal normal-case text-gray-400 mt-0.5">{caption}</span>}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="h-4 bg-gray-100 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-gray-100"></div>
              <div className="w-10 h-10 rounded-full bg-gray-100"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
              <div className="w-24 h-8 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 px-4 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <SearchX className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Belum ada data pembelian</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          Data pembelian ternak akan muncul di sini. Coba tambahkan data baru atau ubah pencarian/filter tanggal.
        </p>
        <button
          onClick={() => navigate('/ho/pembelian/add')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          Tambah Pembelian Baru
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white rounded-xl border border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Daftar Pembelian Ternak</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Menampilkan {startItem}-{endItem} dari {serverPagination.totalRecords} transaksi pembelian
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Info className="w-4 h-4" />
          <span>Klik baris untuk lihat detail tambahan</span>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="pb-3 pt-4 pl-4 pr-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center w-14">No</th>
                <TableHeader label="Pembelian" caption="Nota Sistem / Manual" sortKey="nota_sistem" />
                <TableHeader label="Supplier" caption="Nama & Plat Nomor" sortKey="nama_supplier" />
                <TableHeader label="Tanggal Masuk" caption="Tgl kedatangan" sortKey="tgl_masuk" />
                <TableHeader label="Jumlah" caption="Jumlah ekor" sortKey="jumlah" align="right" />
                <TableHeader label="Total Biaya" caption="Biaya + Berat" sortKey="biaya_total" align="right" />
                <TableHeader label="Jenis Pembelian" caption="Tipe supplier" sortKey="jenis_pembelian" />
                <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedData.map((row, index) => {
                const rowId = row.id || row.pubid;
                const isExpanded = expandedRows.has(rowId);
                const rowNumber = startItem + index;
                const jenisLabel = getJenisPembelianLabel(row.jenis_pembelian);
                return (
                  <React.Fragment key={rowId || index}>
                    <tr className="group hover:bg-gray-50/60 transition-colors">
                      <td className="pl-4 pr-2 py-3.5 text-center">
                        <button
                          onClick={() => toggleExpand(rowId)}
                          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <span className="text-xs font-medium text-gray-400 w-5">{rowNumber}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex-1 min-w-0">
                          <Tooltip text={row.nota_sistem || 'Nota sistem tidak tersedia'}>
                            <div className="text-sm font-semibold text-gray-900 cursor-help">{row.nota_sistem || '-'}</div>
                          </Tooltip>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 font-mono">{row.nota || '-'}</span>
                            <span className="text-[10px] text-gray-400">nota manual</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {row.nama_office || 'Office tidak tersedia'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold ${getSupplierColor(row.nama_supplier)}`}>
                            {getInitials(row.nama_supplier)}
                          </div>
                          <div className="min-w-0">
                            <Tooltip text={row.nama_supplier || 'Supplier tidak tersedia'}>
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[180px] cursor-help">
                                {row.nama_supplier || '-'}
                              </div>
                            </Tooltip>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Truck className="w-3 h-3" />
                              {row.plat_nomor || 'Plat tidak tersedia'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(row.tgl_masuk)}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">Tgl masuk</div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold">
                          {row.jumlah || 0}
                          <span className="text-xs font-normal text-indigo-500">ekor</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(row.biaya_total)}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {row.berat_total ? `${parseFloat(row.berat_total).toFixed(1)} kg total` : 'Berat belum tersedia'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getJenisPembelianStyle(jenisLabel)}`}>
                          {jenisLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === rowId ? null : rowId)}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                            title="Lihat aksi"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openMenuId === rowId && (
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-50 py-1">
                              <button
                                onClick={() => { onDetail(row); setOpenMenuId(null); }}
                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" /> Lihat Detail
                              </button>
                              <button
                                onClick={() => { onEdit(row); setOpenMenuId(null); }}
                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Pencil className="w-4 h-4" /> Edit Data
                              </button>
                              <button
                                onClick={() => { onDelete(row); setOpenMenuId(null); }}
                                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Hapus
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50/60">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <Info className="w-4 h-4 text-gray-400" />
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detail Tambahan</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <InfoItem icon={Truck} label="Nama Supir" value={row.nama_supir} />
                              <InfoItem icon={Banknote} label="Biaya Lain-lain" value={formatCurrency(row.biaya_lain)} valueClass="text-gray-900" />
                              <InfoItem icon={Wallet} label="Biaya Truk" value={formatCurrency(row.biaya_truk)} valueClass="text-gray-900" />
                              <InfoItem icon={Package} label="Total Belanja" value={formatCurrency(row.total_belanja)} valueClass="text-gray-900" />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {sortedData.map((row, index) => {
          const rowId = row.id || row.pubid;
          const jenisLabel = getJenisPembelianLabel(row.jenis_pembelian);
          return (
            <div key={rowId || index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{row.nota_sistem || '-'}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 font-mono">{row.nota || '-'}</span>
                    <span className="text-[10px] text-gray-400">nota manual</span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === rowId ? null : rowId)}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {openMenuId === rowId && (
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 z-50 py-1">
                      <button onClick={() => { onDetail(row); setOpenMenuId(null); }} className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Lihat Detail
                      </button>
                      <button onClick={() => { onEdit(row); setOpenMenuId(null); }} className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Pencil className="w-4 h-4" /> Edit Data
                      </button>
                      <button onClick={() => { onDelete(row); setOpenMenuId(null); }} className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold ${getSupplierColor(row.nama_supplier)}`}>
                  {getInitials(row.nama_supplier)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{row.nama_supplier || '-'}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Truck className="w-3 h-3" />
                    {row.plat_nomor || '-'} • {row.nama_office || '-'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-50">
                <div>
                  <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Tanggal
                  </div>
                  <div className="text-sm font-medium text-gray-900">{formatDateCompact(row.tgl_masuk)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Jumlah Ekor</div>
                  <div className="text-sm font-medium text-indigo-700">{row.jumlah || 0} ekor</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Total Biaya</div>
                  <div className="text-sm font-semibold text-gray-900">{formatCurrency(row.biaya_total)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <div className="text-xs text-gray-500">
                  Berat: {row.berat_total ? `${parseFloat(row.berat_total).toFixed(1)} kg` : '-'}
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getJenisPembelianStyle(jenisLabel)}`}>
                  {jenisLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Tampilkan</span>
          <select
            value={serverPagination.perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
            title="Jumlah data per halaman"
          >
            {[10, 25, 50, 100].map(n => (
              <option key={n} value={n}>{n} baris</option>
            ))}
          </select>
          <span>
            {serverPagination.totalRecords > 0
              ? `• Halaman ${serverPagination.currentPage} dari ${totalPages} (${startItem}-${endItem} dari ${serverPagination.totalRecords} data)`
              : '• 0 data'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(serverPagination.currentPage - 1)}
            disabled={serverPagination.currentPage <= 1}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Halaman sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (serverPagination.currentPage <= 3) {
                page = i + 1;
              } else if (serverPagination.currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = serverPagination.currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    serverPagination.currentPage === page
                      ? 'bg-red-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={`Halaman ${page}`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => onPageChange(serverPagination.currentPage + 1)}
            disabled={serverPagination.currentPage >= totalPages}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Halaman berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModernPembelianTable;
