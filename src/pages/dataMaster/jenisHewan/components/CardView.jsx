import React from "react";
import ActionButton from "./ActionButton";

const CardView = ({ data, onEdit, onDelete, onDetail, openMenuId, setOpenMenuId }) => (
  <div className="space-y-4">
    {data.map(item => (
      <div key={item.pubid} className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-800">{item.name}</h3>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                item.status === 1
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {item.status === 1 ? 'Aktif' : 'Tidak Aktif'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">No: {item.order_no}</span>
            </div>
          </div>
          <div className="ml-2">
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
      </div>
    ))}
  </div>
);

export default CardView;