import React, { useState, useEffect, useRef } from 'react';
import BaseModal from '../../../components/shared/modals/BaseModal';

export default function AddEditKlasifikasiModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  isSubmitting = false,
  errors = {},
}) {
  const [nama, setNama] = useState('');
  const [jenis, setJenis] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const namaRef = useRef();

  useEffect(() => {
    if (isOpen) {
      setNama(initialData.nama || '');
      setJenis(initialData.jenis || '');
      setFormErrors({});
      setTimeout(() => namaRef.current?.focus(), 100); // fokus input pertama
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!nama.trim()) newErrors.nama = 'Nama klasifikasi wajib diisi';
    if (!jenis.trim()) newErrors.jenis = 'Jenis hewan wajib diisi';

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    onSubmit({ ...initialData, nama, jenis });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData.id ? 'Edit Klasifikasi' : 'Tambah Klasifikasi'}
      size="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nama Klasifikasi */}
        <div>
          <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-1">
            Nama Klasifikasi
          </label>
          <input
            id="nama"
            ref={namaRef}
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg shadow-sm text-sm ${
              formErrors.nama ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-red-500 focus:outline-none`}
            placeholder="Contoh: Sapi Limousin"
          />
          {formErrors.nama && <p className="text-red-500 text-xs mt-1">{formErrors.nama}</p>}
        </div>

        {/* Jenis Hewan */}
        <div>
          <label htmlFor="jenis" className="block text-sm font-medium text-gray-700 mb-1">
            Jenis Hewan
          </label>
          <select
            id="jenis"
            value={jenis}
            onChange={(e) => setJenis(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg shadow-sm text-sm ${
              formErrors.jenis ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-red-500 focus:outline-none`}
          >
            <option value="">Pilih jenis hewan</option>
            <option value="Sapi">Sapi</option>
            <option value="Domba">Domba</option>
            <option value="Kambing">Kambing</option>
          </select>
          {formErrors.jenis && <p className="text-red-500 text-xs mt-1">{formErrors.jenis}</p>}
        </div>

        {/* Tombol Aksi */}
        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
