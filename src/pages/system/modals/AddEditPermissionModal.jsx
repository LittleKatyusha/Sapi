import React, { useState } from 'react';
import { X } from 'lucide-react';

const AddEditPermissionModal = ({ isOpen, onClose, onSave, editData, loading }) => {
  const [formData, setFormData] = useState(() => editData || {
    serviceName: '',
    value: '',
    functionName: '',
    method: ''
  });

  React.useEffect(() => {
    setFormData(editData || {
      serviceName: '',
      value: '',
      functionName: '',
      method: ''
    });
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-red-600"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {editData ? 'Edit Permission' : 'Tambah Permission'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Service Name</label>
            <input
              name="serviceName"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              value={formData.serviceName}
              onChange={handleChange}
              placeholder="contoh: parameter"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Value</label>
            <input
              name="value"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              value={formData.value}
              onChange={handleChange}
              placeholder="contoh: data"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Function Name</label>
            <input
              name="functionName"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              value={formData.functionName}
              onChange={handleChange}
              placeholder="contoh: getData"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Method</label>
            <select
              name="method"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              value={formData.method}
              onChange={handleChange}
            >
              <option value="">Pilih Method</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : (editData ? 'Update' : 'Simpan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditPermissionModal; 