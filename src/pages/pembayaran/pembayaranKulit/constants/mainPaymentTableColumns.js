import React from 'react';
import ActionButton from '../components/ActionButton';

export const createPembayaranColumns = (
    serverPagination,
    openMenuId,
    setOpenMenuId,
    handleEdit,
    handleDelete,
    handleDetail
) => [
    {
        name: 'No',
        selector: (row, index) => index + 1,
        sortable: false,
        width: '60px',
        center: true,
        ignoreRowClick: true,
        style: {
            position: 'sticky',
            left: 0,
            zIndex: 999,
            backgroundColor: '#ffffff',
            borderRight: '2px solid #e5e7eb',
            boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
        },
        cell: (row, index) => (
            <div className="font-semibold text-gray-600 w-full flex items-center justify-center sticky-column-content">
                {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
            </div>
        )
    },
    {
        name: 'Aksi',
        width: '80px',
        center: true,
        style: {
            position: 'sticky',
            left: '60px',
            zIndex: 998,
            backgroundColor: '#ffffff',
            borderRight: '2px solid #e5e7eb',
            boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
        },
        cell: row => (
            <div className="w-full flex items-center justify-center sticky-column-content">
                <ActionButton
                    row={row}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDetail={handleDetail}
                    isActive={openMenuId === row.id}
                />
            </div>
        ),
        ignoreRowClick: true,
    },
    {
        name: 'Nota',
        selector: row => row.nota || row.id_pembelian,
        sortable: true,
        width: '150px',
        center: true,
        wrap: true,
        cell: row => (
            <div className="w-full flex items-center justify-center">
                <span className="font-mono text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700" title={row.nota || row.id_pembelian}>
                    {row.nota || row.id_pembelian || '-'}
                </span>
            </div>
        )
    },
    {
        name: 'Nota Sistem',
        selector: row => row.nota_sistem,
        sortable: true,
        width: '150px',
        center: true,
        wrap: true,
        cell: row => (
            <div className="w-full flex items-center justify-center">
                <span className="font-mono text-sm bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700" title={row.nota_sistem}>
                    {row.nota_sistem || '-'}
                </span>
            </div>
        )
    },
    {
        name: 'Tipe Pembelian',
        selector: row => row.purchase_type,
        sortable: true,
        width: '180px',
        center: true,
        wrap: true,
        cell: row => (
            <div className="w-full flex items-center justify-center">
                <span className="font-medium text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200" title={row.purchase_type}>
                    {row.purchase_type || '-'}
                </span>
            </div>
        )
    },
    {
        name: 'Tanggal Masuk',
        selector: row => row.tgl_masuk || row.created_at,
        sortable: true,
        width: '160px',
        center: true,
        wrap: true,
        cell: row => (
            <div className="w-full flex items-center justify-center">
                <span className="text-gray-900 font-medium text-sm">
                    {(row.tgl_masuk || row.created_at) ? (() => {
                        try {
                            // Handle both DD-MM-YYYY and YYYY-MM-DD formats
                            const dateStr = row.tgl_masuk || row.created_at;
                            let date;
                            if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
                                // DD-MM-YYYY format
                                const [day, month, year] = dateStr.split('-');
                                date = new Date(year, month - 1, day);
                            } else {
                                // YYYY-MM-DD format or other standard formats
                                date = new Date(dateStr);
                            }
                            return date.toLocaleDateString('id-ID');
                        } catch (e) {
                            return row.tgl_masuk || row.created_at;
                        }
                    })() : '-'}
                </span>
            </div>
        )
    },
    {
        name: 'Tanggal Jatuh Tempo',
        selector: row => row.due_date,
        sortable: true,
        width: '220px',
        center: true,
        wrap: true,
        cell: row => (
            <div className="w-full flex items-center justify-center">
                <span className="text-gray-900 font-medium text-sm">
                    {row.due_date ? (() => {
                        try {
                            // Handle both DD-MM-YYYY and YYYY-MM-DD formats
                            const dateStr = row.due_date;
                            let date;
                            if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
                                // DD-MM-YYYY format
                                const [day, month, year] = dateStr.split('-');
                                date = new Date(year, month - 1, day);
                            } else {
                                // YYYY-MM-DD format or other standard formats
                                date = new Date(dateStr);
                            }
                            return date.toLocaleDateString('id-ID');
                        } catch (e) {
                            return row.due_date;
                        }
                    })() : '-'}
                </span>
            </div>
        )
    },
    {
        name: 'Tanggal Pelunasan',
        selector: row => row.settlement_date,
        sortable: true,
        width: '200px',
        center: true,
        wrap: true,
        cell: row => (
            <div className="w-full flex items-center justify-center">
                <span className="text-gray-900 font-medium text-sm">
                    {row.settlement_date ? (() => {
                        try {
                            // Handle both DD-MM-YYYY and YYYY-MM-DD formats
                            const dateStr = row.settlement_date;
                            let date;
                            if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
                                // DD-MM-YYYY format
                                const [day, month, year] = dateStr.split('-');
                                date = new Date(year, month - 1, day);
                            } else {
                                // YYYY-MM-DD format or other standard formats
                                date = new Date(dateStr);
                            }
                            return date.toLocaleDateString('id-ID');
                        } catch (e) {
                            return row.settlement_date;
                        }
                    })() : '-'}
                </span>
            </div>
        )
    },
    {
        name: 'Status Pembayaran',
        selector: row => row.payment_status,
        sortable: true,
        width: '200px',
        center: true,
        wrap: true,
        cell: row => (
            <div className="w-full flex items-center justify-center">
                <span className={`inline-flex px-3 py-1.5 text-sm font-medium rounded-lg border ${
                    row.payment_status === 1 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                    {row.payment_status === 1 ? 'Lunas' : 'Belum Lunas'}
                </span>
            </div>
        )
    },
    {
        name: 'Dibuat',
        selector: row => row.created_at,
        sortable: true,
        width: '140px',
        center: true,
        wrap: true,
        cell: row => (
            <div className="w-full flex items-center justify-center">
                <span className="text-gray-900 font-medium text-sm">
                    {row.created_at ? (() => {
                        try {
                            // Handle both DD-MM-YYYY and YYYY-MM-DD formats
                            const dateStr = row.created_at;
                            let date;
                            if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
                                // DD-MM-YYYY format
                                const [day, month, year] = dateStr.split('-');
                                date = new Date(year, month - 1, day);
                            } else {
                                // YYYY-MM-DD format or other standard formats
                                date = new Date(dateStr);
                            }
                            return date.toLocaleDateString('id-ID');
                        } catch (e) {
                            return row.created_at;
                        }
                    })() : '-'}
                </span>
            </div>
        )
    },
    {
        name: 'Diperbarui',
        selector: row => row.updated_at,
        sortable: true,
        width: '140px',
        center: true,
        wrap: true,
        cell: row => (
            <div className="w-full flex items-center justify-center">
                <span className="text-gray-900 font-medium text-sm">
                    {row.updated_at ? (() => {
                        try {
                            // Handle both DD-MM-YYYY and YYYY-MM-DD formats
                            const dateStr = row.updated_at;
                            let date;
                            if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
                                // DD-MM-YYYY format
                                const [day, month, year] = dateStr.split('-');
                                date = new Date(year, month - 1, day);
                            } else {
                                // YYYY-MM-DD format or other standard formats
                                date = new Date(dateStr);
                            }
                            return date.toLocaleDateString('id-ID');
                        } catch (e) {
                            return row.updated_at;
                        }
                    })() : '-'}
                </span>
            </div>
        )
    },
];

export const NoDataComponent = ({ error, searchTerm, clearSearch }) => (
    <div className="text-center py-12">
        {error ? (
            <div className="text-red-600">
                <p className="text-lg font-semibold">Error</p>
                <p className="text-sm">{error}</p>
            </div>
        ) : searchTerm ? (
            <div className="text-gray-500">
                <p className="text-lg font-semibold">Tidak ada hasil untuk "{searchTerm}"</p>
                <p className="text-sm mt-2">Coba gunakan kata kunci yang berbeda</p>
                <button
                    onClick={clearSearch}
                    className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
                >
                    Clear Search
                </button>
            </div>
        ) : (
            <p className="text-gray-500 text-lg">Tidak ada data pembayaran ditemukan</p>
        )}
    </div>
);

export default createPembayaranColumns;