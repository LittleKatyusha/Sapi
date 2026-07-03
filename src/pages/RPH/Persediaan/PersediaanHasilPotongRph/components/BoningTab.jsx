import React, { useMemo, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import {
  Search,
  X,
  Loader2,
  RefreshCw,
  Eye,
  Beef,
  Boxes,
  Scale,
  CircleOff,
} from 'lucide-react';
import usePersediaanHasilPotong from '../hooks/usePersediaanHasilPotong';
import customTableStyles from '../constants/tableStyles';

const formatJumlah = (value) => {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return '-';
  return `${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(numeric)} KG`;
};

const formatNumber = (value) => {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return '0';
  return new Intl.NumberFormat('id-ID').format(numeric);
};

const boningTableStyles = {
  ...customTableStyles,
  table: {
    style: {
      ...customTableStyles.table.style,
      minWidth: '720px',
    },
  },
  headRow: {
    style: {
      ...customTableStyles.headRow.style,
      minHeight: '58px',
      background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      borderBottom: '1px solid #dbe4ee',
      boxShadow: 'inset 0 -1px 0 rgba(148, 163, 184, 0.15)',
    },
  },
  headCells: {
    style: {
      ...customTableStyles.headCells.style,
      color: '#0f172a',
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      padding: '14px 18px',
      borderRight: 'none',
    },
  },
  rows: {
    style: {
      ...customTableStyles.rows.style,
      minHeight: '64px',
      borderBottom: '1px solid #eef2f7',
    },
    highlightOnHoverStyle: {
      ...customTableStyles.rows.highlightOnHoverStyle,
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #dbeafe',
    },
  },
  cells: {
    style: {
      ...customTableStyles.cells.style,
      padding: '14px 18px',
      color: '#334155',
    },
  },
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

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const summary = useMemo(() => {
    const totalBeratMasukHalaman = dataList.reduce((total, item) => total + Number(item.berat_masuk ?? 0), 0);
    const totalBeratKeluarHalaman = dataList.reduce((total, item) => total + Number(item.berat_keluar ?? 0), 0);
    const totalBeratSisaHalaman = dataList.reduce((total, item) => total + Number(item.berat_sisa ?? 0), 0);
    const totalKosongHalaman = dataList.filter((item) => Number(item.berat_sisa ?? 0) <= 0).length;

    return {
      totalBeratMasukHalaman,
      totalBeratKeluarHalaman,
      totalBeratSisaHalaman,
      totalKosongHalaman,
      totalTampil: dataList.length,
      totalMaster: serverPagination.totalItems,
    };
  }, [dataList, serverPagination.totalItems]);

  const columns = useMemo(() => ([
    {
      name: 'No',
      width: '72px',
      cell: (row, index) => (
        <div className="flex w-full justify-center">
          <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
            {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
          </span>
        </div>
      ),
    },
    {
      name: 'Aksi',
      width: '132px',
      cell: (row) => (
        <div className="flex w-full justify-center">
          <button
            type="button"
            onClick={() => onOpenDetail?.(row, 'boning')}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
          >
            <Eye className="h-4 w-4" />
            Detail
          </button>
        </div>
      ),
    },
    {
      name: 'Nama Item',
      selector: (row) => row.name,
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div className="py-1">
          <div className="font-semibold text-slate-900">{row.name || '-'}</div>
          <div className="text-xs text-slate-500">Item potong boning</div>
        </div>
      ),
    },
    {
      name: 'Berat Masuk',
      selector: (row) => row.berat_masuk_sort ?? row.berat_masuk,
      sortable: true,
      width: '160px',
      cell: (row) => (
        <div className="flex w-full justify-center">
          <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
            {formatJumlah(row.berat_masuk)}
          </div>
        </div>
      ),
    },
    {
      name: 'Berat Keluar',
      selector: (row) => row.berat_keluar_sort ?? row.berat_keluar,
      sortable: true,
      width: '160px',
      cell: (row) => (
        <div className="flex w-full justify-center">
          <div className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
            {formatJumlah(row.berat_keluar)}
          </div>
        </div>
      ),
    },
    {
      name: 'Stok Sisa',
      selector: (row) => row.berat_sisa_sort ?? row.berat_sisa,
      sortable: true,
      width: '160px',
      cell: (row) => (
        <div className="flex w-full justify-center">
          <div
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
              Number(row.berat_sisa ?? 0) > 0
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {formatJumlah(row.berat_sisa)}
          </div>
        </div>
      ),
    },
  ]), [onOpenDetail, serverPagination.currentPage, serverPagination.perPage]);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Beef className="h-3.5 w-3.5" />
              Ringkasan Stok Boning
            </div>
            <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
              Persediaan per item potong lebih ringkas dan mudah dipantau
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Tabel ini menampilkan seluruh master item boning. Item tanpa stok tetap terlihat agar kontrol persediaan lebih mudah.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 lg:min-w-[640px]">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Item Master</span>
                <Boxes className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900">{formatNumber(summary.totalMaster)}</div>
              <p className="mt-1 text-xs text-slate-500">Total item boning terdaftar</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Berat Masuk</span>
                <Scale className="h-4 w-4 text-sky-600" />
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900">{formatJumlah(summary.totalBeratMasukHalaman)}</div>
              <p className="mt-1 text-xs text-slate-500">Akumulasi berat masuk halaman aktif</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Berat Keluar</span>
                <Scale className="h-4 w-4 text-rose-600" />
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900">{formatJumlah(summary.totalBeratKeluarHalaman)}</div>
              <p className="mt-1 text-xs text-slate-500">Akumulasi berat keluar halaman aktif</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stok Sisa</span>
                <CircleOff className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900">{formatJumlah(summary.totalBeratSisaHalaman)}</div>
              <p className="mt-1 text-xs text-slate-500">Sisa stok bersih halaman aktif</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama item boning..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {formatNumber(summary.totalTampil)} item tampil
          </div>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Data Stok By Boning</h4>
            <p className="text-xs text-slate-500">Daftar seluruh item potong boning beserta berat masuk, keluar, dan sisa stoknya</p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
            {formatNumber(serverPagination.totalItems)} item
          </span>
        </div>

        <div className="w-full overflow-x-auto bg-white" style={{ maxHeight: '60vh' }}>
          <DataTable
            columns={columns}
            data={dataList}
            pagination={false}
            customStyles={boningTableStyles}
            progressPending={loading}
            dense
            progressComponent={(
              <div className="py-12 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
                <p className="mt-2 text-sm text-gray-500">Memuat data...</p>
              </div>
            )}
            noDataComponent={(
              <div className="py-12 text-center">
                {error ? (
                  <div className="text-red-600">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-slate-700">Tidak ada data stok by boning</p>
                    <p className="mt-1 text-sm text-slate-500">Coba ubah kata kunci pencarian atau refresh data.</p>
                  </div>
                )}
              </div>
            )}
            responsive={false}
            highlightOnHover
            fixedHeader
            fixedHeaderScrollHeight="60vh"
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <span className="text-sm text-slate-700">
            Menampilkan <b>{Math.min(((serverPagination.currentPage - 1) * serverPagination.perPage) + 1, serverPagination.totalItems)}</b>
            {' - '}
            <b>{Math.min(serverPagination.currentPage * serverPagination.perPage, serverPagination.totalItems)}</b>
            {' dari '}<b>{serverPagination.totalItems}</b>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={serverPagination.perPage}
              onChange={(e) => handlePerPageChange(Number(e.target.value))}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <button type="button" onClick={() => handlePageChange(1)} disabled={serverPagination.currentPage === 1} className="rounded-xl p-2 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              </button>
              <button type="button" onClick={() => handlePageChange(serverPagination.currentPage - 1)} disabled={serverPagination.currentPage === 1} className="rounded-xl p-2 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="px-3 text-sm font-semibold text-slate-700">{serverPagination.currentPage} / {serverPagination.totalPages}</span>
              <button type="button" onClick={() => handlePageChange(serverPagination.currentPage + 1)} disabled={serverPagination.currentPage >= serverPagination.totalPages} className="rounded-xl p-2 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
              <button type="button" onClick={() => handlePageChange(serverPagination.totalPages)} disabled={serverPagination.currentPage >= serverPagination.totalPages} className="rounded-xl p-2 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
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
