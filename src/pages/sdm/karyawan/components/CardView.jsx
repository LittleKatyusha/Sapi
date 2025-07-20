import React from 'react';
import { Users, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import CardActionButton from './CardActionButton';
import PaginationControls from './PaginationControls';

const CardView = ({
    data,
    onEdit,
    onDelete,
    onDetail,
    onResetPassword,
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
            <p className="text-gray-500 text-lg">Tidak ada data karyawan ditemukan</p>
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
                                                <Users className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-base sm:text-xl mb-1">{item.name}</p>
                                                <div className="flex items-center text-gray-500">
                                                    <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                    <span className="text-xs sm:text-sm">{item.employee_id}</span>
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
                                            onResetPassword={onResetPassword}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        {/* NIK */}
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200">
                                            <div className="flex items-center">
                                                <Building2 className="w-4 h-4 text-blue-600 mr-2" />
                                                <span className="text-sm font-semibold text-gray-700 mr-2">NIK:</span>
                                                <span className="text-sm text-gray-700 font-medium">{item.employee_id}</span>
                                            </div>
                                        </div>

                                        {/* Contact Info */}
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-200">
                                            <div className="space-y-2">
                                                <div className="flex items-center">
                                                    <Phone className="w-4 h-4 text-green-600 mr-2" />
                                                    <span className="text-sm text-gray-700">{item.phone}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Mail className="w-4 h-4 text-green-600 mr-2" />
                                                    <span className="text-sm text-gray-700">{item.email}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Address */}
                                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200">
                                            <div className="flex items-start">
                                                <MapPin className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <span className="text-sm font-semibold text-gray-700">Alamat:</span>
                                                    <p className="text-sm text-gray-700 leading-relaxed mt-1">
                                                        {item.address}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Role/Group */}
                                        {item.department && (
                                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-2xl border border-purple-200">
                                                <div className="flex items-center">
                                                    <Building2 className="w-4 h-4 text-purple-600 mr-2" />
                                                    <span className="text-sm font-semibold text-gray-700 mr-2">Role:</span>
                                                    <span className="text-sm text-gray-700 font-medium">{item.department}</span>
                                                </div>
                                            </div>
                                        )}
                                        
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