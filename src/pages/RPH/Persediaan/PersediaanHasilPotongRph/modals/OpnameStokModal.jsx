import React, { useState, useEffect } from 'react';
import { X, Scale, AlertTriangle, Plus, Minus, Loader2 } from 'lucide-react';
import PersediaanHasilPotongService from '../../../../../services/persediaanHasilPotongService';

const formatKg = (val) => {
  const num = Number(val ?? 0);
  if (Number.isNaN(num)) return '0 kg';
  return `${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(num)} kg`;
};

const OpnameStokModal = ({ isOpen, onClose, onSuccess, type = 'boning', item }) => {
  const currentStock = type === 'boning'
    ? Number(item?.berat_sisa ?? 0)
    : Number(item?.berat_tersedia ?? item?.berat_kulit ?? 0);

  const itemName = type === 'boning'
    ? (item?.name || 'Item Boning')
    : (item?.item_kulit_name || item?.jenis_sapi || 'Kulit');

  const [tipeOpname, setTipeOpname] = useState('PENGURANGAN');
  const [jumlahSelisih, setJumlahSelisih] = useState('');
  const [tanggalOpname, setTanggalOpname] = useState(new Date().toISOString().split('T')[0]);
  const [alasan, setAlasan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setTipeOpname('PENGURANGAN');
      setJumlahSelisih('');
      setTanggalOpname(new Date().toISOString().split('T')[0]);
      setAlasan('');
      setError(null);
    }
  }, [isOpen, item]);

  if (!isOpen) return null;

  const round3 = (n) => Math.round(n * 1000) / 1000;
  const numericDiff = Number(jumlahSelisih || 0);
  const finalStock = tipeOpname === 'PENGURANGAN'
    ? round3(currentStock - numericDiff)
    : round3(currentStock + numericDiff);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!tanggalOpname) {
      setError('Tanggal opname wajib diisi.');
      return;
    }

    if (!alasan.trim()) {
      setError('Alasan opname wajib diisi.');
      return;
    }

    if (numericDiff <= 0) {
      setError('Jumlah selisih penyesuaian harus lebih dari 0.');
      return;
    }

    if (tipeOpname === 'PENGURANGAN' && numericDiff > currentStock) {
      setError(`Pengurangan (${numericDiff} kg) melebihi stok yang tersedia (${currentStock} kg).`);
      return;
    }

    const payload = type === 'boning'
      ? {
          id_item_potong: item?.id_item_potong,
          tipe_opname: tipeOpname,
          jumlah: numericDiff,
          tanggal_opname: tanggalOpname,
          alasan: alasan.trim(),
        }
      : {
          pid: item?.pid,
          id: item?.id,
          tipe_opname: tipeOpname,
          jumlah: numericDiff,
          tanggal_opname: tanggalOpname,
          alasan: alasan.trim(),
        };

    setLoading(true);
    try {
      const res = await PersediaanHasilPotongService.opname(type, payload);
      if (res.success) {
        onSuccess?.('Opname stok berhasil disimpan');
        onClose();
      } else {
        setError(res.message || 'Gagal menyimpan opname');
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Opname Stok {type === 'boning' ? 'Boning' : 'Kulit'}</h3>
              <p className="text-xs text-slate-500">Penyesuaian stok selisih timbang / penyusutan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Stock Preview Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Item Potong</span>
              <span className="font-bold text-slate-900">{itemName}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Stok Sistem Saat Ini</span>
              <span className="font-extrabold text-sm text-emerald-700">{formatKg(currentStock)}</span>
            </div>
          </div>

          {/* Jenis Penyesuaian (Tipe Opname) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Jenis Penyesuaian</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTipeOpname('PENGURANGAN')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  tipeOpname === 'PENGURANGAN'
                    ? 'border-red-300 bg-red-50 text-red-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Minus className="h-4 w-4 text-red-600" />
                Pengurangan (Susut)
              </button>
              <button
                type="button"
                onClick={() => setTipeOpname('PENAMBAHAN')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  tipeOpname === 'PENAMBAHAN'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Plus className="h-4 w-4 text-emerald-600" />
                Penambahan
              </button>
            </div>
          </div>

          {/* Jumlah Selisih (kg) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Jumlah Selisih (kg) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0.001"
                required
                value={jumlahSelisih}
                onChange={(e) => setJumlahSelisih(e.target.value)}
                placeholder="Misal: 1 (jika susut 1 kg)"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 outline-none transition-all"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">kg</span>
            </div>
          </div>

          {/* Hasil Simulasi Stok */}
          {numericDiff > 0 && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Arah Penyesuaian</span>
                <span className={`font-bold ${tipeOpname === 'PENGURANGAN' ? 'text-red-600' : 'text-emerald-700'}`}>
                  {tipeOpname === 'PENGURANGAN' ? 'Pengurangan (Susut)' : 'Penambahan'} (−{numericDiff} kg)
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60">
                <span className="text-slate-600 font-medium">Stok Akhir Sesudah Opname</span>
                <span className="font-extrabold text-sm text-slate-900">{formatKg(finalStock)}</span>
              </div>
            </div>
          )}

          {/* Tanggal Opname (Wajib) */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-bold text-slate-700">
              <span>Tanggal Opname</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={tanggalOpname}
              onChange={(e) => setTanggalOpname(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 outline-none transition-all"
            />
          </div>

          {/* Alasan Opname (Wajib) */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-bold text-slate-700">
              <span>Alasan Opname</span>
              <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Contoh: Penyusutan berat daging saat penyimpanan di cold storage"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 outline-none transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Opname'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OpnameStokModal;
