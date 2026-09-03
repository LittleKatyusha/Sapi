import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle, Plus } from 'lucide-react';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import StokSapiService from '../../../services/stokSapiService';
import { Notification } from '../../../components/shared/NotificationComponent';
import SearchableSelect from '../../../components/shared/SearchableSelect';

const JENIS_KELAMIN_OPTIONS = [
  { value: 'JANTAN', label: 'Jantan' },
  { value: 'BETINA', label: 'Betina' },
];

const getToday = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
};

const TambahAnakanPage = () => {
  useDocumentTitle('Tambah Stok dari Anakan');
  const navigate = useNavigate();

  const [form, setForm] = useState({
    eartag: '',
    jenis_kelamin: 'JANTAN',
    tgl_lahir: getToday(),
    berat_lahir: '',
    mother_pid: '',
    father_pid: '',
    catatan: '',
  });
  const [motherOptions, setMotherOptions] = useState([]);
  const [fatherOptions, setFatherOptions] = useState([]);
  const [loadingMother, setLoadingMother] = useState(false);
  const [loadingFather, setLoadingFather] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotif = useCallback((type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const fetchMotherOptions = useCallback(async (q = '') => {
    setLoadingMother(true);
    const res = await StokSapiService.parentOptions('BETINA', q);
    if (res.success) {
      setMotherOptions(res.data.options || []);
    } else {
      setMotherOptions([]);
    }
    setLoadingMother(false);
  }, []);

  const fetchFatherOptions = useCallback(async (q = '') => {
    setLoadingFather(true);
    const res = await StokSapiService.parentOptions('JANTAN', q);
    if (res.success) {
      setFatherOptions(res.data.options || []);
    } else {
      setFatherOptions([]);
    }
    setLoadingFather(false);
  }, []);

  useEffect(() => {
    fetchMotherOptions();
    fetchFatherOptions();
  }, [fetchMotherOptions, fetchFatherOptions]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMotherSearch = (input) => {
    fetchMotherOptions(input || '');
  };

  const handleFatherSearch = (input) => {
    fetchFatherOptions(input || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!form.eartag.trim()) {
      showNotif('error', 'ID / Ear Tag wajib diisi');
      return;
    }
    if (!form.tgl_lahir) {
      showNotif('error', 'Tanggal lahir wajib diisi');
      return;
    }

    setSaving(true);
    const payload = {
      eartag: form.eartag.trim(),
      jenis_kelamin: form.jenis_kelamin,
      tgl_lahir: form.tgl_lahir,
      berat_lahir: form.berat_lahir ? parseInt(form.berat_lahir, 10) : null,
      mother_pid: form.mother_pid || null,
      father_pid: form.father_pid || null,
      catatan: form.catatan || null,
    };

    const res = await StokSapiService.storeAnakan(payload);
    setSaving(false);

    if (res.success) {
      showNotif('success', res.message || 'Anakan berhasil ditambahkan');
      setTimeout(() => navigate('/rph/stok-sapi'), 1200);
    } else {
      showNotif('error', res.message || 'Gagal menambahkan anakan');
    }
  };

  const handleCancel = () => navigate('/rph/stok-sapi');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] space-y-4 p-3 sm:p-4">
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Header */}
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="rounded-lg bg-emerald-600 p-2.5 text-white">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Tambah Stok dari Anakan</h1>
                <p className="text-sm text-gray-500">Catat kelahiran sapi baru masuk ke inventory</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Section 1: Data Anakan */}
            <div className="lg:col-span-2 space-y-5">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Data Anakan</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500">
                      ID / Ear Tag <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.eartag}
                      onChange={(e) => handleChange('eartag', e.target.value)}
                      placeholder="Contoh: SAPI-025"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500">
                      Jenis Kelamin <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={JENIS_KELAMIN_OPTIONS}
                      value={form.jenis_kelamin}
                      onChange={(val) => handleChange('jenis_kelamin', val || 'JANTAN')}
                      placeholder="Pilih jenis kelamin"
                      isDisabled={saving}
                      isClearable={false}
                      accentColor="green"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500">
                      Tanggal Lahir <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.tgl_lahir}
                      onChange={(e) => handleChange('tgl_lahir', e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500">Berat Lahir (KG)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.berat_lahir}
                      onChange={(e) => handleChange('berat_lahir', e.target.value)}
                      placeholder="Opsional"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Parentage */}
              <div className="border-t border-gray-100 pt-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Induk / Parentage</h2>
                <p className="mt-1 text-xs text-gray-400">
                  Kedua induk bersifat <strong>opsional</strong> — boleh dikosongkan
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500">Induk Betina</label>
                    <SearchableSelect
                      options={motherOptions}
                      value={form.mother_pid}
                      onChange={(val) => handleChange('mother_pid', val || '')}
                      onInputChange={handleMotherSearch}
                      placeholder="Pilih sapi betina... (opsional)"
                      isLoading={loadingMother}
                      isDisabled={saving}
                      isClearable
                      accentColor="green"
                    />
                    <p className="text-xs text-gray-400">Opsional — boleh dikosongkan</p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500">Induk Jantan / Pejantan</label>
                    <SearchableSelect
                      options={fatherOptions}
                      value={form.father_pid}
                      onChange={(val) => handleChange('father_pid', val || '')}
                      onInputChange={handleFatherSearch}
                      placeholder="Pilih sapi jantan... (opsional)"
                      isLoading={loadingFather}
                      isDisabled={saving}
                      isClearable
                      accentColor="green"
                    />
                    <p className="text-xs text-gray-400">Opsional — boleh dikosongkan</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Catatan */}
              <div className="border-t border-gray-100 pt-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-500">Catatan</label>
                  <textarea
                    value={form.catatan}
                    onChange={(e) => handleChange('catatan', e.target.value)}
                    rows={3}
                    placeholder="Catatan tambahan (opsional)"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>
              </div>
            </div>

            {/* Side info */}
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div className="text-xs text-amber-800">
                    <p className="font-semibold">Aturan Parentage</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      <li>Induk betina & jantan bersifat opsional</li>
                      <li>Induk betina otomatis filter sapi betina</li>
                      <li>Induk jantan otomatis filter sapi jantan</li>
                      <li>Tidak boleh memilih diri sendiri sebagai induk</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs text-emerald-800">
                  <p className="font-semibold">Sumber Stok: BIRTH</p>
                  <p className="mt-1">
                    Sapi hasil kelahiran akan masuk ke inventory dengan source <code>BIRTH</code>, status
                    TERSEDIA, dan tercatat dalam history.
                  </p>
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Anakan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TambahAnakanPage;
