import React, { useState, useEffect, useMemo } from 'react';
import { X, Settings, AlertCircle, Sparkles } from 'lucide-react';
import accountingService from '../../services/accountingService';
import SearchableSelect from '../../components/shared/SearchableSelect';

const TIPE_VALUASI_OPTIONS = [
  { value: 'depresiasi', label: '📉 Susut / Depresiasi (Mobil, Mesin)' },
  { value: 'apresiasi', label: '📈 Kenaikan / Apresiasi (Emas, Investasi)' },
  { value: 'tetap', label: '⏹️ Nilai Tetap (Tanah)' },
];

const KATEGORI_OPTIONS = [
  { value: 'kendaraan', label: 'Kendaraan' },
  { value: 'mesin', label: 'Mesin' },
  { value: 'peralatan', label: 'Peralatan & Perlengkapan' },
  { value: 'bangunan', label: 'Bangunan' },
  { value: 'properti', label: 'Tanah / Properti' },
  { value: 'logam_mulia', label: 'Logam Mulia (Emas/Perak)' },
  { value: 'lainnya', label: 'Lainnya' },
];

const PRESET_UMUR = [
  { label: 'Gol. 1: 4 Thn (48 bln)', bulan: 48, desc: 'Mobil dinas, komputer, perlengkapan ringan' },
  { label: 'Gol. 2: 8 Thn (96 bln)', bulan: 96, desc: 'Truk, mesin berat, alat perkakas besar' },
  { label: 'Gol. 3: 16 Thn (192 bln)', bulan: 192, desc: 'Pabrikasi industri, instalasi utama' },
  { label: 'Bangunan: 20 Thn (240 bln)', bulan: 240, desc: 'Gedung kantor, gudang permanen' },
];

const isContraAsset = (account) =>
  account.tipe === 'Aset' && String(account.normal_balance).toUpperCase() === 'C';

const fmt = (v) => Number(v || 0).toLocaleString('id-ID');

