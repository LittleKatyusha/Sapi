import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle, History } from 'lucide-react';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import StokSapiService from '../../../services/stokSapiService';
import { Notification } from '../../../components/shared/NotificationComponent';
import SearchableSelect from '../../../components/shared/SearchableSelect';

const JENIS_KELAMIN_OPTIONS = [
  { value: 'JANTAN', label: 'Jantan' },
  { value: 'BETINA', label: 'Betina' },
  { value: 'BELUM_DIKETAHUI', label: 'Belum Diketahui' },
];

const EMPTY_FORM = {
  berat: '',
  kondisi: '',
  jenis_kelamin: '',
};

const formatDateTime = (dt) => {
  if (!dt) return '-';
  try {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return String(dt);
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dt);
  }
};

const EditStokSapiPage = () => {
  useDocumentTitle('Edit Stok Sapi');
  const navigate = useNavigate();
  const { pid } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [kondisiOptions, setKondisiOptions] = useState([]);
  const [meta, setMeta] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!pid) return;
    setHistoryLoading(true);
    try {
      const res = await StokSapiService.history(pid);
      if (res.success) {
        setHistory(res.data?.rows || []);
      }
    } catch (err) {
      console.error('fetchHistory error:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [pid]);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detailRes, optionsRes] = await Promise.all([
        StokSapiService.show(pid),
        StokSapiService.getFilterOptions(),
      ]);

      if (!detailRes.success) {
        throw new Error(detailRes.message || 'Gagal memuat data sapi');
      }

      const data = detailRes.data || {};
      setMeta(data);
      setForm({
        berat: data.bobot ? String(data.bobot) : '',
        kondisi: '',
        jenis_kelamin: data.jenis_kelamin || '',
      });

      if (optionsRes.success && optionsRes.data?.kondisi) {
        setKondisiOptions(optionsRes.data.kondisi);
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat memuat data');
      showNotification('error', err?.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }, [pid, showNotification]);

  useEffect(() => {
    if (!pid) {
      setError('PID tidak ditemukan di URL');
      setLoading(false);
      return;
    }
    fetchInitial();
    fetchHistory();
  }, [pid, fetchInitial, fetchHistory]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    navigate('/rph/stok-sapi');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    try {
      const payload = { pid };
      if (form.berat !== '') payload.berat = Number(form.berat);
      if (form.kondisi !== '') payload.kondisi = form.kondisi;
      if (form.jenis_kelamin !== '') payload.jenis_kelamin = form.jenis_kelamin;

      const result = await StokSapiService.update(payload);
      if (result.success) {
        showNotification('success', result.message || 'Data berhasil diperbarui');
        fetchHistory();
      } else {
        showNotification('error', result.message || 'Gagal memperbarui data');
      }
    } catch (err) {
      showNotification('error', err?.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] space-y-4 p-3 sm:p-4">
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50"
              title="Kembali"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Edit Stok Sapi</h1>
              <p className="text-sm text-gray-500">Perbarui bobot & kondisi sapi</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-10 shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <span className="ml-2 text-sm text-gray-600">Memuat data...</span>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-2 shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Gagal memuat data</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Info sapi */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Informasi Sapi</h2>
                <div className="space-y-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-gray-500">Jenis Sapi</span>
                    <span className="text-sm text-gray-800">{meta?.jenis_sapi || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-gray-500">Eartag</span>
                    <span className="text-sm text-gray-800">{meta?.eartag || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-gray-500">Eartag Supplier</span>
                    <span className="text-sm text-gray-800">{meta?.eartag_supplier || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-gray-500">RPH</span>
                    <span className="text-sm text-gray-800">{meta?.nama_rph || meta?.lokasi_sapi || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-gray-500">Pemasok</span>
                    <span className="text-sm text-gray-800">{meta?.pemasok || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-gray-500">No Nota</span>
                    <span className="text-sm text-gray-800">{meta?.nomor_nota || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-gray-500">Tgl Kedatangan</span>
                    <span className="text-sm text-gray-800">{meta?.tanggal_kedatangan || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-gray-500">Kondisi Saat Ini</span>
                    <span className="text-sm text-gray-800">{meta?.kondisi_sapi || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-gray-500">Jenis Kelamin Saat Ini</span>
                    <span className="text-sm text-gray-800">
                      {JENIS_KELAMIN_OPTIONS.find((o) => o.value === meta?.jenis_kelamin)?.label || 'Belum diketahui'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form edit */}
              <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-2"
              >
                <h2 className="text-sm font-semibold text-gray-700">Ubah Bobot, Kondisi & Jenis Kelamin</h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500">Bobot (KG)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.berat}
                      onChange={(e) => handleChange('berat', e.target.value)}
                      placeholder="Bobot saat ini"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                    />
                    <p className="text-xs text-gray-400">Kosongkan jika tidak mengubah bobot</p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500">Kondisi</label>
                    <SearchableSelect
                      options={kondisiOptions}
                      value={form.kondisi}
                      onChange={(val) => handleChange('kondisi', val || '')}
                      placeholder="— Tidak ubah —"
                      isDisabled={saving}
                      isClearable
                      accentColor="green"
                    />
                    <p className="text-xs text-gray-400">Pilih kondisi baru jika ingin mengubah</p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500">Jenis Kelamin</label>
                    <SearchableSelect
                      options={JENIS_KELAMIN_OPTIONS}
                      value={form.jenis_kelamin}
                      onChange={(val) => handleChange('jenis_kelamin', val || '')}
                      placeholder="— Tidak ubah —"
                      isDisabled={saving}
                      isClearable
                      accentColor="green"
                    />
                    <p className="text-xs text-gray-400">Pilih jenis kelamin jika ingin mengubah</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
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
                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Simpan
                  </button>
                </div>
              </form>
            </div>

            {/* History datatable */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                <History className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-700">Riwayat Perubahan</h2>
                <span className="ml-auto text-xs text-gray-500">{history.length} catatan</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse" style={{ minWidth: '700px' }}>
                  <thead>
                    <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                      <th className="py-2 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap" style={{ width: '50px' }}>No</th>
                      <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Tanggal</th>
                      <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Field</th>
                      <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Nilai Lama</th>
                      <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Nilai Baru</th>
                      <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Diubah Oleh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLoading && (
                      <tr>
                        <td colSpan={6} className="py-8 px-3 text-center border border-gray-100">
                          <div className="flex items-center justify-center gap-2 text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Memuat riwayat...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {!historyLoading && history.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 px-3 text-center border border-gray-100">
                          <p className="text-sm font-medium text-gray-500">Belum ada riwayat perubahan</p>
                          <p className="text-xs mt-1 text-gray-400">Perubahan bobot & kondisi akan tampil di sini</p>
                        </td>
                      </tr>
                    )}
                    {!historyLoading && history.length > 0 && history.map((row, index) => (
                      <tr
                        key={index}
                        className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="py-2 px-3 text-center font-medium text-gray-600 border border-gray-100">{index + 1}</td>
                        <td className="py-2 px-3 text-gray-700 border border-gray-100 whitespace-nowrap">{formatDateTime(row.tanggal)}</td>
                        <td className="py-2 px-3 text-gray-700 border border-gray-100">{row.field}</td>
                        <td className="py-2 px-3 text-gray-500 border border-gray-100">{row.nilai_lama ?? '-'}</td>
                        <td className="py-2 px-3 font-medium text-gray-800 border border-gray-100">{row.nilai_baru ?? '-'}</td>
                        <td className="py-2 px-3 text-gray-700 border border-gray-100">{row.oleh ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
};

export default EditStokSapiPage;
