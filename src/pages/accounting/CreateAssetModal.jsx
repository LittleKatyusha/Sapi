import React, { useState, useEffect, useMemo } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import accountingService from '../../services/accountingService';
import SearchableSelect from '../../components/shared/SearchableSelect';

const TIPE_VALUASI_OPTIONS = [
  { value: 'depresiasi', label: '📉 Susut / Depresiasi (Mobil, Mesin)' },
  { value: 'apresiasi', label: '📈 Kenaikan / Apresiasi (Emas, Investasi)' },
  { value: 'tetap', label: '⏹️ Nilai Tetap (Tanah)' },
];

const KATEGORI_OPTIONS = [
  { value: 'kendaraan', label: 'Kendaraan' },
  { value: 'logam_mulia', label: 'Logam Mulia (Emas/Perak)' },
  { value: 'properti', label: 'Tanah / Properti' },
  { value: 'bangunan', label: 'Bangunan' },
  { value: 'peralatan', label: 'Peralatan & Mesin' },
  { value: 'lainnya', label: 'Lainnya' },
];

const emptyForm = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  const today = new Date(d.getTime() - offset).toISOString().slice(0, 10);

  return {
    kode_aset: '',
    nama_aset: '',
    kategori: 'kendaraan',
    tipe_valuasi: 'depresiasi',
    coa_aset_id: '',
    coa_depresiasi_id: '',
    coa_beban_id: '',
    credit_coa_id: '',
    tanggal_perolehan: today,
    harga_perolehan: '',
    nilai_residu: 0,
    umur_bulan: 48,
    keterangan: '',
  };
};

/** Accumulated depreciation accounts are contra-asset: normal balance kredit. */
const isContraAsset = (account) =>
  account.tipe === 'Aset' && String(account.normal_balance).toUpperCase() === 'C';

