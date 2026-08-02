import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import DataTable from 'react-data-table-component';
import { Search, X, Eye, Pencil, Trash2, RefreshCw, MoreVertical, ArrowUp, ArrowDown, ChevronsUpDown, Package, Scale, Layers, Boxes } from 'lucide-react';
import usePersediaanHasilPotong from '../hooks/usePersediaanHasilPotong';
import customTableStyles from '../constants/tableStyles';

const formatDate = (v) => {
  if (!v) return '-';
  return v;
};

const formatWeight = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '0';
  return String(Number(number.toFixed(3)));
};

// Consistent 3-dot action menu — compact, portal-rendered, same across all tabs
const ActionMenu = ({ row, buttonRef, onClose, onDetail, onEdit, onDelete, type }) => {
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
      setMenuStyle({
        position: 'absolute',
        left,
        top: rect.bottom + window.scrollY + 6,
        zIndex: 99999,
        width: menuWidth,
      });
    };
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) {
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
    { label: 'Detail', icon: Eye, iconClass: 'text-sky-600', bgClass: 'bg-sky-100', onClick: () => onDetail?.(row) },
    ...(type !== 'kulit' ? [
      { label: 'Edit', icon: Pencil, iconClass: 'text-amber-600', bgClass: 'bg-amber-100', onClick: () => onEdit?.(row) },
      { label: 'Hapus', icon: Trash2, iconClass: 'text-red-600', bgClass: 'bg-red-100', onClick: () => onDelete?.(row) },
    ] : []),
  ];

  return createPortal(
    <div ref={menuRef} style={menuStyle} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl" role="menu">
      <div className="p-1.5">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => { action.onClick?.(); onClose(); }}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
          >
            <div className={`rounded-md p-1.5 ${action.bgClass}`}>
              <action.icon className={`h-4 w-4 ${action.iconClass}`} />
            </div>
            <span className="text-sm font-semibold text-slate-700">{action.label}</span>
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
      {isOpen && (
        <ActionMenu row={row} buttonRef={buttonRef} onClose={onClose} onDetail={onDetail} onEdit={onEdit} onDelete={onDelete} type={type} />
      )}
    </div>
  );
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

