import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DataTable from 'react-data-table-component';
import {
  TrendingUp, Package, Loader2, RefreshCw, Search, X,
  Plus, Eye, Pencil, Trash2, AlertTriangle,
  Calendar, User, ShoppingCart,
} from 'lucide-react';
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
  headRow: { style: { backgroundColor: '#fef9c3', fontWeight: '700', fontSize: '13px', color: '#854d0e' } },
  rows: { style: { fontSize: '13px', '&:hover': { backgroundColor: '#fef9c3' } } },
  pagination: { style: { borderTop: '1px solid #fde68a' } },
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
          <h3 className="font-bold text-gray-800">Hapus Penjualan Boning</h3>
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
    PenjualanBoningService.show(pid).then((r) => { setData(r.data); setLoading(false); });
  }, [pid]);

  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-5 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Detail Penjualan Boning</h2>
            <p className="text-sm text-yellow-100 mt-0.5">Rincian transaksi penjualan</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-yellow-600" /></div>
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
                <div><span className="text-gray-500">Total Harga</span><p className="font-semibold text-yellow-700">{formatCurrency(data.penjualan?.total_harga)}</p></div>
                <div><span className="text-gray-500">Total Bayar</span><p className="font-bold text-green-700">{formatCurrency(data.penjualan?.total_bayar)}</p></div>
              </div>
              {data.penjualan?.note && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm"><span className="text-gray-500">Catatan: </span>{data.penjualan.note}</div>
              )}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Detail Item Boning</h4>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-yellow-50 text-yellow-900 font-semibold">
                    <tr>
                      <th className="text-left px-3 py-2">Item Boning</th>
                      <th className="text-right px-3 py-2">Berat (kg)</th>
                      <th className="text-right px-3 py-2">Harga/kg</th>
                      <th className="text-right px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.detail || []).map((d, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2">{d.nama_boning || d.id_boning}</td>
                        <td className="px-3 py-2 text-right">{d.berat_bersih}</td>
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
const EMPTY_DETAIL = { id_boning: '', berat: '', harga: '' };

