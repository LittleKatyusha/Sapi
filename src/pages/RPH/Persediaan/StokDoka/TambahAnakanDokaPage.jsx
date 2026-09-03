import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle, Plus, Search, X } from 'lucide-react';
import useDocumentTitle from '../../../../hooks/useDocumentTitle';
import StokDokaService from '../../../../services/stokDokaService';
import { Notification } from '../../../../components/shared/NotificationComponent';
import SearchableSelect from '../../../../components/shared/SearchableSelect';
import ParentPickerDokaModal from './modals/ParentPickerDokaModal';

const JENIS_KELAMIN_OPTIONS = [
  { value: 'JANTAN', label: 'Jantan' },
  { value: 'BETINA', label: 'Betina' },
  { value: 'BELUM_DIKETAHUI', label: 'Belum Diketahui' },
];

const getToday = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
};

const TambahAnakanDokaPage = () => {
  useDocumentTitle('Tambah Stok DOKA dari Anakan');
  const navigate = useNavigate();

  const [form, setForm] = useState({
    eartag: '',
    id_klasifikasi_hewan: '',
    jenis_kelamin: 'JANTAN',
    tgl_lahir: getToday(),
    berat_lahir: '',
    mother_pid: '',
    father_pid: '',
    catatan: '',
  });
  const [klasifikasiOptions, setKlasifikasiOptions] = useState([]);
  const [loadingKlasifikasi, setLoadingKlasifikasi] = useState(false);
  const [motherRow, setMotherRow] = useState(null);
  const [fatherRow, setFatherRow] = useState(null);
  const [motherModalOpen, setMotherModalOpen] = useState(false);
  const [fatherModalOpen, setFatherModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotif = useCallback((type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingKlasifikasi(true);
      const res = await StokDokaService.getKlasifikasiOptions();
      if (res.success) {
        setKlasifikasiOptions(res.data?.options || []);
      }
      setLoadingKlasifikasi(false);
    })();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectMother = (row) => {
    setMotherRow(row);
    handleChange('mother_pid', row.value);
  };

  const handleSelectFather = (row) => {
    setFatherRow(row);
    handleChange('father_pid', row.value);
  };

  const clearMother = () => {
    setMotherRow(null);
    handleChange('mother_pid', '');
  };

  const clearFather = () => {
    setFatherRow(null);
    handleChange('father_pid', '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!form.eartag.trim()) {
      showNotif('error', 'ID / Ear Tag wajib diisi');
      return;
    }
    if (!form.id_klasifikasi_hewan) {
      showNotif('error', 'Klasifikasi (kambing/domba) wajib dipilih');
      return;
    }
    if (!form.tgl_lahir) {
      showNotif('error', 'Tanggal lahir wajib diisi');
      return;
    }

    setSaving(true);
    const payload = {
      eartag: form.eartag.trim(),
      id_klasifikasi_hewan: form.id_klasifikasi_hewan,
      jenis_kelamin: form.jenis_kelamin,
      tgl_lahir: form.tgl_lahir,
      berat_lahir: form.berat_lahir ? parseInt(form.berat_lahir, 10) : null,
      mother_pid: form.mother_pid || null,
      father_pid: form.father_pid || null,
      catatan: form.catatan || null,
    };

    const res = await StokDokaService.storeAnakan(payload);
    setSaving(false);

    if (res.success) {
      showNotif('success', res.message || 'Anakan DOKA berhasil ditambahkan');
      setTimeout(() => navigate('/rph/stok-doka'), 1200);
    } else {
      showNotif('error', res.message || 'Gagal menambahkan anakan DOKA');
    }
  };

  const handleCancel = () => navigate('/rph/stok-doka');

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
                <h1 className="text-lg font-bold text-gray-900">Tambah Stok DOKA dari Anakan</h1>
                <p className="text-sm text-gray-500">Catat kelahiran kambing/domba baru masuk ke inventory</p>
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
                      placeholder="Contoh: DOKA-025"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500">
                      Klasifikasi (Kambing/Domba) <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={klasifikasiOptions}
                      value={form.id_klasifikasi_hewan}
                      onChange={(val) => handleChange('id_klasifikasi_hewan', val || '')}
                      placeholder="Pilih klasifikasi"
                      isLoading={loadingKlasifikasi}
                      isDisabled={saving}
                      isClearable={false}
                      accentColor="green"
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
                    {motherRow ? (
                      <div className="flex items-center justify-between rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2">
                        <div className="text-sm">
                          <div className="font-medium text-gray-800">
                            {motherRow.eartag_supplier || motherRow.eartag_kode || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {motherRow.jenis_hewan || '-'} · {motherRow.jenis_klasifikasi || '-'} · {motherRow.jenis_kelamin_label}
                            {motherRow.berat ? ` · ${motherRow.berat} KG` : ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearMother}
                          disabled={saving}
                          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setMotherModalOpen(true)}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-md border border-dashed border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Search className="h-4 w-4" />
                        Pilih DOKA betina... (opsional)
                      </button>
                    )}
                    <p className="text-xs text-gray-400">Opsional — boleh dikosongkan</p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500">Induk Jantan / Pejantan</label>
                    {fatherRow ? (
                      <div className="flex items-center justify-between rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2">
                        <div className="text-sm">
                          <div className="font-medium text-gray-800">
                            {fatherRow.eartag_supplier || fatherRow.eartag_kode || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {fatherRow.jenis_hewan || '-'} · {fatherRow.jenis_klasifikasi || '-'} · {fatherRow.jenis_kelamin_label}
                            {fatherRow.berat ? ` · ${fatherRow.berat} KG` : ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearFather}
                          disabled={saving}
                          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setFatherModalOpen(true)}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-md border border-dashed border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Search className="h-4 w-4" />
                        Pilih DOKA jantan... (opsional)
                      </button>
                    )}
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
                      <li>Induk hanya bisa dipilih dari kambing/domba (bukan sapi)</li>
                      <li>Induk betina otomatis filter DOKA betina</li>
                      <li>Induk jantan otomatis filter DOKA jantan</li>
                      <li>Tidak boleh memilih diri sendiri sebagai induk</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs text-emerald-800">
                  <p className="font-semibold">Sumber Stok: BIRTH</p>
                  <p className="mt-1">
                    DOKA hasil kelahiran akan masuk ke inventory dengan source <code>BIRTH</code>, status
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

      <ParentPickerDokaModal
        open={motherModalOpen}
        onClose={() => setMotherModalOpen(false)}
        onSelect={handleSelectMother}
        jenisKelamin="BETINA"
        title="Pilih Induk Betina"
      />
      <ParentPickerDokaModal
        open={fatherModalOpen}
        onClose={() => setFatherModalOpen(false)}
        onSelect={handleSelectFather}
        jenisKelamin="JANTAN"
        title="Pilih Induk Jantan"
      />
    </div>
  );
};

export default TambahAnakanDokaPage;
