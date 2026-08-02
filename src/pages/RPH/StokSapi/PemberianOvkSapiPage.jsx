import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DataTable from 'react-data-table-component';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  Loader2,
  MoreVertical,
  RefreshCw,
  Search,
  Trash2,
  Package,
  X,
} from 'lucide-react';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import PemberianOvkSapiService from '../../../services/pemberianOvkSapiService';

const getToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount === 0) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const tableCustomStyles = {
  table: {
    style: {
      backgroundColor: '#fff',
      borderRadius: '0px',
      width: '100%',
      minWidth: '1200px',
      maxWidth: '100%',
      tableLayout: 'fixed',
      borderCollapse: 'separate',
      borderSpacing: 0,
      margin: 0,
    },
  },
  tableWrapper: {
    style: {
      overflowX: 'auto',
      overflowY: 'visible',
      width: '100%',
      maxWidth: '100vw',
      border: 'none',
      borderRadius: '0',
      WebkitOverflowScrolling: 'touch',
      position: 'relative',
      scrollBehavior: 'smooth',
      scrollbarWidth: 'thin',
      scrollbarColor: '#cbd5e1 #f1f5f9',
    },
  },
  headRow: {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: '#f8fafc',
      borderBottom: '2px solid #e2e8f0',
      minHeight: '52px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
  },
  headCells: {
    style: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#374151',
      padding: '16px 12px',
      textAlign: 'center',
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      wordBreak: 'break-word',
      lineHeight: '1.4',
      letterSpacing: '0.025em',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '&:last-child': {
        borderRight: 'none',
      },
    },
  },
  cells: {
    style: {
      padding: '12px',
      fontSize: '13px',
      color: '#374151',
      lineHeight: '1.5',
      textAlign: 'center',
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      wordBreak: 'break-word',
      overflow: 'visible',
      verticalAlign: 'middle',
      borderRight: '1px solid #e5e7eb',
      backgroundColor: 'transparent',
      '&:last-child': {
        borderRight: 'none',
      },
      '&:first-child': {
        fontWeight: '600',
        color: '#6b7280',
        backgroundColor: 'inherit',
      },
    },
  },
  rows: {
    style: {
      fontSize: '13px',
      minHeight: '48px',
      borderBottom: '1px solid #f3f4f6',
      transition: 'all 0.2s ease',
      '&:hover': { backgroundColor: '#d1d5db', transform: 'none' },
      '&:last-child': {
        borderBottom: 'none',
      },
      '&:nth-of-type(odd)': {
        backgroundColor: '#ffffff',
      },
      '&:nth-of-type(even)': {
        backgroundColor: '#e5e7eb',
      },
    },
    highlightOnHoverStyle: {
      backgroundColor: '#d1d5db',
      borderBottomColor: '#9ca3af',
      outline: 'none',
    },
  },
  pagination: {
    style: {
      borderTop: '1px solid #e2e8f0',
      borderRadius: '0',
      padding: '12px 16px',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '8px',
    },
  },
};

