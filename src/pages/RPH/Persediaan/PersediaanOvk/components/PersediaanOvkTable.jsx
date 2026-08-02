import React, { useMemo, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import DataTable from 'react-data-table-component';
import { Search, X, RefreshCw, Package, MoreVertical, Eye, AlertTriangle, TrendingUp, Boxes, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import usePersediaanOvk from '../hooks/usePersediaanOvk';
import customTableStyles from '../../PersediaanHasilPotongRph/constants/tableStyles';

const STOK_MENIPIS_THRESHOLD = 5;

const formatRupiah = (value) => {
  const num = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  if (!isFinite(num) || num === 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const parseNumber = (value) => {
  const num = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return isFinite(num) ? num : 0;
};

const SortIcon = ({ direction }) => {
  if (direction === 'asc') return <ArrowUp className="inline h-3.5 w-3.5 ml-1 text-emerald-600" />;
  if (direction === 'desc') return <ArrowDown className="inline h-3.5 w-3.5 ml-1 text-emerald-600" />;
  return <ChevronsUpDown className="inline h-3.5 w-3.5 ml-1 text-slate-300" />;
};

const ActionMenu = ({ row, buttonRef, onClose }) => {
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
          onClick={() => { onClose(); }}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
        >
          <div className="rounded-md p-1.5 bg-sky-100">
            <Eye className="h-4 w-4 text-sky-600" />
          </div>
          <span className="text-sm font-semibold text-slate-700">Lihat Detail</span>
        </button>
      </div>
    </div>,
    document.body
  );
};

const ActionButton = ({ row, isOpen, onToggle, onClose }) => {
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
      {isOpen && <ActionMenu row={row} buttonRef={buttonRef} onClose={onClose} />}
    </div>
  );
};

const SkeletonRows = () => (
  <>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-slate-100">
        <div className="w-8 h-4 rounded bg-slate-100 animate-pulse" />
        <div className="w-10 h-7 rounded bg-slate-100 animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="w-3/4 h-4 rounded bg-slate-100 animate-pulse" />
          <div className="w-1/3 h-3 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="w-24 h-6 rounded bg-slate-100 animate-pulse" />
        <div className="w-28 h-6 rounded bg-slate-100 animate-pulse" />
      </div>
    ))}
  </>
);

