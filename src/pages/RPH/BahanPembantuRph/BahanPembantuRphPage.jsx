import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import DataTable from 'react-data-table-component';
import {
  Package,
  Plus,
  Search,
  Loader2,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Banknote,
  CalendarDays,
  TrendingUp,
  AlertCircle,
  Filter,
  RotateCcw
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { enhancedTableStyles } from './constants/tableStyles';
import BahanPembantuRphService from '../../../services/bahanPembantuRphService';
import BiayaRphService from '../../../services/biayaRphService';
import DeleteConfirmationModal from '../../../components/shared/modals/DeleteConfirmationModal';

const formatCurrency = (value) => {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : '-';

const SummaryCard = ({ title, value, subtext, icon: Icon, accentClass }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentClass}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-0.5 text-xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500 truncate">{subtext}</p>
    </div>
  </div>
);

const ActionMenu = ({ row, onClose, buttonRef, onDetail, onEdit, onDelete, onBayar }) => {
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
        zIndex: 99999
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
      description: `Lihat detail ${row.notaSistem || ''}`,
      icon: Eye,
      iconClass: 'text-sky-600',
      bgClass: 'bg-sky-100',
      onClick: () => onDetail?.(row)
    },
    {
      label: 'Edit',
      description: `Ubah data ${row.notaSistem || ''}`,
      icon: Pencil,
      iconClass: 'text-amber-600',
      bgClass: 'bg-amber-100',
      onClick: () => onEdit?.(row)
    },
    {
      label: 'Hapus',
      description: `Hapus data ${row.notaSistem || ''}`,
      icon: Trash2,
      iconClass: 'text-red-600',
      bgClass: 'bg-red-100',
      onClick: () => onDelete?.(row)
    }
  ];

  if (row.paymentPid && row.sisaPembayaran > 0) {
    actions.splice(1, 0, {
      label: 'Bayar',
      description: `Bayar ${row.notaSistem || ''}`,
      icon: Banknote,
      iconClass: 'text-emerald-600',
      bgClass: 'bg-emerald-100',
      onClick: () => onBayar?.(row)
    });
  }

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

const ActionButton = ({ row, isOpen, onToggle, onClose, onDetail, onEdit, onDelete, onBayar }) => {
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
          onBayar={onBayar}
        />
      )}
    </div>
  );
};

const rightAlignedColumnName = (label) => <div className="w-full text-right">{label}</div>;

