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
X,
CalendarDays,
TrendingUp,
AlertCircle,
Filter
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

const SummaryCard = ({ title, value, subtext, icon: Icon, gradientClass }) => (
  <div className={`${gradientClass} text-white p-4 sm:p-6 rounded-2xl shadow-lg`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium opacity-90">{title}</p>
        <p className="mt-2 text-3xl font-bold">{value}</p>
        <p className="mt-2 text-xs sm:text-sm opacity-85">{subtext}</p>
      </div>
      <div className="rounded-xl bg-white/15 p-3">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
    </div>
  </div>
);

const ActionMenu = ({ row, onClose, buttonRef, onDetail, onEdit, onDelete }) => {
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

const ActionButton = ({ row, isOpen, onToggle, onClose, onDetail, onEdit, onDelete }) => {
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
  onDelete
}) => (
  <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
    <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500" />
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-400">#{index}</p>
          {showNotaSistem && (
            <p className="mt-1 text-sm font-semibold text-emerald-700">{row.notaSistem}</p>
          )}
          <p className={`text-sm font-medium text-gray-800 ${showNotaSistem ? 'mt-1' : 'mt-2'}`}>
            {row.namaProduk}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            row.jenisPembelian === 'Bank'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-amber-100 text-amber-700 border border-amber-200'
          }`}
        >
          {row.jenisPembelian}
        </span>
      </div>

      {isBiayaTab ? (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400">Tanggal Pembayaran</p>
            <p className="font-medium text-gray-700">{formatDate(row.tanggalPembayaran)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Created At</p>
            <p className="font-medium text-gray-700">{formatDate(row.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Nama Bayar</p>
            <p className="font-medium text-gray-700">{row.namaBayar || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Payor</p>
            <p className="font-medium text-gray-700">{row.payor || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Nama Bank</p>
            <p className="font-medium text-gray-700">{row.namaBank || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Peruntukkan</p>
            <p className="font-medium text-gray-700">{row.peruntukkan || '-'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400">Keterangan</p>
            <p className="font-medium text-gray-700">{row.keterangan || '-'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400">Harga</p>
            <p className="font-semibold text-emerald-700">{formatCurrency(row.hargaSatuan)}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400">Tanggal</p>
            <p className="font-medium text-gray-700">{formatDate(row.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Pemasok</p>
            <p className="font-medium text-gray-700">{row.pemasok || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Peruntukkan</p>
            <p className="font-medium text-gray-700">{row.peruntukkan || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Qty</p>
            <p className="font-medium text-gray-700">
              {row.qty} {row.satuan}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400">Biaya Total</p>
            <p className="font-semibold text-emerald-700">{formatCurrency(row.biayaTotal)}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end border-t border-gray-100 pt-3">
        <ActionButton
          row={row}
          isOpen={isMenuOpen}
          onToggle={onToggleMenu}
          onClose={onCloseMenu}
          onDetail={onDetail}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  </div>
);

const BahanPembantuRphPage = () => {
const navigate = useNavigate();
const [data, setData] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
const [activeTab, setActiveTab] = useState('bank');
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');
const [dailySummary, setDailySummary] = useState({ total_transaksi: 0, total_biaya: 0 });
const [monthlySummary, setMonthlySummary] = useState({ total_transaksi: 0, total_biaya: 0 });
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);
const [isDeleting, setIsDeleting] = useState(false);
const [openMenuIdDesktop, setOpenMenuIdDesktop] = useState(null);
const [openMenuIdMobile, setOpenMenuIdMobile] = useState(null);

  const isBiayaTab = activeTab === 'bank' || activeTab === 'kas';

  const normalizeBiayaRow = (item) => ({
    ...item,
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
    createdAt: item.createdAt ?? item.created_at ?? null
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const params = {
        length: 1000,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      };
      const response = isBiayaTab
        ? await BiayaRphService.getData(params)
        : await BahanPembantuRphService.getData(params);
      if (response.success) {
        const items = response.data || [];
        setData(isBiayaTab ? items.map(normalizeBiayaRow) : items);
      }
    } catch (error) {
      console.error('Error loading bahan pembantu data:', error);
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

  useEffect(() => {
    loadData();
  }, [startDate, endDate, activeTab]);

  useEffect(() => {
    loadSummaries();
  }, [activeTab]);

  const filteredData = useMemo(() => {
      let filtered = data;

      // Tab filtering (client-side on jenisPembelian)
      if (activeTab === 'bank') {
          filtered = filtered.filter((item) => item.jenisPembelian === 'Bank');
      } else if (activeTab === 'kas') {
          filtered = filtered.filter((item) => item.jenisPembelian === 'Kas');
      }
      // 'pembelian_bahan_pembantu' tab shows all data (no filter needed)
      // 'pembelian_bahan_pembantu' tab shows all data (no filter needed)
      // 'pembelian_bahan_pembantu' tab shows all data (no filter needed)
      // 'pembelian_bahan_pembantu' tab shows all data (no filter needed)
      // 'pembelian_bahan_pembantu' tab shows all data (no filter needed)
      // 'pembelian_bahan_pembantu' tab shows all data (no filter needed)
      // 'pembelian_bahan_pembantu' tab shows all data (no filter needed)
      // 'pembelian_bahan_pembantu' tab shows all data (no filter needed)
      // 'pembelian_bahan_pembantu' tab shows all data (no filter needed)
      // 'pembelian_bahan_pembantu' tab shows all data (no filter needed)
      // 'pembelian_bahan_pembantu' tab shows all data (no filter needed)
      // 'pembelian_bahan_pembantu' tab shows all data (no filter needed)
      // 'pembelian_bahan_pembantu' tab shows all data (no filter needed)
      // 'pembelian_bahan_pembantu' tab shows all data (no filter needed)

    // Search filtering
    const keyword = searchTerm.trim().toLowerCase();
    if (keyword) {
      filtered = filtered.filter((item) =>
        [
          item.notaSistem,
          item.namaProduk,
          item.peruntukkan,
          item.pemasok,
          item.keterangan,
          item.jenisPembelian,
          item.namaBank,
          item.namaBayar,
          item.payor
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword))
      );
    }

    return filtered;
  }, [data, activeTab, searchTerm]);

  const handleTabChange = (tabKey) => {
    setSearchTerm('');
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
    const baseColumns = [
      {
        name: 'No',
        width: '50px',
        center: true,
        cell: (row, index) => (
          <div className="w-full text-center font-semibold text-gray-500">{index + 1}</div>
        )
      },
      {
        name: 'Aksi',
        width: '70px',
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
            />
          </div>
        )
      }
    ];

    if (!isBiayaTab) {
      baseColumns.push({
        name: 'Nota Sistem',
        selector: (row) => row.notaSistem,
        sortable: true,
        width: '160px',
        cell: (row) => (
          <div className="w-full">
            <div className="inline-flex rounded-lg bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
              {row.notaSistem}
            </div>
          </div>
        )
      });
    }

    if (isBiayaTab) {
      return [
        ...baseColumns,
        {
          name: 'Item Lain Lain',
          selector: (row) => row.namaProduk,
          sortable: true,
          width: '180px',
          cell: (row) => <div className="py-2 font-semibold text-gray-800">{row.namaProduk || '-'}</div>
        },
        {
          name: rightAlignedColumnName('Harga'),
          selector: (row) => row.hargaSatuan,
          sortable: true,
          width: '140px',
          cell: (row) => (
            <div className="w-full text-right font-semibold text-emerald-700">
              {formatCurrency(row.hargaSatuan)}
            </div>
          )
        },
        {
          name: 'Keterangan',
          selector: (row) => row.keterangan,
          sortable: true,
          width: '180px',
          cell: (row) => <div className="text-sm font-medium text-gray-700">{row.keterangan || '-'}</div>
        },
        {
          name: 'Nama Bank',
          selector: (row) => row.namaBank,
          sortable: true,
          width: '140px',
          cell: (row) => <div className="text-sm font-medium text-gray-700">{row.namaBank || '-'}</div>
        },
        {
          name: 'Jenis Pembelian',
          selector: (row) => row.jenisPembelian,
          sortable: true,
          width: '130px',
          center: true,
          cell: (row) => (
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                row.jenisPembelian === 'Bank'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-amber-100 text-amber-700 border border-amber-200'
              }`}
            >
              {row.jenisPembelian}
            </span>
          )
        },
        {
          name: 'Nama Bayar',
          selector: (row) => row.namaBayar,
          sortable: true,
          width: '150px',
          cell: (row) => <div className="text-sm font-medium text-gray-700">{row.namaBayar || '-'}</div>
        },
        {
          name: 'Tanggal Pembayaran',
          selector: (row) => row.tanggalPembayaran,
          sortable: true,
          width: '160px',
          cell: (row) => <div className="text-sm font-medium text-gray-700">{formatDate(row.tanggalPembayaran)}</div>
        },
        {
          name: 'Peruntukkan',
          selector: (row) => row.peruntukkan,
          sortable: true,
          width: '150px',
          cell: (row) => <div className="text-sm font-medium text-gray-700">{row.peruntukkan || '-'}</div>
        },
        {
          name: 'Payor',
          selector: (row) => row.payor,
          sortable: true,
          width: '140px',
          cell: (row) => <div className="text-sm font-medium text-gray-700">{row.payor || '-'}</div>
        },
        {
          name: 'Created At',
          selector: (row) => row.createdAt,
          sortable: true,
          width: '150px',
          cell: (row) => <div className="text-sm font-medium text-gray-700">{formatDate(row.createdAt)}</div>
        }
      ];
    }

    return [
      ...baseColumns,
      {
        name: 'Nama Produk',
        selector: (row) => row.namaProduk,
        sortable: true,
        width: '180px',
        cell: (row) => <div className="py-2 font-semibold text-gray-800">{row.namaProduk || '-'}</div>
      },
      {
        name: 'Peruntukkan',
        selector: (row) => row.peruntukkan,
        sortable: true,
        width: '150px',
        cell: (row) => <div className="text-sm font-medium text-gray-700">{row.peruntukkan || '-'}</div>
      },
      {
        name: rightAlignedColumnName('Qty'),
        selector: (row) => row.qty,
        sortable: true,
        width: '80px',
        cell: (row) => (
          <div className="w-full text-right text-sm font-medium text-gray-700">{row.qty ?? '-'}</div>
        )
      },
      {
        name: 'Satuan',
        selector: (row) => row.satuan,
        sortable: true,
        width: '100px',
        center: true,
        cell: (row) => <div className="text-sm font-medium text-gray-700">{row.satuan || '-'}</div>
      },
      {
        name: rightAlignedColumnName('Harga Satuan'),
        selector: (row) => row.hargaSatuan,
        sortable: true,
        width: '150px',
        cell: (row) => (
          <div className="w-full text-right text-sm font-medium text-gray-700">
            {formatCurrency(row.hargaSatuan)}
          </div>
        )
      },
      {
        name: 'Pemasok',
        selector: (row) => row.pemasok,
        sortable: true,
        width: '150px',
        cell: (row) => <div className="text-sm font-medium text-gray-700">{row.pemasok || '-'}</div>
      },
      {
        name: rightAlignedColumnName('Biaya Kirim'),
        selector: (row) => row.biayaKirim,
        sortable: true,
        width: '130px',
        cell: (row) => (
          <div className="w-full text-right text-sm font-medium text-gray-700">
            {formatCurrency(row.biayaKirim)}
          </div>
        )
      },
      {
        name: rightAlignedColumnName('Biaya Lain'),
        selector: (row) => row.biayaLain,
        sortable: true,
        width: '130px',
        cell: (row) => (
          <div className="w-full text-right text-sm font-medium text-gray-700">
            {formatCurrency(row.biayaLain)}
          </div>
        )
      },
      {
        name: rightAlignedColumnName('Biaya Total'),
        selector: (row) => row.biayaTotal,
        sortable: true,
        width: '150px',
        cell: (row) => (
          <div className="w-full text-right font-semibold text-emerald-700">
            {formatCurrency(row.biayaTotal)}
          </div>
        )
      },
      {
        name: 'Jenis',
        selector: (row) => row.jenisPembelian,
        sortable: true,
        width: '100px',
        center: true,
        cell: (row) => (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              row.jenisPembelian === 'Bank'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-amber-100 text-amber-700 border border-amber-200'
            }`}
          >
            {row.jenisPembelian}
          </span>
        )
      },
      {
        name: 'Bank',
        selector: (row) => row.namaBank,
        sortable: true,
        width: '130px',
        cell: (row) => <div className="text-sm font-medium text-gray-700">{row.namaBank || '-'}</div>
      },
      {
        name: 'Keterangan',
        selector: (row) => row.keterangan,
        sortable: true,
        width: '180px',
        cell: (row) => <div className="text-sm font-medium text-gray-700">{row.keterangan || '-'}</div>
      },
      {
        name: 'Tanggal',
        selector: (row) => row.createdAt,
        sortable: true,
        width: '160px',
        cell: (row) => <div className="text-sm font-medium text-gray-700">{formatDate(row.createdAt)}</div>
      }
    ];
  }, [isBiayaTab, openMenuIdDesktop]);

  return (
    <>
      <style>{`
        .bahan-pembantu-rph-tabs::-webkit-scrollbar {
          height: 6px;
        }

        .bahan-pembantu-rph-tabs::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }

        .bahan-pembantu-rph-tabs::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-cyan-50/60">
        <div className="mx-auto max-w-full space-y-6">
          {/* Page Header */}
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <Package className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    Bahan Pembantu RPH
                  </h1>
                  <p className="mt-1 text-sm text-gray-500 sm:text-base">
                    Kelola data pembelian bahan pembantu untuk operasional RPH.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
              type="button"
              onClick={() =>
                navigate(
                  activeTab === 'pembelian_bahan_pembantu'
                    ? '/rph/bahan-pembantu-rph/add'
                    : '/rph/bahan-pembantu-rph/biaya/add'
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-emerald-600 hover:to-cyan-700 sm:text-base"
              >
              <Plus className="h-5 w-5" />
              Tambah
              </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SummaryCard
              title="Transaksi Hari Ini"
              value={dailySummary.total_transaksi || 0}
              subtext={`Total biaya: ${formatCurrency(dailySummary.total_biaya)}`}
              icon={CalendarDays}
              gradientClass="bg-gradient-to-br from-blue-500 to-cyan-600"
            />
            <SummaryCard
              title="Transaksi Bulan Ini"
              value={monthlySummary.total_transaksi || 0}
              subtext={`Total biaya: ${formatCurrency(monthlySummary.total_biaya)}`}
              icon={TrendingUp}
              gradientClass="bg-gradient-to-br from-emerald-500 to-emerald-600"
            />
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Tab Headers */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50">
              <div className="flex border-b-2 border-gray-200 bahan-pembantu-rph-tabs overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`relative flex-1 px-8 py-5 text-lg font-bold transition-all duration-300 whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <span className="relative z-10">{tab.label}</span>
                    {activeTab === tab.key && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 bg-gradient-to-br from-slate-50/30 to-blue-50/30">
              {/* Date Filter Row */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Filter Tanggal:</span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Tanggal Mulai"
                  />
                  <span className="text-sm text-gray-400">s/d</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Tanggal Akhir"
                  />
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
                <div className="relative w-full max-w-full sm:max-w-md">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  {isLoading && (
                    <Loader2 className="absolute right-12 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-500" />
                  )}
                  {!!searchTerm && !isLoading && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Cari bahan pembantu..."
                    className="w-full rounded-full border border-gray-200 py-3 pl-12 pr-12 text-sm shadow-sm outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 sm:text-base"
                  />
                </div>

                <div className="text-sm text-gray-500">
                  Total <span className="font-semibold text-gray-700">{filteredData.length}</span> data ditampilkan
                </div>
              </div>

              {/* Desktop DataTable */}
              <div className="hidden md:block">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  customStyles={enhancedTableStyles}
                  progressPending={isLoading}
                  progressComponent={
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                      <span className="ml-3 text-gray-500">Memuat data...</span>
                    </div>
                  }
                  noDataComponent={
                    <div className="py-12 text-center">
                      <AlertCircle className="mx-auto h-10 w-10 text-gray-300" />
                      <p className="mt-3 text-base font-semibold text-gray-600">Tidak ada data ditemukan</p>
                      <p className="mt-1 text-sm text-gray-400">
                        Coba ubah kata kunci pencarian atau filter tanggal untuk menemukan data yang sesuai.
                      </p>
                    </div>
                  }
                  highlightOnHover
                  pointerOnHover
                  responsive
                  dense
                  fixedHeader
                  fixedHeaderScrollHeight="calc(100vh - 420px)"
                />
              </div>

              {/* Mobile Card View */}
              <div className="space-y-4 pt-4 md:hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    <span className="ml-3 text-gray-500">Memuat data...</span>
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center">
                    <AlertCircle className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-3 font-semibold text-gray-600">Tidak ada data ditemukan</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Coba ubah kata kunci pencarian atau filter tanggal untuk menemukan data yang sesuai.
                    </p>
                  </div>
                ) : (
                  filteredData.map((row, index) => (
                    <MobileBahanPembantuCard
                      key={row.pid}
                      row={row}
                      index={index + 1}
                      showNotaSistem={!isBiayaTab}
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
                    />
                  ))
                )}
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
            ? `Anda yakin ingin menghapus bahan pembantu ${selectedItem.notaSistem || ''}? Tindakan ini tidak dapat dibatalkan.`
            : 'Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.'
        }
      />
    </>
  );
};

export default BahanPembantuRphPage;