export default function EditAssetModal({
  isOpen,
  onClose,
  onSuccess,
  asset,
  accounts = [],
}) {
  const [form, setForm] = useState({
    nama_aset: '',
    kategori: 'peralatan',
    tipe_valuasi: 'depresiasi',
    coa_aset_id: '',
    coa_depresiasi_id: '',
    coa_beban_id: '',
    umur_bulan: '',
    nilai_residu: 0,
    kode_inventaris: '',
    lokasi: '',
    unit_kerja: '',
    penanggung_jawab: '',
    kondisi: 'baik',
    nomor_seri: '',
    merek_tipe: '',
    jumlah: 1,
    tanggal_mulai_digunakan: '',
    keterangan: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && asset) {
      setError('');
      setForm({
        nama_aset: asset.nama_aset || '',
        kategori: asset.kategori || 'peralatan',
        tipe_valuasi: asset.tipe_valuasi || 'depresiasi',
        coa_aset_id: asset.coa_aset_id ? Number(asset.coa_aset_id) : '',
        coa_depresiasi_id: asset.coa_depresiasi_id ? Number(asset.coa_depresiasi_id) : '',
        coa_beban_id: asset.coa_beban_id ? Number(asset.coa_beban_id) : '',
        umur_bulan: asset.umur_bulan && Number(asset.umur_bulan) > 0 ? Number(asset.umur_bulan) : '',
        nilai_residu: asset.nilai_residu ? Number(asset.nilai_residu) : 0,
        kode_inventaris: asset.kode_inventaris || '',
        lokasi: asset.lokasi || '',
        unit_kerja: asset.unit_kerja || '',
        penanggung_jawab: asset.penanggung_jawab || '',
        kondisi: asset.kondisi || 'baik',
        nomor_seri: asset.nomor_seri || '',
        merek_tipe: asset.merek_tipe || '',
        jumlah: asset.jumlah ? Number(asset.jumlah) : 1,
        tanggal_mulai_digunakan: asset.tanggal_mulai_digunakan
          ? String(asset.tanggal_mulai_digunakan).slice(0, 10)
          : '',
        keterangan: asset.keterangan || '',
      });
    }
  }, [isOpen, asset]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  const assetAccountOptions = useMemo(() => {
    return (accounts || [])
      .filter((a) => a.tipe === 'Aset' && !isContraAsset(a))
      .map((a) => ({
        value: Number(a.id),
        label: `${a.kode_akun} - ${a.nama_akun}`,
        tipe: a.tipe,
      }));
  }, [accounts]);

  const accumulatedAccountOptions = useMemo(() => {
    const filtered = (accounts || []).filter(
      (a) => isContraAsset(a) || /akumulasi|accumulated/i.test(a.nama_akun || '')
    );

    return (filtered.length ? filtered : accounts || []).map((a) => ({
      value: Number(a.id),
      label: `${a.kode_akun} - ${a.nama_akun}`,
      tipe: a.tipe,
    }));
  }, [accounts]);

  const expenseAccountOptions = useMemo(() => {
    const filtered = (accounts || []).filter((a) => a.tipe === 'Beban');
    return (filtered.length ? filtered : accounts).map((a) => ({
      value: Number(a.id),
      label: `${a.kode_akun} - ${a.nama_akun}`,
      tipe: a.tipe,
    }));
  }, [accounts]);

  const monthlyEst = useMemo(() => {
    if (form.tipe_valuasi !== 'depresiasi' || !form.umur_bulan || Number(form.umur_bulan) <= 0) {
      return 0;
    }
    const cost = Number(asset?.harga_perolehan || 0);
    const residual = Number(form.nilai_residu || 0);
    const months = Number(form.umur_bulan);
    return Math.max(0, Math.round((cost - residual) / months));
  }, [form.tipe_valuasi, form.umur_bulan, form.nilai_residu, asset]);

  if (!isOpen || !asset) return null;

  const isNeedConfig =
    (!asset.umur_bulan || Number(asset.umur_bulan) <= 0) &&
    (!asset.tipe_valuasi || asset.tipe_valuasi === 'depresiasi');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nama_aset.trim()) {
      setError('Nama aset wajib diisi.');
      return;
    }

    if (form.tipe_valuasi === 'depresiasi') {
      if (!form.umur_bulan || Number(form.umur_bulan) <= 0) {
        setError('Masa manfaat (umur bulan) wajib diisi lebih dari 0.');
        return;
      }
      if (!form.coa_depresiasi_id || !form.coa_beban_id) {
        setError('Akun akumulasi dan beban penyusutan wajib dipilih.');
        return;
      }
      if (Number(form.nilai_residu) >= Number(asset.harga_perolehan)) {
        setError('Nilai residu harus lebih kecil dari harga perolehan.');
        return;
      }
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        nama_aset: form.nama_aset.trim(),
        kategori: form.kategori,
        tipe_valuasi: form.tipe_valuasi,
        coa_aset_id: Number(form.coa_aset_id),
        keterangan: form.keterangan || null,
        // Atribut fisik (dipakai modul opname aset)
        kode_inventaris: form.kode_inventaris?.trim() || null,
        lokasi: form.lokasi?.trim() || null,
        unit_kerja: form.unit_kerja?.trim() || null,
        penanggung_jawab: form.penanggung_jawab?.trim() || null,
        kondisi: form.kondisi || null,
        nomor_seri: form.nomor_seri?.trim() || null,
        merek_tipe: form.merek_tipe?.trim() || null,
        jumlah: Number(form.jumlah) > 0 ? Number(form.jumlah) : 1,
        tanggal_mulai_digunakan: form.tanggal_mulai_digunakan || null,
      };

      if (form.tipe_valuasi === 'depresiasi') {
        payload.umur_bulan = Number(form.umur_bulan);
        payload.nilai_residu = Number(form.nilai_residu || 0);
        payload.coa_depresiasi_id = Number(form.coa_depresiasi_id);
        payload.coa_beban_id = Number(form.coa_beban_id);
      } else {
        payload.umur_bulan = 0;
        payload.nilai_residu = 0;
      }

      await accountingService.updateAsset(asset.id, payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal memperbarui parameter aset.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Atur Parameter & Umur Aset</h2>
              <p className="text-xs text-gray-500">
                {asset.kode_aset} · {asset.nama_aset}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isNeedConfig && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Masa manfaat aset belum diatur:</span> Aset ini baru disinkronkan
                  dari Pembelian Lain-Lain. Silakan tentukan masa manfaat (umur bulan) di bawah agar penyusutan bulanan
                  dapat diproses.
                </div>
              </div>
            )}

            {/* Read-only Basic Info */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <div>
                <span className="text-gray-500">Harga Perolehan:</span>
                <div className="font-bold text-gray-900 text-sm">Rp {fmt(asset.harga_perolehan)}</div>
              </div>
              <div>
                <span className="text-gray-500">Akumulasi Susut Saat Ini:</span>
                <div className="font-bold text-gray-700 text-sm">Rp {fmt(asset.akumulasi_depresiasi)}</div>
              </div>
            </div>

            {/* Nama & Kategori */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-700">
                Data Fisik (untuk opname aset)
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="text-xs text-gray-700">
                  Kode Inventaris
                  <input value={form.kode_inventaris} onChange={(e) => setForm({ ...form, kode_inventaris: e.target.value })}
                    className="mt-1 w-full rounded-lg border p-2 text-sm" />
                </label>
                <label className="text-xs text-gray-700">
                  Lokasi Penempatan
                  <input value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                    className="mt-1 w-full rounded-lg border p-2 text-sm" />
                </label>
                <label className="text-xs text-gray-700">
                  Unit Kerja
                  <input value={form.unit_kerja} onChange={(e) => setForm({ ...form, unit_kerja: e.target.value })}
                    className="mt-1 w-full rounded-lg border p-2 text-sm" />
                </label>
                <label className="text-xs text-gray-700">
                  Penanggung Jawab
                  <input value={form.penanggung_jawab} onChange={(e) => setForm({ ...form, penanggung_jawab: e.target.value })}
                    className="mt-1 w-full rounded-lg border p-2 text-sm" />
                </label>
                <label className="text-xs text-gray-700">
                  Kondisi
                  <select value={form.kondisi} onChange={(e) => setForm({ ...form, kondisi: e.target.value })}
                    className="mt-1 w-full rounded-lg border p-2 text-sm">
                    <option value="baik">Baik</option>
                    <option value="rusak_ringan">Rusak ringan</option>
                    <option value="rusak_berat">Rusak berat</option>
                    <option value="tidak_berfungsi">Tidak berfungsi</option>
                  </select>
                </label>
                <label className="text-xs text-gray-700">
                  Jumlah (unit)
                  <input type="number" min="1" value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                    className="mt-1 w-full rounded-lg border p-2 text-sm" />
                </label>
                <label className="text-xs text-gray-700">
                  Merek / Tipe
                  <input value={form.merek_tipe} onChange={(e) => setForm({ ...form, merek_tipe: e.target.value })}
                    className="mt-1 w-full rounded-lg border p-2 text-sm" />
                </label>
                <label className="text-xs text-gray-700">
                  Nomor Seri
                  <input value={form.nomor_seri} onChange={(e) => setForm({ ...form, nomor_seri: e.target.value })}
                    className="mt-1 w-full rounded-lg border p-2 text-sm" />
                </label>
                <label className="text-xs text-gray-700">
                  Tanggal Mulai Digunakan
                  <input type="date" value={form.tanggal_mulai_digunakan}
                    onChange={(e) => setForm({ ...form, tanggal_mulai_digunakan: e.target.value })}
                    className="mt-1 w-full rounded-lg border p-2 text-sm" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Nama Aset *
                </label>
                <input
                  type="text"
                  value={form.nama_aset}
                  onChange={(e) => setForm({ ...form, nama_aset: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Kategori
                </label>
                <select
                  value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {KATEGORI_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tipe Valuasi */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Tipe Valuasi
              </label>
              <select
                value={form.tipe_valuasi}
                onChange={(e) => setForm({ ...form, tipe_valuasi: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {TIPE_VALUASI_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Khusus Tipe Depresiasi */}
            {form.tipe_valuasi === 'depresiasi' && (
              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Pengaturan Masa Manfaat & Akun Penyusutan</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                    Masa Manfaat / Umur Penyusutan (Bulan) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.umur_bulan}
                      onChange={(e) => setForm({ ...form, umur_bulan: e.target.value })}
                      placeholder="Contoh: 48"
                      className="w-36 px-3 py-2 border border-blue-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      required
                    />
                    <span className="text-xs text-gray-600">
                      bulan {form.umur_bulan ? `(${(Number(form.umur_bulan) / 12).toFixed(1)} tahun)` : ''}
                    </span>
                  </div>

                  {/* Preset Buttons */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PRESET_UMUR.map((p) => (
                      <button
                        key={p.bulan}
                        type="button"
                        onClick={() => setForm({ ...form, umur_bulan: p.bulan })}
                        className={`text-xs px-2.5 py-1 rounded-md border transition cursor-pointer ${
                          Number(form.umur_bulan) === p.bulan
                            ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-200'
                        }`}
                        title={p.desc}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {monthlyEst > 0 && (
                    <div className="mt-3 p-2.5 bg-white rounded-lg border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                      <span className="text-gray-600">Estimasi Beban Penyusutan per Bulan:</span>
                      <span className="font-bold text-blue-700 font-mono text-sm">Rp {fmt(monthlyEst)} / bln</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                    Nilai Residu / Nilai Sisa (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.nilai_residu}
                    onChange={(e) => setForm({ ...form, nilai_residu: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="0"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Nilai sisa aset di akhir masa manfaat (biasanya 0).</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-blue-200/60">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                      Akun Akumulasi Penyusutan (COA) *
                    </label>
                    <SearchableSelect
                      options={accumulatedAccountOptions}
                      value={form.coa_depresiasi_id ? Number(form.coa_depresiasi_id) : ''}
                      onChange={(val) => setForm({ ...form, coa_depresiasi_id: val ? Number(val) : '' })}
                      placeholder="Pilih akun akumulasi (1620)..."
                      accentColor="blue"
                      className="w-full text-sm"
                      isClearable={false}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                      Akun Beban Penyusutan (COA) *
                    </label>
                    <SearchableSelect
                      options={expenseAccountOptions}
                      value={form.coa_beban_id ? Number(form.coa_beban_id) : ''}
                      onChange={(val) => setForm({ ...form, coa_beban_id: val ? Number(val) : '' })}
                      placeholder="Pilih akun beban (6700)..."
                      accentColor="blue"
                      className="w-full text-sm"
                      isClearable={false}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Akun Aset di Neraca */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Akun Aset di Neraca (COA) *
              </label>
              <SearchableSelect
                options={assetAccountOptions}
                value={form.coa_aset_id ? Number(form.coa_aset_id) : ''}
                onChange={(val) => setForm({ ...form, coa_aset_id: val ? Number(val) : '' })}
                placeholder="Pilih akun aset..."
                accentColor="blue"
                className="w-full text-sm"
                isClearable={false}
              />
            </div>

            {/* Keterangan */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Keterangan
              </label>
              <textarea
                rows="2"
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Catatan tambahan aset..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
