import React from 'react';
import { Package } from 'lucide-react';
import ActionButton from '../components/ActionButton';
import { formatCurrency, formatDate } from '../utils/formatters';

// Helper function for row number calculation
const getRowNumber = (index, pagination) => {
  return ((pagination.currentPage - 1) * pagination.perPage) + index + 1;
};

// Create table columns configuration
export const createDetailColumns = (
  pagination,
  openMenuId,
  setOpenMenuId,
  handleEditAction,
  handleDeleteAction,
  handleDetailAction
) => [
  {
    name: 'No',
    selector: (row, index) => row.rowNumber || getRowNumber(index, pagination),
    sortable: false,
    minWidth: '60px',
    maxWidth: '80px',
    center: true,
    ignoreRowClick: true,
    cell: (row, index) => (
      <div className="font-semibold text-gray-600 w-full flex items-center justify-center">
        {row.rowNumber || getRowNumber(index, pagination)}
      </div>
    )
  },
  {
    name: 'Aksi',
    width: '80px',
    center: true,
    cell: row => (
      <div className="w-full flex items-center justify-center">
        <ActionButton
          row={row}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          onEdit={handleEditAction}
          onDelete={handleDeleteAction}
          onDetail={handleDetailAction}
          isActive={openMenuId === row.id}
        />
      </div>
    ),
    ignoreRowClick: true,
  },
  {
    name: 'Jumlah Pembayaran',
    selector: row => row.amount,
    sortable: true,
    grow: 1.5,
    minWidth: '150px',
    wrap: true,
    center: true,
    cell: row => (
      <div className="w-full flex items-center justify-center">
        <span className="inline-flex px-3 py-2 text-sm font-semibold rounded-lg bg-green-100 text-green-800">
          {formatCurrency(row.amount)}
        </span>
      </div>
    )
  },
  {
    name: 'Tanggal Pembayaran',
    selector: row => row.payment_date,
    sortable: true,
    grow: 1.2,
    minWidth: '120px',
    wrap: true,
    center: true,
    cell: row => (
      <div className="w-full flex items-center justify-center">
        <span className="text-gray-900 font-medium">
          {formatDate(row.payment_date)}
        </span>
      </div>
    )
  },
  {
    name: 'Catatan',
    selector: row => row.note,
    sortable: true,
    grow: 2,
    minWidth: '200px',
    wrap: true,
    center: true,
    cell: row => (
      <div className="w-full flex items-center justify-center">
        <span className="text-gray-900 font-medium text-sm">
          {row.note || '-'}
        </span>
      </div>
    )
  },
  {
    name: 'Tanggal Dibuat',
    selector: row => row.created_at,
    sortable: true,
    grow: 1.2,
    minWidth: '120px',
    wrap: true,
    center: true,
    cell: row => (
      <div className="w-full flex items-center justify-center">
        <span className="text-gray-900 font-medium">
          {formatDate(row.created_at)}
        </span>
      </div>
    )
  }
];

// No data component for the table
export const NoDataComponent = () => (
  <div className="text-center py-12">
    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <p className="text-gray-500 text-lg">Tidak ada detail pembayaran ditemukan</p>
  </div>
);