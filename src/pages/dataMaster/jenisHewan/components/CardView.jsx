import React from "react";
import { MoreVertical } from "lucide-react";
import ActionMenu from "./ActionMenu";

const CardView = ({ data, onEdit, onDelete, openMenuId, setOpenMenuId }) => (
  <div className="space-y-4">
    {data.map(item => (
      <div key={item.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex justify-between items-start">
          <p className="font-semibold text-gray-800">{item.name}</p>
          <div className="relative">
            <button
              onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
              className="p-2 text-gray-500 hover:bg-gray-200 rounded-full"
            >
              <MoreVertical size={18} />
            </button>
            {openMenuId === item.id && (
              <ActionMenu
                row={item}
                onEdit={onEdit}
                onDelete={onDelete}
                onClose={() => setOpenMenuId(null)}
              />
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 font-mono mt-1">{item.id}</p>
      </div>
    ))}
  </div>
);

export default CardView;