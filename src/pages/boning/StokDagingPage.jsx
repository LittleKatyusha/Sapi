import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DataTable from 'react-data-table-component';
import {
  Package, Loader2, RefreshCw, Search, X,
  Plus, Eye, Pencil, Trash2, AlertTriangle,
  Calendar, ShoppingCart,
} from 'lucide-react';
import PenjualanKarkasService, { BAGIAN_KARKAS } from '../../services/penjualanKarkasService';
import PenjualanBoningService from '../../services/penjualanBoningService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

const formatDate = (v) => {
  if (!v) return '-';
  return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getCurrentUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
};

const tableStyles = {
  headRow: { style: { backgroundColor: '#fdf4ff', fontWeight: '700', fontSize: '13px', color: '#7e22ce' } },
  rows: { style: { fontSize: '13px', '&:hover': { backgroundColor: '#fdf4ff' } } },
  pagination: { style: { borderTop: '1px solid #e9d5ff' } },
};

const TipeBadge = ({ tipe }) => {
  if (tipe === 1) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Cash</span>;
  if (tipe === 2) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Kredit</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">-</span>;
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────

const DeleteModal = ({ item, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-full bg-red-100"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
        <div>
          <h3 className="font-bold text-gray-800">Hapus Penjualan Karkas</h3>
          <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        Hapus transaksi <strong>{item?.nota_sistem}</strong> — <strong>{item?.nama_pedagang}</strong> ({formatCurrency(item?.total_bayar)})?
      </p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} disabled={loading} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">Batal</button>
        <button onClick={onConfirm} disabled={loading} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />} Hapus
        </button>
      </div>
    </div>
  </div>
);

// ─── Detail Modal ─────────────────────────────────────────────────────────────

const DetailModal = ({ pid, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    PenjualanKarkasService.show(pid).then((r) => { setData(r.data); setLoading(false); });
  }, [pid]);

  const getBagianLabel = (val) => BAGIAN_KARKAS.find((b) => b.value === val)?.label || val;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-5 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Detail Penjualan Karkas</h2>
            <p className="text-sm text-purple-100 mt-0.5">Rincian transaksi penjualan karkas</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
          ) : !data ? (
            <p className="text-center text-gray-500 py-8">Data tidak ditemukan</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Nota</span><p className="font-semibold">{data.penjualan?.nota_sistem}</p></div>
                <div><span className="text-gray-500">Tgl Pemotongan</span><p className="font-semibold">{formatDate(data.penjualan?.tgl_pemotongan)}</p></div>
                <div><span className="text-gray-500">Pedagang</span><p className="font-semibold">{data.pedagang?.nama_alias || data.pedagang?.nama_identitas || '-'}</p></div>
                <div><span className="text-gray-500">ID Pedagang</span><p className="font-semibold">{data.pedagang?.id_pedagang || '-'}</p></div>
                <div><span className="text-gray-500">Tipe Pembayaran</span><p><TipeBadge tipe={data.penjualan?.tipe_pembayaran} /></p></div>
                <div><span className="text-gray-500">Ongkos Kirim</span><p className="font-semibold">{data.penjualan?.is_gratis_ongkir ? 'Gratis' : formatCurrency(data.penjualan?.ongkos_kirim)}</p></div>
                <div><span className="text-gray-500">Total Harga</span><p className="font-semibold text-purple-700">{formatCurrency(data.penjualan?.total_harga)}</p></div>
                <div><span className="text-gray-500">Total Bayar</span><p className="font-bold text-green-700">{formatCurrency(data.penjualan?.total_bayar)}</p></div>
              </div>
              {data.penjualan?.note && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm"><span className="text-gray-500">Catatan: </span>{data.penjualan.note}</div>
              )}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Detail Bagian Karkas</h4>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-purple-50 text-purple-900 font-semibold">
                    <tr>
                      <th className="text-left px-3 py-2">Bagian</th>
                      <th className="text-right px-3 py-2">Berat Bersih</th>
                      <th className="text-right px-3 py-2">Berat Kulit</th>
                      <th className="text-right px-3 py-2">Harga/kg</th>
                      <th className="text-right px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.detail || []).map((d, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2">{getBagianLabel(d.bagian_karkas)}</td>
                        <td className="px-3 py-2 text-right">{d.berat_bersih} kg</td>
                        <td className="px-3 py-2 text-right">{d.berat_kulit ? `${d.berat_kulit} kg` : '-'}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(d.harga_satuan)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{formatCurrency(d.total_harga)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t shrink-0 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition">Tutup</button>
        </div>
      </div>
    </div>
  );
};

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

