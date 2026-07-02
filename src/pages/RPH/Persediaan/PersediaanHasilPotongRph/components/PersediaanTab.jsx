import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import DataTable from 'react-data-table-component';
import { Search, X, Loader2, MoreVertical, Eye, Pencil, Trash2, RefreshCw } from 'lucide-react';
import usePersediaanHasilPotong from '../hooks/usePersediaanHasilPotong';
import customTableStyles from '../constants/tableStyles';

const formatDate = (v) => {
  if (!v) return '-';
  return v;
};

const ActionMenu = ({ row, buttonRef, onClose, onDetail, onEdit, onDelete, type }) => {
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  useLayoutEffect(() => {
    const updatePosition = () => {
      if (!buttonRef?.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'absolute',
        left: rect.left + window.scrollX,
        top: rect.bottom + window.scrollY + 8,
        zIndex: 99999,
      });
    };

    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
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
  }, [buttonRef, onClose]);

  if (!menuStyle) return null;

  const actions = [
    {
      label: 'Detail',
      description: 'Lihat detail data',
      icon: Eye,
      iconClass: 'text-sky-600',
      bgClass: 'bg-sky-100',
      onClick: () => onDetail?.(row),
    },
    ...(type === 'sapi'
      ? []
      : [
        {
          label: 'Edit',
          description: 'Ubah data',
          icon: Pencil,
          iconClass: 'text-amber-600',
          bgClass: 'bg-amber-100',
          onClick: () => onEdit?.(row),
        },
        {
          label: 'Hapus',
          description: 'Hapus data',
          icon: Trash2,
          iconClass: 'text-red-600',
          bgClass: 'bg-red-100',
          onClick: () => onDelete?.(row),
        },
      ]),
  ];

  const handleActionClick = (action) => {
    action.onClick?.();
    onClose();
  };

  return createPortal(
    <div
      ref={menuRef}
      style={menuStyle}
      className="w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
      role="menu"
      aria-label="Menu aksi"
    >
      <div className="border-b border-gray-100 bg-gray-50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Menu Aksi</p>
      </div>
      <div className="p-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => handleActionClick(action)}
            className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-50"
          >
            <div className={`mt-0.5 rounded-lg p-2 ${action.bgClass}`}>
              <action.icon className={`h-4 w-4 ${action.iconClass}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{action.label}</p>
              <p className="text-xs text-gray-500">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
};

const ActionButton = ({ row, isOpen, onToggle, onClose, onDetail, onEdit, onDelete, type }) => {
  const buttonRef = useRef(null);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        className={`rounded-lg p-2 transition-all ${
          isOpen ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'
        }`}
        aria-label="Buka menu aksi"
        aria-expanded={isOpen}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <ActionMenu
          row={row}
          onClose={onClose}
          buttonRef={buttonRef}
          onDetail={onDetail}
          onEdit={onEdit}
          onDelete={onDelete}
          type={type}
        />
      )}
    </div>
  );
};

const PersediaanTab = ({ type, onOpenDetail, onOpenEdit, onOpenDelete }) => {
  const {
    dataList,
    loading,
    error,
    searchTerm,
    serverPagination,
    fetchData,
    handleSearch,
    clearSearch,
    handlePageChange,
    handlePerPageChange,
    refresh,
  } = usePersediaanHasilPotong(type);

  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [fetchData, type]);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        name: 'No',
        width: '60px',
        cell: (row, index) => (
          <div className="text-center w-full font-semibold text-gray-600">
            {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
          </div>
        ),
      },
      {
        name: 'Aksi',
        width: '80px',
        cell: (row) => (
          <ActionButton
            row={row}
            isOpen={openMenuId === row.pid}
            onToggle={() => setOpenMenuId(openMenuId === row.pid ? null : row.pid)}
            onClose={() => setOpenMenuId(null)}
            onDetail={onOpenDetail}
            onEdit={onOpenEdit}
            onDelete={onOpenDelete}
            type={type}
          />
        ),
      },
      {
        name: 'Tanggal Masuk',
        selector: (row) => formatDate(row.tanggal_masuk),
        sortable: true,
        width: '180px',
      },
      {
        name: 'Jenis Sapi',
        selector: (row) => row.jenis_sapi,
        sortable: true,
        width: '120px',
      },
      {
        name: 'Eartag',
        selector: (row) => row.eartag,
        sortable: true,
        width: '120px',
      },
      {
        name: 'Waktu Pemeliharaan',
        selector: (row) => row.waktu_pemeliharaan_sort,
        sortable: true,
        width: '150px',
        cell: (row) => (
          <div className="text-center">
            {row.waktu_pemeliharaan || '-'}
          </div>
        ),
      },
      {
        name: 'Bobot Awal',
        selector: (row) => row.bobot_awal,
        sortable: true,
        width: '100px',
        cell: (row) => (
          <div className="text-center">
            {row.bobot_awal ? `${row.bobot_awal} KG` : '-'}
          </div>
        ),
      },
      {
        name: 'Pengirim',
        selector: (row) => row.pengirim,
        sortable: true,
        width: '150px',
      },
    ];

    if (type === 'kulit') {
      baseColumns.push({
        name: 'Berat Kulit',
        selector: (row) => row.berat_kulit,
        sortable: true,
        width: '120px',
        cell: (row) => (
          <div className="text-center font-semibold text-teal-700">
            {row.berat_kulit ? `${row.berat_kulit} KG` : '-'}
          </div>
        ),
      });
    }

    baseColumns.push({
      name: 'Dibuat',
      selector: (row) => row.created_at,
      sortable: true,
      width: '180px',
      cell: (row) => (
        <div className="text-xs text-gray-500">
          {row.created_at || '-'}
        </div>
      ),
    });

    return baseColumns;
  }, [openMenuId, serverPagination, type, onOpenDetail, onOpenEdit, onOpenDelete]);

  const typeLabels = {
    boning: 'Boning',
    sapi: 'Sapi',
    karkas: 'Karkas',
    kulit: 'Kulit',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Cari ${typeLabels[type]}...`}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white shadow-lg border-y border-gray-100 relative overflow-hidden rounded-lg">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-600">Data Persediaan {typeLabels[type]}</span>
          <span className="text-xs text-gray-500">{serverPagination.totalItems} item</span>
        </div>

        <div className="w-full overflow-x-auto" style={{ maxHeight: '60vh' }}>
          <DataTable
            columns={columns}
            data={dataList}
            pagination={false}
            customStyles={customTableStyles}
            progressPending={loading}
            dense
            progressComponent={
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
              </div>
            }
            noDataComponent={
              <div className="text-center py-12">
                {error ? (
                  <div className="text-red-600">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">Tidak ada data persediaan {typeLabels[type].toLowerCase()}</p>
                )}
              </div>
            }
            responsive={false}
            highlightOnHover
            fixedHeader
            fixedHeaderScrollHeight="60vh"
          />
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-700">
            Menampilkan{' '}
            <b>{Math.min(((serverPagination.currentPage - 1) * serverPagination.perPage) + 1, serverPagination.totalItems)}</b>
            {' - '}
            <b>{Math.min(serverPagination.currentPage * serverPagination.perPage, serverPagination.totalItems)}</b>
            {' dari '}<b>{serverPagination.totalItems}</b>
          </span>
          <div className="flex items-center gap-2">
            <select
              value={serverPagination.perPage}
              onChange={(e) => handlePerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-emerald-500"
            >
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={serverPagination.currentPage === 1}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={() => handlePageChange(serverPagination.currentPage - 1)}
                disabled={serverPagination.currentPage === 1}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="px-2 text-sm font-medium">
                {serverPagination.currentPage} / {serverPagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(serverPagination.currentPage + 1)}
                disabled={serverPagination.currentPage >= serverPagination.totalPages}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
              <button
                onClick={() => handlePageChange(serverPagination.totalPages)}
                disabled={serverPagination.currentPage >= serverPagination.totalPages}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersediaanTab;
