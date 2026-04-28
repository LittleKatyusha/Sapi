import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Search, Square, X, AlertCircle, Loader2 } from 'lucide-react';
import PersediaanPakanService from '../../../../../services/persediaanPakanService';

const formatCurrency = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const BuatResepPakanModal = ({
  isOpen,
  onClose,
  onSuccess,
  editData = null,
}) => {
  const isEditMode = !!editData;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    tgl_aktif: '',
    keterangan: '',
  });

  // Stok bahan baku state
  const [stokBahanBaku, setStokBahanBaku] = useState([]);
  const [loadingStok, setLoadingStok] = useState(false);
  const [errorStok, setErrorStok] = useState('');

  // Selected items state
  const [selectedMap, setSelectedMap] = useState({});

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch stok bahan baku on modal open - always fetch fresh data without caching
  useEffect(() => {
    if (!isOpen) return;

    const fetchStokBahanBaku = async () => {
      setLoadingStok(true);
      setErrorStok('');
      // Clear previous data to ensure fresh fetch
      setStokBahanBaku([]);
      
      try {
        const response = await PersediaanPakanService.getStokBahanBaku();
        if (response.success) {
          setStokBahanBaku(response.data || []);
        } else {
          setErrorStok(response.message || 'Gagal memuat data stok bahan baku');
        }
      } catch (err) {
        setErrorStok(err.message || 'Terjadi kesalahan saat memuat data');
      } finally {
        setLoadingStok(false);
      }
    };

    // Always fetch fresh stok bahan baku data when modal opens
    fetchStokBahanBaku();

    // Reset form for add mode
    if (!isEditMode) {
      setFormData({
        name: '',
        tgl_aktif: new Date().toISOString().split('T')[0],
        keterangan: '',
      });
      setSelectedMap({});
    } else {
      // Set form for edit mode with data from /show endpoint
      setFormData({
        name: editData.name || '',
        tgl_aktif: editData.tgl_aktif || '',
        keterangan: editData.keterangan || '',
      });
      
      // Populate selectedMap with detail items from /show response
      if (editData.detail && Array.isArray(editData.detail)) {
        const initialSelectedMap = {};
        editData.detail.forEach((item) => {
          initialSelectedMap[item.id_produk] = {
            selected: true,
            jumlah: item.jumlah || 1,
          };
        });
        setSelectedMap(initialSelectedMap);
      } else {
        setSelectedMap({});
      }
    }

    setSearchTerm('');
    setSubmitError('');
  }, [isOpen, isEditMode, editData]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return stokBahanBaku;
    const lower = searchTerm.toLowerCase();
    return stokBahanBaku.filter((item) =>
      [item.name, item.produk]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(lower))
    );
  }, [stokBahanBaku, searchTerm]);

  // Calculate selected items and total
  const selectedItems = useMemo(() => {
    return Object.entries(selectedMap)
      .filter(([, value]) => {
        if (!value.selected) return false;
        // Only include items with valid positive numbers
        const jumlah = value.jumlah;
        return typeof jumlah === 'number' && jumlah > 0;
      })
      .map(([id, value]) => {
        const item = stokBahanBaku.find((entry) => entry.id === Number(id));
        if (!item) return null;
        return {
          ...item,
          jumlah: value.jumlah,
          subtotal: (item.harga || 0) * value.jumlah,
        };
      })
      .filter(Boolean);
  }, [stokBahanBaku, selectedMap]);

  const totalHarga = selectedItems.reduce((acc, item) => acc + (item.subtotal || 0), 0);
  const totalJumlah = selectedItems.reduce((acc, item) => acc + (item.jumlah || 0), 0);

  // Handlers
  const handleSelectAll = () => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      filteredItems.forEach((item) => {
        next[item.id] = {
          selected: true,
          jumlah: next[item.id]?.jumlah !== undefined ? next[item.id].jumlah : '',
        };
      });
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      filteredItems.forEach((item) => {
        delete next[item.id];
      });
      return next;
    });
  };

  const handleToggleSelect = (item) => {
    setSelectedMap((prev) => {
      const current = prev[item.id];
      const next = { ...prev };
      if (current?.selected) {
        delete next[item.id];
      } else {
        next[item.id] = {
          selected: true,
          jumlah: current?.jumlah !== undefined ? current.jumlah : '',
        };
      }
      return next;
    });
  };

  const handleJumlahChange = (item, jumlah) => {
    // Allow empty string when user clears the input
    if (jumlah === '' || jumlah === null || jumlah === undefined) {
      setSelectedMap((prev) => ({
        ...prev,
        [item.id]: {
          selected: true,
          jumlah: '', // Store as empty string
        },
      }));
      return;
    }

    const numJumlah = Number(jumlah);
    
    // Validate against stock - don't allow exceeding stock
    if (numJumlah > item.jumlah) {
      return;
    }

    // Only allow non-negative numbers
    if (numJumlah < 0) {
      return;
    }

    setSelectedMap((prev) => ({
      ...prev,
      [item.id]: {
        selected: true,
        jumlah: numJumlah,
      },
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'Nama resep harus diisi';
    }
    if (!formData.tgl_aktif) {
      return 'Tanggal aktif harus diisi';
    }
    if (!formData.keterangan.trim()) {
      return 'Keterangan harus diisi';
    }
    
    // Check if there are any selected items with valid quantities
    const validItems = Object.entries(selectedMap)
      .filter(([, value]) => value.selected)
      .filter(([, value]) => {
        const jumlah = value.jumlah;
        // Check if jumlah is a valid positive number
        return typeof jumlah === 'number' && jumlah > 0;
      });
    
    if (validItems.length === 0) {
      return 'Pilih minimal satu bahan baku dengan jumlah lebih dari 0';
    }
    
    // Validate quantities against stock
    for (const [id, value] of Object.entries(selectedMap)) {
      if (!value.selected) continue;
      
      const item = stokBahanBaku.find((entry) => entry.id === Number(id));
      if (!item) continue;
      
      const jumlah = value.jumlah;
      
      // Skip if empty (will be caught by validItems check above)
      if (jumlah === '' || jumlah === null || jumlah === undefined) continue;
      
      // Check if it's a valid number
      if (typeof jumlah !== 'number' || isNaN(jumlah)) {
        return `Jumlah untuk ${item.name} tidak valid`;
      }
      
      if (jumlah <= 0) {
        return `Jumlah untuk ${item.name} harus lebih dari 0`;
      }
      
      if (jumlah > item.jumlah) {
        return `Jumlah untuk ${item.name} melebihi stok tersedia (${item.jumlah})`;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        tgl_aktif: formData.tgl_aktif,
        name: formData.name.trim(),
        keterangan: formData.keterangan.trim(),
        items: selectedItems.map((item) => ({
          id_produk: item.id,
          jumlah: item.jumlah,
        })),
      };

      let response;
      if (isEditMode) {
        payload.pid = editData.pid || editData.pubid;
        response = await PersediaanPakanService.updateResep(payload);
      } else {
        response = await PersediaanPakanService.storeResep(payload);
      }

      if (response.success) {
        if (onSuccess) {
          onSuccess(response);
        }
      } else {
        setSubmitError(response.message || 'Gagal menyimpan resep pakan');
      }
    } catch (err) {
      setSubmitError(err.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!isSubmitting ? onClose : undefined} />
      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500 to-cyan-600 px-6 py-4 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/80">
              {isEditMode ? 'Edit' : 'Buat'} Resep Pakan
            </p>
            <h2 className="text-lg font-semibold">
              {isEditMode ? 'Edit Resep Pakan' : 'Buat Resep Pakan Baru'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 transition hover:bg-white/15 disabled:opacity-50"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Section */}
        <div className="px-6 pt-4 space-y-4">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Resep <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Masukkan nama resep"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Aktif <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.tgl_aktif}
                onChange={(e) => handleInputChange('tgl_aktif', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keterangan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.keterangan}
                onChange={(e) => handleInputChange('keterangan', e.target.value)}
                placeholder="Masukkan keterangan"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Search and Select Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari bahan baku..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                disabled={isSubmitting || loadingStok}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
              >
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                disabled={isSubmitting || loadingStok}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Deselect Semua
              </button>
            </div>
          </div>

          {/* Error Messages */}
          {errorStok && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {errorStok}
            </div>
          )}

          {submitError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {submitError}
            </div>
          )}
        </div>

        {/* Table Section */}
        <div className="max-h-[45vh] overflow-auto px-6 pb-4 pt-2">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="w-12 border-b border-slate-200 px-3 py-2 text-center">Pilih</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left">Nama</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left">Produk</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-right">Harga</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-center">Stok Tersedia</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-center">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {loadingStok && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memuat data stok bahan baku...
                      </div>
                    </td>
                  </tr>
                )}
                {!loadingStok && !errorStok && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                      Tidak ada data stok bahan baku
                    </td>
                  </tr>
                )}
                {!loadingStok && !errorStok && filteredItems.map((item) => {
                  const current = selectedMap[item.id];
                  const isSelected = Boolean(current?.selected);
                  // Display empty string if jumlah is empty or not set, otherwise show the number
                  const jumlahValue = current?.jumlah !== undefined ? current.jumlah : '';
                  const isOverStock = typeof jumlahValue === 'number' && jumlahValue > item.jumlah;

                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-slate-100 transition hover:bg-emerald-50/50 ${
                        isSelected ? 'bg-emerald-50' : ''
                      } ${isOverStock ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(item)}
                          disabled={isSubmitting}
                          className="rounded-md p-1 transition hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <Square className="h-5 w-5 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-700">{item.name}</td>
                      <td className="px-3 py-2 text-slate-600">{item.produk || '-'}</td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {formatCurrency(item.harga)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          item.jumlah > 0 
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border border-red-200 bg-red-50 text-red-700'
                        }`}>
                          {item.jumlah}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max={item.jumlah}
                          value={jumlahValue}
                          onChange={(e) => handleJumlahChange(item, e.target.value)}
                          disabled={isSubmitting}
                          className={`w-full rounded-lg border px-2 py-1.5 text-sm text-center ${
                            isOverStock 
                              ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-100'
                              : 'border-slate-200 bg-white text-slate-700 focus:border-emerald-300 focus:ring-emerald-100'
                          } outline-none transition focus:ring-4 disabled:opacity-50`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-700">{selectedItems.length} bahan</span>
            {' '}dipilih • Total Jumlah:{' '}
            <span className="font-semibold text-emerald-700">{totalJumlah}</span>
            {' '}• Total Harga:{' '}
            <span className="font-semibold text-emerald-700">{formatCurrency(totalHarga)}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || loadingStok || selectedItems.length === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  {isEditMode ? 'Simpan Perubahan' : 'Simpan Resep'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuatResepPakanModal;
