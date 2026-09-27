import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2, Save, Calendar, Scale, FileText, Trash2, Plus } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';
import StokSapiService from '../../../../services/stokSapiService';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const Toast = ({ notification, onClose }) => {
  if (!notification) return null;

  const config = {
    success: {
      border: 'border-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600',
      title: 'Berhasil!',
      icon: CheckCircle2,
    },
    info: {
      border: 'border-sky-500',
      iconBg: 'bg-sky-50 text-sky-600',
      title: 'Memproses...',
      icon: Loader2,
    },
    error: {
      border: 'border-red-500',
      iconBg: 'bg-red-50 text-red-600',
      title: 'Gagal!',
      icon: AlertCircle,
    },
  }[notification.type] || {
    border: 'border-slate-500',
    iconBg: 'bg-slate-50 text-slate-600',
    title: 'Informasi',
    icon: AlertCircle,
  };

  const Icon = config.icon;

  return (
    <div className="fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-sm">
      <div className={`overflow-hidden rounded-xl border-l-4 ${config.border} bg-white shadow-lg ring-1 ring-black/5`}>
        <div className="flex items-start gap-3 p-4">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.iconBg}`}>
            <Icon className={`h-4 w-4 ${notification.type === 'info' ? 'animate-spin' : ''}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{config.title}</p>
            <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup notifikasi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, required = false, helperText, children }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {required ? <span className="ml-1 text-rose-500">*</span> : null}
    </label>
    {children}
    {helperText ? <p className="text-xs text-slate-400">{helperText}</p> : null}
  </div>
);