// Mobile card list — thumb-friendly, no horizontal scroll, 3-dot menu konsisten
const MobileCardList = ({ data, type, page, perPage, onDetail, onEdit, onDelete }) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  if (!data.length) return null;
  return (
    <div className="divide-y divide-slate-100">
      {data.map((row, index) => {
        const title = type === 'kulit'
          ? (row.item_potong_name || '-')
          : (row.jenis_sapi || row.name || '-');
        const subtitle = type === 'kulit'
          ? (row.jenis_sapi || '-')
          : (row.eartag || row.tanggal_masuk || '-');
        const metric = type === 'kulit'
          ? `${formatWeight(row.berat_tersedia)} kg`
          : (row.bobot_awal ? `${row.bobot_awal} kg` : '-');
        const rowKey = row.pid || row.id || `idx-${index}`;
        return (
          <div key={rowKey} className="p-3.5 hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-400">#{(page - 1) * perPage + index + 1}</span>
                  {row.status && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${row.status === 'TERSEDIA' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {row.status}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-900 truncate">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>
                {metric !== '-' && (
                  <p className="text-sm font-bold text-emerald-700 mt-1">{metric}</p>
                )}
              </div>
              <ActionButton
                row={row}
                isOpen={openMenuId === rowKey}
                onToggle={() => setOpenMenuId(openMenuId === rowKey ? null : rowKey)}
                onClose={() => setOpenMenuId(null)}
                onDetail={onDetail}
                onEdit={onEdit}
                onDelete={onDelete}
                type={type}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Custom sort icon — clear visual direction (replaces default RDT icon)
const SortIcon = ({ direction }) => {
  if (direction === 'asc') return <ArrowUp className="inline h-3.5 w-3.5 ml-1 text-emerald-600" />;
  if (direction === 'desc') return <ArrowDown className="inline h-3.5 w-3.5 ml-1 text-emerald-600" />;
  return <ChevronsUpDown className="inline h-3.5 w-3.5 ml-1 text-slate-300" />;
};

const PersediaanSummaryCard = ({ data, type }) => {
  const stats = useMemo(() => {
    if (type === 'kulit') {
      const totalItem = data.length;
      const totalMasuk = data.reduce((s, i) => s + Number(i.total_berat_masuk ?? 0), 0);
      const totalTersedia = data.reduce((s, i) => s + Number(i.berat_tersedia ?? 0), 0);
      return { totalItem, totalMasuk, totalTersedia };
    }
    const totalItem = data.length;
    const totalBobot = data.reduce((s, i) => s + Number(i.bobot_awal ?? 0), 0);
    const tersediaCount = data.filter((i) => (i.status || '').toUpperCase() === 'TERSEDIA').length;
    return { totalItem, totalBobot, tersediaCount };
  }, [data, type]);

  const typeLabels = {
    sapi: 'Sapi',
    karkas: 'Karkas',
    kulit: 'Kulit',
  };

  const cards = type === 'kulit'
    ? [
        { label: `Total ${typeLabels[type]}`, value: stats.totalItem, icon: Boxes, color: 'emerald', sub: 'item kulit' },
        { label: 'Berat Masuk', value: `${formatWeight(stats.totalMasuk)} kg`, icon: Scale, color: 'sky', sub: 'total produksi' },
        { label: 'Tersedia', value: `${formatWeight(stats.totalTersedia)} kg`, icon: Layers, color: stats.totalTersedia > 0 ? 'amber' : 'rose', sub: 'sisa stok' },
      ]
    : [
        { label: `Total ${typeLabels[type]}`, value: stats.totalItem, icon: type === 'sapi' ? Package : Layers, color: 'emerald', sub: 'ekor/unit' },
        { label: 'Total Bobot', value: `${formatWeight(stats.totalBobot)} kg`, icon: Scale, color: 'sky', sub: 'bobot awal' },
        { label: 'Tersedia', value: stats.tersediaCount, icon: Package, color: stats.tersediaCount > 0 ? 'amber' : 'rose', sub: 'siap pakai' },
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

  const searchInputRef = useRef(null);
  const [openMenuId, setOpenMenuId] = useState(null);

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

  useEffect(() => {
    fetchData();
  }, [fetchData, type]);

  const columns = useMemo(() => {
    if (type === 'kulit') {
      return [
        {
          name: 'No',
          width: '60px',
          cell: (row, index) => (
            <div className="text-center w-full text-gray-600 text-base font-medium">
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
                onEdit={onOpenEdit}
                onDelete={onOpenDelete}
                type={type}
              />
            );
          },
        },
        {
          name: 'Item & Klasifikasi',
          selector: (row) => row.item_potong_name,
          sortable: true,
          minWidth: '160px',
          cell: (row) => (
            <div className="py-1">
              <div className="font-bold text-slate-900 text-sm leading-tight truncate" title={row.item_potong_name || ''}>
                {row.item_potong_name || '-'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">{row.jenis_sapi || '-'}</span>
              </div>
            </div>
          ),
        },
        {
          name: 'Berat (Masuk / Keluar)',
          selector: (row) => row.total_berat_masuk,
          sortable: true,
          width: '220px',
          cell: (row) => (
            <div className="py-1 text-xs leading-tight">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Masuk</span>
                <span className="font-semibold text-slate-700">{formatWeight(row.total_berat_masuk)} kg</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="text-slate-500">Keluar</span>
                <span className="font-semibold text-rose-600">{formatWeight(row.total_berat_keluar)} kg</span>
              </div>
            </div>
          ),
        },
        {
          name: 'Tersedia',
          selector: (row) => row.berat_tersedia,
          sortable: true,
          width: '160px',
          cell: (row) => {
            const tersedia = Number(row.berat_tersedia ?? 0);
            const masuk = Number(row.total_berat_masuk ?? 0);
            const pct = masuk > 0 ? Math.round((tersedia / masuk) * 100) : 0;
            return (
              <div className="py-1">
                <div className={`font-bold text-sm ${tersedia > 0 ? 'text-emerald-700' : 'text-amber-600'}`}>
                  {formatWeight(row.berat_tersedia)} kg
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${tersedia > 0 ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">{pct}%</span>
                </div>
              </div>
            );
          },
        },
        {
          name: 'Status',
          selector: (row) => row.status,
          sortable: true,
          width: '110px',
          center: true,
          cell: (row) => (
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${row.status === 'TERSEDIA' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
              {row.status || '-'}
            </span>
          ),
        },
      ];
    }

    const baseColumns = [
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
              onEdit={onOpenEdit}
              onDelete={onOpenDelete}
              type={type}
            />
          );
        },
      },
      {
        name: 'Identitas (Jenis + Eartag)',
        selector: (row) => row.jenis_sapi,
        sortable: true,
        minWidth: '180px',
        cell: (row) => (
          <div className="py-1">
            <div className="font-bold text-slate-900 text-sm leading-tight">{row.jenis_sapi || '-'}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-mono">{row.eartag || '-'}</div>
          </div>
        ),
      },
      {
        name: 'Tanggal Masuk & Pemeliharaan',
        selector: (row) => formatDate(row.tanggal_masuk),
        sortable: true,
        width: '170px',
        cell: (row) => (
          <div className="py-1">
            <div className="text-slate-700 font-semibold text-sm leading-tight whitespace-nowrap">{formatDate(row.tanggal_masuk)}</div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{row.waktu_pemeliharaan || '-'}</span>
            </div>
          </div>
        ),
      },
      {
        name: 'Bobot & Pengirim',
        selector: (row) => row.bobot_awal,
        sortable: true,
        minWidth: '180px',
        cell: (row) => (
          <div className="py-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Bobot awal:</span>
              <span className="font-bold text-emerald-700 text-sm">{row.bobot_awal ? `${row.bobot_awal} kg` : '-'}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 truncate" title={row.pengirim || ''}>
              Pengirim: <span className="font-medium text-slate-700">{row.pengirim || '-'}</span>
            </div>
          </div>
        ),
      },
    ];

    if (type === 'kulit') {
      baseColumns.push({
        name: 'Berat Kulit',
        selector: (row) => row.berat_kulit,
        sortable: true,
        width: '130px',
        right: true,
        cell: (row) => (
          <div className="text-right">
            <div className="font-bold text-emerald-700 text-sm">{row.berat_kulit ? `${row.berat_kulit} kg` : '-'}</div>
            <div className="text-[10px] text-slate-400">total kulit</div>
          </div>
        ),
      });
    }

    return baseColumns;
  }, [openMenuId, serverPagination, type, onOpenDetail, onOpenEdit, onOpenDelete]);

  const typeLabels = {
    boning: 'Boning',
    sapi: 'Sapi',
    karkas: 'Karkas',
    kulit: 'Kulit',
  };

  return (
    <div className="space-y-3">
      {!error && dataList.length > 0 && <PersediaanSummaryCard data={dataList} type={type} />}

      {/* Compact Toolbar — sticky on scroll */}
      <div className="sticky top-0 z-20 flex flex-col lg:flex-row lg:items-center gap-2.5 bg-white/95 backdrop-blur-sm py-1">
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={`Cari ${typeLabels[type].toLowerCase()}... (tekan /)`}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/20 outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="Hapus pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 lg:ml-auto">
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2">
            <span className="text-xs font-semibold text-slate-500">Total</span>
            <span className="text-sm font-extrabold text-emerald-700">{serverPagination.totalItems}</span>
            <span className="text-xs text-slate-500">data</span>
          </div>
          <button
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
              onClick={clearSearch}
              className="ml-0.5 rounded-full hover:bg-emerald-100 p-0.5 transition-colors"
              aria-label="Hapus filter"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Mobile: card list (thumb-friendly, no horizontal scroll) */}
        <div className="md:hidden">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-4 rounded bg-slate-100 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="w-3/4 h-4 rounded bg-slate-100 animate-pulse" />
                      <div className="w-1/2 h-3 rounded bg-slate-100 animate-pulse" />
                      <div className="w-20 h-6 rounded bg-slate-100 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : dataList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              {error ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-3">
                    <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-red-700 text-base font-bold">Tidak bisa memuat data</p>
                  <p className="text-red-500 text-sm mt-1 text-center max-w-xs">{error}</p>
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
                  <p className="text-slate-700 text-base font-bold">Belum ada data {typeLabels[type].toLowerCase()}</p>
                  <p className="text-slate-500 text-sm mt-1 text-center">
                    {searchTerm ? 'Coba kata kunci lain' : 'Data akan muncul di sini'}
                  </p>
                </>
              )}
            </div>
          ) : (
            <MobileCardList
              data={dataList}
              type={type}
              page={serverPagination.currentPage}
              perPage={serverPagination.perPage}
              onDetail={onOpenDetail}
              onEdit={onOpenEdit}
              onDelete={onOpenDelete}
            />
          )}
        </div>

        {/* Desktop: data table */}
        <div className="hidden md:block w-full overflow-x-auto" style={{ maxHeight: '62vh' }}>
          <DataTable
            columns={columns}
            data={dataList}
            pagination={false}
            customStyles={customTableStyles}
            progressPending={loading}
            progressComponent={<SkeletonRows />}
            onRowClicked={(row) => onOpenDetail?.(row)}
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
                    <p className="text-slate-700 text-base font-bold">Belum ada data {typeLabels[type].toLowerCase()}</p>
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
              <span className="text-slate-500">data</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 mr-1">
              <span className="text-xs text-slate-500 font-medium">Tampil:</span>
              <select
                value={serverPagination.perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none cursor-pointer"
                aria-label="Baris per halaman"
              >
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
              <button
                onClick={() => handlePageChange(1)}
                disabled={serverPagination.currentPage === 1}
                className="hidden sm:block p-1.5 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman pertama"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={() => handlePageChange(serverPagination.currentPage - 1)}
                disabled={serverPagination.currentPage === 1}
                className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman berikutnya"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
              <button
                onClick={() => handlePageChange(serverPagination.totalPages)}
                disabled={serverPagination.currentPage >= serverPagination.totalPages}
                className="hidden sm:block p-1.5 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman terakhir"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersediaanTab;
