import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Package, Loader2, AlertCircle, Save, Calendar, Clock, User } from 'lucide-react';
import PemberianOvkSapiService from '../../../../services/pemberianOvkSapiService';

const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatRupiah = (v) => {
  const n = Number(v || 0);
  return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const BeriOvkQurbanModal = ({ isOpen, onClose, row, onSuccess }) => {
  const [tglPemberian, setTglPemberian] = useState(getToday());
  const [jamPemberian, setJamPemberian] = useState('08:00');
  const [namaPeternak, setNamaPeternak] = useState('');
  const [jumlah, setJumlah] = useState(1);
  const [selectedOvk, setSelectedOvk] = useState('');

  const [ovkOptions, setOvkOptions] = useState([]);
  const [loadingOvk, setLoadingOvk] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchOvkOptions = useCallback(async () => {
    setLoadingOvk(true);
    const res = await PemberianOvkSapiService.getOvkOptions();
    setLoadingOvk(false);
    if (res.success && Array.isArray(res.data)) {
      setOvkOptions(res.data);
    } else {
      setOvkOptions([]);
      setError(res.message || 'Gagal memuat daftar OVK');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTglPemberian(getToday());
      setJamPemberian('08:00');
      setNamaPeternak('');
      setJumlah(1);
      setSelectedOvk('');
      setError(null);
      fetchOvkOptions();
    }
  }, [isOpen, fetchOvkOptions]);

  const selectedOvkDetail = useMemo(
    () => ovkOptions.find((o) => o.value === selectedOvk),
    [ovkOptions, selectedOvk]
  );

  const maxStok = useMemo(() => {
    const stok = Number(selectedOvkDetail?.stok);
    return Number.isFinite(stok) && stok > 0 ? stok : 0;
  }, [selectedOvkDetail]);

  const estimasiTotal = selectedOvkDetail && jumlah > 0 && selectedOvkDetail.harga
    ? Number(selectedOvkDetail.harga) * Number(jumlah)
    : null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!row?.pid_sapi) return setError('PID sapi tidak tersedia.');
    if (!selectedOvk) return setError('OVK wajib dipilih.');
    if (!tglPemberian || !jamPemberian || !namaPeternak.trim()) {
      return setError('Tanggal, jam, dan nama peternak wajib diisi.');
    }
    const qty = Number(jumlah);
    if (!Number.isFinite(qty) || qty < 1) return setError('Jumlah (qty) minimal 1.');
    if (maxStok > 0 && qty > maxStok) {
      return setError(`Jumlah melebihi stok tersedia (${maxStok}).`);
    }

    setIsSubmitting(true);
    setError(null);

    const ovkSelection = PemberianOvkSapiService.parseOvkOptionValue(selectedOvk);
    const payload = {
      pid: row.pid_sapi,
      id_produk: Number(ovkSelection.id_produk),
      ...(ovkSelection.id_satuan != null ? { id_satuan: Number(ovkSelection.id_satuan) } : {}),
      ...(ovkSelection.harga != null ? { harga: Number(ovkSelection.harga) } : {}),
      jumlah: qty,
      tgl_pemberian_ovk: tglPemberian,
      jam_pemberian_ovk: jamPemberian,
      nama_peternak: namaPeternak.trim(),
    };

    const res = await PemberianOvkSapiService.store(payload);
    setIsSubmitting(false);
    if (res.success) {
      onSuccess?.(res);
      onClose?.();
    } else {
      const msg = typeof res.message === 'object' ? Object.values(res.message).flat().join(', ') : res.message;
      setError(msg || 'Gagal menyimpan.');
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setTglPemberian(getToday());
    setJamPemberian('08:00');
    setNamaPeternak('');
    setJumlah(1);
    setSelectedOvk('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500" />

        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-2.5 text-white">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Beri OVK</h2>
              <p className="text-xs text-gray-500">Sapi Qurban · Obat/Vitamin/Konsentrat</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="rounded-lg bg-sky-50 border border-sky-100 px-3 py-2 text-sm">
            <span className="text-gray-500">Eartag: </span>
            <span className="font-mono font-semibold text-sky-700">{row?.eartag || '-'}</span>
            {row?.eartag_supplier && (
              <span className="ml-2 text-xs text-gray-500">({row.eartag_supplier})</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Tanggal <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="date"
                  value={tglPemberian}
                  onChange={(e) => setTglPemberian(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Jam <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="time"
                  value={jamPemberian}
                  onChange={(e) => setJamPemberian(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Produk OVK <span className="text-rose-500">*</span>
            </label>
            {loadingOvk ? (
              <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat OVK...
              </div>
            ) : ovkOptions.length === 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                Belum ada stok OVK tersedia.
              </div>
            ) : (
              <select
                value={selectedOvk}
                onChange={(e) => setSelectedOvk(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              >
                <option value="">— Pilih OVK —</option>
                {ovkOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Jumlah <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
              {maxStok > 0 && (
                <p className="text-[11px] text-gray-400">Stok tersedia: {maxStok}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Nama Peternak <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={namaPeternak}
                  onChange={(e) => setNamaPeternak(e.target.value)}
                  required
                  placeholder="Nama peternak..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {estimasiTotal != null && (
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs text-gray-600 flex justify-between">
              <span>Estimasi Total:</span>
              <span className="font-semibold text-sky-700">{formatRupiah(estimasiTotal)}</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedOvk}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BeriOvkQurbanModal;
