import React, { useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import styled, { StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import customTableStyles from '../../constants/tableStyles';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PENJUALAN_ROUTES } from '../../constants/routes';
import PenjualanService from '../../../../../services/penjualanService';
import ActionButton from '../ActionButton';
import DeleteConfirmationModal from '../../modals/DeleteConfirmationModal';
import PrintPenjualanModal from '../../modals/PrintPenjualanModal';

// Styled components
const TableWrapper = styled.div`
    .rdt_Table {
        min-width: 1400px;
    }
    
    .rdt_TableHead {
        position: sticky;
        top: 0;
        z-index: 10;
    }
    
    .rdt_TableBody {
        overflow: visible;
    }
`;

const SearchContainer = styled.div`
    position: relative;
    width: 100%;
    max-width: 400px;
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 10px 40px 10px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 14px;
    transition: all 0.2s ease;
    
    &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    &::placeholder {
        color: #94a3b8;
    }
`;

const SearchIcon = styled.div`
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    cursor: ${props => props.$clickable ? 'pointer' : 'default'};
    
    &:hover {
        color: ${props => props.$clickable ? '#64748b' : '#94a3b8'};
    }
`;

const PaginationContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    flex-wrap: wrap;
    gap: 16px;
`;

const PaginationInfo = styled.div`
    font-size: 14px;
    color: #64748b;
`;

const PaginationControls = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const PageButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid ${props => props.$active ? '#3b82f6' : '#e2e8f0'};
    background: ${props => props.$active ? '#3b82f6' : 'white'};
    color: ${props => props.$active ? 'white' : '#64748b'};
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover:not(:disabled) {
        border-color: #3b82f6;
        color: ${props => props.$active ? 'white' : '#3b82f6'};
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const PerPageSelect = styled.select`
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    color: #64748b;
    background: white;
    cursor: pointer;
    
    &:focus {
        outline: none;
        border-color: #3b82f6;
    }
`;

const PenjualanBahanBakuTable = ({
    data = [],
    loading = false,
    error = null,
    searchTerm = '',
    isSearching = false,
    searchError = null,
    serverPagination = {},
    handleSearch,
    clearSearch,
    handleServerPageChange,
    handleServerPerPageChange,
    setNotification
}) => {
    const navigate = useNavigate();
    const searchInputRef = useRef(null);
    const tableWrapperRef = useRef(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Print/download modal state
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printRow, setPrintRow] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // Handle download action - open print modal
    const handleDownload = useCallback((row) => {
        setPrintRow(row);
        setIsPrintModalOpen(true);
    }, []);

    // Handle print/download submit from modal
    const handlePrintDownload = useCallback(async ({ reportType, petugas, id }) => {
        setIsDownloading(true);
        try {
            let blob;
            if (reportType === 'surat-jalan') {
                blob = await PenjualanService.downloadSuratJalan(id, petugas);
            } else if (reportType === 'serah-terima') {
                blob = await PenjualanService.downloadSerahTerimaBarang(id, petugas);
            } else {
                blob = await PenjualanService.downloadKwitansi(id, petugas);
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const faktur = printRow?.nomor_faktur || 'penjualan';
            link.download = `${reportType}_${faktur}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setIsPrintModalOpen(false);
            setPrintRow(null);

            if (setNotification) {
                setNotification({ type: 'success', message: 'Dokumen berhasil diunduh' });
            }
        } catch (error) {
            if (setNotification) {
                setNotification({ type: 'error', message: error.message || 'Gagal mengunduh dokumen' });
            }
        } finally {
            setIsDownloading(false);
        }
    }, [printRow, setNotification]);

    // Handle edit action
    const handleEdit = useCallback((row) => {
        const id = row.id || row.pid;
        navigate(PENJUALAN_ROUTES.EDIT(id));
    }, [navigate]);

    // Handle delete action - open confirmation modal
    const handleDelete = useCallback((row) => {
        setSelectedItem(row);
        setIsDeleteModalOpen(true);
    }, []);

    // Confirm delete
    const handleConfirmDelete = useCallback(async () => {
        if (!selectedItem) return;

        const pid = selectedItem.pubid || selectedItem.pid;
        setIsDeleting(true);

        try {
            await PenjualanService.deletePenjualan(pid);

            if (setNotification) {
                setNotification({
                    type: 'success',
                    message: `Data penjualan "${selectedItem.nomor_faktur || ''}" berhasil dihapus`
                });
            }

            setIsDeleteModalOpen(false);
            setSelectedItem(null);

            // Refresh current page data
            if (handleServerPageChange) {
                handleServerPageChange(serverPagination.currentPage || 1);
            }
        } catch (error) {
            if (setNotification) {
                setNotification({
                    type: 'error',
                    message: error.message || 'Gagal menghapus data penjualan'
                });
            }
        } finally {
            setIsDeleting(false);
        }
    }, [selectedItem, setNotification, handleServerPageChange, serverPagination.currentPage]);

    // Table columns
    const columns = useMemo(() => [
        {
            name: 'No',
            selector: (row, index) => {
                const startIndex = ((serverPagination.currentPage || 1) - 1) * (serverPagination.perPage || 10);
                return startIndex + index + 1;
            },
            width: '70px',
            center: true,
        },
        {
            name: 'Aksi',
            cell: (row) => (
                <ActionButton
                    row={row}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onDownload={handleDownload}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isActive={openMenuId === (row.id || row.pid)}
                />
            ),
            width: '80px',
            center: true,
        },
        {
            name: 'Tanggal Penjualan',
            selector: row => formatDate(row.tgl_penjualan),
            sortable: true,
            width: '190px',
            center: true,
        },
        {
            name: 'Nomor Faktur',
            selector: row => row.nomor_faktur,
            sortable: true,
            width: '200px',
            center: true,
        },
        {
            name: 'Nama Produk',
            selector: row => row.nama_produk || '-',
            sortable: true,
            width: '200px',
            center: true,
        },
        {
            name: 'Jumlah',
            selector: row => row.total_jumlah,
            sortable: true,
            width: '120px',
            center: true,
        },
        {
            name: 'Harga Total',
            selector: row => formatCurrency(row.harga_total),
            sortable: true,
            width: '160px',
            center: true,
        },
        {
            name: 'Keterangan',
            selector: row => row.keterangan || '-',
            sortable: false,
            width: '250px',
            center: true,
        },
        {
            name: 'Sopir',
            selector: row => row.nama_supir || '-',
            sortable: true,
            width: '150px',
            center: true,
        },
        {
            name: 'Nama Penerima',
            selector: row => row.nama_penerima || '-',
            sortable: true,
            width: '170px',
            center: true,
        },
        {
            name: 'Plat Nomor',
            selector: row => row.plat_nomor || '-',
            sortable: true,
            width: '160px',
            center: true,
        },
    ], [serverPagination.currentPage, serverPagination.perPage, openMenuId, handleEdit, handleDelete]);

    // Handle search input change
    const handleSearchChange = (e) => {
        const value = e.target.value;
        if (handleSearch) {
            handleSearch(value);
        }
    };

    // Handle clear search
    const handleClearSearch = () => {
        if (clearSearch) {
            clearSearch();
        }
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    // Custom pagination component
    const CustomPagination = () => {
        const { currentPage = 1, perPage = 10, totalRows = 0, totalPages = 0 } = serverPagination;
        const startRow = totalRows === 0 ? 0 : (currentPage - 1) * perPage + 1;
        const endRow = Math.min(currentPage * perPage, totalRows);

        const getPageNumbers = () => {
            const pages = [];
            const maxVisiblePages = 5;
            
            if (totalPages <= maxVisiblePages) {
                for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                if (currentPage <= 3) {
                    for (let i = 1; i <= 4; i++) {
                        pages.push(i);
                    }
                    pages.push('...');
                    pages.push(totalPages);
                } else if (currentPage >= totalPages - 2) {
                    pages.push(1);
                    pages.push('...');
                    for (let i = totalPages - 3; i <= totalPages; i++) {
                        pages.push(i);
                    }
                } else {
                    pages.push(1);
                    pages.push('...');
                    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                        pages.push(i);
                    }
                    pages.push('...');
                    pages.push(totalPages);
                }
            }
            
            return pages;
        };

        return (
            <PaginationContainer>
                <PaginationInfo>
                    Menampilkan {startRow} - {endRow} dari {totalRows} data
                </PaginationInfo>
                
                <PaginationControls>
                    <PerPageSelect
                        value={perPage}
                        onChange={(e) => handleServerPerPageChange && handleServerPerPageChange(Number(e.target.value))}
                    >
                        <option value={10}>10 per halaman</option>
                        <option value={25}>25 per halaman</option>
                        <option value={50}>50 per halaman</option>
                        <option value={100}>100 per halaman</option>
                    </PerPageSelect>
                    
                    <PageButton
                        onClick={() => handleServerPageChange && handleServerPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft size={18} />
                    </PageButton>
                    
                    {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                            <span key={`ellipsis-${index}`} style={{ padding: '0 8px', color: '#64748b' }}>...</span>
                        ) : (
                            <PageButton
                                key={page}
                                $active={page === currentPage}
                                onClick={() => handleServerPageChange && handleServerPageChange(page)}
                            >
                                {page}
                            </PageButton>
                        )
                    ))}
                    
                    <PageButton
                        onClick={() => handleServerPageChange && handleServerPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        <ChevronRight size={18} />
                    </PageButton>
                </PaginationControls>
            </PaginationContainer>
        );
    };

    // Loading component
    const LoadingComponent = () => (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    // No data component
    const NoDataComponent = () => (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">Tidak ada data penjualan bahan baku</p>
            <p className="text-sm text-gray-400 mt-1">Data akan muncul setelah ada transaksi penjualan</p>
        </div>
    );

    return (
        <StyleSheetManager shouldForwardProp={prop => isPropValid(prop)}>
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <SearchContainer>
                        <SearchInput
                            ref={searchInputRef}
                            type="text"
                            placeholder="Cari faktur, bahan baku, sopir..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                        <SearchIcon 
                            $clickable={!!searchTerm}
                            onClick={searchTerm ? handleClearSearch : undefined}
                        >
                            {searchTerm ? <X size={18} /> : <Search size={18} />}
                        </SearchIcon>
                    </SearchContainer>
                </div>

                {/* Error Message */}
                {(error || searchError) && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error || searchError}
                    </div>
                )}

                {/* Table */}
                <TableWrapper ref={tableWrapperRef}>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <DataTable
                            columns={columns}
                            data={data}
                            customStyles={customTableStyles}
                            progressPending={loading || isSearching}
                            progressComponent={<LoadingComponent />}
                            noDataComponent={<NoDataComponent />}
                            highlightOnHover
                            responsive
                            dense={false}
                        />
                        <CustomPagination />
                    </div>
                </TableWrapper>

                {/* Delete Confirmation Modal */}
                <DeleteConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => {
                        if (!isDeleting) {
                            setIsDeleteModalOpen(false);
                            setSelectedItem(null);
                        }
                    }}
                    onConfirm={handleConfirmDelete}
                    itemName={selectedItem?.nomor_faktur || ''}
                    isDeleting={isDeleting}
                />

                {/* Print/Download Modal */}
                <PrintPenjualanModal
                    isOpen={isPrintModalOpen}
                    onClose={() => {
                        if (!isDownloading) {
                            setIsPrintModalOpen(false);
                            setPrintRow(null);
                        }
                    }}
                    onDownload={handlePrintDownload}
                    data={printRow}
                    isDownloading={isDownloading}
                />
            </div>
        </StyleSheetManager>
    );
};

export default PenjualanBahanBakuTable;