const EMPTY_FORM = {
  tgl_pemotongan: new Date().toISOString().split('T')[0],
  pid_pedagang: '',
  tipe_pembayaran: '1',
  is_gratis_ongkir: true,
  ongkos_kirim: '',
  note: '',
};

const initDetailRows = () =>
  BAGIAN_KARKAS.map((b) => ({ bagian_karkas: b.value, berat_bersih: '', berat_kulit: '', harga: '' }));

const AddEditModal = ({ mode, initial, onClose, onSaved }) => {
  const user = getCurrentUser();
  const idOffice = user?.id_office;

  const [form, setForm] = useState(EMPTY_FORM);
  const [details, setDetails] = useState(initDetailRows());
  const [pedagangList, setPedagangList] = useState([]);
  const [hargaKarkas, setHargaKarkas] = useState(null);
  const [loadingPedagang, setLoadingPedagang] = useState(false);
  const [loadingHarga, setLoadingHarga] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!idOffice) return;
    setLoadingPedagang(true);
    PenjualanBoningService.getPedagang(idOffice).then((r) => {
      if (r.success) setPedagangList(r.data);
      setLoadingPedagang(false);
    });
  }, [idOffice]);

  useEffect(() => {
    if (mode === 'edit' && initial) {
      setForm({
        tgl_pemotongan: initial.tgl_pemotongan || '',
        pid_pedagang: initial.pid || '',
        tipe_pembayaran: String(initial.tipe_pembayaran || 1),
        is_gratis_ongkir: Boolean(initial.is_gratis_ongkir),
        ongkos_kirim: initial.ongkos_kirim || '',
        note: initial.note || '',
      });
      if (initial.detail?.length) {
        const rows = initDetailRows();
        initial.detail.forEach((d) => {
          const idx = rows.findIndex((r) => r.bagian_karkas === d.bagian_karkas);
          if (idx >= 0) {
            rows[idx] = { bagian_karkas: d.bagian_karkas, berat_bersih: d.berat_bersih || '', berat_kulit: d.berat_kulit || '', harga: d.harga_satuan || '' };
          }
        });
        setDetails(rows);
      }
    }
  }, [mode, initial]);

  const handlePedagangChange = async (pid) => {
    setForm((f) => ({ ...f, pid_pedagang: pid }));
    if (!pid) { setHargaKarkas(null); return; }
    setLoadingHarga(true);
    const r = await PenjualanKarkasService.getHarga(pid);
    if (r.success && r.data?.harga_karkas) {
      const hk = r.data.harga_karkas;
      setHargaKarkas(hk);
      setDetails((rows) => rows.map((row) => ({
        ...row,
        harga: hk[row.bagian_karkas] ?? row.harga,
      })));
    }
    setLoadingHarga(false);
  };

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setDetail = (i, k, v) => setDetails((d) => d.map((row, idx) => idx === i ? { ...row, [k]: v } : row));

  const validate = () => {
    const e = {};
    if (!form.tgl_pemotongan) e.tgl_pemotongan = 'Tanggal wajib diisi';
    if (!form.pid_pedagang) e.pid_pedagang = 'Pedagang wajib dipilih';
    const hasData = details.some((d) => d.berat_bersih && d.harga);
    if (!hasData) e.detail = 'Isi minimal satu bagian karkas (berat + harga)';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setSaving(true);
    try {
      const filledDetails = details
        .filter((d) => d.berat_bersih && d.harga)
        .map((d) => ({
          bagian_karkas: d.bagian_karkas,
          id_pembelian_ho_detail: null,
          berat_bersih: Number(d.berat_bersih),
          berat_kulit: d.berat_kulit ? Number(d.berat_kulit) : null,
          harga: Number(d.harga),
        }));

      const payload = {
        id_office: idOffice,
        pid_pedagang: form.pid_pedagang,
        tgl_pemotongan: form.tgl_pemotongan,
        tipe_pembayaran: Number(form.tipe_pembayaran),
        is_gratis_ongkir: form.is_gratis_ongkir,
        ongkos_kirim: form.is_gratis_ongkir ? 0 : (Number(form.ongkos_kirim) || 0),
        note: form.note || null,
        detail: filledDetails,
      };

      let result;
      if (mode === 'edit') {
        result = await PenjualanKarkasService.update({ pid: initial.pid, ...payload });
      } else {
        result = await PenjualanKarkasService.store(payload);
      }
      if (result.success) {
        onSaved(result.message);
      } else {
        setErrors({ _general: result.message });
      }
    } catch (err) {
      setErrors({ _general: err?.message || 'Terjadi kesalahan' });
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, error, required, children }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-5 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{mode === 'edit' ? 'Edit' : 'Tambah'} Penjualan Karkas</h2>
            <p className="text-sm text-purple-100 mt-0.5">4 bagian karkas: paha belakang & depan</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          {errors._general && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex gap-2">
              <X className="w-4 h-4 shrink-0 mt-0.5" />{errors._general}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tanggal Pemotongan" error={errors.tgl_pemotongan} required>
              <input type="date" value={form.tgl_pemotongan} onChange={(e) => setF('tgl_pemotongan', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
            </Field>

            <Field label="Pedagang" error={errors.pid_pedagang} required>
              <select value={form.pid_pedagang} onChange={(e) => handlePedagangChange(e.target.value)} disabled={loadingPedagang}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                <option value="">{loadingPedagang ? 'Memuat...' : '-- Pilih Pedagang --'}</option>
                {pedagangList.map((p) => (
                  <option key={p.pubid} value={p.pid}>{p.nama_alias || p.nama_identitas} ({p.id_pedagang})</option>
                ))}
              </select>
              {loadingHarga && <p className="text-xs text-purple-500 mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Memuat harga...</p>}
            </Field>

            <Field label="Tipe Pembayaran" required>
              <select value={form.tipe_pembayaran} onChange={(e) => setF('tipe_pembayaran', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                <option value="1">Cash</option>
                <option value="2">Kredit</option>
              </select>
            </Field>

            <Field label="Ongkos Kirim">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={form.is_gratis_ongkir} onChange={(e) => setF('is_gratis_ongkir', e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  Gratis
                </label>
                {!form.is_gratis_ongkir && (
                  <input type="number" min="0" value={form.ongkos_kirim} onChange={(e) => setF('ongkos_kirim', e.target.value)} placeholder="Nominal ongkir"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                )}
              </div>
            </Field>
          </div>

          <Field label="Catatan">
            <textarea value={form.note} onChange={(e) => setF('note', e.target.value)} rows={2} placeholder="Catatan tambahan (opsional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none" />
          </Field>

          {/* Detail Bagian Karkas (fixed 4 rows) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detail Bagian Karkas <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(isi berat bagian yang dipotong)</span>
            </label>
            {errors.detail && <p className="text-xs text-red-500 mb-2">{errors.detail}</p>}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-purple-50 text-purple-800 font-semibold">
                  <tr>
                    <th className="text-left px-3 py-2">Bagian</th>
                    <th className="text-right px-3 py-2">Berat Bersih (kg)</th>
                    <th className="text-right px-3 py-2">Berat Kulit (kg)</th>
                    <th className="text-right px-3 py-2">Harga/kg</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d, i) => {
                    const label = BAGIAN_KARKAS.find((b) => b.value === d.bagian_karkas)?.label || d.bagian_karkas;
                    return (
                      <tr key={d.bagian_karkas} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-medium text-gray-700">{label}</td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" step="0.01" value={d.berat_bersih} onChange={(e) => setDetail(i, 'berat_bersih', e.target.value)}
                            placeholder="0"
                            className="w-full text-right border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-purple-400 focus:border-purple-400" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" step="0.01" value={d.berat_kulit} onChange={(e) => setDetail(i, 'berat_kulit', e.target.value)}
                            placeholder="opsional"
                            className="w-full text-right border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-purple-400 focus:border-purple-400" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" value={d.harga} onChange={(e) => setDetail(i, 'harga', e.target.value)}
                            placeholder="0"
                            className="w-full text-right border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-purple-400 focus:border-purple-400" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-3">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">Batal</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 transition">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const StokDagingPage = () => {
  const user = getCurrentUser();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [modal, setModal] = useState(null);

  const searchTimer = useRef(null);

  const showNotif = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
  }, []);

  const fetchData = useCallback(async (page = 1, rows = perPage) => {
    setLoading(true);
    const result = await PenjualanKarkasService.getData({
      draw: page,
      start: (page - 1) * rows,
      length: rows,
      search,
      startDate,
      endDate,
      idOffice: user?.id_office,
    });
    if (result.success) {
      setData(result.data);
      setTotalRecords(result.recordsFiltered);
    }
    setLoading(false);
  }, [search, startDate, endDate, perPage, user?.id_office]);

  useEffect(() => {
    document.title = 'Penjualan Karkas | TernaSys';
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setCurrentPage(1); fetchData(1, perPage); }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search, startDate, endDate]);

  const handlePageChange = (page) => { setCurrentPage(page); fetchData(page, perPage); };
  const handlePerRowsChange = (rows, page) => { setPerPage(rows); setCurrentPage(page); fetchData(page, rows); };

  const handleSaved = useCallback((message) => {
    showNotif(message);
    setModal(null);
    fetchData(currentPage, perPage);
  }, [showNotif, fetchData, currentPage, perPage]);

  const handleConfirmDelete = useCallback(async () => {
    if (!modal?.item) return;
    const result = await PenjualanKarkasService.hapus(modal.item.pid);
    if (result.success) {
      showNotif(result.message);
      setModal(null);
      fetchData(currentPage, perPage);
    } else {
      showNotif(result.message, 'error');
    }
  }, [modal, showNotif, fetchData, currentPage, perPage]);

  const columns = useMemo(() => [
    {
      name: 'No.',
      width: '60px',
      cell: (_, i) => <span className="text-gray-500 text-sm">{(currentPage - 1) * perPage + i + 1}</span>,
    },
    {
      name: 'Nota',
      selector: (r) => r.nota_sistem,
      cell: (r) => <span className="font-mono text-xs font-semibold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded">{r.nota_sistem}</span>,
    },
    {
      name: 'Tanggal',
      selector: (r) => r.tgl_pemotongan,
      cell: (r) => <span className="text-sm">{formatDate(r.tgl_pemotongan)}</span>,
      width: '130px',
    },
    {
      name: 'Pedagang',
      selector: (r) => r.nama_pedagang,
      cell: (r) => (
        <div>
          <p className="text-sm font-medium">{r.nama_pedagang || '-'}</p>
          {r.id_pedagang && <p className="text-xs text-gray-400">{r.id_pedagang}</p>}
        </div>
      ),
    },
    {
      name: 'Total Bayar',
      selector: (r) => r.total_bayar,
      cell: (r) => <span className="text-sm font-semibold text-green-700">{formatCurrency(r.total_bayar)}</span>,
      right: true,
    },
    {
      name: 'Tipe',
      cell: (r) => <TipeBadge tipe={r.tipe_pembayaran} />,
      width: '90px',
      center: true,
    },
    {
      name: 'Aksi',
      width: '120px',
      center: true,
      cell: (r) => (
        <div className="flex gap-1">
          <button onClick={() => setModal({ type: 'detail', item: r })} title="Detail"
            className="p-1.5 rounded hover:bg-purple-50 text-purple-600 hover:text-purple-800 transition"><Eye className="w-4 h-4" /></button>
          <button onClick={() => setModal({ type: 'edit', item: r })} title="Edit"
            className="p-1.5 rounded hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => setModal({ type: 'delete', item: r })} title="Hapus"
            className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ], [currentPage, perPage]);

  return (
    <div className="space-y-5">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
          notification.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {notification.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-500 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-xl"><Package className="w-6 h-6" /></div>
          <div>
            <h1 className="text-xl font-bold">Penjualan Karkas</h1>
            <p className="text-purple-100 text-sm mt-0.5">Kelola transaksi penjualan karkas (4 bagian paha) ke pedagang</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nota..."
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-52 focus:ring-2 focus:ring-purple-400 focus:border-purple-400" />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-400 focus:border-purple-400" />
              <span className="text-gray-400 text-sm">—</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-400 focus:border-purple-400" />
            </div>
            <button onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); }}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => fetchData(currentPage, perPage)} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setModal({ type: 'add', item: null })}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition">
              <Plus className="w-4 h-4" /> Tambah Penjualan
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          progressPending={loading}
          progressComponent={<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>}
          pagination
          paginationServer
          paginationTotalRows={totalRecords}
          paginationDefaultPage={currentPage}
          onChangePage={handlePageChange}
          onChangeRowsPerPage={handlePerRowsChange}
          customStyles={tableStyles}
          noDataComponent={
            <div className="py-12 text-center text-gray-500">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium">Belum ada data penjualan karkas</p>
              <button onClick={() => setModal({ type: 'add', item: null })}
                className="mt-3 text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1 mx-auto">
                <Plus className="w-4 h-4" /> Tambah transaksi pertama
              </button>
            </div>
          }
        />
      </div>

      {/* Modals */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <AddEditModal mode={modal.type} initial={modal.item} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.type === 'detail' && (
        <DetailModal pid={modal.item?.pid} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal item={modal.item} onConfirm={handleConfirmDelete} onCancel={() => setModal(null)} loading={loading} />
      )}
    </div>
  );
};

export default StokDagingPage;

            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Stok</p>
              <p className="text-2xl font-bold text-gray-900">2,450 kg</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Thermometer className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Fresh Stock</p>
              <p className="text-2xl font-bold text-gray-900">1,850 kg</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mendekati Expired</p>
              <p className="text-2xl font-bold text-gray-900">320 kg</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stok Minimum</p>
              <p className="text-2xl font-bold text-gray-900">8 item</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-8">
          <div className="text-center">
            <Package className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Stok Daging Boning</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Kelola inventaris daging hasil olahan boning dengan sistem tracking real-time.
            </p>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <Package className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="text-sm font-semibold text-blue-900">Inventory Tracking</h4>
              <p className="text-xs text-blue-700 mt-1">
                Real-time tracking stok berdasarkan grade, potongan, dan lokasi penyimpanan
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-800">Grade A:</span>
                  <span className="font-medium text-blue-900">850 kg</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-800">Grade B:</span>
                  <span className="font-medium text-blue-900">980 kg</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-800">Grade C:</span>
                  <span className="font-medium text-blue-900">620 kg</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <Thermometer className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="text-sm font-semibold text-green-900">Cold Storage Management</h4>
              <p className="text-xs text-green-700 mt-1">
                Monitor suhu, kelembaban, dan kondisi penyimpanan daging
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-green-800">Freezer 1:</span>
                  <span className="font-medium text-green-900">-18°C ✓</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-800">Freezer 2:</span>
                  <span className="font-medium text-green-900">-20°C ✓</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-800">Chiller:</span>
                  <span className="font-medium text-green-900">2°C ✓</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200">
              <Clock className="h-8 w-8 text-yellow-600 mb-3" />
              <h4 className="text-sm font-semibold text-yellow-900">Expiry Management</h4>
              <p className="text-xs text-yellow-700 mt-1">
                Sistem FIFO dan alert untuk produk mendekati tanggal kadaluarsa
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
              <AlertTriangle className="h-8 w-8 text-red-600 mb-3" />
              <h4 className="text-sm font-semibold text-red-900">Stock Alerts</h4>
              <p className="text-xs text-red-700 mt-1">
                Notifikasi otomatis untuk stok minimum dan kebutuhan restock
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors">
              <Package className="w-5 h-5 mr-2" />
              Kelola Stok
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StokDagingPage;
