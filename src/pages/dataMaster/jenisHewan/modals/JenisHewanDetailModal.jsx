import React from "react";
import { X } from "lucide-react";

const JenisHewanDetailModal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Detail Jenis Hewan</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={24} className="text-gray-600" />
          </button>
        </div>
        <div className="p-6 space-y-4">

          <div>
            <span className="block text-xs text-gray-500 mb-1">Nama Jenis Hewan</span>
            <span className="font-bold text-lg text-gray-800">{data.name}</span>
          </div>
          <div>
            <span className="block text-xs text-gray-500 mb-1">Deskripsi</span>
            <p className="text-sm text-gray-700 leading-relaxed">{data.description}</p>
          </div>
          <div>
            <span className="block text-xs text-gray-500 mb-1">Status</span>
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
              data.status === 1
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {data.status === 1 ? 'Aktif' : 'Tidak Aktif'}
            </span>
          </div>
        </div>
        <div className="flex justify-end p-4 bg-gray-50 border-t rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default JenisHewanDetailModal;