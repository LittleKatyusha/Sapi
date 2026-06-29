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
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wheat,
  X,
} from 'lucide-react';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import PemberianPakanSapiService from '../../../services/pemberianPakanSapiService';

const getToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getFirstDayOfMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
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
  const [cowRows, setCowRows] = useState([]);
  const [cowTotal, setCowTotal] = useState(0);
  const [cowPage, setCowPage] = useState(1);
  const [cowPerPage, setCowPerPage] = useState(10);
  const [cowSearch, setCowSearch] = useState('');
  const [cowSearchInput, setCowSearchInput] = useState('');
  const [cowLoading, setCowLoading] = useState(false);

  const modalTableStyles = {
    table: {
      style: {
        width: '100%',
        minWidth: 'auto',
        maxWidth: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
        margin: 0,
      },
    },
    tableWrapper: {
      style: {
        border: 'none',
        borderRadius: '0',
        overflow: 'visible',
      },
    },
    headRow: {
      style: {
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        minHeight: '44px',
      },
    },
    headCells: {
      style: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#475569',
        padding: '10px 16px',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
      },
    },
    cells: {
      style: {
        padding: '10px 16px',
        fontSize: '13px',
        color: '#334155',
      },
    },
    rows: {
      style: {
        minHeight: '44px',
        borderBottom: '1px solid #f1f5f9',
        '&:hover': {
          backgroundColor: '#f8fafc',
        },
      },
    },
    pagination: {
      style: {
        borderTop: '1px solid #f1f5f9',
        padding: '8px 16px',
        fontSize: '13px',
        color: '#475569',
      },
    },
  };

  const fetchCowDetails = useCallback(async (page, perPage, search) => {
    if (!row?.pid) return;
    setCowLoading(true);
    const response = await PemberianPakanSapiService.showDetail(row.pid, {
      start: (page - 1) * perPage,
      length: perPage,
      search,
    });
    if (response.success) {
      setCowRows(response.data);
      setCowTotal(response.recordsFiltered);
    } else {
      setCowRows([]);
      setCowTotal(0);
    }
    setCowLoading(false);
  }, [row?.pid]);

  useEffect(() => {
    fetchCowDetails(cowPage, cowPerPage, cowSearch);
  }, [fetchCowDetails, cowPage, cowPerPage, cowSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCowPage(1);
    setCowSearch(cowSearchInput.trim());
  };

  const handleClearSearch = () => {
    setCowSearchInput('');
    setCowPage(1);
    setCowSearch('');
  };

  const cowColumns = useMemo(() => [
    {
      name: 'No',
      cell: (_, index) => (cowPage - 1) * cowPerPage + index + 1,
      width: '70px',
      center: true,
    },
    {
      name: 'Nama Sapi',
      selector: (d) => d.nama_sapi,
      grow: 2,
      cell: (d) => <span className="font-medium text-slate-700">{d.nama_sapi || '-'}</span>,
    },
    {
      name: 'Eartag',
      selector: (d) => d.eartag_sapi,
      grow: 2,
      cell: (d) => <span className="font-mono text-slate-600">{d.eartag_sapi || '-'}</span>,
    },
  ], [cowPage, cowPerPage]);

  if (!row) return null;

  const detailItems = [
    ['Resep Pakan', row.nama_resep_pakan],
    ['Tanggal Pemberian', row.tgl_pemberian_pakan],
    ['Jam Pemberian', row.jam_pemberian_pakan],
    ['Nama Peternak', row.nama_peternak],
    ['Harga', formatCurrency(row.harga)],
    ['Total Sapi', cowTotal ? `${cowTotal} ekor` : '-'],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="detail-pakan-title">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <Wheat className="h-6 w-6" />
            </div>
            <div>
              <h2 id="detail-pakan-title" className="text-xl font-bold text-slate-900">Detail Pemberian Pakan</h2>
              <p className="mt-1 text-sm text-slate-500">Informasi pemberian pakan sapi RPH.</p>
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

        <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
          {detailItems.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-800">{value || '-'}</p>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <div className="flex flex-col gap-3 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-slate-800">Daftar Sapi</p>
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={cowSearchInput}
                    onChange={(e) => setCowSearchInput(e.target.value)}
                    placeholder="Cari eartag / sapi..."
                    className="w-60 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Cari
                </button>
                {cowSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Reset
                  </button>
                )}
              </form>
            </div>
            <DataTable
              columns={cowColumns}
              data={cowRows}
              customStyles={modalTableStyles}
              progressPending={cowLoading}
              progressComponent={(
                <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Memuat daftar sapi...
                </div>
              )}
              noDataComponent={(
                <div className="py-8 text-center text-sm text-slate-400">
                  {cowSearch ? 'Tidak ada sapi yang cocok dengan pencarian.' : 'Detail sapi belum tersedia.'}
                </div>
              )}
              pagination
              paginationServer
              paginationTotalRows={cowTotal}
              paginationDefaultPage={cowPage}
              paginationPerPage={cowPerPage}
              paginationRowsPerPageOptions={[10, 25, 50, 100]}
              onChangePage={(page) => setCowPage(page)}
              onChangeRowsPerPage={(newPerPage, page) => {
                setCowPerPage(newPerPage);
                setCowPage(page);
              }}
              highlightOnHover
              dense
              striped
              responsive={false}
            />
          </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-pakan-title">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Trash2 className="h-7 w-7" />
          </div>
          <h2 id="delete-pakan-title" className="mt-4 text-xl font-bold text-slate-900">Hapus Data Pemberian Pakan?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Catatan pemberian pakan <span className="font-semibold text-slate-700">{row.nama_resep_pakan || 'ini'}</span> pada tanggal {row.tgl_pemberian_pakan || '-'} akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
        aria-label={`Menu aksi ${row.nama_sapi || 'pemberian pakan'}`}
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

const PemberianPakanSapiPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useDocumentTitle('Pemberian Pakan Sapi RPH');

  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getToday());
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [openActionMenuPid, setOpenActionMenuPid] = useState(null);

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

  const fetchData = useCallback(async ({ page = currentPage, limit = perPage, query = search } = {}) => {
    setLoading(true);
    setError(null);

    const response = await PemberianPakanSapiService.getData({
      draw: page,
      start: (page - 1) * limit,
      length: limit,
      search: query,
      startDate,
      endDate,
      orderColumn: 6,
      orderDir: 'desc',
    });

    if (response.success) {
      setRows(response.data || []);
      setTotalRows(response.recordsFiltered || 0);
    } else {
      setRows([]);
      setTotalRows(0);
      setError(response.message || 'Gagal memuat data pemberian pakan sapi');
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
    const detailResponse = await PemberianPakanSapiService.show(row.pid);
    const record = detailResponse.success ? { ...row, ...(detailResponse.data || {}) } : row;

    if (!detailResponse.success) {
      setNotification({
        type: 'error',
        message: detailResponse.message || 'Gagal memuat detail data untuk edit',
      });
    }

    navigate(`/rph/pemberian-pakan-sapi/edit/${encodeURIComponent(row.pid)}`, {
      state: { record },
    });
    setOpenActionMenuPid(null);
  };

  const handleDetail = async (row) => {
    setNotification({ type: 'info', message: 'Memuat detail data...' });
    const detailResponse = await PemberianPakanSapiService.show(row.pid);

    if (detailResponse.success) {
      setDetailRow({ ...row, ...(detailResponse.data || {}) });
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
    const response = await PemberianPakanSapiService.delete(row.pid);
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
    const uniqueResep = new Set(rows.map((row) => row.nama_resep_pakan).filter(Boolean)).size;

    return [
      { label: 'Data Ditampilkan', value: `${rows.length} data`, tone: 'emerald' },
      { label: 'Total Terfilter', value: `${totalRows} data`, tone: 'cyan' },
      { label: 'Resep Pakan', value: `${uniqueResep} resep`, tone: 'amber' },
      { label: 'Total Harga', value: formatCurrency(totalHarga), tone: 'violet' },
    ];
  }, [rows, totalRows]);

  const columns = useMemo(() => [
    {
      name: 'No',
      cell: (_, index) => (currentPage - 1) * perPage + index + 1,
      width: '56px',
      center: true,
    },
    {
      name: 'Aksi',
      width: '80px',
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
      name: 'Waktu Pemberian',
      selector: (row) => row.tgl_pemberian_pakan,
      sortable: true,
      minWidth: '150px',
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800">
            <Calendar className="h-4 w-4 text-emerald-500" />
            {row.tgl_pemberian_pakan || '-'}
          </span>
          <span className="inline-flex items-center gap-1.5 pl-5 font-mono text-xs text-cyan-700">
            <Clock className="h-3 w-3" />
            {String(row.jam_pemberian_pakan || '-').slice(0, 5)}
          </span>
        </div>
      ),
    },
    {
      name: 'Pakan & Peternak',
      selector: (row) => `${row.nama_resep_pakan} ${row.nama_peternak}`,
      sortable: true,
      minWidth: '220px',
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 w-fit">
            {row.nama_resep_pakan || '-'}
          </span>
          <span className="text-xs text-slate-500">
            <span className="text-slate-400">Peternak:</span> {row.nama_peternak || '-'}
          </span>
        </div>
      ),
    },
    {
      name: 'Harga',
      selector: (row) => row.harga,
      sortable: true,
      right: true,
      minWidth: '120px',
      cell: (row) => <span className="font-semibold text-emerald-700">{formatCurrency(row.harga)}</span>,
    },
  ], [currentPage, handleDetail, handleEdit, openActionMenuPid, perPage]);

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
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <Wheat className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Pemberian Pakan Sapi RPH</h1>
                <p className="mt-1 text-sm text-gray-500 sm:text-base">Kelola pencatatan pemberian pakan untuk sapi aktif di RPH.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/rph/pemberian-pakan-sapi/add')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              Tambah Pemberian Pakan
            </button>
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
                  placeholder="Cari resep atau peternak..."
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
                Memuat data pemberian pakan...
              </div>
            )}
            noDataComponent={(
              <div className="py-12 text-center text-sm text-slate-400">
                Belum ada data pemberian pakan sapi pada filter saat ini.
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

export default PemberianPakanSapiPage;