const Toast = ({ notification, onClose }) => {
  if (!notification) return null;

  const isSuccess = notification.type === 'success';
  const isInfo = notification.type === 'info';
  const Icon = isSuccess ? CheckCircle2 : isInfo ? Loader2 : AlertCircle;
  const colorClass = isSuccess
    ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
    : isInfo
      ? 'border-sky-500 bg-sky-50 text-sky-600'
      : 'border-red-500 bg-red-50 text-red-600';

  return (
    <div className="fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className={`overflow-hidden rounded-xl border-l-4 bg-white shadow-lg ring-1 ring-black/5 ${colorClass.split(' ')[0]}`}>
        <div className="flex items-start gap-3 p-4">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass.split(' ').slice(1).join(' ')}`}>
            <Icon className={`h-4 w-4 ${isInfo ? 'animate-spin' : ''}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{isSuccess ? 'Berhasil!' : isInfo ? 'Memproses...' : 'Gagal!'}</p>
            <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup notifikasi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailModal = ({ row, onClose, onEdit }) => {
  if (!row) return null;

  const detailItems = [
    ['OVK / Deskripsi', row.nama_ovk || row.nama_produk || `OVK #${row.id_pembelian_rph_detail}`],
    ['Tanggal Pemberian', row.tgl_pemberian_ovk],
    ['Jam Pemberian', String(row.jam_pemberian_ovk || '').slice(0, 5)],
    ['Nama Peternak', row.nama_peternak],
    ['Jumlah (Qty)', row.jumlah != null ? String(row.jumlah) : '1'],
    ['Harga', formatCurrency(row.harga)],
    ['Eartag Sapi', row.eartag_sapi || row.eartag || '-'],
    ['Nama Sapi', row.nama_sapi || '-'],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="detail-ovk-title">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-teal-100 p-3 text-teal-700">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h2 id="detail-ovk-title" className="text-xl font-bold text-slate-900">Detail Pemberian OVK</h2>
              <p className="mt-1 text-sm text-slate-500">Informasi detail pemberian OVK sapi RPH.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup detail"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
          {detailItems.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-800">{value || '-'}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-end sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => onEdit(row)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            <Edit className="h-4 w-4" />
            Edit Data
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({ row, loading, onClose, onConfirm }) => {
  if (!row) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-ovk-title">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Trash2 className="h-7 w-7" />
          </div>
          <h2 id="delete-ovk-title" className="mt-4 text-xl font-bold text-slate-900">Hapus Data Pemberian OVK?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Catatan pemberian OVK <span className="font-semibold text-slate-700">{row.nama_ovk || row.nama_produk || 'ini'}</span> untuk Sapi {row.eartag_sapi || row.eartag || ''} akan dihapus. Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(row)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {loading ? 'Menghapus...' : 'Hapus Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

const RowActionMenu = ({ row, anchorRef, onClose, onDetail, onEdit, onDelete }) => {
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  useLayoutEffect(() => {
    const updatePosition = () => {
      if (!anchorRef?.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'absolute',
        left: rect.left + window.scrollX,
        top: rect.bottom + window.scrollY + 8,
        zIndex: 99999,
      });
    };

    const handleClickOutside = (event) => {
      if (
        menuRef.current
        && !menuRef.current.contains(event.target)
        && anchorRef.current
        && !anchorRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [anchorRef, onClose]);

  if (!menuStyle) return null;

  const menu = (
    <div
      ref={menuRef}
      style={menuStyle}
      className="w-48 overflow-hidden rounded-xl border border-gray-200/60 bg-white/95 shadow-xl backdrop-blur"
      role="menu"
      aria-label="Menu aksi"
    >
      <div className="border-b border-gray-100 bg-gray-50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Menu Aksi</p>
      </div>
      <div className="p-1.5">
        <button
          type="button"
          onClick={() => {
            onDetail(row);
            onClose();
          }}
          className="group mt-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-blue-50"
          role="menuitem"
        >
          <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><Eye className="h-4 w-4" /></span>
          <span className="text-xs font-semibold">Lihat Detail</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onEdit(row);
            onClose();
          }}
          className="group mt-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-amber-50"
          role="menuitem"
        >
          <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><Edit className="h-4 w-4" /></span>
          <span className="text-xs font-semibold">Edit</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onDelete(row);
            onClose();
          }}
          className="group mt-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-red-50"
          role="menuitem"
        >
          <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600"><Trash2 className="h-4 w-4" /></span>
          <span className="text-xs font-semibold">Hapus</span>
        </button>
      </div>
    </div>
  );

  return createPortal(menu, document.body);
};

const RowActionButton = ({ row, isOpen, onToggle, onClose, onDetail, onEdit, onDelete }) => {
  const buttonRef = useRef(null);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle(row.pid);
        }}
        className={`rounded-lg border p-2 text-gray-600 shadow-sm transition-all hover:scale-105 hover:bg-blue-50 hover:text-blue-600 ${isOpen ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-300 bg-white'}`}
        aria-label="Menu aksi pemberian OVK"
        aria-expanded={isOpen}
      >
        <MoreVertical className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen ? (
        <RowActionMenu
          row={row}
          anchorRef={buttonRef}
          onClose={onClose}
          onDetail={onDetail}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : null}
    </div>
  );
};

const PemberianOvkSapiPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useDocumentTitle('Pemberian OVK Sapi RPH');

  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(getDaysAgo(6));
  const [endDate, setEndDate] = useState(getToday());
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [openActionMenuPid, setOpenActionMenuPid] = useState(null);
  const [ovkNamesMap, setOvkNamesMap] = useState({});

  useEffect(() => {
    if (location.state?.message) {
      setNotification({ type: 'success', message: location.state.message });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (!notification || notification.type === 'info') return undefined;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Fetch OVK items options once to map names
  useEffect(() => {
    const loadOvkMapping = async () => {
      const res = await PemberianOvkSapiService.getOvkOptions();
      if (res.success && Array.isArray(res.data)) {
        const mapping = {};
        res.data.forEach((item) => {
          mapping[item.value] = item.label;
        });
        setOvkNamesMap(mapping);
      }
    };
    loadOvkMapping();
  }, []);

  const fetchData = useCallback(async ({ page = currentPage, limit = perPage, query = search } = {}) => {
    setLoading(true);
    setError(null);

    const response = await PemberianOvkSapiService.getData({
      draw: page,
      start: (page - 1) * limit,
      length: limit,
      search: query,
      startDate,
      endDate,
      orderColumn: 5,
      orderDir: 'desc',
    });

    if (response.success) {
      setRows(response.data || []);
      setTotalRows(response.recordsFiltered || 0);
    } else {
      setRows([]);
      setTotalRows(0);
      setError(response.message || 'Gagal memuat data pemberian OVK sapi');
    }

    setLoading(false);
  }, [currentPage, endDate, perPage, search, startDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplySearch = () => {
    setCurrentPage(1);
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleEdit = async (row) => {
    const detailResponse = await PemberianOvkSapiService.show(row.pid);
    const record = detailResponse.success ? { ...row, ...(detailResponse.data || {}) } : row;

    if (!detailResponse.success) {
      setNotification({
        type: 'error',
        message: detailResponse.message || 'Gagal memuat detail data untuk edit',
      });
    }

    navigate(`/rph/pemberian-ovk-sapi/edit/${encodeURIComponent(row.pid)}`, {
      state: { record },
    });
    setOpenActionMenuPid(null);
  };

  const handleDetail = async (row) => {
    setNotification({ type: 'info', message: 'Memuat detail data...' });
    const detailResponse = await PemberianOvkSapiService.show(row.pid);

    if (detailResponse.success) {
      const detailed = { ...row, ...(detailResponse.data || {}) };
      // Map OVK product name
      detailed.nama_ovk = ovkNamesMap[detailed.id_pembelian_rph_detail] || detailed.nama_produk || `OVK #${detailed.id_pembelian_rph_detail}`;
      setDetailRow(detailed);
      setNotification(null);
      return;
    }

    setNotification({
      type: 'error',
      message: detailResponse.message || 'Gagal memuat detail data',
    });
  };

  const handleDeleteConfirm = async (row) => {
    setDeleteLoading(true);
    const response = await PemberianOvkSapiService.delete(row.pid);
    setDeleteLoading(false);

    if (response.success) {
      setDeleteRow(null);
      setNotification({ type: 'success', message: response.message || 'Data berhasil dihapus' });
      fetchData();
      return;
    }

    setNotification({ type: 'error', message: response.message || 'Gagal menghapus data' });
  };

  const statCards = useMemo(() => {
    const totalHarga = rows.reduce((sum, row) => sum + (Number(row.harga) || 0), 0);
    const uniqueOvkIds = new Set(rows.map((row) => row.id_pembelian_rph_detail).filter(Boolean));

    return [
      { label: 'Data Ditampilkan', value: `${rows.length} data`, tone: 'emerald' },
      { label: 'Total Terfilter', value: `${totalRows} data`, tone: 'cyan' },
      { label: 'Varian OVK Diberikan', value: `${uniqueOvkIds.size} produk`, tone: 'amber' },
      { label: 'Total Biaya OVK', value: formatCurrency(totalHarga), tone: 'violet' },
    ];
  }, [rows, totalRows]);

  const columns = useMemo(() => [
    {
      name: 'No',
      cell: (_, index) => (currentPage - 1) * perPage + index + 1,
      width: '64px',
      center: true,
    },
    {
      name: 'Aksi',
      width: '90px',
      center: true,
      cell: (row) => (
        <div className="flex items-center justify-center">
          <RowActionButton
            row={row}
            isOpen={openActionMenuPid === row.pid}
            onToggle={(pid) => setOpenActionMenuPid((current) => (current === pid ? null : pid))}
            onClose={() => setOpenActionMenuPid(null)}
            onDetail={handleDetail}
            onEdit={handleEdit}
            onDelete={(selectedRow) => setDeleteRow(selectedRow)}
          />
        </div>
      ),
    },
    {
      name: 'OVK / Produk',
      selector: (row) => row.id_pembelian_rph_detail,
      sortable: true,
      minWidth: '180px',
      cell: (row) => {
        const name = ovkNamesMap[row.id_pembelian_rph_detail] || row.nama_produk || `OVK #${row.id_pembelian_rph_detail}`;
        return <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">{name}</span>;
      },
    },
    {
      name: 'Sapi (Eartag)',
      selector: (row) => row.eartag_sapi || row.eartag,
      sortable: true,
      minWidth: '150px',
      cell: (row) => <span className="font-mono text-xs font-bold text-slate-700">{row.eartag_sapi || row.eartag || '-'}</span>,
    },
    {
      name: 'Tanggal',
      selector: (row) => row.tgl_pemberian_ovk,
      sortable: true,
      minWidth: '130px',
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 text-slate-700">
          <Calendar className="h-4 w-4 text-emerald-500" />
          {row.tgl_pemberian_ovk || '-'}
        </span>
      ),
    },
    {
      name: 'Jam',
      selector: (row) => row.jam_pemberian_ovk,
      center: true,
      width: '110px',
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-1 font-mono text-xs font-semibold text-cyan-700">
          <Clock className="h-3.5 w-3.5" />
          {String(row.jam_pemberian_ovk || '-').slice(0, 5)}
        </span>
      ),
    },
    {
      name: 'Peternak',
      selector: (row) => row.nama_peternak,
      sortable: true,
      minWidth: '150px',
      cell: (row) => <span className="text-slate-700">{row.nama_peternak || '-'}</span>,
    },
    {
      name: 'Qty',
      selector: (row) => row.jumlah,
      center: true,
      width: '90px',
      cell: (row) => (
        <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
          {row.jumlah != null ? row.jumlah : 1}
        </span>
      ),
    },
    {
      name: 'Harga',
      selector: (row) => row.harga,
      right: true,
      minWidth: '130px',
      cell: (row) => <span className="font-semibold text-emerald-700">{formatCurrency(row.harga)}</span>,
    },
  ], [currentPage, handleDetail, handleEdit, openActionMenuPid, perPage, ovkNamesMap]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-white to-cyan-50/30">
      <div className="mx-auto max-w-full space-y-5 p-4 md:p-6">
        <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => navigate('/rph/stok-sapi')}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                aria-label="Kembali ke Stok Sapi"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="rounded-2xl bg-teal-100 p-3 text-teal-700">
                <Package className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Pemberian OVK Sapi RPH</h1>
                <p className="mt-1 text-sm text-gray-500 sm:text-base">Kelola pencatatan pemberian Obat, Vitamin, dan Konsentrat untuk sapi aktif di RPH.</p>
              </div>
            </div>
            
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <label htmlFor="start-date" className="text-sm font-semibold text-slate-600">Dari</label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setCurrentPage(1);
                    setStartDate(event.target.value);
                  }}
                  max={endDate}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="end-date" className="text-sm font-semibold text-slate-600">Sampai</label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(event) => {
                    setCurrentPage(1);
                    setEndDate(event.target.value);
                  }}
                  min={startDate}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-[240px] flex-1 xl:w-96">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleApplySearch();
                  }}
                  placeholder="Cari peternak..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-10 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
                {searchInput ? (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Bersihkan pencarian"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleApplySearch}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <Search className="h-4 w-4" />
                Cari
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Gagal memuat data</p>
              <p className="mt-0.5 text-sm">{error}</p>
            </div>
          </div>
        ) : null}

        <section className="relative hidden overflow-hidden border-y border-gray-100 bg-white shadow-lg md:block">
          <DataTable
            columns={columns}
            data={rows}
            customStyles={tableCustomStyles}
            progressPending={loading}
            progressComponent={(
              <div className="flex items-center gap-2 py-12 text-sm text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                Memuat data pemberian OVK...
              </div>
            )}
            noDataComponent={(
              <div className="py-12 text-center text-sm text-slate-400">
                Belum ada data pemberian OVK sapi pada filter saat ini.
              </div>
            )}
            pagination
            paginationServer
            paginationTotalRows={totalRows}
            paginationDefaultPage={currentPage}
            paginationPerPage={perPage}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            onChangePage={(page) => setCurrentPage(page)}
            onChangeRowsPerPage={(newPerPage, page) => {
              setPerPage(newPerPage);
              setCurrentPage(page);
            }}
            highlightOnHover
            dense
            striped
            responsive={false}
            fixedHeader
            fixedHeaderScrollHeight="65vh"
          />
        </section>
      </div>

      <DetailModal
        row={detailRow}
        onClose={() => setDetailRow(null)}
        onEdit={(row) => {
          setDetailRow(null);
          handleEdit(row);
        }}
      />
      <DeleteModal
        row={deleteRow}
        loading={deleteLoading}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDeleteConfirm}
      />
      <Toast notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
};

export default PemberianOvkSapiPage;
