import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Loader, Truck, Plus, Trash2 } from 'lucide-react';
import perpindahanTernakService from '../../../services/perpindahanTernakService';
import systemService from '../../../services/systemService';

const AddEditPerpindahanTernakModal = ({ isOpen, onClose, onSuccess, editMode, selectedPid }) => {
  const [loading, setLoading] = useState(false);
  const [loadingSapi, setLoadingSapi] = useState(false);
  const [error, setError] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    tanggal_perpindahan: new Date().toISOString().split('T')[0],
    id_lokasi_tujuan: '',
    id_alasan: '',
    armada_pengiriman: '',
    plat_nomor: '',
    sopir: '',
    biaya_kirim: '',
    keterangan: '',
  });

  // Ternak list (batch)
  const [ternakList, setTernakList] = useState([]);
  const [selectedTernak, setSelectedTernak] = useState([]);

  // Master data
  const [lokasiOptions, setLokasiOptions] = useState([]);
  const [alasanOptions, setAlasanOptions] = useState([]);
  const [sapiOptions, setSapiOptions] = useState([]);

  // Load master data
  useEffect(() => {
    if (isOpen) {
      loadMasterData();
      loadSapiList();
      if (editMode && selectedPid) {
        loadDetailData();
      }
    }
  }, [isOpen, editMode, selectedPid]);

  const loadMasterData = async () => {
    try {
      const [lokasiRes, alasanRes] = await Promise.all([
        systemService.getOffice(),
        systemService.getParameterByGroup('ALASAN_PERPINDAHAN'),
      ]);

      if (lokasiRes.success) {
        setLokasiOptions(lokasiRes.data || []);
      }

      if (alasanRes.success) {
        setAlasanOptions(alasanRes.data || []);
      }
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  };

  const loadSapiList = async () => {
    setLoadingSapi(true);
    try {
      const response = await perpindahanTernakService.getSapiList();
      if (response.success) {
        setSapiOptions(response.data || []);
      }
    } catch (err) {
      console.error('Error loading sapi list:', err);
    } finally {
      setLoadingSapi(false);
    }
  };

  const loadDetailData = async () => {
    setLoading(true);
    try {
      const response = await perpindahanTernakService.show(selectedPid);
      if (response.success) {
        const { header, details } = response.data;
        
        setFormData({
          tanggal_perpindahan: header.tanggal_perpindahan,
          id_lokasi_tujuan: header.id_lokasi_tujuan,
          id_alasan: header.id_alasan,
          armada_pengiriman: header.armada_pengiriman || '',
          plat_nomor: header.plat_nomor || '',
          sopir: header.sopir || '',
          biaya_kirim: header.biaya_kirim || '',
          keterangan: header.keterangan || '',
        });

        setSelectedTernak(
          details.map((d) => ({
            pid: d.pid_sapi,
            eartag: d.eartag,
            jenis_ternak: d.jenis_ternak,
            klasifikasi: d.klasifikasi,
            bobot: d.bobot,
            keterangan: d.keterangan || '',
          }))
        );
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTernak = (sapi) => {
    if (selectedTernak.find((t) => t.pid === sapi.pid)) {
      alert('Sapi sudah ditambahkan');
      return;
    }

    setSelectedTernak((prev) => [
      ...prev,
      {
        pid: sapi.pid,
        eartag: sapi.eartag,
        jenis_ternak: sapi.jenis_ternak,
        klasifikasi: sapi.klasifikasi,
        bobot: sapi.bobot || 0,
        keterangan: '',
      },
    ]);
  };

  const handleRemoveTernak = (pid) => {
    setSelectedTernak((prev) => prev.filter((t) => t.pid !== pid));
  };

  const handleTernakBobotChange = (pid, bobot) => {
    setSelectedTernak((prev) =>
      prev.map((t) => (t.pid === pid ? { ...t, bobot: parseFloat(bobot) || 0 } : t))
    );
  };

  const handleTernakKeteranganChange = (pid, keterangan) => {
    setSelectedTernak((prev) =>
      prev.map((t) => (t.pid === pid ? { ...t, keterangan } : t))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (selectedTernak.length === 0) {
      setError('Pilih minimal 1 ternak untuk dipindahkan');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        ternak: selectedTernak.map((t) => ({
          pid: t.pid,
          bobot: t.bobot,
          keterangan: t.keterangan,
        })),
      };

      const response = editMode
        ? await perpindahanTernakService.update(selectedPid, payload)
        : await perpindahanTernakService.store(payload);

      if (response.success) {
        alert(response.message);
        onSuccess();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-500 to-cyan-600 p-5 text-white">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6" />
            <h2 className="text-xl font-bold">
              {editMode ? 'Edit Perpindahan Ternak' : 'Tambah Perpindahan Ternak'}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 transition hover:bg-white/20">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Perpindahan <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="tanggal_perpindahan"
                value={formData.tanggal_perpindahan}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokasi Tujuan <span className="text-red-500">*</span>
              </label>
              <select
                name="id_lokasi_tujuan"
                value={formData.id_lokasi_tujuan}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Pilih Lokasi Tujuan</option>
                {lokasiOptions.map((lok) => (
                  <option key={lok.id} value={lok.id}>
                    {lok.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alasan Perpindahan <span className="text-red-500">*</span>
              </label>
              <select
                name="id_alasan"
                value={formData.id_alasan}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Pilih Alasan</option>
                {alasanOptions.map((alasan) => (
                  <option key={alasan.id} value={alasan.id}>
                    {alasan.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Armada Pengiriman
              </label>
              <input
                type="text"
                name="armada_pengiriman"
                value={formData.armada_pengiriman}
                onChange={handleInputChange}
                placeholder="Colt Diesel, Engkel, dll"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plat Nomor
              </label>
              <input
                type="text"
                name="plat_nomor"
                value={formData.plat_nomor}
                onChange={handleInputChange}
                placeholder="B 1234 XYZ"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Sopir
              </label>
              <input
                type="text"
                name="sopir"
                value={formData.sopir}
                onChange={handleInputChange}
                placeholder="Bapak Rahman"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biaya Kirim (Rp)
              </label>
              <input
                type="number"
                name="biaya_kirim"
                value={formData.biaya_kirim}
                onChange={handleInputChange}
                placeholder="150000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keterangan
              </label>
              <textarea
                name="keterangan"
                value={formData.keterangan}
                onChange={handleInputChange}
                rows="2"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Sapi Selection */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Pilih Ternak <span className="text-red-500">*</span>
            </h3>

            {loadingSapi ? (
              <div className="text-center py-4 text-gray-500">
                <Loader className="inline h-5 w-5 animate-spin" />
                <span className="ml-2">Memuat daftar sapi...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  onChange={(e) => {
                    const sapi = sapiOptions.find((s) => s.pid === e.target.value);
                    if (sapi) handleAddTernak(sapi);
                    e.target.value = '';
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Pilih Sapi untuk Ditambahkan --</option>
                  {sapiOptions.map((sapi) => (
                    <option key={sapi.pid} value={sapi.pid}>
                      {sapi.eartag} - {sapi.klasifikasi} ({sapi.bobot} kg)
                    </option>
                  ))}
                </select>

                {selectedTernak.length > 0 ? (
                  <div className="rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Eartag</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Klasifikasi</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Bobot (kg)</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Keterangan</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedTernak.map((ternak) => (
                          <tr key={ternak.pid}>
                            <td className="px-3 py-2">{ternak.eartag}</td>
                            <td className="px-3 py-2">{ternak.klasifikasi}</td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={ternak.bobot}
                                onChange={(e) => handleTernakBobotChange(ternak.pid, e.target.value)}
                                className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={ternak.keterangan}
                                onChange={(e) => handleTernakKeteranganChange(ternak.pid, e.target.value)}
                                placeholder="Catatan"
                                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveTernak(ternak.pid)}
                                className="rounded bg-red-100 p-1 text-red-700 hover:bg-red-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      <strong>Total:</strong> {selectedTernak.length} ekor,{' '}
                      {selectedTernak.reduce((sum, t) => sum + parseFloat(t.bobot || 0), 0).toFixed(2)} kg
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
                    Belum ada ternak dipilih. Pilih dari dropdown di atas.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
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

export default AddEditPerpindahanTernakModal;
