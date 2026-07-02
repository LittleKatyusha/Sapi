import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  SearchX,
  PlusCircle,
  Truck,
  Banknote,
  Package,
  Wallet,
  Info
} from 'lucide-react';
import LaporanPembelianService from '../../../../services/laporanPembelianService';
import PortalActionDropdown from './PortalActionDropdown';

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
  if (text.includes('internal')) return 'bg-orange-50 text-orange-700 border-orange-200';
  if (text.includes('external')) return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-purple-50 text-purple-700 border-purple-200';
};

const getPaymentStatusStyle = (status) => {
  switch (status) {
    case 0: return 'bg-orange-50 text-orange-700 border-orange-200';
    case 1: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 2: return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const PaymentStatusBadge = ({ status, label }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${getPaymentStatusStyle(status)} whitespace-nowrap`}>
    {label || 'Belum Bayar'}
  </span>
);

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

const ModernPembelianLainLainTable = ({
  data,
  loading,
  serverPagination,
  onPageChange,
  onPerPageChange,
  onEdit,
  onDelete,
  onDetail,
  getFarmName,
  getBankName,
  bankOptions = []
}) => {
  const navigate = useNavigate();
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [downloadLoadingId, setDownloadLoadingId] = useState(null);
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

  const handleDownload = async (row) => {
    const id = row.id || row.encryptedPid;
    if (!id) return;
    const rowId = row.id || row.encryptedPid;
    setDownloadLoadingId(rowId);
    try {
      const blob = await LaporanPembelianService.downloadReportNotaLainLain(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Laporan_Nota_LainLain_${row.nota || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download lain-lain report error:', error);
    } finally {
      setDownloadLoadingId(null);
    }
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
      className={`pb-2 pt-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition-colors ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      }`}
      onClick={sortKey ? () => handleSort(sortKey) : undefined}
    >
      <div className={`flex flex-col ${align === 'right' ? 'items-end' : align === 'center' ? 'items-center' : 'items-start'}`}>
        <div className="flex items-center gap-1">
          {label}
          {sortKey && (
            <ArrowUpDown className={`w-3.5 h-3.5 transition-colors ${sortConfig.key === sortKey ? 'text-green-600' : 'text-gray-300'}`} />
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
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Belum ada data pembelian lain-lain</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          Data pembelian lain-lain akan muncul di sini. Coba tambahkan data baru atau ubah pencarian/filter tanggal.
        </p>
        <button
          onClick={() => navigate('/ho/pembelian-lain-lain/add')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Tambah Pembelian Lain-Lain
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="pb-2 pt-2.5 pl-3 pr-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center w-14">No</th>
                <TableHeader label="Pembelian" caption="Nota Sistem / Manual" sortKey="nota_sistem" />
                <TableHeader label="Supplier" caption="Nama & Plat Nomor" sortKey="nama_supplier" />
                <TableHeader label="Tanggal Masuk" caption="Tgl kedatangan" sortKey="tgl_masuk" />
                <TableHeader label="Jumlah" caption="Jumlah item" sortKey="jumlah" align="right" />
                <TableHeader label="Total Biaya" caption="Beli + Lain + Truk" align="right" />
                <TableHeader label="Jenis Pembelian" caption="Tipe supplier" sortKey="jenis_pembelian" />
                <th className="pb-2 pt-2.5 px-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-left">Status Bayar</th>
                <th className="pb-2 pt-2.5 pr-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedData.map((row, index) => {
                const rowId = row.id || row.encryptedPid;
                const isExpanded = expandedRows.has(rowId);
                const rowNumber = startItem + index;
                return (
                  <React.Fragment key={rowId || index}>
                    <tr className="group hover:bg-gray-50/60 transition-colors">
                      <td className="pl-3 pr-2 py-2 text-center">
                        <button
                          onClick={() => toggleExpand(rowId)}
                          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <span className="text-xs font-medium text-gray-400 w-5">{rowNumber}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                              {row.nota_sistem || '-'}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-900 truncate">{row.nota || '-'}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold ${getSupplierColor(row.nama_supplier)}`}>
                            {getInitials(row.nama_supplier)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{row.nama_supplier || '-'}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              <span>{row.plat_nomor || '-'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm font-medium text-gray-900">{formatDate(row.tgl_masuk)}</div>
                        <div className="text-xs text-gray-500">{formatDateCompact(row.tgl_masuk)}</div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="text-sm font-semibold text-gray-900">{row.jumlah || 0}</div>
                        <div className="text-xs text-gray-500">item</div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(row.biaya_total)}</div>
                        <div className="text-xs text-gray-500">
                          B:{formatCurrency(row.total_belanja)} L:{formatCurrency(row.biaya_lain)} T:{formatCurrency(row.biaya_truk)}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${getJenisPembelianStyle(row.jenis_pembelian)}`}>
                          {row.jenis_pembelian || '-'}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <PaymentStatusBadge status={row.payment_status} label={row.payment_status_label} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <PortalActionDropdown
                          row={row}
                          rowId={rowId}
                          onDetail={onDetail}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onDownload={handleDownload}
                          downloadLoadingId={downloadLoadingId}
                          labels={{ download: 'Download Nota', tandaTerimaTitle: 'TANDA TERIMA BARANG - ASET' }}
                        />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <InfoItem icon={Calendar} label="Tanggal Masuk" value={formatDate(row.tgl_masuk)} />
                            <InfoItem icon={Truck} label="Supir / Plat" value={`${row.nama_supir || '-'} / ${row.plat_nomor || '-'}`} />
                            <InfoItem icon={Package} label="Jumlah / Berat" value={`${row.jumlah || 0} item / ${row.berat_total ? `${row.berat_total} kg` : '-'}`} />
                            <InfoItem icon={Banknote} label="Total Belanja" value={formatCurrency(row.total_belanja)} valueClass="text-emerald-700" />
                            <InfoItem icon={Wallet} label="Biaya Lain" value={formatCurrency(row.biaya_lain)} valueClass="text-orange-700" />
                            <InfoItem icon={Truck} label="Biaya Truk" value={formatCurrency(row.biaya_truk)} valueClass="text-cyan-700" />
                            <InfoItem icon={Banknote} label="Biaya Total" value={formatCurrency(row.biaya_total)} valueClass="text-green-700 font-semibold" />
                            <InfoItem icon={MapPin} label="Farm" value={row.farm || getFarmName(row.id_farm)} />
                            <InfoItem icon={Info} label="Syarat Pembelian" value={row.syarat_pembelian || getBankName(row.id_syarat_pembelian, bankOptions)} />
                            <InfoItem icon={Package} label="Nota HO" value={row.nota_ho} />
                            <InfoItem icon={Info} label="Catatan" value={row.note} />
                            <InfoItem icon={Info} label="Jenis Pembelian" value={row.jenis_pembelian} valueClass={`${getJenisPembelianStyle(row.jenis_pembelian).replace('border-', '').replace('bg-', 'text-').split(' ')[0]}`} />
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {sortedData.map((row, index) => {
          const rowId = row.id || row.encryptedPid;
          const isExpanded = expandedRows.has(rowId);
          const rowNumber = startItem + index;
          return (
            <div key={rowId || index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-400">#{rowNumber}</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        {row.nota_sistem || '-'}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 truncate">{row.nama_supplier || '-'}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Truck className="w-3 h-3" />
                      {row.plat_nomor || '-'}
                    </div>
                  </div>
                  <PortalActionDropdown
                    row={row}
                    rowId={rowId}
                    onDetail={onDetail}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDownload={handleDownload}
                    downloadLoadingId={downloadLoadingId}
                    labels={{ download: 'Download Nota', tandaTerimaTitle: 'TANDA TERIMA BARANG - ASET' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Tanggal</div>
                    <div className="font-medium text-gray-900">{formatDate(row.tgl_masuk)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Jumlah</div>
                    <div className="font-medium text-gray-900">{row.jumlah || 0} item</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Nota</div>
                    <div className="font-medium text-gray-900">{row.nota || '-'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total Biaya</div>
                    <div className="font-medium text-green-700">{formatCurrency(row.biaya_total)}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <PaymentStatusBadge status={row.payment_status} label={row.payment_status_label} />
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getJenisPembelianStyle(row.jenis_pembelian)}`}>
                      {row.jenis_pembelian || '-'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleExpand(rowId)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    {isExpanded ? 'Sembunyikan' : 'Lihat detail'}
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50">
                  <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500">Supir</div>
                      <div className="font-medium text-gray-900">{row.nama_supir || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Berat</div>
                      <div className="font-medium text-gray-900">{row.berat_total ? `${row.berat_total} kg` : '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Total Belanja</div>
                      <div className="font-medium text-emerald-700">{formatCurrency(row.total_belanja)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Biaya Lain</div>
                      <div className="font-medium text-orange-700">{formatCurrency(row.biaya_lain)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Biaya Truk</div>
                      <div className="font-medium text-cyan-700">{formatCurrency(row.biaya_truk)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Farm</div>
                      <div className="font-medium text-gray-900">{row.farm || getFarmName(row.id_farm) || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Syarat</div>
                      <div className="font-medium text-gray-900">{row.syarat_pembelian || getBankName(row.id_syarat_pembelian, bankOptions) || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Nota HO</div>
                      <div className="font-medium text-gray-900">{row.nota_ho || '-'}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    Catatan: {row.note || '-'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          Menampilkan <span className="font-semibold">{startItem}</span> sampai <span className="font-semibold">{endItem}</span> dari <span className="font-semibold">{serverPagination.totalRecords}</span> data
        </div>
        <div className="flex items-center gap-2">
          <select
            value={serverPagination.perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          >
            {[10, 25, 50, 100].map(size => (
              <option key={size} value={size}>{size} / halaman</option>
            ))}
          </select>
          <button
            onClick={() => onPageChange(serverPagination.currentPage - 1)}
            disabled={serverPagination.currentPage <= 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 px-2">
            <span className="font-semibold">{serverPagination.currentPage}</span> / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(serverPagination.currentPage + 1)}
            disabled={serverPagination.currentPage >= totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModernPembelianLainLainTable;
