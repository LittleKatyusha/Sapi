import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Save, AlertTriangle } from 'lucide-react';
import OpnameStokService from '../../../../services/opnameStokService';

const OpnameStokModal = ({ isOpen, onClose, onSaved, tipeStok, selectedItem }) => {
  const [formData, setFormData] = useState({
    id_item: '',
    item_name: '',
    tipe_opname: 'PENAMBAHAN',
    jumlah: '',
    satuan: 'kg',
    tanggal_opname: new Date().toISOString().split('T')[0],
    alasan: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && selectedItem) {
      setFormData({
        id_item: selectedItem.ID_ITEM || selectedItem.id_item || selectedItem.id_item_ovk || selectedItem.id_satuan || '',
        item_name: selectedItem.NAME || selectedItem.item_name || selectedItem.nama_item || selectedItem.produk || '',
        tipe_opname: 'PENAMBAHAN',
        jumlah: '',
        satuan: tipeStok === 'FEEDMIL' ? 'kg' : 'pcs',
        tanggal_opname: new Date().toISOString().split('T')[0],
        alasan: '',
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, selectedItem, tipeStok]);

  // Debug log untuk melihat data yang masuk
  useEffect(() => {
    if (isOpen && selectedItem) {
      console.log('OpnameModal - selectedItem:', selectedItem);
      console.log('OpnameModal - tipeStok:', tipeStok);
    }
  }, [isOpen, selectedItem, tipeStok]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Debug log
      console.log('Submitting opname:', { tipeStok, selectedItem, formData });

      // For OVK, prioritize id_satuan (HO stok table), then id_item_ovk (RPH stok table)
      if (tipeStok === 'OVK') {
        if (!selectedItem?.id_satuan && !selectedItem?.id_item_ovk && !selectedItem?.id_item) {
          setError('Data item OVK tidak memiliki ID yang valid.');
          setLoading(false);
          return;
        }
      }

      // Map field names based on tipeStok
      const payload = {
        ...formData,
        jumlah: parseFloat(formData.jumlah),
      };

      // For OVK, use id_satuan (HO) or id_item_ovk (RPH) as the item identifier
      if (tipeStok === 'OVK') {
        payload.id_item = selectedItem?.id_satuan || selectedItem?.id_item_ovk || selectedItem?.id_item || formData.id_item;
      }

      console.log('Final payload:', payload);

      let response;
      if (tipeStok === 'FEEDMIL') {
        response = await OpnameStokService.storeFeedmil(payload);
      } else {
        response = await OpnameStokService.storeOvk(payload);
      }

      if (response?.status === 'ok') {
        setSuccess(true);
        await onSaved?.();
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
      } else {
        setError(response?.message || 'Gagal menyimpan opname');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Gagal menyimpan opname');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Opname Stok {tipeStok === 'FEEDMIL' ? 'Feedmil' : 'OVK'}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              Opname berhasil disimpan
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item
            </label>
            <input
              type="text"
              value={formData.item_name}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Opname
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipe_opname"
                  value="PENAMBAHAN"
                  checked={formData.tipe_opname === 'PENAMBAHAN'}
                  onChange={(e) => setFormData({ ...formData, tipe_opname: e.target.value })}
                  className="text-emerald-600"
                />
                <span className="flex items-center gap-1 text-sm">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  Penambahan
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipe_opname"
                  value="PENGURANGAN"
                  checked={formData.tipe_opname === 'PENGURANGAN'}
                  onChange={(e) => setFormData({ ...formData, tipe_opname: e.target.value })}
                  className="text-red-600"
                />
                <span className="flex items-center gap-1 text-sm">
                  <Minus className="w-4 h-4 text-red-600" />
                  Pengurangan
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              required
              value={formData.jumlah}
              onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Masukkan jumlah penyesuaian"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Satuan
            </label>
            <input
              type="text"
              value={formData.satuan}
              onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Opname
            </label>
            <input
              type="date"
              required
              value={formData.tanggal_opname}
              onChange={(e) => setFormData({ ...formData, tanggal_opname: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alasan (opsional)
            </label>
            <textarea
              value={formData.alasan}
              onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Misal: Stok rusak, selisih hitung, dll"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Menyimpan...'
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OpnameStokModal;