const MobileBahanPembantuCard = ({
  row,
  index,
  showNotaSistem = true,
  isBiayaTab = false,
  onToggleMenu,
  isMenuOpen,
  onCloseMenu,
  onDetail,
  onEdit,
  onDelete,
  onBayar
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-slate-400">#{index}</p>
        {showNotaSistem && (
          <p className="mt-0.5 inline-flex rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">{row.notaSistem}</p>
        )}
        <p className={`text-sm font-semibold text-slate-800 ${showNotaSistem ? 'mt-1.5' : 'mt-1'}`}>{row.namaProduk}</p>
      </div>
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          row.jenisPembelian === 'Bank'
            ? 'bg-blue-100 text-blue-700 border border-blue-200'
            : 'bg-amber-100 text-amber-700 border border-amber-200'
        }`}
      >
        {row.jenisPembelian}
      </span>
    </div>

    {isBiayaTab ? (
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-[10px] text-slate-400">Tgl Bayar</p>
          <p className="font-medium text-slate-700">{formatDate(row.tanggalPembayaran)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400">Payor</p>
          <p className="font-medium text-slate-700">{row.payor || '-'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] text-slate-400">Keterangan</p>
          <p className="font-medium text-slate-700">{row.keterangan || '-'}</p>
        </div>
        <div className="col-span-2 border-t border-slate-100 pt-2">
          <p className="text-[10px] text-slate-400">Harga</p>
          <p className="font-semibold text-emerald-700">{formatCurrency(row.hargaSatuan)}</p>
        </div>
      </div>
    ) : (
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-[10px] text-slate-400">Tanggal</p>
          <p className="font-medium text-slate-700">{formatDate(row.createdAt)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400">Pemasok</p>
          <p className="font-medium text-slate-700">{row.pemasok || '-'}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400">Qty</p>
          <p className="font-medium text-slate-700">{row.qty} {row.satuan}</p>
        </div>
        <div className="border-t border-slate-100 pt-2 col-span-2">
          <p className="text-[10px] text-slate-400">Biaya Total</p>
          <p className="font-semibold text-emerald-700">{formatCurrency(row.biayaTotal)}</p>
        </div>
      </div>
    )}

    <div className="flex items-center justify-end border-t border-slate-100 pt-2 mt-3">
      <ActionButton
        row={row}
        isOpen={isMenuOpen}
        onToggle={onToggleMenu}
        onClose={onCloseMenu}
        onDetail={onDetail}
        onEdit={onEdit}
        onDelete={onDelete}
        onBayar={onBayar}
      />
    </div>
  </div>
);

const BahanPembantuRphPage = () => {
const navigate = useNavigate();
const [data, setData] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [activeTab, setActiveTab] = useState('bank');
const [dailySummary, setDailySummary] = useState({ total_transaksi: 0, total_biaya: 0 });
const [monthlySummary, setMonthlySummary] = useState({ total_transaksi: 0, total_biaya: 0 });
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);
const [isDeleting, setIsDeleting] = useState(false);
const [openMenuIdDesktop, setOpenMenuIdDesktop] = useState(null);
const [openMenuIdMobile, setOpenMenuIdMobile] = useState(null);

// Server-side pagination
const [currentPage, setCurrentPage] = useState(1);
const [perPage, setPerPage] = useState(10);
const [totalRecords, setTotalRecords] = useState(0);
const [filteredRecords, setFilteredRecords] = useState(0);

// Advanced filter: draft (input) vs applied (sent to server)
const emptyFilter = { nota: '', namaProduk: '', pemasok: '', peruntukkan: '', jenisPembelian: '', namaBank: '', keterangan: '', namaBayar: '', payor: '', startDate: '', endDate: '' };
const [filterInput, setFilterInput] = useState(emptyFilter);
const [appliedFilters, setAppliedFilters] = useState(emptyFilter);

  const isBiayaTab = activeTab === 'bank' || activeTab === 'kas';

  const normalizeBiayaRow = (item) => ({
    ...item,
    notaSistem: item.notaSistem ?? item.nota_sistem ?? '-',
    namaProduk: item.namaProduk ?? item.nama_produk ?? item.item_lain_lain ?? '-',
    hargaSatuan: item.hargaSatuan ?? item.harga ?? null,
    biayaTotal: item.biayaTotal ?? item.harga ?? null,
    keterangan: item.keterangan ?? '-',
    namaBank: item.namaBank ?? item.nama_bank ?? '-',
    jenisPembelian: item.jenisPembelian ?? item.jenis_pembelian ?? '-',
    namaBayar: item.namaBayar ?? item.nama_bayar ?? '-',
    tanggalPembayaran: item.tanggalPembayaran ?? item.tanggal_pembayaran ?? null,
    peruntukkan: item.peruntukkan ?? '-',
    payor: item.payor ?? '-',
    createdAt: item.createdAt ?? item.created_at ?? null,
    paymentPid: item.paymentPid ?? item.payment_pid ?? null,
    sisaPembayaran: Number(item.sisaPembayaran ?? item.sisa_pembayaran ?? 0)
  });

  // Build filter params for the active tab from a filter object
  const buildFilterParams = (filters) => {
    if (isBiayaTab) {
      return {
        nota_sistem: filters.nota || '',
        nama_bayar: filters.namaBayar || '',
        keterangan: filters.keterangan || '',
        peruntukkan: filters.peruntukkan || '',
        jenis_pembelian: activeTab === 'bank' ? 'Bank' : activeTab === 'kas' ? 'Kas' : (filters.jenisPembelian || ''),
        nama_bank: filters.namaBank || '',
        payor: filters.payor || '',
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      };
    }
    return {
      nota_sistem: filters.nota || '',
      nama_produk: filters.namaProduk || '',
      pemasok: filters.pemasok || '',
      peruntukkan: filters.peruntukkan || '',
      jenis_pembelian: filters.jenisPembelian || '',
      nama_bank: filters.namaBank || '',
      keterangan: filters.keterangan || '',
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
    };
  };

  const loadData = async (page = currentPage, size = perPage, filters = appliedFilters) => {
    setIsLoading(true);
    try {
      const start = (page - 1) * size;
      const params = {
        start,
        length: size,
        filters: buildFilterParams(filters),
      };
      const response = isBiayaTab
        ? await BiayaRphService.getData(params)
        : await BahanPembantuRphService.getData(params);
      if (response.success) {
        const items = response.data || [];
        setData(isBiayaTab ? items.map(normalizeBiayaRow) : items);
        setTotalRecords(response.recordsTotal || 0);
        setFilteredRecords(response.recordsFiltered || 0);
      } else {
        setData([]);
        setTotalRecords(0);
        setFilteredRecords(0);
      }
    } catch (error) {
      console.error('Error loading bahan pembantu data:', error);
      setData([]);
      setTotalRecords(0);
      setFilteredRecords(0);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummaries = async () => {
    try {
      if (isBiayaTab) {
        const [dailyRes, monthlyRes] = await Promise.all([
          BiayaRphService.getSummaryDaily(),
          BiayaRphService.getSummaryMonthly()
        ]);
        const summaryKey = activeTab;
        if (dailyRes.success && dailyRes.data) {
          const daily = dailyRes.data?.[summaryKey] || {};
          setDailySummary({
            total_transaksi: daily.total_transaksi || 0,
            total_biaya: daily.total_harga || 0
          });
        }
        if (monthlyRes.success && monthlyRes.data) {
          const monthly = monthlyRes.data?.[summaryKey] || {};
          setMonthlySummary({
            total_transaksi: monthly.total_transaksi || 0,
            total_biaya: monthly.total_harga || 0
          });
        }
      } else {
        const [dailyRes, monthlyRes] = await Promise.all([
          BahanPembantuRphService.getSummaryDaily(),
          BahanPembantuRphService.getSummaryMonthly()
        ]);

        if (dailyRes.success && dailyRes.data) {
          setDailySummary(dailyRes.data);
        }
        if (monthlyRes.success && monthlyRes.data) {
          setMonthlySummary(monthlyRes.data);
        }
      }
    } catch (error) {
      console.error('Error loading summaries:', error);
    }
  };

  // Reload data when tab or page size changes; filters only via explicit Search
  useEffect(() => {
    setCurrentPage(1);
    loadData(1, perPage, appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, perPage]);

  useEffect(() => {
    loadSummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Pagination info
  const startIdx = filteredRecords === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endIdx = Math.min(currentPage * perPage, filteredRecords);
  const totalPages = Math.max(1, Math.ceil(filteredRecords / perPage));

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    loadData(page, perPage, appliedFilters);
  };

  const handlePerPageChange = (size) => {
    setPerPage(size);
    setCurrentPage(1);
    loadData(1, size, appliedFilters);
  };

  const handleFilterChange = (field, value) => {
    setFilterInput(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters(filterInput);
    setCurrentPage(1);
    loadData(1, perPage, filterInput);
  };

  const handleResetFilter = () => {
    setFilterInput(emptyFilter);
    setAppliedFilters(emptyFilter);
    setCurrentPage(1);
    loadData(1, perPage, emptyFilter);
  };

  const hasAppliedFilters = Object.values(appliedFilters).some(v => v && String(v).trim() !== '');

  const handleTabChange = (tabKey) => {
    setFilterInput(emptyFilter);
    setAppliedFilters(emptyFilter);
    setActiveTab(tabKey);
    setOpenMenuIdDesktop(null);
    setOpenMenuIdMobile(null);
  };

  const handleDetail = (row) => {
  setOpenMenuIdDesktop(null);
  setOpenMenuIdMobile(null);
  navigate(`/rph/bahan-pembantu-rph/detail/${row.pid}`);
  };
  
  const handleEdit = (row) => {
  setOpenMenuIdDesktop(null);
  setOpenMenuIdMobile(null);
  navigate(
    activeTab === 'pembelian_bahan_pembantu'
      ? `/rph/bahan-pembantu-rph/edit/${row.pid}`
      : `/rph/bahan-pembantu-rph/biaya/edit/${row.pid}`
  );
  };

  const handleDelete = (row) => {
    if (!row) return;
    setSelectedItem(row);
    setIsDeleteModalOpen(true);
    setOpenMenuIdDesktop(null);
    setOpenMenuIdMobile(null);
  };

  const handleBayar = (row) => {
    setOpenMenuIdDesktop(null);
    setOpenMenuIdMobile(null);
    navigate(`/rph/keuangan/pengeluaran/bayar/${row.paymentPid}`);
  };

  const confirmDelete = async () => {
    if (!selectedItem?.pid) return;

    setIsDeleting(true);
    try {
      const response = isBiayaTab
        ? await BiayaRphService.delete(selectedItem.pid)
        : await BahanPembantuRphService.delete(selectedItem.pid);
      if (response.success) {
        await loadData();
        await loadSummaries();
        setIsDeleteModalOpen(false);
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Error deleting bahan pembantu:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs = [
      { key: 'bank', label: 'Bank' },
      { key: 'kas', label: 'Kas' },
      { key: 'pembelian_bahan_pembantu', label: 'Pembelian Bahan Pembantu' }
  ];

  const columns = useMemo(() => {
    const fixedWidthColumn = (config) => ({
      grow: 0,
      ...config
    });

    const flexibleColumn = (config) => ({
      grow: config.grow ?? 1,
      ...config
    });

    const startIdx = (currentPage - 1) * perPage;

    const baseColumns = [
      fixedWidthColumn({
        name: 'No',
        width: '48px',
        center: true,
        cell: (row, index) => (
          <div className="w-full text-center text-xs font-medium text-slate-400">{startIdx + index + 1}</div>
        )
      }),
      fixedWidthColumn({
        name: 'Aksi',
        width: '60px',
        center: true,
        ignoreRowClick: true,
        cell: (row) => (
          <div className="flex w-full justify-center">
            <ActionButton
              row={row}
              isOpen={openMenuIdDesktop === row.pid}
              onToggle={() => {
                setOpenMenuIdMobile(null);
                setOpenMenuIdDesktop((currentId) => (currentId === row.pid ? null : row.pid));
              }}
              onClose={() => setOpenMenuIdDesktop(null)}
              onDetail={handleDetail}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBayar={handleBayar}
            />
          </div>
        )
      })
    ];

    if (!isBiayaTab) {
      baseColumns.push(
        fixedWidthColumn({
          name: 'Nota',
          selector: (row) => row.notaSistem,
          sortable: true,
          width: '130px',
          cell: (row) => (
            <div className="w-full">
              <div className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                {row.notaSistem}
              </div>
            </div>
          )
        })
      );
    }

    if (isBiayaTab) {
      return [
        ...baseColumns,
        fixedWidthColumn({
          name: 'Nota Sistem',
          selector: (row) => row.notaSistem,
          sortable: true,
          width: '150px',
          cell: (row) => (
            <div className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
              {row.notaSistem}
            </div>
          )
        }),
        flexibleColumn({
          name: 'Item / Keterangan',
          selector: (row) => row.namaProduk,
          sortable: true,
          minWidth: '220px',
          grow: 1.6,
          cell: (row) => (
            <div className="py-1.5">
              <div className="text-sm font-semibold text-slate-800">{row.namaProduk || '-'}</div>
              {row.keterangan && (
                <div className="text-xs text-slate-500 truncate max-w-[220px]">{row.keterangan}</div>
              )}
            </div>
          )
        }),
        flexibleColumn({
          name: 'Pembayaran',
          selector: (row) => row.namaBayar,
          sortable: true,
          minWidth: '160px',
          grow: 1.1,
          cell: (row) => (
            <div className="py-1.5">
              <div className="text-sm font-medium text-slate-700">{row.namaBayar || '-'}</div>
              <div className="text-xs text-slate-400">{formatDate(row.tanggalPembayaran)}</div>
            </div>
          )
        }),
        flexibleColumn({
          name: 'Bank / Payor',
          selector: (row) => row.namaBank,
          sortable: true,
          minWidth: '150px',
          grow: 1.05,
          cell: (row) => (
            <div className="py-1.5">
              <div className="text-sm font-medium text-slate-700">{row.namaBank || '-'}</div>
              {row.payor && <div className="text-xs text-slate-400 truncate max-w-[150px]">{row.payor}</div>}
            </div>
          )
        }),
        flexibleColumn({
          name: 'Peruntukkan',
          selector: (row) => row.peruntukkan,
          sortable: true,
          minWidth: '130px',
          grow: 0.9,
          cell: (row) => <div className="text-sm text-slate-600">{row.peruntukkan || '-'}</div>
        }),
        flexibleColumn({
          name: 'Jenis',
          selector: (row) => row.jenisPembelian,
          sortable: true,
          minWidth: '90px',
          grow: 0.7,
          center: true,
          cell: (row) => (
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                row.jenisPembelian === 'Bank'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {row.jenisPembelian}
            </span>
          )
        }),
        flexibleColumn({
          name: rightAlignedColumnName('Harga'),
          selector: (row) => row.hargaSatuan,
          sortable: true,
          minWidth: '140px',
          grow: 1,
          right: true,
          cell: (row) => (
            <div className="w-full text-right text-sm font-semibold text-emerald-700">
              {formatCurrency(row.hargaSatuan)}
            </div>
          )
        })
      ];
    }

    return [
      ...baseColumns,
      flexibleColumn({
        name: 'Produk / Peruntukkan',
        selector: (row) => row.namaProduk,
        sortable: true,
        minWidth: '200px',
        grow: 1.5,
        cell: (row) => (
          <div className="py-1.5">
            <div className="text-sm font-semibold text-slate-800">{row.namaProduk || '-'}</div>
            {row.peruntukkan && (
              <div className="text-xs text-slate-500 truncate max-w-[200px]">{row.peruntukkan}</div>
            )}
          </div>
        )
      }),
      flexibleColumn({
        name: 'Qty',
        selector: (row) => row.qty,
        sortable: true,
        minWidth: '80px',
        grow: 0.7,
        cell: (row) => (
          <div className="text-sm text-slate-700 tabular-nums">
            {row.qty ?? '-'}<span className="ml-1 text-xs text-slate-400">{row.satuan || ''}</span>
          </div>
        )
      }),
      flexibleColumn({
        name: 'Pemasok / Bank',
        selector: (row) => row.pemasok,
        sortable: true,
        minWidth: '150px',
        grow: 1.05,
        cell: (row) => (
          <div className="py-1.5">
            <div className="text-sm font-medium text-slate-700">{row.pemasok || '-'}</div>
            {row.namaBank && <div className="text-xs text-slate-400">{row.namaBank}</div>}
          </div>
        )
      }),
      flexibleColumn({
        name: rightAlignedColumnName('Harga / Total'),
        selector: (row) => row.biayaTotal,
        sortable: true,
        minWidth: '150px',
        grow: 1,
        right: true,
        cell: (row) => (
          <div className="w-full text-right py-1.5">
            <div className="text-sm font-semibold text-emerald-700">{formatCurrency(row.biayaTotal)}</div>
            <div className="text-xs text-slate-400">{formatCurrency(row.hargaSatuan)}/unit</div>
          </div>
        )
      }),
      flexibleColumn({
        name: 'Jenis',
        selector: (row) => row.jenisPembelian,
        sortable: true,
        minWidth: '90px',
        grow: 0.7,
        center: true,
        cell: (row) => (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              row.jenisPembelian === 'Bank'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {row.jenisPembelian}
          </span>
        )
      }),
      flexibleColumn({
        name: 'Tanggal',
        selector: (row) => row.createdAt,
        sortable: true,
        minWidth: '110px',
        grow: 0.8,
        cell: (row) => (
          <div className="py-1.5">
            <div className="text-sm text-slate-600">{formatDate(row.createdAt)}</div>
            {row.keterangan && (
              <div className="text-xs text-slate-400 truncate max-w-[110px]">{row.keterangan}</div>
            )}
          </div>
        )
      })
    ];
  }, [isBiayaTab, openMenuIdDesktop]);

  return (
    <>
      <style>{`
        .bahan-pembantu-rph-tabs::-webkit-scrollbar { height: 4px; }
        .bahan-pembantu-rph-tabs::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
        .bahan-pembantu-rph-tabs::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
        {/* === Sticky Header === */}
        <header className="shrink-0 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <Package className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold tracking-tight text-slate-900 truncate">Bahan Pembantu RPH</h1>
                <p className="text-xs text-slate-500 truncate hidden sm:block">Pembelian bahan pembantu & biaya operasional RPH</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                navigate(
                  activeTab === 'pembelian_bahan_pembantu'
                    ? '/rph/bahan-pembantu-rph/add'
                    : '/rph/bahan-pembantu-rph/biaya/add'
                )
              }
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors shrink-0"
            >
              <Plus className="h-4 w-4" />
              Tambah
            </button>
          </div>
        </header>

        {/* === Main Content === */}
        <div className="flex-1 min-h-0 overflow-auto p-4 sm:px-6">
          <div className="flex flex-col gap-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SummaryCard
                title="Transaksi Hari Ini"
                value={dailySummary.total_transaksi || 0}
                subtext={`Total: ${formatCurrency(dailySummary.total_biaya)}`}
                icon={CalendarDays}
                accentClass="bg-blue-50 text-blue-600"
              />
              <SummaryCard
                title="Transaksi Bulan Ini"
                value={monthlySummary.total_transaksi || 0}
                subtext={`Total: ${formatCurrency(monthlySummary.total_biaya)}`}
                icon={TrendingUp}
                accentClass="bg-emerald-50 text-emerald-600"
              />
            </div>

            {/* Main Content Card */}
            <div className="rounded-xl border border-slate-200 bg-white flex flex-col">
              {/* Tab Headers */}
              <div className="shrink-0 border-b border-slate-100 bahan-pembantu-rph-tabs overflow-x-auto">
                <div className="flex">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => handleTabChange(tab.key)}
                      className={`relative px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                        activeTab === tab.key
                          ? 'text-emerald-700'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.key && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Filter Panel */}
              <div className="shrink-0 border-b border-slate-100 bg-slate-50/50">
                <div className="px-4 py-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Filter className="h-3.5 w-3.5 text-slate-400" />
                      Filter Lanjutan
                      {hasAppliedFilters && (
                        <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleResetFilter}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                        Cari
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    <input
                      type="text"
                      value={filterInput.nota}
                      onChange={(e) => handleFilterChange('nota', e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                      placeholder="Nota Sistem"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                    />
                    <input
                      type="text"
                      value={filterInput.namaProduk}
                      onChange={(e) => handleFilterChange('namaProduk', e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                      placeholder={isBiayaTab ? 'Item Lain-Lain' : 'Nama Produk'}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                    />
                    {!isBiayaTab && (
                      <input
                        type="text"
                        value={filterInput.pemasok}
                        onChange={(e) => handleFilterChange('pemasok', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                        placeholder="Pemasok"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                      />
                    )}
                    <input
                      type="text"
                      value={filterInput.peruntukkan}
                      onChange={(e) => handleFilterChange('peruntukkan', e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                      placeholder="Peruntukkan"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                    />
                    {isBiayaTab && (
                      <input
                        type="text"
                        value={filterInput.namaBayar}
                        onChange={(e) => handleFilterChange('namaBayar', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                        placeholder="Nama Bayar"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                      />
                    )}
                    {isBiayaTab && (
                      <input
                        type="text"
                        value={filterInput.payor}
                        onChange={(e) => handleFilterChange('payor', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                        placeholder="Payor"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                      />
                    )}
                    <input
                      type="text"
                      value={filterInput.namaBank}
                      onChange={(e) => handleFilterChange('namaBank', e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                      placeholder="Nama Bank"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                    />
                    <input
                      type="text"
                      value={filterInput.keterangan}
                      onChange={(e) => handleFilterChange('keterangan', e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                      placeholder="Keterangan"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                    />
                    <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
                      <input
                        type="date"
                        value={filterInput.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        title="Tanggal mulai"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                      />
                      <span className="text-xs text-slate-400">s/d</span>
                      <input
                        type="date"
                        value={filterInput.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        title="Tanggal akhir"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop DataTable */}
              <div className="hidden md:block">
                <DataTable
                  columns={columns}
                  data={data}
                  customStyles={enhancedTableStyles}
                  progressPending={isLoading}
                  progressComponent={
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                      <span className="ml-2 text-sm text-slate-500">Memuat data...</span>
                    </div>
                  }
                  noDataComponent={
                    <div className="py-12 text-center">
                      <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-sm font-semibold text-slate-600">Tidak ada data ditemukan</p>
                      <p className="mt-1 text-xs text-slate-400">Coba ubah filter lalu klik Cari</p>
                    </div>
                  }
                  highlightOnHover
                  pointerOnHover
                  responsive
                  dense
                />
              </div>

              {/* Mobile Card View */}
              <div className="space-y-3 p-3 md:hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                    <span className="ml-2 text-sm text-slate-500">Memuat data...</span>
                  </div>
                ) : data.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center">
                    <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 font-semibold text-slate-600">Tidak ada data ditemukan</p>
                    <p className="mt-1 text-xs text-slate-400">Coba ubah filter lalu klik Cari</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 px-1">
                      Menampilkan <span className="font-semibold text-slate-700">{startIdx}-{endIdx}</span> dari <span className="font-semibold text-slate-700">{filteredRecords}</span> data
                    </p>
                    {data.map((row, index) => (
                      <MobileBahanPembantuCard
                        key={row.pid}
                        row={row}
                        index={startIdx + index}
                        showNotaSistem
                        isBiayaTab={isBiayaTab}
                        isMenuOpen={openMenuIdMobile === row.pid}
                        onToggleMenu={() => {
                          setOpenMenuIdDesktop(null);
                          setOpenMenuIdMobile((currentId) => (currentId === row.pid ? null : row.pid));
                        }}
                        onCloseMenu={() => setOpenMenuIdMobile(null)}
                        onDetail={handleDetail}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onBayar={handleBayar}
                      />
                    ))}
                  </>
                )}
              </div>

              {/* Server-side Pagination */}
              <div className="shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 px-4 py-2.5 bg-white">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>Baris:</span>
                  <select
                    value={perPage}
                    onChange={(e) => handlePerPageChange(Number(e.target.value))}
                    className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                  >
                    {[10, 25, 50, 100].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <span className="text-slate-500">
                    {filteredRecords === 0 ? '0-0' : `${startIdx}-${endIdx}`} dari <span className="font-semibold text-slate-700">{filteredRecords}</span>
                    {hasAppliedFilters && filteredRecords !== totalRecords && (
                      <span className="text-slate-400"> (filter dari {totalRecords})</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage <= 1 || isLoading}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Halaman pertama"
                  >
                    «
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || isLoading}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Sebelumnya"
                  >
                    ‹
                  </button>
                  <span className="px-2 text-xs font-medium text-slate-700 tabular-nums">
                    Hal {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || isLoading}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Berikutnya"
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage >= totalPages || isLoading}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Halaman terakhir"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedItem(null);
        }}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Hapus Bahan Pembantu?"
        description={
          selectedItem
            ? `Anda yakin ingin menghapus ${selectedItem.notaSistem || selectedItem.namaProduk || 'data ini'}? Tindakan ini tidak dapat dibatalkan.`
            : 'Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.'
        }
      />
    </>
  );
};

export default BahanPembantuRphPage;
