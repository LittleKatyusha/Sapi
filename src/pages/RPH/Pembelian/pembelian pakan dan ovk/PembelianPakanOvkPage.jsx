import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Trash2
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { enhancedTableStyles } from '../pembelian sapi qurban/constants/tableStyles';
import RphPembelianService from '../../../../services/rphPembelianService';

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

const getStatusClasses = (status) => {
  const normalizedStatus = (status || '').toLowerCase();

  if (normalizedStatus.includes('selesai')) {
    return 'bg-green-100 text-green-700 border border-green-200';
  }

  if (normalizedStatus.includes('proses')) {
    return 'bg-blue-100 text-blue-700 border border-blue-200';
  }

  return 'bg-amber-100 text-amber-700 border border-amber-200';
};

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
      description: `Lihat detail ${row.nomor}`,
      icon: Eye,
      iconClass: 'text-sky-600',
      bgClass: 'bg-sky-100',
      onClick: () => onDetail?.(row)
    },
    {
      label: 'Edit',
      description: `Ubah data ${row.nomor}`,
      icon: Pencil,
      iconClass: 'text-amber-600',
      bgClass: 'bg-amber-100',
      onClick: () => onEdit?.(row)
    },
    {
      label: 'Hapus',
      description: `Hapus data ${row.nomor}`,
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
        <MoreHorizontal className="h-4 w-4" />
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

const MobilePurchaseCard = ({
  row,
  index,
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
          <p className="mt-1 text-sm font-semibold text-emerald-700">{row.nomor}</p>
          <p className="mt-1 text-sm font-medium text-gray-800">{row.jenisItem}</p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(row.status)}`}>
          {row.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400">Tanggal</p>
          <p className="font-medium text-gray-700">{formatDate(row.tanggal)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Pemasok</p>
          <p className="font-medium text-gray-700">{row.supplier}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Jenis Item</p>
          <p className="font-medium text-gray-700">{row.jenisItem}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Jumlah</p>
          <p className="font-medium text-gray-700">
            {row.jumlah} {row.satuan}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-gray-400">Total</p>
          <p className="font-semibold text-emerald-700">{formatCurrency(row.total)}</p>
        </div>
      </div>

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

const PembelianPakanOvkPage = () => {
 const navigate = useNavigate();
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

 const activeData = pembelianData[activeTab] || [];

 const getRowId = (row) => row?.pid || row?.id || row?._original?.pid || row?._original?.id;

 const handleDetail = (row) => {
   const rowId = getRowId(row);
   if (!rowId) return;
   navigate(`/rph/pembelian-pakan-ovk/detail/${rowId}`, { state: { item: row, type: activeTab } });
   setOpenMenuIdDesktop(null);
   setOpenMenuIdMobile(null);
 };

 const handleEdit = (row) => {
   const rowId = getRowId(row);
   if (!rowId) return;
   navigate(`/rph/pembelian-pakan-ovk/edit/${rowId}`, { state: { item: row, type: activeTab } });
   setOpenMenuIdDesktop(null);
   setOpenMenuIdMobile(null);
 };

 const handleDelete = (row) => {
   if (!row) return;
   setOpenMenuIdDesktop(null);
   setOpenMenuIdMobile(null);
 };

 const loadPembelianData = async (jenisPembelian, isActive) => {
   setIsLoading(true);
   setErrorMessage('');

   const response = await RphPembelianService.getPembelianData(PURCHASE_TYPES[jenisPembelian]);

   if (!isActive.current) return;

   setPembelianData((prevState) => ({
     ...prevState,
     [jenisPembelian]: response.data
   }));

   if (!response.success) {
     setErrorMessage(response.message || 'Gagal memuat data pembelian.');
   }

   setIsLoading(false);
 };

 const handleTabChange = (tabKey) => {
   setSearchTerm('');
   setActiveTab(tabKey);
   setOpenMenuIdDesktop(null);
   setOpenMenuIdMobile(null);
 };

 useEffect(() => {
   const isActive = { current: true };

   loadPembelianData(activeTab, isActive);

   return () => {
     isActive.current = false;
   };
 }, [activeTab]);

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
        width: '70px',
        center: true,
        cell: (row, index) => (
          <div className="w-full text-center font-semibold text-gray-500">{index + 1}</div>
        )
      },
      {
        name: 'Pilih',
        width: '80px',
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
              onDelete={handleDelete}
            />
          </div>
        )
      },
      {
        name: 'Nomor Pembelian',
        selector: (row) => row.nomor,
        sortable: true,
        minWidth: '170px',
        cell: (row) => (
          <div className="w-full">
            <div className="inline-flex rounded-lg bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
              {row.nomor}
            </div>
          </div>
        )
      },
      {
        name: 'Tanggal',
        selector: (row) => row.tanggal,
        sortable: true,
        minWidth: '140px',
        cell: (row) => <div className="text-sm font-medium text-gray-700">{formatDate(row.tanggal)}</div>
      },
      {
        name: activeTab === 'ovk' ? 'Jenis OVK' : 'Jenis Pakan',
        selector: (row) => row.jenisItem,
        sortable: true,
        minWidth: '220px',
        grow: 1.3,
        cell: (row) => <div className="py-2 font-semibold text-gray-800">{row.jenisItem}</div>
      },
      {
        name: 'Pemasok',
        selector: (row) => row.supplier,
        sortable: true,
        minWidth: '200px',
        cell: (row) => <div className="text-sm font-medium text-gray-700">{row.supplier}</div>
      },
      {
        name: 'Jumlah',
        selector: (row) => row.jumlah,
        sortable: true,
        width: '120px',
        center: true,
        cell: (row) => (
          <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
            {row.jumlah} {row.satuan}
          </div>
        )
      },
      {
        name: 'Total',
        selector: (row) => row.total,
        sortable: true,
        minWidth: '160px',
        cell: (row) => <div className="font-semibold text-emerald-700">{formatCurrency(row.total)}</div>
      },
      {
        name: 'Catatan',
        selector: (row) => row.status,
        sortable: true,
        minWidth: '200px',
        cell: (row) => (
          <div className="text-sm font-medium text-gray-700">{row.status || '-'}</div>
        )
      }
    ],
    [openMenuIdDesktop, activeTab]
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
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
            <ShoppingCart className="h-7 w-7" />
            </div>
            <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Pembelian Pakan & OVK
            </h1>
            <p className="mt-1 text-sm text-gray-500 sm:text-base">
            Kelola transaksi pembelian pakan, obat, vitamin, dan kebutuhan OVK untuk operasional RPH.
            </p>
            </div>
            </div>
           
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {activeTab === 'pakan' ? (
            <button
            type="button"
            onClick={() => navigate('/rph/pembelian-pakan-ovk/add/pakan')}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 sm:text-base"
            >
            <PlusCircle className="h-5 w-5" />
            Tambah Pembelian Pakan
            </button>
            ) : (
            <button
            type="button"
            onClick={() => navigate('/rph/pembelian-pakan-ovk/add/ovk')}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-emerald-600 hover:to-cyan-700 sm:text-base"
            >
            <PlusCircle className="h-5 w-5" />
            Tambah Pembelian OVK
            </button>
            )}
            </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
            title={activeTab === 'ovk' ? 'Total Pembelian OVK' : 'Total Pembelian Pakan'}
            value={stats.totalTransaksi}
            subtext={activeTab === 'ovk' ? 'Jumlah transaksi pembelian OVK' : 'Jumlah transaksi pembelian Pakan'}
            icon={ClipboardList}
            gradientClass="bg-gradient-to-br from-emerald-500 to-emerald-600"
            />
            <SummaryCard
            title={activeTab === 'ovk' ? 'Jenis OVK' : 'Jenis Pakan'}
            value={stats.jenisAktif}
            subtext={activeTab === 'ovk' ? 'Jenis OVK yang tercatat pada daftar' : 'Jenis Pakan yang tercatat pada daftar'}
            icon={Pill}
            gradientClass="bg-gradient-to-br from-blue-500 to-cyan-600"
            />
            <SummaryCard
            title={activeTab === 'ovk' ? 'Total Jumlah OVK' : 'Total Jumlah Pakan'}
            value={stats.totalUnit}
            subtext={activeTab === 'ovk' ? 'Akumulasi unit OVK yang dibeli' : 'Akumulasi unit Pakan yang dibeli'}
            icon={Package}
            gradientClass="bg-gradient-to-br from-violet-500 to-purple-600"
            />
            <SummaryCard
            title="Total Harga"
            value={formatCurrency(stats.totalNominal)}
            subtext={activeTab === 'ovk' ? 'Akumulasi nilai pembelian OVK' : 'Akumulasi nilai pembelian Pakan'}
            icon={Wallet}
            gradientClass="bg-gradient-to-br from-amber-500 to-orange-500"
            />
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Tab Headers */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="flex border-b-2 border-gray-200">
          <button
          onClick={() => handleTabChange('pakan')}
          className={`relative flex-1 px-8 py-5 text-lg font-bold transition-all duration-300 ${
          activeTab === 'pakan'
          ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg'
          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
          >
          <span className="relative z-10">Pembelian Pakan</span>
          {activeTab === 'pakan' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
          )}
          </button>
          <button
          onClick={() => handleTabChange('ovk')}
          className={`relative flex-1 px-8 py-5 text-lg font-bold transition-all duration-300 ${
          activeTab === 'ovk'
          ? 'text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg'
          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
          >
          <span className="relative z-10">Pembelian OVK</span>
          {activeTab === 'ovk' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
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
                    placeholder={activeTab === 'ovk' ? 'Cari pembelian OVK...' : 'Cari pembelian Pakan...'}
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
                    Coba ubah kata kunci pencarian untuk menemukan data {activeTab === 'ovk' ? 'OVK' : 'Pakan'} yang sesuai.
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
                  Coba ubah kata kunci pencarian untuk menemukan data {activeTab === 'ovk' ? 'OVK' : 'Pakan'} yang sesuai.
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
                    onDelete={handleDelete}
                  />
                ))
              )}
              </div>
              </div>
              </div>
              </div>
              </div>
              </>
  );
};

export default PembelianPakanOvkPage;