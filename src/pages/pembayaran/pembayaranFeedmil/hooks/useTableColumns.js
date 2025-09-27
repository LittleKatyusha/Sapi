import { useMemo } from 'react';
import { createPaymentStatusBadge, createStyledCell, createBadge, createNumberCell } from '../utils/tableUtils';
import { formatDateCell } from '../utils/dateUtils';
import { COLUMN_WIDTHS } from '../constants';
import ActionButton from '../components/ActionButton';

/**
 * Custom hook for generating table columns
 * @param {Object} params - Parameters for column generation
 * @param {string|null} params.openMenuId - Currently open menu ID
 * @param {Array} params.filteredData - Filtered data array
 * @param {Function} params.setOpenMenuId - Function to set open menu ID
 * @param {Function} params.handleEdit - Edit handler function
 * @param {Function} params.handleDelete - Delete handler function
 * @param {Function} params.handleDetail - Detail handler function
 * @param {Object} params.serverPagination - Server pagination object
 * @returns {Array} Array of column definitions
 */
export const useTableColumns = ({
  openMenuId,
  filteredData,
  setOpenMenuId,
  handleEdit,
  handleDelete,
  handleDetail,
  serverPagination
}) => {
  return useMemo(() => [
    {
      name: 'No',
      selector: (row, index) => index + 1,
      sortable: false,
      width: COLUMN_WIDTHS.NO,
      center: true,
      ignoreRowClick: true,
      cell: (row, index) => createNumberCell(
        index + 1, 
        serverPagination.currentPage, 
        serverPagination.perPage, 
        index
      )
    },
    {
      name: 'Aksi',
      width: COLUMN_WIDTHS.ACTION,
      center: true,
      cell: row => createStyledCell(
        <ActionButton
          row={row}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDetail={handleDetail}
          isActive={openMenuId === row.id}
        />
      ),
      ignoreRowClick: true,
    },
    {
      name: 'Nota',
      selector: row => row.nota || row.id_pembelian,
      sortable: true,
      width: COLUMN_WIDTHS.NOTA,
      center: true,
      wrap: true,
      cell: row => createStyledCell(
        createBadge(
          row.nota || row.id_pembelian,
          'bg-gray-50',
          'text-gray-700',
          'border-gray-200',
          row.nota || row.id_pembelian
        )
      )
    },
    {
      name: 'Nota Sistem',
      selector: row => row.nota_sistem,
      sortable: true,
      width: COLUMN_WIDTHS.NOTA_SISTEM,
      center: true,
      wrap: true,
      cell: row => createStyledCell(
        createBadge(
          row.nota_sistem,
          'bg-blue-50',
          'text-blue-700',
          'border-blue-200',
          row.nota_sistem
        )
      )
    },
    {
      name: 'Tipe Pembelian',
      selector: row => row.purchase_type,
      sortable: true,
      width: COLUMN_WIDTHS.TIPE_PEMBELIAN,
      center: true,
      wrap: true,
      cell: row => createStyledCell(
        createBadge(
          row.purchase_type,
          'bg-indigo-50',
          'text-indigo-700',
          'border-indigo-200',
          row.purchase_type
        )
      )
    },
    {
      name: 'Tanggal Masuk',
      selector: row => row.tgl_masuk || row.created_at,
      sortable: true,
      width: COLUMN_WIDTHS.TANGGAL_MASUK,
      center: true,
      wrap: true,
      cell: row => createStyledCell(formatDateCell(row.tgl_masuk || row.created_at))
    },
    {
      name: 'Tanggal Jatuh Tempo',
      selector: row => row.due_date,
      sortable: true,
      width: COLUMN_WIDTHS.TANGGAL_JATUH_TEMPO,
      center: true,
      wrap: true,
      cell: row => createStyledCell(formatDateCell(row.due_date))
    },
    {
      name: 'Tanggal Pelunasan',
      selector: row => row.settlement_date,
      sortable: true,
      width: COLUMN_WIDTHS.TANGGAL_PELUNASAN,
      center: true,
      wrap: true,
      cell: row => createStyledCell(formatDateCell(row.settlement_date))
    },
    {
      name: 'Status Pembayaran',
      selector: row => row.payment_status,
      sortable: true,
      width: COLUMN_WIDTHS.STATUS_PEMBAYARAN,
      center: true,
      wrap: true,
      cell: row => createStyledCell(createPaymentStatusBadge(row.payment_status))
    },
    {
      name: 'Dibuat',
      selector: row => row.created_at,
      sortable: true,
      width: COLUMN_WIDTHS.DIBUAT,
      center: true,
      wrap: true,
      cell: row => createStyledCell(formatDateCell(row.created_at))
    },
    {
      name: 'Diperbarui',
      selector: row => row.updated_at,
      sortable: true,
      width: COLUMN_WIDTHS.DIPERBARUI,
      center: true,
      wrap: true,
      cell: row => createStyledCell(formatDateCell(row.updated_at))
    },
  ], [
    openMenuId, 
    filteredData, 
    serverPagination.currentPage, 
    serverPagination.perPage
  ]);
};
