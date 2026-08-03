import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import DataTable from 'react-data-table-component';
import { Calendar, Eye, Loader2, MoreVertical, Pencil, PlusCircle, Search, Trash2, X } from 'lucide-react';
import { enhancedTableStyles } from './constants/tableStyles';
import usePenjualanBoning from './hooks/usePenjualanBoning';
import AddEditBoningModal from './modals/AddEditBoningModal';
import DetailBoningModal from './modals/DetailBoningModal';
import DeleteConfirmBoningModal from './modals/DeleteConfirmBoningModal';

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const PAYMENT_LABEL = {
  '1': 'Cash',
  '2': 'Bank',
};

const SHIPPING_STYLE = {
  DIAMBIL: 'bg-slate-100 text-slate-700',
  DIANTAR: 'bg-sky-100 text-sky-700',
};

const PAYMENT_STYLE = {
  '1': 'bg-emerald-100 text-emerald-700',
  '2': 'bg-amber-100 text-amber-700',
};

const STATUS_STYLE = {
  Lunas: 'bg-emerald-100 text-emerald-700',
  'Belum Lunas': 'bg-amber-100 text-amber-700',
  'Belum Bayar': 'bg-rose-100 text-rose-700',
  '-': 'bg-slate-100 text-slate-600',
};

const RowActionMenu = ({ row, anchorRef, onClose, onDetail, onEdit, onDelete }) => {
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  useEffect(() => {
    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: Math.max(12, rect.right - 192),
        zIndex: 200,
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

  return createPortal(
    <div
      ref={menuRef}
      style={menuStyle}
      className="w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
      role="menu"
      aria-label="Menu aksi"
    >
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Menu Aksi</p>
      </div>
      <div className="p-1.5">
        <button
          type="button"
          onClick={() => {
            onDetail(row);
            onClose();
          }}
          className="mt-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-blue-50"
          role="menuitem"
        >
          <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><Eye className="h-4 w-4" /></span>
          <span className="text-xs font-semibold">Detail</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onEdit(row);
            onClose();
          }}
          className="mt-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-amber-50"
          role="menuitem"
        >
          <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><Pencil className="h-4 w-4" /></span>
          <span className="text-xs font-semibold">Edit</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onDelete(row);
            onClose();
          }}
          className="mt-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-rose-50"
          role="menuitem"
        >
          <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600"><Trash2 className="h-4 w-4" /></span>
          <span className="text-xs font-semibold">Hapus</span>
        </button>
      </div>
    </div>,
    document.body
  );
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
        className={`rounded-lg border p-2 text-slate-600 shadow-sm transition-all hover:bg-rose-50 hover:text-rose-600 ${isOpen ? 'border-rose-400 bg-rose-50 text-rose-600' : 'border-slate-300 bg-white'}`}
        aria-label={`Menu aksi ${row.nama_pedagang || 'penjualan boning'}`}
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

const PenjualanBoningPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pid: routePid } = useParams();
  const isFormPage = location.pathname.endsWith('/add') || location.pathname.includes('/edit/');
  const {
    dataList, loading, error,
    searchTerm, dateRange, serverPagination,
    pedagangList, boningItems, itemPotongOptions, bankOptions, pengirimOptions, kendaraanOptions,
    masterLoading, createLoading, updateLoading, deleteLoading,
    fetchData, fetchMasterData, fetchHarga, fetchPedagangHarga,
    show, store, update, hapus,
    handlePageChange, handlePerPageChange,
    handleSearch, clearSearch,
    handleDateRange, clearDateRange,
    refresh, idOffice,
  } = usePenjualanBoning();

  const [notification, setNotification] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
    fetchMasterData();
  }, [fetchData, fetchMasterData]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    if (!openMenuId) return undefined;
    const closeMenu = () => setOpenMenuId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [openMenuId]);

  const handleOpenAdd = async () => {
    if (!pedagangList.length || !boningItems.length || !bankOptions.length || !pengirimOptions.length || !kendaraanOptions.length) {
      await fetchMasterData();
    }
    setSelectedItem(null);
    navigate('/rph/penjualan-boning/add');
  };

  const handleLoadDetail = useCallback(async (pid, onSuccess) => {
    setDetailLoading(true);
    const res = await show(pid);
    setDetailLoading(false);

    if (!res.success) {
      setNotification({ type: 'error', message: res.message || 'Gagal memuat detail transaksi' });
      return;
    }

    onSuccess(res.data);
  }, [show]);

  const handleOpenEdit = useCallback(async (item) => {
    if (!isFormPage) {
      navigate(`/rph/penjualan-boning/edit/${item.pid}`);
      return;
    }
    if (!pedagangList.length || !boningItems.length || !bankOptions.length || !pengirimOptions.length || !kendaraanOptions.length) {
      await fetchMasterData();
    }
    await handleLoadDetail(item.pid, (data) => {
      setSelectedItem(data);
      setIsEditModalOpen(true);
    });
  }, [isFormPage, navigate, pedagangList, boningItems, bankOptions, pengirimOptions, kendaraanOptions, fetchMasterData, handleLoadDetail]);

  useEffect(() => {
    if (!isFormPage || !routePid) return;
    handleLoadDetail(routePid, (data) => setSelectedItem(data));
  }, [isFormPage, routePid, handleLoadDetail]);

  const handleOpenDetail = useCallback(async (item) => {
    await handleLoadDetail(item.pid, (data) => {
      setDetailData(data);
      setIsDetailModalOpen(true);
    });
  }, [handleLoadDetail]);

  const handleOpenDelete = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleStore = async (payload) => {
    const res = await store(payload);
    if (!res.success) {
      setNotification({ type: 'error', message: res.message || 'Gagal menyimpan data' });
      throw new Error(res.message || 'Gagal menyimpan data');
    }

    setNotification({ type: 'success', message: res.message || 'Penjualan boning berhasil disimpan' });
    setIsAddModalOpen(false);
    if (isFormPage) navigate('/rph/penjualan-boning');
    refresh();
    fetchMasterData();
  };

  const handleUpdate = async (payload) => {
    const res = await update(payload);
    if (!res.success) {
      setNotification({ type: 'error', message: res.message || 'Gagal memperbarui data' });
      throw new Error(res.message || 'Gagal memperbarui data');
    }

    setNotification({ type: 'success', message: res.message || 'Penjualan boning berhasil diperbarui' });
    setIsEditModalOpen(false);
    if (isFormPage) navigate('/rph/penjualan-boning');
    refresh();
    fetchMasterData();
  };

  const handleDelete = async (pid) => {
    const res = await hapus(pid);
    if (!res.success) {
      setNotification({ type: 'error', message: res.message || 'Gagal menghapus data' });
      return;
    }

    setNotification({ type: 'success', message: res.message || 'Data berhasil dihapus' });
    setIsDeleteModalOpen(false);
    refresh();
    fetchMasterData();
  };

  const columns = useMemo(() => ([
    {
      name: 'No',
      width: '70px',
      cell: (row, index) => (
        <div className="w-full text-center font-semibold text-slate-500">
          {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
        </div>
      ),
    },
    {
      name: 'Aksi',
      width: '80px',
      center: true,
      cell: (row) => (
        <div className="flex items-center justify-center">
          <RowActionButton
            row={row}
            isOpen={openMenuId === row.pid}
            onToggle={(pid) => setOpenMenuId((current) => (current === pid ? null : pid))}
            onClose={() => setOpenMenuId(null)}
            onDetail={handleOpenDetail}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
          />
        </div>
      ),
    },
    {
      name: 'No Kwitansi',
      selector: (row) => row.no_kwitansi,
      sortable: true,
      minWidth: '180px',
      cell: (row) => (
        <div className="rounded-lg bg-rose-50 px-2 py-1 font-mono text-xs text-rose-700">
          {row.no_kwitansi || '-'}
        </div>
      ),
    },
    {
      name: 'Pedagang',
      selector: (row) => row.nama_pedagang,
      sortable: true,
      minWidth: '220px',
      cell: (row) => (
        <div className="py-2">
          <div className="text-sm font-semibold text-slate-800">{row.nama_pedagang || '-'}</div>
          <div className="text-xs text-slate-500">{row.id_pedagang || '-'}</div>
        </div>
      ),
    },
    {
      name: 'Tanggal',
      selector: (row) => row.tgl_penjualan,
      sortable: true,
      width: '130px',
      cell: (row) => <span className="text-sm text-slate-700">{formatDate(row.tgl_penjualan)}</span>,
    },
    {
      name: 'Berat',
      selector: (row) => row.total_berat,
      sortable: true,
      width: '130px',
      cell: (row) => <span className="text-sm font-medium text-slate-700">{Math.round(Number(row.total_berat || 0))} Kg</span>,
    },
    {
      name: 'Total Harga',
      selector: (row) => row.total_harga,
      sortable: true,
      minWidth: '150px',
      cell: (row) => <span className="text-sm font-semibold text-emerald-700">{formatCurrency(row.total_harga)}</span>,
    },
    {
      name: 'Pembayaran',
      width: '120px',
      cell: (row) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PAYMENT_STYLE[row.tipe_pembayaran] || 'bg-slate-100 text-slate-600'}`}>
          {PAYMENT_LABEL[row.tipe_pembayaran] || '-'}
        </span>
      ),
    },
    {
      name: 'Status',
      minWidth: '140px',
      cell: (row) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[row.payment_status_label] || STATUS_STYLE['-']}`}>
          {row.payment_status_label || '-'}
        </span>
      ),
    },
    {
      name: 'Pengiriman',
      width: '120px',
      cell: (row) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${SHIPPING_STYLE[row.pengiriman] || 'bg-slate-100 text-slate-600'}`}>
          {row.pengiriman || '-'}
        </span>
      ),
    },
  ]), [openMenuId, serverPagination, handleOpenDetail, handleOpenEdit]);

  if (isFormPage) {
    const formData = routePid ? selectedItem : null;
    return <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <AddEditBoningModal fullPage isOpen onClose={() => navigate('/rph/penjualan-boning')} onSubmit={routePid ? handleUpdate : handleStore} editData={formData} pedagangList={pedagangList} boningItems={boningItems} itemPotongOptions={itemPotongOptions} bankOptions={bankOptions} pengirimOptions={pengirimOptions} kendaraanOptions={kendaraanOptions} fetchHarga={fetchHarga} fetchPedagangHarga={fetchPedagangHarga} loading={routePid ? updateLoading : createLoading} masterLoading={masterLoading} idOffice={idOffice} />
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="space-y-6 px-4 py-5 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-xl shadow-rose-100/50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Penjualan Boning RPH</h1>
              <p className="mt-1 text-sm text-slate-500">Transaksi penjualan item boning berdasarkan stok aktif RPH.</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAdd}
              disabled={masterLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {masterLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
              Tambah Penjualan
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => handleSearch(event.target.value)}
                placeholder="Cari no kwitansi atau pedagang"
                className="w-full rounded-2xl border border-slate-300 py-3 pl-10 pr-10 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              />
              {searchTerm && (
                <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(event) => handleDateRange({ ...dateRange, startDate: event.target.value })}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              />
              <span className="text-sm text-slate-500">s/d</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(event) => handleDateRange({ ...dateRange, endDate: event.target.value })}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              />
              {(dateRange.startDate || dateRange.endDate) && (
                <button type="button" onClick={clearDateRange} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-visible rounded-3xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div>
              <div className="text-sm font-semibold text-slate-800">Daftar Penjualan Boning</div>
              <div className="text-xs text-slate-500">Total data {serverPagination.totalItems}</div>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-visible">
            <DataTable
              columns={columns}
              data={dataList}
              pagination={false}
              customStyles={enhancedTableStyles}
              progressPending={loading}
              highlightOnHover
              pointerOnHover
              responsive
              progressComponent={(
                <div className="py-12 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-rose-600" />
                  <p className="mt-2 text-sm text-slate-500">Memuat data penjualan boning...</p>
                </div>
              )}
              noDataComponent={(
                <div className="py-12 text-center">
                  {error ? (
                    <>
                      <div className="text-sm font-semibold text-rose-600">Gagal memuat data</div>
                      <div className="mt-1 text-sm text-slate-500">{error}</div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-500">Belum ada transaksi penjualan boning.</div>
                  )}
                </div>
              )}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-slate-600">
              Menampilkan <strong>{serverPagination.totalItems ? ((serverPagination.currentPage - 1) * serverPagination.perPage) + 1 : 0}</strong>
              {' '}sampai{' '}
              <strong>{Math.min(serverPagination.currentPage * serverPagination.perPage, serverPagination.totalItems)}</strong>
              {' '}dari <strong>{serverPagination.totalItems}</strong> data
            </div>
            <div className="flex items-center gap-2">
              <select
                value={serverPagination.perPage}
                onChange={(event) => handlePerPageChange(Number(event.target.value))}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-rose-500"
              >
                {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <button type="button" onClick={() => handlePageChange(serverPagination.currentPage - 1)} disabled={serverPagination.currentPage <= 1} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50">
                Prev
              </button>
              <span className="text-sm font-medium text-slate-700">{serverPagination.currentPage} / {serverPagination.totalPages}</span>
              <button type="button" onClick={() => handlePageChange(serverPagination.currentPage + 1)} disabled={serverPagination.currentPage >= serverPagination.totalPages} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div className="fixed right-4 top-4 z-[70]">
          <div className={`max-w-sm rounded-2xl border px-4 py-3 shadow-xl ${notification.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 text-sm font-medium">{notification.message}</div>
              <button type="button" onClick={() => setNotification(null)} className="text-current/60 hover:text-current">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-[1250] flex items-center justify-center bg-black/30">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-2xl">
            <Loader2 className="h-5 w-5 animate-spin text-rose-600" />
            <span className="text-sm font-medium text-slate-700">Memuat detail transaksi...</span>
          </div>
        </div>
      )}

      <AddEditBoningModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleStore}
        editData={null}
        pedagangList={pedagangList}
        boningItems={boningItems}
        itemPotongOptions={itemPotongOptions}
        bankOptions={bankOptions}
        pengirimOptions={pengirimOptions}
        kendaraanOptions={kendaraanOptions}
        fetchHarga={fetchHarga}
        fetchPedagangHarga={fetchPedagangHarga}
        loading={createLoading}
        masterLoading={masterLoading}
        idOffice={idOffice}
      />

      <AddEditBoningModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdate}
        editData={selectedItem}
        pedagangList={pedagangList}
        boningItems={boningItems}
        itemPotongOptions={itemPotongOptions}
        bankOptions={bankOptions}
        pengirimOptions={pengirimOptions}
        kendaraanOptions={kendaraanOptions}
        fetchHarga={fetchHarga}
        fetchPedagangHarga={fetchPedagangHarga}
        loading={updateLoading}
        masterLoading={masterLoading}
        idOffice={idOffice}
      />

      <DetailBoningModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        data={detailData}
      />

      <DeleteConfirmBoningModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        item={selectedItem}
        loading={deleteLoading}
      />
    </div>
  );
};

export default PenjualanBoningPage;
