import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle, Save, Handshake, AlertTriangle, Users, MoreVertical } from 'lucide-react';
import usePenawaranPenjualan from '../../../hooks/usePenawaranPenjualan';
import PedagangPickerModal from './PedagangPickerModal';

const formatRupiah = (val) => 'Rp ' + (Number(val || 0)).toLocaleString('id-ID');

const AddEditPenawaranPage = () => {
  const { pid } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(pid);
  const { loading, error, fetchDetail, store, update } = usePenawaranPenjualan();

  const [pedagangMap, setPedagangMap] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const [form, setForm] = useState({
    pid: '',
    tgl_pengajuan: new Date().toISOString().split('T')[0],
    diajukan_kepada: '',
    notes: '',
    detail: [],
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isEdit && pid) {
      const loadDetail = async () => {
        const result = await fetchDetail(pid);
        if (result.success && result.data) {
          const d = result.data;
          const detailMap = {};
          (d.detail || []).forEach(item => {
            detailMap[String(item.pedagang_id)] = item.pedagang;
          });
          setPedagangMap(detailMap);
          setForm({
            pid: d.pid,
            tgl_pengajuan: d.tgl_pengajuan?.split(' ')[0] || new Date().toISOString().split('T')[0],
            diajukan_kepada: d.diajukan_kepada || '',
            notes: d.notes || '',
            detail: (d.detail || []).map(item => ({
              pedagang_id: String(item.pedagang_id),
              saldo_awal: item.saldo_awal || 0,
              saldo_akhir: item.saldo_akhir || 0,
              angkatan_terakhir_nilai: item.angkatan_terakhir_nilai || 0,
              setoran_nilai: item.setoran_nilai || 0,
              tabungan: item.tabungan || 0,
              kulit: item.kulit || 0,
              deposit: item.deposit || 0,
            })),
          });
        }
      };
      loadDetail();
    }
  }, [isEdit, pid, fetchDetail]);

  const totalSaldo = useMemo(() => {
    return form.detail.reduce((sum, item) => sum + (Number(item.saldo_akhir) || 0), 0);
  }, [form.detail]);

  const openPicker = () => setPickerOpen(true);

  const handlePickerConfirm = (selectedItems) => {
    const newMap = { ...pedagangMap };
    selectedItems.forEach(p => {
      newMap[String(p.id)] = p;
    });
    setPedagangMap(newMap);
    setForm(prev => ({
      ...prev,
      detail: [
        ...prev.detail,
        ...selectedItems.map(p => ({
          pedagang_id: String(p.id),
          saldo_awal: Number(p.saldo_akhir) || 0,
          saldo_akhir: Number(p.saldo_akhir) || 0,
          angkatan_terakhir_nilai: 0,
          setoran_nilai: 0,
          tabungan: Number(p.tabungan) || 0,
          kulit: Number(p.kulit) || 0,
          deposit: Number(p.deposit_pedagang) || 0,
        })),
      ],
    }));
  };

  const removePedagang = (idx) => {
    setForm(prev => ({ ...prev, detail: prev.detail.filter((_, i) => i !== idx) }));
  };

  const excludeIds = form.detail.map(d => Number(d.pedagang_id));

  const validate = () => {
    const errors = {};
    if (!form.tgl_pengajuan) errors.tgl_pengajuan = 'Tanggal wajib diisi';
    if (!form.detail.length) errors.detail = 'Minimal 1 pedagang';
    else {
      const seen = new Set();
      form.detail.forEach((item, i) => {
        if (!item.pedagang_id) errors[`d_${i}_pedagang`] = 'Wajib dipilih';
        else if (seen.has(item.pedagang_id)) errors[`d_${i}_pedagang`] = 'Duplikat pedagang';
        else seen.add(item.pedagang_id);
        if (Number(item.saldo_akhir) <= 0) errors[`d_${i}_saldo`] = 'Saldo akhir > 0';
      });
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      tgl_pengajuan: form.tgl_pengajuan,
      diajukan_kepada: form.diajukan_kepada ? Number(form.diajukan_kepada) : null,
      notes: form.notes,
      detail: form.detail.map(d => ({
        pedagang_id: Number(d.pedagang_id),
        saldo_awal: Number(d.saldo_awal) || 0,
        saldo_akhir: Number(d.saldo_akhir) || 0,
        angkatan_terakhir_nilai: Number(d.angkatan_terakhir_nilai) || 0,
        setoran_nilai: Number(d.setoran_nilai) || 0,
        tabungan: Number(d.tabungan) || 0,
        kulit: Number(d.kulit) || 0,
        deposit: Number(d.deposit) || 0,
      })),
    };
    if (isEdit) payload.pid = form.pid;
    const result = isEdit ? await update(payload) : await store(payload);
    if (result.success) navigate('/rph/penawaran', { state: { fromForm: true, action: isEdit ? 'edit' : 'create' } });
  };

  return (
    <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-800 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Handshake className="w-6 h-6 text-emerald-600" />
              {isEdit ? 'Edit Penawaran Dispensasi' : 'Buat Penawaran Dispensasi'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Penawaran dispensasi untuk pedagang dengan masalah pembayaran / saldo tinggi</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Informasi Utama</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tanggal Pengajuan <span className="text-red-500">*</span></label>
                <input type="date" value={form.tgl_pengajuan} onChange={(e) => setForm(prev => ({ ...prev, tgl_pengajuan: e.target.value }))} className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition ${formErrors.tgl_pengajuan ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 focus:ring-emerald-500/20 focus:border-emerald-500'}`} />
                {formErrors.tgl_pengajuan && <p className="text-xs text-red-500 mt-1">{formErrors.tgl_pengajuan}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Catatan</label>
                <input type="text" value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Catatan tambahan..." className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
              </div>
            </div>
          </div>

          {/* Pedagang Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Pedagang Dispensasi</h2>
                <p className="text-xs text-gray-500 mt-0.5">Klik "Tambah Pedagang" untuk memilih via modal pencarian</p>
              </div>
              <button type="button" onClick={openPicker} className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition">
                <Plus className="w-3.5 h-3.5" />
                Tambah Pedagang
              </button>
            </div>

            <div className="space-y-2">
              {form.detail.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  Belum ada pedagang. Klik "Tambah Pedagang" untuk memulai.
                </div>
              )}

              {/* Column header */}
              {form.detail.length > 0 && (
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                  <div className="col-span-12 sm:col-span-4">Pedagang</div>
                  <div className="col-span-3 sm:col-span-2 text-right">Saldo Awal</div>
                  <div className="col-span-3 sm:col-span-2 text-right">Saldo Akhir</div>
                  <div className="col-span-2 sm:col-span-1 text-right">Tabungan</div>
                  <div className="col-span-2 sm:col-span-1 text-right">Deposit</div>
                  <div className="col-span-2 sm:col-span-1 text-center">Status</div>
                  <div className="col-span-1 text-center">Aksi</div>
                </div>
              )}

              {form.detail.map((item, idx) => {
                const p = pedagangMap[item.pedagang_id];
                const hasDispensasi = p?.is_dispensasi === 1;
                return (
                  <div key={idx} className={`grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg border transition ${hasDispensasi ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-gray-100 hover:border-emerald-200'}`}>
                    {/* Pedagang info — read only */}
                    <div className="col-span-12 sm:col-span-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold flex-shrink-0">
                          {(p?.nama_alias || p?.nama_identitas || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{p?.nama_alias || p?.nama_identitas || '-'}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{p?.id_pedagang || '-'}</p>
                        </div>
                      </div>
                      {formErrors[`d_${idx}_pedagang`] && <p className="text-xs text-red-500 mt-1">{formErrors[`d_${idx}_pedagang`]}</p>}
                      {hasDispensasi && (
                        <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Dispensasi aktif
                        </p>
                      )}
                    </div>
                    {/* Read-only fields */}
                    <div className="col-span-3 sm:col-span-2 text-right">
                      <span className="text-sm text-gray-600 tabular-nums">{formatRupiah(item.saldo_awal)}</span>
                    </div>
                    <div className="col-span-3 sm:col-span-2 text-right">
                      <span className="text-sm font-semibold text-gray-800 tabular-nums">{formatRupiah(item.saldo_akhir)}</span>
                      {formErrors[`d_${idx}_saldo`] && <p className="text-[10px] text-red-500 mt-0.5">{formErrors[`d_${idx}_saldo`]}</p>}
                    </div>
                    <div className="col-span-2 sm:col-span-1 text-right">
                      <span className="text-sm text-gray-600 tabular-nums">{formatRupiah(item.tabungan)}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1 text-right">
                      <span className="text-sm text-gray-600 tabular-nums">{formatRupiah(item.deposit)}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1 text-center">
                      {p ? (
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full ${hasDispensasi ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                          {hasDispensasi ? 'Aktif' : 'OK'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-300">-</span>
                      )}
                    </div>
                    <div className="col-span-1 text-center relative">
                      <button
                        type="button"
                        onClick={() => setOpenMenuIdx(openMenuIdx === idx ? null : idx)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenuIdx === idx && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenuIdx(null)} />
                          <div className="absolute right-0 top-full mt-1 z-50 w-40 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => { removePedagang(idx); setOpenMenuIdx(null); }}
                              className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus Pedagang
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {formErrors.detail && <p className="text-xs text-red-500">{formErrors.detail}</p>}

            {/* Total */}
            <div className="flex justify-end items-center gap-4 pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">Total Saldo</span>
              <span className="text-xl font-bold text-emerald-600">{formatRupiah(totalSaldo)}</span>
            </div>
          </div>

          {/* Pedagang Picker Modal */}
          <PedagangPickerModal
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onConfirm={handlePickerConfirm}
            excludeIds={excludeIds}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/rph/penawaran')} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition">Batal</button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? 'Simpan Perubahan' : 'Simpan Draft'}
            </button>
          </div>
        </form>
      </div>
  );
};

export default AddEditPenawaranPage;