const AddEditModal = ({ mode, initial, onClose, onSaved }) => {
  const user = getCurrentUser();
  const idOffice = user?.id_office;

  const [form, setForm] = useState(EMPTY_FORM);
  const [details, setDetails] = useState([{ ...EMPTY_DETAIL }]);
  const [pedagangList, setPedagangList] = useState([]);
  const [boningItems, setBoningItems] = useState([]);
  const [loadingPedagang, setLoadingPedagang] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Load pedagang & boning items on mount
  useEffect(() => {
    if (!idOffice) return;
    setLoadingPedagang(true);
    Promise.all([
      PenjualanBoningService.getPedagang(idOffice),
      PenjualanBoningService.getBoningItems(),
    ]).then(([pRes, bRes]) => {
      if (pRes.success) setPedagangList(pRes.data);
      if (bRes.success) setBoningItems(bRes.data);
      setLoadingPedagang(false);
    });
  }, [idOffice]);

  // Pre-fill on edit
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
        setDetails(initial.detail.map((d) => ({
          id_boning: String(d.id_boning || ''),
          berat: d.berat_bersih || '',
          harga: d.harga_satuan || '',
        })));
      }
    }
  }, [mode, initial]);

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addDetailRow = () => setDetails((d) => [...d, { ...EMPTY_DETAIL }]);
  const removeDetailRow = (i) => setDetails((d) => d.filter((_, idx) => idx !== i));
  const setDetail = (i, k, v) => setDetails((d) => d.map((row, idx) => idx === i ? { ...row, [k]: v } : row));

  // Auto-fill harga from boning item default
  const handleBoningChange = (i, id_boning) => {
    const item = boningItems.find((b) => String(b.id) === String(id_boning));
    setDetails((d) => d.map((row, idx) => idx === i ? { ...row, id_boning, harga: item?.harga || row.harga } : row));
  };

  const validate = () => {
    const e = {};
    if (!form.tgl_pemotongan) e.tgl_pemotongan = 'Tanggal wajib diisi';
    if (!form.pid_pedagang) e.pid_pedagang = 'Pedagang wajib dipilih';
    if (!details.length || details.some((d) => !d.id_boning || !d.berat || !d.harga)) {
      e.detail = 'Isi semua kolom detail (item boning, berat, harga)';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setSaving(true);
    try {
      const payload = {
        id_office: idOffice,
        pid_pedagang: form.pid_pedagang,
        tgl_pemotongan: form.tgl_pemotongan,
        tipe_pembayaran: Number(form.tipe_pembayaran),
        is_gratis_ongkir: form.is_gratis_ongkir,
        ongkos_kirim: form.is_gratis_ongkir ? 0 : (Number(form.ongkos_kirim) || 0),
        note: form.note || null,
        detail: details.map((d) => ({
          id_boning: Number(d.id_boning),
          berat: Number(d.berat),
          harga: Number(d.harga),
        })),
      };
      let result;
      if (mode === 'edit') {
        result = await PenjualanBoningService.update({ pid: initial.pid, ...payload });
      } else {
        result = await PenjualanBoningService.store(payload);
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
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-5 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{mode === 'edit' ? 'Edit' : 'Tambah'} Penjualan Boning</h2>
            <p className="text-sm text-yellow-100 mt-0.5">Transaksi penjualan boning ke pedagang</p>
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500" />
            </Field>

            <Field label="Pedagang" error={errors.pid_pedagang} required>
              <select value={form.pid_pedagang} onChange={(e) => setF('pid_pedagang', e.target.value)} disabled={loadingPedagang}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500">
                <option value="">{loadingPedagang ? 'Memuat...' : '-- Pilih Pedagang --'}</option>
                {pedagangList.map((p) => (
                  <option key={p.pubid} value={p.pid}>{p.nama_alias || p.nama_identitas} ({p.id_pedagang})</option>
                ))}
              </select>
            </Field>

            <Field label="Tipe Pembayaran" required>
              <select value={form.tipe_pembayaran} onChange={(e) => setF('tipe_pembayaran', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500">
                <option value="1">Cash</option>
                <option value="2">Kredit</option>
              </select>
            </Field>

            <Field label="Ongkos Kirim">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={form.is_gratis_ongkir} onChange={(e) => setF('is_gratis_ongkir', e.target.checked)}
                    className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500" />
                  Gratis
                </label>
                {!form.is_gratis_ongkir && (
                  <input type="number" min="0" value={form.ongkos_kirim} onChange={(e) => setF('ongkos_kirim', e.target.value)} placeholder="Nominal ongkir"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500" />
                )}
              </div>
            </Field>
          </div>

          <Field label="Catatan">
            <textarea value={form.note} onChange={(e) => setF('note', e.target.value)} rows={2} placeholder="Catatan tambahan (opsional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none" />
          </Field>

          {/* Detail Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Detail Item Boning <span className="text-red-500">*</span></label>
              <button type="button" onClick={addDetailRow}
                className="text-xs text-yellow-700 hover:text-yellow-900 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-yellow-50 transition">
                <Plus className="w-3 h-3" /> Tambah Baris
              </button>
            </div>
            {errors.detail && <p className="text-xs text-red-500 mb-2">{errors.detail}</p>}
            <div className="space-y-2">
              {details.map((d, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <select value={d.id_boning} onChange={(e) => handleBoningChange(i, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500">
                    <option value="">-- Pilih Boning --</option>
                    {boningItems.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <input type="number" min="0" step="0.01" value={d.berat} onChange={(e) => setDetail(i, 'berat', e.target.value)} placeholder="Berat (kg)"
                    className="w-28 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500" />
                  <input type="number" min="0" value={d.harga} onChange={(e) => setDetail(i, 'harga', e.target.value)} placeholder="Harga/kg"
                    className="w-32 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500" />
                  {details.length > 1 && (
                    <button type="button" onClick={() => removeDetailRow(i)} className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-3">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">Batal</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 rounded-lg bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2 transition">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PenjualanPage = () => {
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

  // Modal state
  const [modal, setModal] = useState(null); // null | { type: 'add'|'edit'|'detail'|'delete', item }

  const searchTimer = useRef(null);

  const showNotif = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
  }, []);

  const fetchData = useCallback(async (page = 1, rows = perPage) => {
    setLoading(true);
    const result = await PenjualanBoningService.getData({
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
    document.title = 'Penjualan Boning | TernaSys';
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
    const result = await PenjualanBoningService.hapus(modal.item.pid);
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
      cell: (r) => <span className="font-mono text-xs font-semibold text-yellow-800 bg-yellow-50 px-1.5 py-0.5 rounded">{r.nota_sistem}</span>,
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
            className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600 hover:text-yellow-800 transition"><Eye className="w-4 h-4" /></button>
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
      <div className="bg-gradient-to-r from-yellow-600 to-orange-500 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <h1 className="text-xl font-bold">Penjualan Boning</h1>
            <p className="text-yellow-100 text-sm mt-0.5">Kelola transaksi penjualan boning ke pedagang</p>
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
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-52 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400" />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400" />
              <span className="text-gray-400 text-sm">—</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400" />
            </div>
            <button onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); }}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => fetchData(currentPage, perPage)} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setModal({ type: 'add', item: null })}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition">
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
          progressComponent={<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>}
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
              <p className="text-sm font-medium">Belum ada data penjualan boning</p>
              <button onClick={() => setModal({ type: 'add', item: null })}
                className="mt-3 text-yellow-600 hover:text-yellow-700 text-sm font-medium flex items-center gap-1 mx-auto">
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

export default PenjualanPage;

