import React from 'react';
import { Edit, Trash2, Eye, FileText } from 'lucide-react';
import ActionButton from './ActionButton';

const CardView = ({ 
  data, 
  onEdit, 
  onDelete, 
  onDetail, 
  openMenuId, 
  setOpenMenuId 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Tidak ada data
        </h3>
        <p className="text-gray-500">
          Belum ada barang yang ditambahkan.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {data.map((item) => (
        <div
          key={item.pid || item.pubid}
          className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
        >
          {/* Card Header */}
          <div className="p-4 pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-lg">
                  {item.name}
                </h3>
              </div>
              
              {/* Action Menu */}
              <div className="relative">
                <ActionButton
                  item={item}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDetail={onDetail}
                  isOpen={openMenuId === (item.pid || item.pubid)}
                  onToggle={() => setOpenMenuId(
                    openMenuId === (item.pid || item.pubid) 
                      ? null 
                      : (item.pid || item.pubid)
                  )}
                />
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="px-4 pb-4">
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
              {item.description}
            </p>
          </div>

          {/* Card Footer - Quick Actions */}
          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onDetail(item)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="Lihat Detail"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onEdit(item)}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(item)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardView;