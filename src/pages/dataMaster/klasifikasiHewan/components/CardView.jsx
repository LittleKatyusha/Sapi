import React from "react";
import ActionButton from "./ActionButton";

const CardView = ({ data, onEdit, onDelete, onDetail, openMenuId, setOpenMenuId }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
    {data.map(item => (
      <div key={item.pubid} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
        {/* Header Card */}
        <div className={`h-2 ${
          item.jenis === 'Sapi' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
          item.jenis === 'Domba' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
          item.jenis === 'Kambing' ? 'bg-gradient-to-r from-orange-500 to-amber-600' :
          'bg-gradient-to-r from-gray-500 to-gray-600'
        }`}></div>
        
        <div className="p-5">
          {/* Title and Status */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">{item.name}</h3>

            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                item.status === 1
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {item.status === 1 ? 'Aktif' : 'Tidak Aktif'}
              </span>
              <ActionButton
                row={item}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                onEdit={onEdit}
                onDelete={onDelete}
                onDetail={onDetail}
              />
            </div>
          </div>
          
          {/* Jenis Hewan Badge */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Jenis Hewan:</span>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm ${
                item.jenis === 'Sapi' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                item.jenis === 'Domba' ? 'bg-green-50 text-green-700 border border-green-200' :
                item.jenis === 'Kambing' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                'bg-gray-50 text-gray-700 border border-gray-200'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  item.jenis === 'Sapi' ? 'bg-blue-500' :
                  item.jenis === 'Domba' ? 'bg-green-500' :
                  item.jenis === 'Kambing' ? 'bg-orange-500' :
                  'bg-gray-500'
                }`}></div>
                {item.jenis}
              </span>
            </div>
          </div>
          
          {/* Description */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {item.description}
            </p>
          </div>
          
          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <button
              onClick={() => onDetail(item)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
            >
              Lihat Detail →
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(item)}
                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium rounded-lg transition-colors duration-200"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(item)}
                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-lg transition-colors duration-200"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default CardView;