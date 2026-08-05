import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import {
  PlusCircle,
  Search,
  X,
  Loader2,
  ShoppingCart,
  Package,
  Pill,
  Wallet,
  ClipboardList,
  MoreHorizontal,
  Eye,
  Pencil,
  Ban,
  Boxes,
  CreditCard
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { enhancedTableStyles } from '../pembelian sapi qurban/constants/tableStyles';
import RphPembelianService from '../../../../services/rphPembelianService';
import DeleteConfirmationModal from '../../../../components/shared/modals/DeleteConfirmationModal';
import StokRphModal from './modals/StokRphModal';

const PURCHASE_TYPES = {
  pakan: 1,
  ovk: 2
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : '-';

const SummaryCard = ({ title, value, subtext, icon: Icon, accentClass }) => (
  <div className="group rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md">
    <div className="flex items-center gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accentClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-gray-500">{title}</p>
        <p className="mt-0.5 truncate text-lg font-bold leading-tight text-gray-900">{value}</p>
      </div>
    </div>
    <p className="mt-2 truncate text-[11px] text-gray-400">{subtext}</p>
  </div>
);

const ActionMenu = ({ row, onClose, buttonRef, onDetail, onEdit, onCancel, onBayar }) => {
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

  const canCancel = row.payment_status_label !== 'Lunas' && row.payment_status_label !== 'Belum Lunas';
  const canBayar = row.payment_status_label !== 'Lunas' && !!row.payment_pid;
  const canEdit = row.payment_status_label !== 'Lunas';

  const actions = [
    {
      label: 'Detail',
      icon: Eye,
      iconClass: 'text-sky-600',
      bgClass: 'bg-sky-100',
      onClick: () => onDetail?.(row)
    },
    {
      label: 'Bayar',
      icon: CreditCard,
      iconClass: canBayar ? 'text-emerald-600' : 'text-gray-400',
      bgClass: canBayar ? 'bg-emerald-100' : 'bg-gray-100',
      disabled: !canBayar,
      onClick: () => {
        if (canBayar) onBayar?.(row);
      }
    },
    {
      label: 'Edit',
      icon: Pencil,
      iconClass: canEdit ? 'text-amber-600' : 'text-gray-400',
      bgClass: canEdit ? 'bg-amber-100' : 'bg-gray-100',
      disabled: !canEdit,
      onClick: () => {
        if (canEdit) onEdit?.(row);
      }
    },
    {
      label: canCancel ? 'Batalkan Transaksi' : 'Tidak Dapat Dibatalkan',
      icon: Ban,
      iconClass: canCancel ? 'text-red-600' : 'text-gray-400',
      bgClass: canCancel ? 'bg-red-100' : 'bg-gray-100',
      disabled: !canCancel,
      onClick: () => {
        if (canCancel) onCancel?.(row);
      }
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
      className="w-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
      role="menu"
      aria-label="Menu aksi"
    >
      <div className="p-1.5">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled={action.disabled}
            onClick={() => handleActionClick(action)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors whitespace-nowrap ${
              action.disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'
            }`}
          >
            <div className={`rounded-lg p-1.5 ${action.bgClass}`}>
              <action.icon className={`h-4 w-4 ${action.iconClass}`} />
            </div>
            <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">{action.label}</p>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
};

const ActionButton = ({ row, isOpen, onToggle, onClose, onDetail, onEdit, onCancel, onBayar }) => {
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
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <ActionMenu
          row={row}
          onClose={onClose}
          buttonRef={buttonRef}
          onDetail={onDetail}
          onEdit={onEdit}
          onCancel={onCancel}
          onBayar={onBayar}
        />
      )}
    </div>
  );
};

const MobilePurchaseCard = ({
  row,
  index,
  onToggleMenu,
  isMenuOpen,
  onCloseMenu,
  onDetail,
  onEdit,
  onCancel,
  onBayar
}) => (
  <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
    <div className="space-y-3 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="inline-flex w-fit rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            {row.nomor}
          </div>
          <div className="text-xs text-gray-500">{formatDate(row.tanggal)}</div>
        </div>
        <ActionButton
          row={row}
          isOpen={isMenuOpen}
          onToggle={onToggleMenu}
          onClose={onCloseMenu}
          onDetail={onDetail}
          onEdit={onEdit}
          onCancel={onCancel}
          onBayar={onBayar}
        />
      </div>

      <div className="text-sm font-semibold text-gray-800">{row.jenisItem}</div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-gray-400">Jumlah</p>
          <p className="font-medium text-slate-700">
            <span className="rounded bg-slate-100 px-1.5 py-0.5">{row.jumlah} {row.satuan}</span>
          </p>
        </div>
        <div>
          <p className="text-gray-400">Pemasok</p>
          <p className="font-medium text-gray-700">{row.supplier || '-'}</p>
        </div>
        <div className="col-span-2 flex items-center justify-between border-t border-gray-100 pt-2">
          <p className="text-gray-400">Total</p>
          <p className="font-semibold text-emerald-700">{formatCurrency(row.total)}</p>
        </div>
        <div className="col-span-2 flex items-center justify-between">
          <p className="text-gray-400">Status</p>
          {(() => {
            const label = row.payment_status_label || 'Belum Bayar';
            const badgeClass = label === 'Lunas'
              ? 'bg-emerald-100 text-emerald-700'
              : label === 'Belum Lunas'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700';
            return (
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
                {label}
              </span>
            );
          })()}
        </div>
      </div>

      {row.status && (
        <div className="border-t border-gray-100 pt-2 text-xs text-gray-600">
          <span className="text-gray-400">Catatan: </span>
          {row.status}
        </div>
      )}
    </div>
  </div>
);

 const PembelianPakanOvkPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuIdDesktop, setOpenMenuIdDesktop] = useState(null);
  const [openMenuIdMobile, setOpenMenuIdMobile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('ovk');
  const [pembelianData, setPembelianData] = useState({
    pakan: [],
    ovk: []
  });
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isStokModalOpen, setIsStokModalOpen] = useState(false);
  const hasLoadedOnceRef = useRef(false);

 const activeData = useMemo(() => pembelianData[activeTab] || [], [pembelianData, activeTab]);

 const getRowId = (row) => row?.pid || row?.id || row?._original?.pid || row?._original?.id;

 const handleDetail = useCallback((row) => {
   const rowId = getRowId(row);
    if (!rowId) return;
    navigate(`/rph/pembelian-pakan-ovk/detail/${rowId}`, { state: { item: row, type: activeTab } });
    setOpenMenuIdDesktop(null);
    setOpenMenuIdMobile(null);
  }, [navigate, activeTab]);

  const handleEdit = useCallback((row) => {
    const rowId = getRowId(row);
    if (!rowId) return;
    if (row.payment_status_label === 'Lunas') {
      setErrorMessage('Transaksi yang sudah lunas tidak dapat diedit.');
      return;
    }
    navigate(`/rph/pembelian-pakan-ovk/edit/${rowId}`, { state: { item: row, type: activeTab } });
    setOpenMenuIdDesktop(null);
    setOpenMenuIdMobile(null);
  }, [navigate, activeTab]);

  const handleBayar = useCallback((row) => {
    if (!row?.payment_pid) return;
    navigate(`/rph/keuangan/pengeluaran/bayar/${encodeURIComponent(row.payment_pid)}`);
    setOpenMenuIdDesktop(null);
    setOpenMenuIdMobile(null);
  }, [navigate]);

const handleCancel = useCallback((row) => {
    if (!row) return;
    const canCancel = row.payment_status_label !== 'Lunas' && row.payment_status_label !== 'Belum Lunas';
    if (!canCancel) {
      setErrorMessage('Transaksi yang sudah dibayar / lunas tidak dapat dibatalkan.');
      return;
    }
    setSelectedItem(row);
    setIsCancelModalOpen(true);
    setOpenMenuIdDesktop(null);
    setOpenMenuIdMobile(null);
  }, []);

  const handleConfirmCancel = async () => {
    if (!selectedItem) return;
    const rowId = getRowId(selectedItem);
    if (!rowId) return;

    setIsCancelling(true);
    setErrorMessage('');

    try {
      const response = await RphPembelianService.cancelPembelian(rowId);

      if (!response.success) {
        setErrorMessage(response.message || 'Gagal membatalkan transaksi.');
        return;
      }

      // hard refresh after cancel
      setTimeout(() => window.location.reload(), 50);
    } catch (error) {
      setErrorMessage(error?.message || 'Gagal membatalkan transaksi.');
    } finally {
      setIsCancelling(false);
    }
  };

  const loadPembelianData = async (jenisPembelian, isActive, cacheBuster) => {
    if (!isActive?.current) return;
    setIsLoading(true);
    setErrorMessage('');

    const response = await RphPembelianService.getPembelianData(PURCHASE_TYPES[jenisPembelian], cacheBuster);

    if (!isActive.current) return;

    setPembelianData((prevState) => ({
      ...prevState,
      [jenisPembelian]: response.data
    }));

    if (!response.success) {
      setErrorMessage(response.message || 'Gagal memuat data pembelian.');
    }

    setIsLoading(false);
    hasLoadedOnceRef.current = true;
  };


  const handleTabChange = (tabKey) => {
    setSearchTerm('');
    setActiveTab(tabKey);
    setOpenMenuIdDesktop(null);
    setOpenMenuIdMobile(null);
  };

  useEffect(() => {
    const isActive = { current: true };

    loadPembelianData(activeTab, isActive, Date.now());

    return () => {
      isActive.current = false;
    };
  }, [activeTab]);

  useEffect(() => {
    if (!hasLoadedOnceRef.current) return;

    const isActive = { current: true };

    loadPembelianData(activeTab, isActive, Date.now());

    return () => {
      isActive.current = false;
    };
  }, [location.key, activeTab]);
const filteredData = useMemo(() => {
 const keyword = searchTerm.trim().toLowerCase();
 if (!keyword) return activeData;

 return activeData.filter((item) =>
 [item.nomor, item.jenisItem, item.supplier, item.status]
 .filter(Boolean)
 .some((value) => value.toLowerCase().includes(keyword))
 );
 }, [searchTerm, activeData]);

 const stats = useMemo(() => {
 const totalTransaksi = activeData.length;
 const jenisAktif = new Set(activeData.map((item) => item.jenisItem)).size;
 const totalUnit = activeData.reduce((sum, item) => sum + (item.jumlah || 0), 0);
 const totalNominal = activeData.reduce((sum, item) => sum + (item.total || 0), 0);

 return {
 totalTransaksi,
 jenisAktif,
 totalUnit,
 totalNominal
 };
 }, [activeData]);

  const columns = useMemo(
    () => [
      {
        name: 'No',
        width: '52px',
        center: true,
        cell: (row, index) => (
          <div className="w-full text-center text-xs font-semibold text-gray-400">{index + 1}</div>
        )
      },
      {
        name: 'Aksi',
        width: '72px',
        center: true,
        ignoreRowClick: true,
        cell: (row) => (
          <div className="flex w-full justify-center">
            <ActionButton
              row={row}
              isOpen={openMenuIdDesktop === row.id}
              onToggle={() => {
                setOpenMenuIdMobile(null);
                setOpenMenuIdDesktop((currentId) => (currentId === row.id ? null : row.id));
              }}
              onClose={() => setOpenMenuIdDesktop(null)}
              onDetail={handleDetail}
              onEdit={handleEdit}
              onCancel={handleCancel}
              onBayar={handleBayar}
            />
          </div>
        )
      },
      {
        name: 'Pembelian',
        selector: (row) => row.nomor,
        sortable: true,
        minWidth: '220px',
        grow: 1.2,
        cell: (row) => (
          <div className="flex flex-col gap-0.5 py-2">
            <div className="inline-flex w-fit rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {row.nomor}
            </div>
            <div className="text-xs text-gray-500">{formatDate(row.tanggal)}</div>
            <div className="text-xs font-medium text-gray-600">
              <span className="text-gray-400">Pemasok: </span>
              {row.supplier || '-'}
            </div>
          </div>
        )
      },
      {
        name: activeTab === 'ovk' ? 'OVK' : 'Bahan Baku',
        selector: (row) => row.jenisItem,
        sortable: true,
        minWidth: '240px',
        grow: 1.3,
        cell: (row) => (
          <div className="flex flex-col gap-0.5 py-2">
            <div className="text-sm font-semibold text-gray-800">{row.jenisItem}</div>
            <div className="text-xs font-medium text-slate-600">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                {row.jumlah} {row.satuan}
              </span>
            </div>
          </div>
        )
      },
      {
        name: 'Total Harga',
        selector: (row) => row.total,
        sortable: true,
        minWidth: '150px',
        right: true,
        cell: (row) => (
          <div className="py-2 text-right text-sm font-semibold text-emerald-700">
            {formatCurrency(row.total)}
          </div>
        )
      },
      {
        name: 'Status Pembayaran',
        selector: (row) => row.payment_status_label,
        sortable: true,
        minWidth: '150px',
        center: true,
        cell: (row) => {
          const label = row.payment_status_label || 'Belum Bayar';
          const badgeClass = label === 'Lunas'
            ? 'bg-emerald-100 text-emerald-700'
            : label === 'Belum Lunas'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-red-100 text-red-700';
          return (
            <div className="py-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
                {label}
              </span>
            </div>
          );
        }
      },
      {
        name: 'Catatan',
        selector: (row) => row.status,
        sortable: true,
        minWidth: '180px',
        cell: (row) => (
          <div className="py-2 text-xs font-medium text-gray-600 line-clamp-2">
            {row.status || '-'}
          </div>
        )
      }
    ],
    [openMenuIdDesktop, activeTab, handleDetail, handleEdit, handleCancel, handleBayar]
  );

  return (
    <>
      <style>{`
        .rph-pakan-ovk-tabs::-webkit-scrollbar {
          height: 6px;
        }

        .rph-pakan-ovk-tabs::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }

        .rph-pakan-ovk-tabs::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-cyan-50/60">
        <div className="mx-auto max-w-full space-y-6">
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
            <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900">
            Pembelian Bahan Baku & OVK
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
            Kelola transaksi pembelian bahan baku, obat, vitamin, dan kebutuhan OVK untuk operasional RPH.
            </p>
            </div>
            </div>
           
            <div className="flex shrink-0 items-center gap-3">
            <button
            type="button"
            onClick={() => setIsStokModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
            >
            <Boxes className="h-4 w-4" />
            Cek Stok
            </button>
            {activeTab === 'pakan' ? (
            <button
            type="button"
            onClick={() => navigate('/rph/pembelian-pakan-ovk/add/pakan')}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50"
            >
            <PlusCircle className="h-4 w-4" />
            Tambah Bahan Baku
            </button>
            ) : (
            <button
            type="button"
            onClick={() => navigate('/rph/pembelian-pakan-ovk/add/ovk')}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700"
            >
            <PlusCircle className="h-4 w-4" />
            Tambah OVK
            </button>
            )}
            </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryCard
            title={activeTab === 'ovk' ? 'Total Pembelian OVK' : 'Total Pembelian Bahan Baku'}
            value={stats.totalTransaksi}
            subtext={activeTab === 'ovk' ? 'Jumlah transaksi pembelian OVK' : 'Jumlah transaksi pembelian Bahan Baku'}
            icon={ClipboardList}
            accentClass="bg-emerald-100 text-emerald-600"
            />
            <SummaryCard
            title={activeTab === 'ovk' ? 'Jenis OVK' : 'Jenis Bahan Baku'}
            value={stats.jenisAktif}
            subtext={activeTab === 'ovk' ? 'Jenis OVK yang tercatat pada daftar' : 'Jenis Bahan Baku yang tercatat pada daftar'}
            icon={Pill}
            accentClass="bg-blue-100 text-blue-600"
            />
            <SummaryCard
            title={activeTab === 'ovk' ? 'Total Jumlah OVK' : 'Total Jumlah Bahan Baku'}
            value={stats.totalUnit}
            subtext={activeTab === 'ovk' ? 'Akumulasi unit OVK yang dibeli' : 'Akumulasi unit Bahan Baku yang dibeli'}
            icon={Package}
            accentClass="bg-violet-100 text-violet-600"
            />
            <SummaryCard
            title="Total Harga"
            value={formatCurrency(stats.totalNominal)}
            subtext={activeTab === 'ovk' ? 'Akumulasi nilai pembelian OVK' : 'Akumulasi nilai pembelian Bahan Baku'}
            icon={Wallet}
            accentClass="bg-amber-100 text-amber-600"
            />
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
          <div className="flex">
          <button
          onClick={() => handleTabChange('pakan')}
          className={`relative flex-1 px-6 py-3 text-sm font-semibold transition-all ${
          activeTab === 'pakan'
          ? 'text-emerald-700 bg-emerald-50/50'
          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          >
          <span className="relative z-10">Pembelian Bahan Baku</span>
          {activeTab === 'pakan' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
          )}
          </button>
          <button
          onClick={() => handleTabChange('ovk')}
          className={`relative flex-1 px-6 py-3 text-sm font-semibold transition-all ${
          activeTab === 'ovk'
          ? 'text-emerald-700 bg-emerald-50/50'
          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          >
          <span className="relative z-10">Pembelian OVK</span>
          {activeTab === 'ovk' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
          )}
          </button>
          </div>
          </div>
         
          {/* Tab Content */}
          <div className="p-6 bg-gradient-to-br from-slate-50/30 to-blue-50/30">
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
                    placeholder={activeTab === 'ovk' ? 'Cari pembelian OVK...' : 'Cari pembelian Bahan Baku...'}
                    className={`w-full rounded-full border border-gray-200 py-3 pl-12 pr-12 text-sm shadow-sm outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 sm:text-base`}
                  />
                </div>

                <div className="text-sm text-gray-500">
                  Total <span className="font-semibold text-gray-700">{filteredData.length}</span> data ditampilkan
                </div>
                {errorMessage && (
                  <div className="mt-2 text-sm font-medium text-red-600">{errorMessage}</div>
                )}
                </div>
               
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
                    <p className="text-base font-semibold text-gray-600">Tidak ada data ditemukan</p>
                    <p className="mt-1 text-sm text-gray-400">
                    Coba ubah kata kunci pencarian untuk menemukan data {activeTab === 'ovk' ? 'OVK' : 'Bahan Baku'} yang sesuai.
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
           
            <div className="space-y-4 pt-4 md:hidden">
            {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  <span className="ml-3 text-gray-500">Memuat data...</span>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center">
                  <p className="font-semibold text-gray-600">Tidak ada data ditemukan</p>
                  <p className="mt-1 text-sm text-gray-400">
                  Coba ubah kata kunci pencarian untuk menemukan data {activeTab === 'ovk' ? 'OVK' : 'Bahan Baku'} yang sesuai.
                  </p>
                </div>
                    ) : (
        filteredData.map((row, index) => (
          <MobilePurchaseCard
            key={row.id}
            row={row}
            index={index + 1}
            isMenuOpen={openMenuIdMobile === row.id}
            onToggleMenu={() => {
              setOpenMenuIdDesktop(null);
              setOpenMenuIdMobile((currentId) => (currentId === row.id ? null : row.id));
            }}
            onCloseMenu={() => setOpenMenuIdMobile(null)}
            onDetail={handleDetail}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onBayar={handleBayar}
          />
        ))
      )}
      </div>
      </div>
      </div>
      </div>
      </div>

      <StokRphModal
        isOpen={isStokModalOpen}
        onClose={() => setIsStokModalOpen(false)}
        activeTab={activeTab}
      />

      <DeleteConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedItem(null);
        }}
        onConfirm={handleConfirmCancel}
        loading={isCancelling}
        title="Batalkan Transaksi?"
        description={
          selectedItem
            ? `Anda yakin ingin membatalkan transaksi ${selectedItem.nomor || ''}? Stok akan dikembalikan ke warehouse dan transaksi dihapus dari daftar. Tindakan ini tidak dapat dibatalkan.`
            : 'Anda yakin ingin membatalkan transaksi ini? Stok akan dikembalikan ke warehouse. Tindakan ini tidak dapat dibatalkan.'
        }
      />
    </>
  );
};

export default PembelianPakanOvkPage;
