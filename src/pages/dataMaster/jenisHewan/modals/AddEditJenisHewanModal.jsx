import React, { useState } from "react";
import { X } from "lucide-react";

const AddEditJenisHewanModal = ({ item, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState(item || {
    name: "",
    description: "",
    order_no: "",
    status: 1
  });
  const isEditMode = !!item;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-xl font-bold text-gray-800">
              {isEditMode ? "Edit Jenis Hewan" : "Tambah Jenis Hewan"}
            </h3>
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X size={24} className="text-gray-600" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Jenis Hewan
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="Contoh: Sapi"
                maxLength="200"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field w-full h-24 resize-none"
                placeholder="Deskripsi jenis hewan..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No
              </label>
              <input
                type="number"
                name="order_no"
                value={formData.order_no}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="Nomor jenis hewan"
                min="1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field w-full"
                required
              >
                <option value={1}>Aktif</option>
                <option value={0}>Tidak Aktif</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end p-4 bg-gray-50 border-t rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-75 w-36 text-center"
            >
              {loading ? "Menyimpan..." : isEditMode ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditJenisHewanModal;