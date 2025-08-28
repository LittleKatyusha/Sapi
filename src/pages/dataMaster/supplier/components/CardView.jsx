import React, { useMemo } from 'react';
import { Building2, FileText, Package } from 'lucide-react';
import CardActionButton from './CardActionButton';
import PaginationControls from './PaginationControls';

const CardView = ({
    data,
    onEdit,
    onDelete,
    onDetail,
    openMenuId,
    setOpenMenuId,
    loading = false,
    error = null,
    // Pagination props
    currentPage = 1,
    itemsPerPage = 12,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = [6, 12, 18, 24]
}) => {
    // Calculate pagination
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = data.slice(startIndex, endIndex);

    // Loading component
    const LoadingGrid = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: itemsPerPage }, (_, index) => (
                <div key={index} className="group bg-white border border-gray-200 rounded-2xl p-3 sm:rounded-3xl sm:p-6 shadow-lg animate-pulse">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-200 rounded-xl sm:rounded-2xl mr-3 sm:mr-4"></div>
                            <div>
                                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                        </div>
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="space-y-4">
                        <div className="h-16 bg-gray-200 rounded-2xl"></div>
                        <div className="flex items-center justify-start pt-3 border-t border-gray-100">
                            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Error component
    const ErrorDisplay = () => (
        <div className="text-center py-12">
            <div className="text-red-600">
                <p className="text-lg font-semibold">Error</p>
                <p className="text-sm">{error}</p>
            </div>
        </div>
    );

    // Empty state component
    const EmptyState = () => (
        <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Tidak ada data supplier ditemukan</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Cards Grid */}
            <div className="min-h-[400px]">
                {loading ? (
                    <LoadingGrid />
                ) : error ? (
                    <ErrorDisplay />
                ) : currentPageData.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {currentPageData.map(item => (
                            <div key={item.pubid} className="group bg-white border border-gray-200 rounded-2xl p-3 sm:rounded-3xl sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-50 to-rose-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                <Package className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-base sm:text-xl mb-1">{item.name}</p>
                                                <div className="flex items-center text-gray-500">
                                                    <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                    <span className="text-xs sm:text-sm">Supplier</span>
                                                </div>
                                            </div>
                                        </div>
                                        <CardActionButton
                                            item={item}
                                            openMenuId={openMenuId}
                                            setOpenMenuId={setOpenMenuId}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            onDetail={onDetail}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                                                                 {item.description && (
                                             <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200">
                                                 <div className="flex items-center mb-2">
                                                     <FileText className="w-4 h-4 text-gray-600 mr-2" />
                                                     <span className="text-sm font-semibold text-gray-700">Deskripsi</span>
                                                 </div>
                                                 <p className="text-sm text-gray-700 leading-relaxed">
                                                     {item.description}
                                                 </p>
                                             </div>
                                         )}
                                         
                                         {item.adress && (
                                             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200">
                                                 <div className="flex items-center mb-2">
                                                     <FileText className="w-4 h-4 text-blue-600 mr-2" />
                                                     <span className="text-sm font-semibold text-blue-700">Alamat</span>
                                                 </div>
                                                 <p className="text-sm text-blue-700 leading-relaxed">
                                                     {item.adress}
                                                 </p>
                                             </div>
                                         )}
                                        
                                        <div className="flex items-center justify-start pt-3 sm:pt-4 border-t border-gray-100">
                                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    item.status === 1
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {item.status === 1 ? 'Aktif' : 'Tidak Aktif'}
                                                </span>
                                                {item.kategori_supplier && (
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        item.kategori_supplier === '1' || item.kategori_supplier === 1 || item.kategori_supplier === 'Ternak' || item.kategori_supplier === 'TERNAK'
                                                            ? 'bg-orange-100 text-orange-800'
                                                            : item.kategori_supplier === '2' || item.kategori_supplier === 2 || item.kategori_supplier === 'Feedmil' || item.kategori_supplier === 'FEEDMIL'
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : item.kategori_supplier === '3' || item.kategori_supplier === 3 || item.kategori_supplier === 'Ovk' || item.kategori_supplier === 'OVK'
                                                            ? 'bg-indigo-100 text-indigo-800'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {item.kategori_supplier === '1' || item.kategori_supplier === 1 || item.kategori_supplier === 'Ternak' || item.kategori_supplier === 'TERNAK'
                                                            ? 'Ternak'
                                                            : item.kategori_supplier === '2' || item.kategori_supplier === 2 || item.kategori_supplier === 'Feedmil' || item.kategori_supplier === 'FEEDMIL'
                                                            ? 'Feedmil'
                                                            : item.kategori_supplier === '3' || item.kategori_supplier === 3 || item.kategori_supplier === 'Ovk' || item.kategori_supplier === 'OVK'
                                                            ? 'Ovk'
                                                            : item.kategori_supplier || '-'
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && !error && totalItems > 0 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                    onPageChange={onPageChange}
                    onItemsPerPageChange={onItemsPerPageChange}
                    itemsPerPageOptions={itemsPerPageOptions}
                    loading={loading}
                />
            )}
        </div>
    );
};

export default CardView;