export default function CreateAssetModal({
  isOpen,
  onClose,
  onSuccess,
  selectedSettingId,
  settingName,
  accounts = [],
}) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setForm(emptyForm());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  /** Asset accounts only: exclude contra-asset (accumulated depreciation). */
  const assetAccountOptions = useMemo(() => {
    return (accounts || [])
      .filter((a) => a.tipe === 'Aset' && !isContraAsset(a))
      .map((a) => ({
        value: Number(a.id),
        label: `${a.kode_akun} - ${a.nama_akun}`,
        tipe: a.tipe,
      }));
  }, [accounts]);

  /** Accumulated depreciation: contra-asset, or explicitly named akumulasi. */
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

  /** Funding source: cash/bank first, payable accounts accepted as well. */
  const creditAccountOptions = useMemo(() => {
    const filtered = (accounts || []).filter(
      (a) => a.tipe === 'Aset' || a.tipe === 'Kewajiban'
    );

    return (filtered.length ? filtered : accounts || []).map((a) => ({
      value: Number(a.id),
      label: `${a.kode_akun} - ${a.nama_akun}`,
      tipe: a.tipe,
    }));
  }, [accounts]);

  const handleValuationChange = (val) => {
    let defKategori = form.kategori;
    if (val === 'apresiasi') defKategori = 'logam_mulia';
    else if (val === 'tetap') defKategori = 'properti';
    else defKategori = 'kendaraan';

    setForm((prev) => ({
      ...prev,
      tipe_valuasi: val,
      kategori: defKategori,
      umur_bulan: val === 'depresiasi' ? 48 : 0,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSettingId) {
      setError('Pilih entitas akuntansi terlebih dahulu.');
      return;
    }

    if (!form.kode_aset || !form.nama_aset || !form.coa_aset_id || !form.harga_perolehan) {
      setError('Harap lengkapi semua field bertanda bintang (*).');
      return;
    }

    if (form.tipe_valuasi === 'depresiasi' && (!form.coa_depresiasi_id || !form.coa_beban_id)) {
      setError('Untuk aset yang disusutkan, akun akumulasi dan beban penyusutan wajib dipilih.');
      return;
    }

    if (form.tipe_valuasi === 'depresiasi' && Number(form.nilai_residu) >= Number(form.harga_perolehan)) {
      setError('Nilai residu harus lebih kecil dari harga perolehan.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        setting_id: Number(selectedSettingId),
        kode_aset: form.kode_aset.trim(),
        nama_aset: form.nama_aset.trim(),
        kategori: form.kategori,
        tipe_valuasi: form.tipe_valuasi,
        coa_aset_id: Number(form.coa_aset_id),
        tanggal_perolehan: form.tanggal_perolehan,
        harga_perolehan: Number(form.harga_perolehan),
        nilai_pasar_terkini: Number(form.harga_perolehan),
        keterangan: form.keterangan || null,
      };

      if (form.credit_coa_id) {
        payload.credit_coa_id = Number(form.credit_coa_id);
      }

      if (form.tipe_valuasi === 'depresiasi') {
        payload.coa_depresiasi_id = Number(form.coa_depresiasi_id);
        payload.coa_beban_id = Number(form.coa_beban_id);
        payload.umur_bulan = Number(form.umur_bulan);
        payload.nilai_residu = Number(form.nilai_residu || 0);
      }

      await accountingService.createAsset(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan aset.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="flex flex-col w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/75 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Tambah Aset Baru</h2>
              <p className="text-xs text-gray-500">
                {settingName ? `Entitas: ${settingName}` : 'Pencatatan kepemilikan aset tetap atau investasi'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Row 1: Tipe Valuasi & Kategori */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Tipe Valuasi *
                </label>
                <SearchableSelect
                  options={TIPE_VALUASI_OPTIONS}
                  value={form.tipe_valuasi}
                  onChange={handleValuationChange}
                  placeholder="Pilih tipe valuasi..."
                  isClearable={false}
                  accentColor="blue"
                  className="w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Kategori Aset *
                </label>
                <SearchableSelect
                  options={KATEGORI_OPTIONS}
                  value={form.kategori}
                  onChange={(val) => setForm((prev) => ({ ...prev, kategori: val }))}
                  placeholder="Pilih kategori aset..."
                  isClearable={false}
                  accentColor="blue"
                  className="w-full text-sm"
                />
              </div>
            </div>

            {/* Row 2: Kode Aset & Nama Aset */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Kode Aset *
                </label>
                <input
                  type="text"
                  value={form.kode_aset}
                  onChange={(e) => setForm({ ...form, kode_aset: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Contoh: AST-001 / HILUX-01"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Nama Aset *
                </label>
                <input
                  type="text"
                  value={form.nama_aset}
                  onChange={(e) => setForm({ ...form, nama_aset: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Contoh: Toyota Hilux 4x4 / Mesin Chopper"
                  required
                />
              </div>
            </div>

            {/* Row 3: Akun Aset, Tanggal Perolehan, Harga Perolehan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  isClearable={true}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Tanggal Perolehan *
                </label>
                <input
                  type="date"
                  value={form.tanggal_perolehan}
                  onChange={(e) => setForm({ ...form, tanggal_perolehan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Harga Beli / Perolehan (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.harga_perolehan}
                  onChange={(e) => setForm({ ...form, harga_perolehan: e.target.value })}
                  className="w-full px-3 py-2 text-right border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            {/* Row 4: Funding source */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Sumber Dana / Akun Lawan
              </label>
              <SearchableSelect
                options={creditAccountOptions}
                value={form.credit_coa_id ? Number(form.credit_coa_id) : ''}
                onChange={(val) => setForm({ ...form, credit_coa_id: val ? Number(val) : '' })}
                placeholder="Kas / Bank / Hutang (default: mapping Kas)"
                accentColor="blue"
                className="w-full text-sm"
                isClearable={true}
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Jurnal perolehan otomatis: Dr akun aset / Cr sumber dana. Kosongkan untuk memakai mapping Kas entitas.
              </p>
            </div>

            {/* Parameter Penyusutan (Khusus Depresiasi) */}
            {form.tipe_valuasi === 'depresiasi' && (
              <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Parameter Penyusutan (Metode Garis Lurus)
                  </span>
                  <span className="text-xs text-gray-500">
                    Penyusutan dihitung per bulan
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Masa Manfaat (Bulan) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.umur_bulan}
                      onChange={(e) => setForm({ ...form, umur_bulan: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                      placeholder="Contoh: 48 (4 tahun)"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Nilai Residu / Sisa (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={form.nilai_residu}
                      onChange={(e) => setForm({ ...form, nilai_residu: e.target.value })}
                      className="w-full px-3 py-2 text-right border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Akun Akumulasi Penyusutan (COA) *
                    </label>
                    <SearchableSelect
                      options={accumulatedAccountOptions}
                      value={form.coa_depresiasi_id ? Number(form.coa_depresiasi_id) : ''}
                      onChange={(val) => setForm({ ...form, coa_depresiasi_id: val ? Number(val) : '' })}
                      placeholder="Pilih akun akumulasi penyusutan..."
                      accentColor="blue"
                      className="w-full text-sm"
                      isClearable={true}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Akun Beban Penyusutan (COA) *
                    </label>
                    <SearchableSelect
                      options={expenseAccountOptions}
                      value={form.coa_beban_id ? Number(form.coa_beban_id) : ''}
                      onChange={(val) => setForm({ ...form, coa_beban_id: val ? Number(val) : '' })}
                      placeholder="Pilih akun beban penyusutan..."
                      accentColor="blue"
                      className="w-full text-sm"
                      isClearable={true}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Keterangan */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Keterangan / Catatan
              </label>
              <textarea
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Catatan tambahan mengenai aset (opsional)"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || !selectedSettingId}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {saving ? 'Menyimpan...' : 'Simpan Aset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