const PotongPaksaModal = ({ isOpen, onClose, onSuccess, cowData, editData }) => {
  const [tglPotongPaksa, setTglPotongPaksa] = useState(getToday());
  const [idSebabPotongPaksa, setIdSebabPotongPaksa] = useState(null);
  const [bobotSebelum, setBobotSebelum] = useState('');
  const [details, setDetails] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);
  const [biayaTambahan, setBiayaTambahan] = useState('0');
  const [modal, setModal] = useState(null);
  const [detailReady, setDetailReady] = useState(false);
  const totalHasil = details.reduce((sum, row) => sum + Number(row.berat || 0), 0);
  const bobotSelisih = Math.round((Number(bobotSebelum || 0) - totalHasil) * 1000) / 1000;
  const rupiah = value => value == null ? 'Belum tersedia' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
  const changeDetail = (index, field, value) => setDetails(rows => rows.map((row, i) => i === index ? { ...row, [field]: value } : row));
  const [idMengetahui, setIdMengetahui] = useState(null);
  const [keterangan, setKeterangan] = useState('');
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [sebabOptions, setSebabOptions] = useState([]);
  const [mengetahuiOptions, setMengetahuiOptions] = useState([]);

  const [loadingSebab, setLoadingSebab] = useState(false);
  const [loadingMengetahui, setLoadingMengetahui] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchSebabOptions = useCallback(async () => {
    setLoadingSebab(true);
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PARAMETERS}/dataByGroup`, {
        group: 'sebab_potong_paksa'
      });
      if (response.data && Array.isArray(response.data)) {
        setSebabOptions(response.data.map(item => ({
          value: parseInt(item.value),
          label: item.name
        })));
      }
    } catch (err) {
      console.error('Error fetching sebab options:', err);
    }
    setLoadingSebab(false);
  }, []);

  const fetchMengetahuiOptions = useCallback(async () => {
    setLoadingMengetahui(true);
    try {
      const response = await HttpClient.get(`${API_ENDPOINTS.MASTER.PERSETUJUAN_RPH}/data`, {
        cache: true
      });
      if (response.data && Array.isArray(response.data)) {
        setMengetahuiOptions(response.data.map(item => ({
          value: item.id,
          label: item.name || 'Unknown'
        })));
      }
    } catch (err) {
      console.error('Error fetching mengetahui options:', err);
    }
    setLoadingMengetahui(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSebabOptions();
      fetchMengetahuiOptions();
      StokSapiService.getItemPotongOptions().then(response => {
        if (response.success && Array.isArray(response.data)) setItemOptions(response.data);
        else setNotification({ type: 'error', message: 'Gagal memuat master hasil potong.' });
      }).catch(() => setNotification({ type: 'error', message: 'Gagal memuat master hasil potong.' }));
    }
  }, [isOpen, fetchSebabOptions, fetchMengetahuiOptions]);

  useEffect(() => {
    const fetchDetail = async () => {
      if (editData?.pid) {
        setIsLoadingDetail(true);
        try {
          const response = await StokSapiService.showPotongPaksa(editData.pid);
          if (response.success && response.data) {
            const data = response.data;
            
            setTglPotongPaksa(data.tgl_potong_paksa_raw || '');
            setBobotSebelum(data.bobot_sebelum_potong ?? '');
            setDetails((data.detail || []).map(row => ({ ...row, estimasi_harga_jual_per_kg: row.estimasi_harga_jual_per_kg ?? '' })));
            setBiayaTambahan(data.biaya_tambahan ?? '0');
            setModal(data.nilai_modal_snapshot ?? null);
            setDetailReady(true);
            setIdSebabPotongPaksa(data.id_sebab_potong_paksa);
            setIdMengetahui(data.id_mengetahui);
            setKeterangan(data.keterangan || '');
            
          } else {
            setNotification({ type: 'error', message: 'Gagal memuat detail data.' });
          }
        } catch (err) {
          console.error('Error fetching detail:', err);
          setNotification({ type: 'error', message: 'Gagal memuat detail data.' });
        } finally {
          setIsLoadingDetail(false);
        }
      }
    };

    if (isOpen && editData) {
      setDetailReady(false);
      setTglPotongPaksa('');
      setIdSebabPotongPaksa(editData.id_sebab_potong_paksa);
      setIdMengetahui(editData.id_mengetahui);
      setKeterangan(editData.keterangan || '');
      
      // Then fetch the full detail
      fetchDetail();
    } else if (isOpen) {
      setTglPotongPaksa(getToday());
      setIdSebabPotongPaksa(null);
      setBobotSebelum(cowData?.bobot ?? cowData?.berat ?? '');
      setModal(cowData?.total_harga ?? null);
      setDetails([]);
      setBiayaTambahan('0');
      setDetailReady(true);
      setIdMengetahui(null);
      setKeterangan('');
    }
  }, [isOpen, editData, cowData]);

  useEffect(() => {
    if (!notification || notification.type === 'info') return undefined;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  const handleClose = () => {
    if (isSubmitting) return;
    setTglPotongPaksa(getToday());
    setIdSebabPotongPaksa(null);
    setDetails([]);
    setIdMengetahui(null);
    setKeterangan('');
    setNotification(null);
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || isLoadingDetail || !detailReady) return;

    if (!tglPotongPaksa) {
      setNotification({ type: 'error', message: 'Tanggal potong paksa wajib diisi.' });
      return;
    }

    if (!idSebabPotongPaksa) {
      setNotification({ type: 'error', message: 'Sebab potong paksa wajib dipilih.' });
      return;
    }

    if (!Number.isFinite(Number(bobotSebelum)) || Number(bobotSebelum) <= 0 || bobotSelisih <= 0 || !details.length) {
      setNotification({ type: 'error', message: 'Isi bobot sebelum potong dan minimal satu hasil. Total berat hasil harus kurang dari bobot sebelum potong. Bobot selisih harus lebih besar dari 0 kg.' });
      return;
    }
    if (details.some(row => !row.id_item_potong || !Number.isFinite(Number(row.berat)) || Number(row.berat) <= 0)
      || new Set(details.map(row => Number(row.id_item_potong))).size !== details.length
      || biayaTambahan === '' || !Number.isFinite(Number(biayaTambahan)) || Number(biayaTambahan) < 0) {
      setNotification({ type: 'error', message: 'Periksa item unik, berat positif, dan biaya tambahan nonnegatif.' });
      return;
    }

    if (!idMengetahui) {
      setNotification({ type: 'error', message: 'Mengetahui wajib dipilih.' });
      return;
    }

    setIsSubmitting(true);
    setNotification({ type: 'info', message: editData ? 'Memperbarui data potong paksa...' : 'Menyimpan data potong paksa...' });

    const payload = {
      pid: editData ? editData.pid : cowData?.pid,
      tgl_potong_paksa: tglPotongPaksa,
      id_sebab_potong_paksa: parseInt(idSebabPotongPaksa),
      bobot_sebelum_potong: Number(bobotSebelum),
      biaya_tambahan: Number(biayaTambahan),
      detail: details.map(row => ({ id_jenis_potong: Number(row.id_jenis_potong), id_item_potong: Number(row.id_item_potong), berat: Number(row.berat), estimasi_harga_jual_per_kg: row.estimasi_harga_jual_per_kg === '' ? null : Number(row.estimasi_harga_jual_per_kg) })),
      id_mengetahui: parseInt(idMengetahui),
      keterangan: keterangan.trim() || null,
    };

    try {
    const response = editData 
      ? await StokSapiService.updatePotongPaksa(payload)
      : await StokSapiService.potongPaksa(payload);

    if (response.success) {
      setNotification({ type: 'success', message: response.message || 'Data potong paksa berhasil disimpan.' });
      setIsSubmitting(false);
      onClose();
      if (onSuccess) onSuccess();
      return;
    }

    setNotification({ type: 'error', message: response.message || 'Gagal menyimpan data potong paksa.' });
    setIsSubmitting(false);
    } catch (error) {
      setNotification({ type: 'error', message: error.message || 'Gagal menyimpan data potong paksa.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {notification && <Toast notification={notification} onClose={() => setNotification(null)} />}

      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div role="dialog" aria-modal="true" aria-label="Potong Paksa Sapi" className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl transform transition-all">
          <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-rose-500 to-pink-500" />

          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 p-3 text-white">
                <Scale className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editData ? 'Edit Potong Paksa Sapi' : 'Potong Paksa Sapi'}</h2>
                <p className="text-sm text-slate-500">Form potong paksa untuk sapi</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          <form id="potong-paksa-form" onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
            <p className="text-sm text-amber-800">Hasil boning dan kulit menambah stok saat disimpan. Catat hanya hasil layak dimanfaatkan. Selisih berat bukan kerugian rupiah.</p>
            <Field label="Bobot sebelum potong (kg)" required>
              <input aria-label="Bobot sebelum potong (kg)" type="number" min="0.001" step="0.001" required value={bobotSebelum} onChange={e => setBobotSebelum(e.target.value)} className="border rounded p-2 w-full" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tanggal Potong Paksa" required>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={tglPotongPaksa}
                    onChange={(e) => setTglPotongPaksa(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                    required
                  />
                </div>
              </Field>

              <Field label="Bobot selisih (kg)" helperText="Otomatis: bobot sebelum potong dikurangi boning dan kulit tercatat. Harus lebih besar dari 0 kg. Termasuk bagian lain yang belum dirinci.">
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    value={bobotSelisih}
                    readOnly
                    aria-label="Bobot selisih (kg)"
                    step="0.001"
                    placeholder="0"
                    min="0.001"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                    required
                  />
                </div>
              </Field>
            </div>

            <Field label="Sebab Potong Paksa" required>
              <SearchableSelect
                options={sebabOptions}
                value={idSebabPotongPaksa}
                onChange={setIdSebabPotongPaksa}
                placeholder={loadingSebab ? 'Memuat...' : 'Pilih sebab potong paksa'}
                isLoading={loadingSebab}
                isDisabled={loadingSebab || isSubmitting}
              />
            </Field>

            <Field label="Mengetahui" required>
              <SearchableSelect
                options={mengetahuiOptions}
                value={idMengetahui}
                onChange={setIdMengetahui}
                placeholder={loadingMengetahui ? 'Memuat...' : 'Pilih yang mengetahui'}
                isLoading={loadingMengetahui}
                isDisabled={loadingMengetahui || isSubmitting}
              />
            </Field>

            <section className="space-y-3" aria-label="Hasil potong">
              <h3 className="font-semibold">Hasil potong layak dimanfaatkan</h3>
              {details.map((row, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] border rounded p-3">
                  <Field label="Item hasil" required>
                    <SearchableSelect
                      aria-label={`Item hasil ${index + 1}`}
                      options={itemOptions.filter(item => [1, 3].includes(Number(item.id_jenis_potong))).map(item => ({
                        value: Number(item.id),
                        label: `${Number(item.id_jenis_potong) === 3 ? 'Kulit' : 'Boning'} - ${item.name}`,
                      }))}
                      value={Number(row.id_item_potong) || null}
                      onChange={value => {
                        const item = itemOptions.find(option => Number(option.id) === value);
                        setDetails(rows => rows.map((current, i) => i === index ? { ...current, id_item_potong: item?.id || '', id_jenis_potong: Number(item?.id_jenis_potong) } : current));
                      }}
                      placeholder="Pilih item hasil"
                      isDisabled={isSubmitting || isLoadingDetail}
                    />
                  </Field>
                  <label>Berat (kg)<input aria-label={`Berat hasil ${index + 1}`} type="number" min="0.001" step="0.001" required value={row.berat} onChange={e => changeDetail(index, 'berat', e.target.value)} className="border rounded p-2 w-full" /></label>
                  <button type="button" aria-label={`Hapus hasil ${index + 1}`} title="Hapus hasil potong" onClick={() => setDetails(rows => rows.filter((_, i) => i !== index))} className="inline-flex h-10 w-10 items-center justify-center self-end justify-self-end rounded-lg text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors">
                    <Trash2 className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              ))}
              <button type="button" disabled={isSubmitting || isLoadingDetail} onClick={() => setDetails(rows => [...rows, { id_jenis_potong: 1, id_item_potong: '', berat: '', estimasi_harga_jual_per_kg: '' }])} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Tambah hasil potong
              </button>
              <p>Total hasil: {totalHasil.toLocaleString('id-ID', { maximumFractionDigits: 3 })} kg</p>
            </section>
            <Field label="Biaya tambahan (Rp)" helperText="Hanya biaya yang belum termasuk modal sapi; jangan dihitung dua kali.">
              <input aria-label="Biaya tambahan (Rp)" required type="number" min="0" step="0.01" value={biayaTambahan} onChange={e => setBiayaTambahan(e.target.value)} className="border rounded p-2 w-full" />
            </Field>
            <div className="rounded bg-slate-50 p-3 text-sm space-y-1" aria-live="polite">
              <p>Modal sapi (total_harga): {rupiah(modal)}. Snapshot ditentukan server saat simpan.</p>
            </div>
            <Field label="Keterangan" helperText="Opsional">
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Tambahkan keterangan jika diperlukan..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
                />
              </div>
            </Field>
          </form>

          <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              form="potong-paksa-form"
              disabled={isSubmitting || isLoadingDetail || !detailReady}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Potong Paksa
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PotongPaksaModal;