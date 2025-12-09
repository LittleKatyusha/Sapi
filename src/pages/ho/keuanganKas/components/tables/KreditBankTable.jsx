import React, { useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Search, CreditCard, PlusCircle } from 'lucide-react';
import ActionButton from '../ActionButton';

const KreditBankTable = ({
    data,
    openMenuId,
    setOpenMenuId,
    handleEdit,
    handleDelete,
    handleDetail,
    handleAdd
}) => {
    // Custom table styles for KreditBankTable
    const kreditBankTableStyles = {
        table: {
            style: {
                backgroundColor: '#fff',
                borderRadius: '0px',
                width: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'separate',
                borderSpacing: 0,
            }
        },
        tableWrapper: {
            style: {
                overflowX: 'auto',
                overflowY: 'visible',
                width: '100%',
                border: 'none',
                borderRadius: '0',
            }
        },
        headRow: {
            style: {
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                backgroundColor: '#f8fafc',
                borderBottom: '2px solid #e2e8f0',
                minHeight: '52px',
            }
        },
        headCells: {
            style: {
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                padding: '12px 16px',
                textAlign: 'center',
                justifyContent: 'center',
                borderRight: '1px solid #e5e7eb',
                '&:last-child': {
                    borderRight: 'none',
                },
            }
        },
        rows: {
            style: {
                minHeight: '48px',
                borderBottom: '1px solid #f3f4f6',
                '&:hover': {
                    backgroundColor: '#f9fafb',
                },
            }
        },
        cells: {
            style: {
                padding: '12px 16px',
                fontSize: '13px',
                color: '#374151',
                textAlign: 'center',
                justifyContent: 'center',
                borderRight: '1px solid #f3f4f6',
                '&:last-child': {
                    borderRight: 'none',
                },
            }
        }
    };

    const columns = useMemo(() => [
        {
            name: 'NO URUT',
            selector: (row, index) => index + 1,
            sortable: false,
            width: '90px',
            center: true,
            cell: (row, index) => (
                <div className="font-semibold text-gray-600">
                    {index + 1}
                </div>
            )
        },
        {
            name: 'PILIH',
            width: '90px',
            center: true,
            cell: row => (
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
        },
        {
            name: 'KREDIT',
            selector: row => row.kredit,
            sortable: true,
            width: '160px',
            center: true,
            wrap: true,
            cell: row => (
                <div className="font-semibold text-green-600">
                    {row.kredit ? new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                    }).format(row.kredit) : '-'}
                </div>
            )
        },
        {
            name: 'TANGGAL KREDIT',
            selector: row => row.tgl_kredit,
            sortable: true,
            grow: 1,
            center: true,
            wrap: true,
            cell: row => (
                <div className="font-medium text-gray-800">
                    {row.tgl_kredit ? new Date(row.tgl_kredit).toLocaleDateString('id-ID') : '-'}
                </div>
            )
        },
        {
            name: 'KREDIT BANK',
            selector: row => row.kredit_bank,
            sortable: true,
            grow: 1,
            center: true,
            wrap: true,
            cell: row => (
                <div className="font-medium text-blue-600">
                    {row.kredit_bank || '-'}
                </div>
            )
        },
        {
            name: 'DEPOSITOR',
            selector: row => row.depositor,
            sortable: true,
            grow: 1,
            center: true,
            wrap: true,
            cell: row => (
                <div className="font-medium text-gray-800">
                    {row.depositor || '-'}
                </div>
            )
        },
        {
            name: 'BUKTI SETOR',
            selector: row => row.bukti_setor,
            sortable: true,
            grow: 1,
            center: true,
            wrap: true,
            cell: row => (
                <div className="font-medium text-gray-800">
                    {row.bukti_setor || '-'}
                </div>
            )
        },
    ], [openMenuId, handleEdit, handleDelete, handleDetail, setOpenMenuId]);

    return (
        <>
            <div className="bg-white rounded-none p-4 sm:p-6 shadow-lg border border-gray-100">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari data kredit bank..."
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 relative overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Data kas sudah ter setor</h3>
                    <button
                        onClick={handleAdd}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Tambah Data
                    </button>
                </div>

                {/* Scroll Indicator */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18"></path>
                        </svg>
                        Scroll horizontal untuk melihat semua kolom
                        <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m0-4H3"></path>
                        </svg>
                    </div>
                    <div className="text-xs text-gray-500">
                        {data.length} item{data.length !== 1 ? 's' : ''}
                    </div>
                </div>
                
                <div className="w-full overflow-x-auto max-w-full table-scroll-container" style={{maxHeight: '60vh'}}>
                    <div className="min-w-full">
                        <DataTable
                            columns={columns}
                            data={data}
                            pagination={false}
                            customStyles={kreditBankTableStyles}
                            noDataComponent={
                                <div className="text-center py-12">
                                    <div className="mb-4">
                                        <CreditCard size={64} className="text-gray-300 mx-auto" />
                                    </div>
                                    <p className="text-gray-500 text-lg">Tidak ada data kas sudah ter setor</p>
                                </div>
                            }
                            highlightOnHover
                            pointerOnHover
                        />
                    </div>
                </div>
                
                <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                        Menampilkan 1 - {data.length} dari {data.length}
                    </span>
                    <div className="flex gap-2">
                        <select
                            value={10}
                            className="border rounded px-2 py-1"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <button
                            disabled
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <span className="px-3 py-1">1 / 1</span>
                        <button
                            disabled
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default KreditBankTable;