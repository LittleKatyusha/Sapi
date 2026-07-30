import React, { useMemo, useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import DataTable from 'react-data-table-component';
import { Search, X, RefreshCw, Eye, MoreVertical, ArrowUp, ArrowDown, ChevronsUpDown, Beef, ArrowDownToLine, Package } from 'lucide-react';
import usePersediaanHasilPotong from '../hooks/usePersediaanHasilPotong';
import customTableStyles from '../constants/tableStyles';

const formatJumlah = (value) => {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return '-';
  return `${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(numeric)} kg`;
};

const formatNumber = (value) => {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return '0';
  return new Intl.NumberFormat('id-ID').format(numeric);
};

const SkeletonRows = () => (
  <>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-slate-100">
        <div className="w-8 h-4 rounded bg-slate-100 animate-pulse" />
        <div className="w-32 h-4 rounded bg-slate-100 animate-pulse" />
        <div className="flex-1 h-4 rounded bg-slate-100 animate-pulse" />
        <div className="w-20 h-4 rounded bg-slate-100 animate-pulse" />
        <div className="w-24 h-7 rounded bg-slate-100 animate-pulse" />
      </div>
    ))}
  </>
);

const SortIcon = ({ direction }) => {
  if (direction === 'asc') return <ArrowUp className="inline h-3.5 w-3.5 ml-1 text-emerald-600" />;
  if (direction === 'desc') return <ArrowDown className="inline h-3.5 w-3.5 ml-1 text-emerald-600" />;
  return <ChevronsUpDown className="inline h-3.5 w-3.5 ml-1 text-slate-300" />;
};