const SummaryCard = ({ data }) => {
  const stats = useMemo(() => {
    const totalItem = data.length;
    const totalNilai = data.reduce((sum, item) => sum + parseNumber(item.nominal), 0);
    const stokMenipis = data.filter((item) => {
      const j = parseNumber(item.jumlah);
      return j > 0 && j <= STOK_MENIPIS_THRESHOLD;
    }).length;
    return { totalItem, totalNilai, stokMenipis };
  }, [data]);

  const cards = [
    { label: 'Total Produk', value: stats.totalItem, icon: Boxes, color: 'emerald', sub: 'item tercatat' },
    { label: 'Nilai Inventory', value: formatRupiah(stats.totalNilai), icon: TrendingUp, color: 'sky', sub: 'estimasi stok' },
    { label: 'Stok Menipis', value: stats.stokMenipis, icon: AlertTriangle, color: 'amber', sub: `<= ${STOK_MENIPIS_THRESHOLD} unit` },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {cards.map((card) => {
        const Icon = card.icon;
        const colorMap = {
          emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', value: 'text-emerald-700', ring: 'ring-emerald-100' },
          sky: { bg: 'bg-sky-50', icon: 'text-sky-600', value: 'text-sky-700', ring: 'ring-sky-100' },
          amber: { bg: 'bg-amber-50', icon: 'text-amber-600', value: 'text-amber-700', ring: 'ring-amber-100' },
        };
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

const PersediaanOvkTable = () => {
  const { persediaanData, loading, error, refresh } = usePersediaanOvk();
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'SELECT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && searchTerm) {
        setSearchTerm('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [searchTerm]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return persediaanData;
    const term = searchTerm.toLowerCase();
    return persediaanData.filter((item) =>
      String(item.nama_produk || '').toLowerCase().includes(term) ||
      String(item.satuan || '').toLowerCase().includes(term)
    );
  }, [persediaanData, searchTerm]);

  const columns = useMemo(() => ([
    {
      name: 'No',
      width: '50px',
      cell: (row, index) => (
        <div className="text-center w-full text-slate-500 text-sm font-medium">{index + 1}</div>
      ),
    },
    {
      name: 'Aksi',
      width: '70px',
      center: true,
      cell: (row, index) => {
        const rowKey = row.nama_produk || row.id || `idx-${index}`;
        return (
          <ActionButton
            row={row}
            isOpen={openMenuId === rowKey}
            onToggle={() => setOpenMenuId(openMenuId === rowKey ? null : rowKey)}
            onClose={() => setOpenMenuId(null)}
          />
        );
      },
    },
    {
      name: 'Produk & Satuan',
      selector: (row) => row.nama_produk,
      sortable: true,
      minWidth: '220px',
      cell: (row) => (
        <div className="py-1">
          <div className="font-bold text-slate-900 text-sm leading-tight">{row.nama_produk || '-'}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">{row.satuan || '-'}</span>
          </div>
        </div>
      ),
    },
    {
      name: 'Stok',
      selector: (row) => parseNumber(row.jumlah),
      sortable: true,
      width: '160px',
      cell: (row) => {
        const jumlah = parseNumber(row.jumlah);
        const isHabis = jumlah === 0;
        const isMenipis = jumlah > 0 && jumlah <= STOK_MENIPIS_THRESHOLD;
        const status = isHabis ? 'Habis' : isMenipis ? 'Menipis' : 'Aman';
        const color = isHabis ? 'bg-red-100 text-red-700' : isMenipis ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
        return (
          <div className="py-1">
            <div className={`font-bold text-sm ${isHabis ? 'text-red-600' : isMenipis ? 'text-amber-600' : 'text-emerald-700'}`}>
              {jumlah} <span className="text-xs font-medium text-slate-400">{row.satuan || ''}</span>
            </div>
            <span className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${color}`}>{status}</span>
          </div>
        );
      },
    },
    {
      name: 'Nominal Stok',
      selector: (row) => parseNumber(row.nominal),
      sortable: true,
      width: '170px',
      right: true,
      cell: (row) => {
        const nominal = parseNumber(row.nominal);
        const total = persediaanData.reduce((sum, item) => sum + parseNumber(item.nominal), 0);
        const pct = total > 0 ? Math.round((nominal / total) * 100) : 0;
        return (
          <div className="py-1 text-right">
            <div className="font-bold text-sm text-slate-900">{formatRupiah(row.nominal)}</div>
            <div className="text-[10px] text-slate-400 font-medium">{pct}% dari total</div>
          </div>
        );
      },
    },
  ]), [openMenuId, persediaanData]);

  const clearSearch = () => setSearchTerm('');

  return (
    <div className="space-y-3">
      {!error && persediaanData.length > 0 && <SummaryCard data={persediaanData} />}

      <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center gap-2.5 bg-white/95 backdrop-blur-sm py-1">
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Cari produk atau satuan... (tekan /)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2">
            <span className="text-xs font-semibold text-slate-500">Total</span>
            <span className="text-sm font-extrabold text-emerald-700">{persediaanData.length}</span>
            <span className="text-xs text-slate-500">produk</span>
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
          <span className="text-xs text-slate-400">{filteredData.length} hasil</span>
        </div>
      )}

      {/* Table Card — desktop */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto" style={{ maxHeight: '62vh' }}>
          <DataTable
            columns={columns}
            data={filteredData}
            pagination={false}
            customStyles={customTableStyles}
            progressPending={loading}
            progressComponent={<SkeletonRows />}
            sortIcon={<SortIcon />}
            responsive={false}
            highlightOnHover
            pointerOnHover
            fixedHeader
            fixedHeaderScrollHeight="62vh"
            noDataComponent={
              <div className="flex flex-col items-center justify-center py-12 px-4">
                {error ? (
                  <>
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-3">
                      <AlertTriangle className="h-7 w-7 text-red-600" />
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
                      <Package className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-700 text-base font-bold">Belum ada produk tercatat</p>
                    <p className="text-slate-500 text-sm mt-1 text-center">
                      {searchTerm ? 'Coba kata kunci lain atau hapus pencarian' : 'Data stok OVK akan muncul di sini'}
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
          />
        </div>

        {!error && filteredData.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-2.5 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Menampilkan <b className="text-slate-700">{filteredData.length}</b> dari <b className="text-slate-700">{persediaanData.length}</b> produk
            </div>
            <div className="text-xs text-slate-400">
              Nilai total: <b className="text-emerald-700">{formatRupiah(persediaanData.reduce((s, i) => s + parseNumber(i.nominal), 0))}</b>
            </div>
          </div>
        )}
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
                    <div className="w-1/3 h-3 rounded bg-slate-100" />
                  </div>
                  <div className="w-8 h-8 rounded bg-slate-100" />
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="flex-1 h-8 rounded bg-slate-100" />
                  <div className="flex-1 h-8 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </>
        )}

        {!loading && error && (
          <div className="bg-white rounded-xl border border-red-200 p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
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

        {!loading && !error && filteredData.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
              <Package className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-slate-700 text-sm font-bold">Belum ada produk</p>
            <p className="text-slate-500 text-xs mt-1">
              {searchTerm ? 'Coba kata kunci lain' : 'Data stok akan muncul di sini'}
            </p>
          </div>
        )}

        {!loading && !error && filteredData.map((item, index) => {
          const jumlah = parseNumber(item.jumlah);
          const isHabis = jumlah === 0;
          const isMenipis = jumlah > 0 && jumlah <= STOK_MENIPIS_THRESHOLD;
          const status = isHabis ? 'Habis' : isMenipis ? 'Menipis' : 'Aman';
          const color = isHabis ? 'bg-red-100 text-red-700' : isMenipis ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
          const rowKey = item.nama_produk || item.id || `idx-${index}`;
          return (
            <div key={rowKey} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                      <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{item.satuan || '-'}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm leading-tight">{item.nama_produk || '-'}</div>
                  </div>
                  <ActionButton
                    row={item}
                    isOpen={openMenuId === rowKey}
                    onToggle={() => setOpenMenuId(openMenuId === rowKey ? null : rowKey)}
                    onClose={() => setOpenMenuId(null)}
                  />
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Stok</div>
                    <div className={`text-sm font-bold ${isHabis ? 'text-red-600' : isMenipis ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {jumlah} <span className="text-xs font-medium text-slate-400">{item.satuan || ''}</span>
                    </div>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${color}`}>{status}</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Nominal</div>
                    <div className="text-sm font-bold text-slate-900">{formatRupiah(item.nominal)}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {(() => {
                        const total = persediaanData.reduce((s, i) => s + parseNumber(i.nominal), 0);
                        const pct = total > 0 ? Math.round((parseNumber(item.nominal) / total) * 100) : 0;
                        return `${pct}% dari total`;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!loading && !error && filteredData.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 px-3.5 py-2.5 flex items-center justify-between text-xs">
            <div className="text-slate-500">
              <b className="text-slate-700">{filteredData.length}</b> produk
            </div>
            <div className="text-slate-400">
              Total: <b className="text-emerald-700">{formatRupiah(persediaanData.reduce((s, i) => s + parseNumber(i.nominal), 0))}</b>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersediaanOvkTable;
