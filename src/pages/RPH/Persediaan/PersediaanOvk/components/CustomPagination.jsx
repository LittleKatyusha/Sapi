import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const CustomPagination = ({ rowsPerPage, rowCount, onChangePage, onChangeRowsPerPage, currentPage }) => {
    const totalPages = Math.ceil(rowCount / rowsPerPage) || 1;
    const startRow = rowCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endRow = Math.min(currentPage * rowsPerPage, rowCount);

    const handleBackButtonClick = () => {
        onChangePage(currentPage - 1);
    };

    const handleNextButtonClick = () => {
        onChangePage(currentPage + 1);
    };

    const handleFirstPageButtonClick = () => {
        onChangePage(1);
    };

    const handleLastPageButtonClick = () => {
        onChangePage(totalPages);
    };

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-emerald-100">
            <div className="text-sm text-gray-700">
                Menampilkan {startRow} sampai {endRow} dari {rowCount} hasil
            </div>
            <div className="flex items-center gap-x-6">
                <div className="flex items-center gap-x-2">
                    <span className="text-sm text-gray-700">Rows per page:</span>
                    <select
                        value={rowsPerPage}
                        onChange={e => onChangeRowsPerPage(Number(e.target.value))}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                        {[10, 25, 50, 100].map(size => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-x-4">
                    <button
                        onClick={handleFirstPageButtonClick}
                        disabled={currentPage === 1}
                        aria-label="Go to first page"
                        className="p-1 text-gray-500 rounded-md hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronsLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleBackButtonClick}
                        disabled={currentPage === 1}
                        aria-label="Go to previous page"
                        className="p-1 text-gray-500 rounded-md hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-700">
                        {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={handleNextButtonClick}
                        disabled={currentPage === totalPages}
                        aria-label="Go to next page"
                        className="p-1 text-gray-500 rounded-md hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleLastPageButtonClick}
                        disabled={currentPage === totalPages}
                        aria-label="Go to last page"
                        className="p-1 text-gray-500 rounded-md hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronsRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(CustomPagination);