// Consistent 3-dot action menu (same as PersediaanTab)
const ActionMenu = ({ row, buttonRef, onClose, onDetail }) => {
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  useLayoutEffect(() => {
    const updatePosition = () => {
      if (!buttonRef?.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      // Skip if button is hidden (display:none) — prevents duplicate menu at (0,0)
      if (rect.width === 0 && rect.height === 0) return;
      const menuWidth = 200;
      const left = Math.min(rect.left + window.scrollX, window.innerWidth - menuWidth - 8);
      setMenuStyle({ position: 'absolute', left, top: rect.bottom + window.scrollY + 6, zIndex: 99999, width: menuWidth });
    };
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) onClose();
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

  return createPortal(
    <div ref={menuRef} style={menuStyle} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl" role="menu">
      <div className="p-1.5">
        <button
          type="button"
          onClick={() => { onDetail?.(row, 'boning'); onClose(); }}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
        >
          <div className="rounded-md p-1.5 bg-sky-100">
            <Eye className="h-4 w-4 text-sky-600" />
          </div>
          <span className="text-sm font-semibold text-slate-700">Detail</span>
        </button>
      </div>
    </div>,
    document.body
  );
};

const ActionButton = ({ row, isOpen, onToggle, onClose, onDetail }) => {
  const buttonRef = useRef(null);
  return (
    <div className="relative flex justify-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`rounded-lg p-1.5 border transition-all ${
          isOpen
            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
            : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700'
        }`}
        aria-label="Menu aksi"
        aria-expanded={isOpen}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {isOpen && <ActionMenu row={row} buttonRef={buttonRef} onClose={onClose} onDetail={onDetail} />}
    </div>
  );
};

const BoningSummaryCard = ({ data }) => {
  const stats = useMemo(() => {
    const totalItem = data.length;
    const totalMasuk = data.reduce((s, i) => s + Number(i.berat_masuk ?? 0), 0);
    const totalSisa = data.reduce((s, i) => s + Number(i.berat_sisa ?? 0), 0);
    const habisCount = data.filter((i) => Number(i.berat_sisa ?? 0) <= 0).length;
    return { totalItem, totalMasuk, totalSisa, habisCount };
  }, [data]);

  const cards = [
    { label: 'Total Item', value: stats.totalItem, icon: Beef, color: 'emerald', sub: 'item boning' },
    { label: 'Berat Masuk', value: formatJumlah(stats.totalMasuk), icon: ArrowDownToLine, color: 'sky', sub: 'total produksi' },
    { label: 'Sisa Stok', value: formatJumlah(stats.totalSisa), icon: Package, color: stats.totalSisa > 0 ? 'amber' : 'rose', sub: `${stats.habisCount} habis` },
  ];

  const colorMap = {
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', value: 'text-emerald-700', ring: 'ring-emerald-100' },
    sky: { bg: 'bg-sky-50', icon: 'text-sky-600', value: 'text-sky-700', ring: 'ring-sky-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', value: 'text-amber-700', ring: 'ring-amber-100' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', value: 'text-rose-700', ring: 'ring-rose-100' },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {cards.map((card) => {
        const Icon = card.icon;
        const c = colorMap[card.color];
        return (
          <div key={card.label} className={`relative overflow-hidden rounded-xl bg-white border border-slate-200 p-3.5 ring-1 ${c.ring}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${c.icon}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-500 truncate">{card.label}</div>
                <div className={`text-lg font-extrabold ${c.value} leading-tight truncate`}>{card.value}</div>
                <div className="text-[10px] text-slate-400 font-medium">{card.sub}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const BoningSummaryTable = ({ onOpenDetail, refreshKey }) => {
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
  } = usePersediaanHasilPotong('boning');

  const searchInputRef = useRef(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // Keyboard shortcut: "/" focuses search (Linear/Notion pattern)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'SELECT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && searchTerm) {
        clearSearch();
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [searchTerm, clearSearch]);

  const columns = useMemo(() => ([
    {
      name: 'No',
      width: '50px',
      cell: (row, index) => (
        <div className="text-center w-full text-slate-500 text-sm font-medium">
          {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
        </div>
      ),
    },
    {
      name: 'Aksi',
      width: '70px',
      center: true,
      cell: (row, index) => {
        const rowKey = row.pid || row.id || `idx-${index}`;
        return (
          <ActionButton
            row={row}
            isOpen={openMenuId === rowKey}
            onToggle={() => setOpenMenuId(openMenuId === rowKey ? null : rowKey)}
            onClose={() => setOpenMenuId(null)}
            onDetail={onOpenDetail}
          />
        );
      },
    },
    {
      name: 'Nama Item',
      selector: (row) => row.name,
      sortable: true,
      grow: 1,
      minWidth: '140px',
      cell: (row) => (
        <div className="font-bold text-slate-900 text-sm leading-tight truncate" title={row.name || ''}>
          {row.name || '-'}
        </div>
      ),
    },
    {
      name: 'Berat (Masuk / Keluar)',
      selector: (row) => row.berat_masuk_sort ?? row.berat_masuk,
      sortable: true,
      width: '220px',
      cell: (row) => (
        <div className="py-1 text-xs leading-tight">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Masuk</span>
            <span className="font-semibold text-slate-700">{formatJumlah(row.berat_masuk)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span className="text-slate-500">Keluar</span>
            <span className="font-semibold text-rose-600">{formatJumlah(row.berat_keluar)}</span>
          </div>
        </div>
      ),
    },
    {
      name: 'Sisa Stok',
      selector: (row) => row.berat_sisa_sort ?? row.berat_sisa,
      sortable: true,
      width: '150px',
      cell: (row) => {
        const sisa = Number(row.berat_sisa ?? 0);
        const masuk = Number(row.berat_masuk ?? 0);
        const pct = masuk > 0 ? Math.round((sisa / masuk) * 100) : 0;
        return (
          <div className="py-1">
            <div className={`font-bold text-sm ${sisa > 0 ? 'text-emerald-700' : 'text-amber-600'}`}>
              {formatJumlah(row.berat_sisa)}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${sisa > 0 ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <span className="text-[10px] font-bold text-slate-500">{pct}%</span>
            </div>
          </div>
        );
      },
    },
    {
      name: 'Status',
      width: '100px',
      center: true,
      cell: (row) => {
        const sisa = Number(row.berat_sisa ?? 0);
        const masuk = Number(row.berat_masuk ?? 0);
        const status = sisa <= 0 ? 'Habis' : sisa === masuk ? 'Utuh' : 'Sebagian';
        const color = sisa <= 0 ? 'bg-red-100 text-red-700' : sisa === masuk ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700';
        return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>{status}</span>;
      },
    },
  ]), [onOpenDetail, openMenuId, serverPagination.currentPage, serverPagination.perPage]);

  return (
    <div className="space-y-3">
      {!error && dataList.length > 0 && <BoningSummaryCard data={dataList} />}

      {/* Compact Toolbar — sticky on scroll */}
      <div className="sticky top-0 z-20 flex flex-col lg:flex-row lg:items-center gap-2.5 bg-white/95 backdrop-blur-sm py-1">
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Cari item boning... (tekan /)"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/20 outline-none transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="Hapus pencarian"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 lg:ml-auto">
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2">
            <span className="text-xs font-semibold text-slate-500">Total</span>
            <span className="text-sm font-extrabold text-emerald-700">{formatNumber(serverPagination.totalItems)}</span>
            <span className="text-xs text-slate-500">item</span>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white border-2 border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50 focus-visible:ring-4 focus-visible:ring-emerald-500/20 outline-none transition-all shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        </div>
      </div>

      {/* Active search filter chip */}
      {searchTerm && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filter aktif:</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
            <Search className="h-3 w-3" />
            "{searchTerm}"
            <button
              type="button"
              onClick={clearSearch}
              className="ml-0.5 rounded-full hover:bg-emerald-100 p-0.5 transition-colors"
              aria-label="Hapus filter"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {/* Table Card — desktop */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto" style={{ maxHeight: '62vh' }}>
          <DataTable
            columns={columns}
            data={dataList}
            pagination={false}
            customStyles={customTableStyles}
            progressPending={loading}
            progressComponent={<SkeletonRows />}
            onRowClicked={(row) => onOpenDetail?.(row, 'boning')}
            pointerOnHover
            sortIcon={<SortIcon />}
            noDataComponent={
              <div className="flex flex-col items-center justify-center py-16 px-4">
                {error ? (
                  <>
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-3">
                      <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-red-700 text-base font-bold">Tidak bisa memuat data</p>
                    <p className="text-red-500 text-sm mt-1 max-w-xs text-center">{error}</p>
                    <button
                      onClick={refresh}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 active:scale-95 transition-all"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Coba lagi
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Search className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-700 text-base font-bold">Belum ada item boning</p>
                    <p className="text-slate-500 text-sm mt-1">
                      {searchTerm ? 'Coba kata kunci lain atau hapus pencarian' : 'Data akan muncul di sini setelah ditambahkan'}
                    </p>
                    {!searchTerm && (
                      <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                        <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500">/</kbd>
                        untuk mencari cepat
                      </p>
                    )}
                  </>
                )}
              </div>
            }
            responsive={false}
            highlightOnHover
            fixedHeader
            fixedHeaderScrollHeight="62vh"
          />
        </div>

        {/* Compact Pagination */}
        <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-slate-500">Menampilkan</span>
              <b className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-900 text-xs">
                {(serverPagination.currentPage - 1) * serverPagination.perPage + 1}–{Math.min(serverPagination.currentPage * serverPagination.perPage, serverPagination.totalItems)}
              </b>
              <span className="text-slate-500">dari</span>
              <b className="text-emerald-700">{serverPagination.totalItems}</b>
              <span className="text-slate-500">item</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 mr-1">
              <span className="text-xs text-slate-500 font-medium">Tampil:</span>
              <select
                value={serverPagination.perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none cursor-pointer"
                aria-label="Baris per halaman"
              >
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => handlePageChange(1)}
                disabled={serverPagination.currentPage === 1}
                className="hidden sm:block p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman pertama"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={() => handlePageChange(serverPagination.currentPage - 1)}
                disabled={serverPagination.currentPage === 1}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman sebelumnya"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1.5">
                <span className="text-sm font-bold text-emerald-700 bg-emerald-50 rounded-md px-2 py-0.5">{serverPagination.currentPage}</span>
                <span className="text-slate-400 text-sm">/</span>
                <span className="text-sm font-semibold text-slate-600">{serverPagination.totalPages || 1}</span>
              </div>
              <button
                onClick={() => handlePageChange(serverPagination.currentPage + 1)}
                disabled={serverPagination.currentPage >= serverPagination.totalPages}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman berikutnya"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
              <button
                onClick={() => handlePageChange(serverPagination.totalPages)}
                disabled={serverPagination.currentPage >= serverPagination.totalPages}
                className="hidden sm:block p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman terakhir"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Card List — thumb-friendly */}
      <div className="lg:hidden space-y-2.5">
        {loading && (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-3.5 animate-pulse">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="w-3/4 h-4 rounded bg-slate-100" />
                    <div className="w-1/2 h-3 rounded bg-slate-100" />
                  </div>
                  <div className="w-8 h-8 rounded bg-slate-100" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="h-14 rounded bg-slate-100" />
                  <div className="h-14 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </>
        )}

        {!loading && error && (
          <div className="bg-white rounded-xl border border-red-200 p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-red-700 text-sm font-bold">Tidak bisa memuat data</p>
            <p className="text-red-500 text-xs mt-1">{error}</p>
            <button
              onClick={refresh}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white active:scale-95 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Coba lagi
            </button>
          </div>
        )}

        {!loading && !error && dataList.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
              <Search className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-slate-700 text-sm font-bold">Belum ada item boning</p>
            <p className="text-slate-500 text-xs mt-1">
              {searchTerm ? 'Coba kata kunci lain' : 'Data akan muncul di sini'}
            </p>
          </div>
        )}

        {!loading && !error && dataList.map((row, index) => {
          const sisa = Number(row.berat_sisa ?? 0);
          const masuk = Number(row.berat_masuk ?? 0);
          const pct = masuk > 0 ? Math.round((sisa / masuk) * 100) : 0;
          const status = sisa <= 0 ? 'Habis' : sisa === masuk ? 'Utuh' : 'Sebagian';
          const color = sisa <= 0 ? 'bg-red-100 text-red-700' : sisa === masuk ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700';
          const rowKey = row.pid || row.id || `idx-${index}`;
          return (
            <div
              key={rowKey}
              onClick={() => onOpenDetail?.(row, 'boning')}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400">#{(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${color}`}>{status}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm leading-tight">{row.name || '-'}</div>
                  </div>
                  <ActionButton
                    row={row}
                    isOpen={openMenuId === rowKey}
                    onToggle={() => setOpenMenuId(openMenuId === rowKey ? null : rowKey)}
                    onClose={() => setOpenMenuId(null)}
                    onDetail={onOpenDetail}
                  />
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Masuk</div>
                    <div className="text-sm font-bold text-slate-700">{formatJumlah(row.berat_masuk)}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Sisa</div>
                    <div className={`text-sm font-bold ${sisa > 0 ? 'text-emerald-700' : 'text-amber-600'}`}>{formatJumlah(row.berat_sisa)}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <div className="flex-1 h-1 rounded-full bg-slate-200 overflow-hidden">
                        <div className={`h-full rounded-full ${sisa > 0 ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{pct}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BoningTab = ({ refreshKey, onOpenDetail }) => {
  return (
    <BoningSummaryTable
      refreshKey={refreshKey}
      onOpenDetail={onOpenDetail}
    />
  );
};

export default BoningTab;
