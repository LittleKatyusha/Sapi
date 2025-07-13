import React from 'react';
import { Tag, Package, Calendar, Activity } from 'lucide-react';
import StatusBadge from './StatusBadge';
import CardActionButton from './CardActionButton';

const CardView = ({ data, onEdit, onDelete, onDetail, openMenuId, setOpenMenuId }) => (
    <div className="space-y-6">
        {data.map(item => (
            <div key={item.id} className="group bg-white border border-gray-200 rounded-2xl p-3 sm:rounded-3xl sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-50 to-rose-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Tag className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 font-mono text-base sm:text-xl mb-1">{item.id}</p>
                                <div className="flex items-center text-gray-500">
                                    <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span className="text-xs sm:text-sm">{item.jenisHewan}</span>
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
                        <div className="flex items-center justify-between">
                            <StatusBadge status={item.status} />
                            {item.tanggalPemasangan && (
                                <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-full">
                                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                    <span className="text-xs sm:text-sm">{item.tanggalPemasangan}</span>
                                </div>
                            )}
                        </div>
                        {item.deskripsi && (
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {item.deskripsi}
                                </p>
                            </div>
                        )}
                        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
                            <div className="flex items-center text-xs text-gray-500">
                                <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span>Status: {item.status}</span>
                            </div>
                            {!item.tanggalPemasangan && (
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                                    Belum Terpasang
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default CardView;