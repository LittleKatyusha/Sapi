import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DataTable from 'react-data-table-component';
import {
  Activity, Loader2, RefreshCw, Search, X,
  Plus, Eye, Pencil, Trash2, AlertTriangle,
  Calendar, CheckCircle, Clock,
} from 'lucide-react';
import DofRphService from '../../../services/dofRphService';

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
  headRow: { style: { backgroundColor: '#f0fdf4', fontWeight: '700', fontSize: '13px', color: '#166534' } },
  rows: { style: { fontSize: '13px', '&:hover': { backgroundColor: '#f0fdf4' } } },
  pagination: { style: { borderTop: '1px solid #bbf7d0' } },
};

const StatusBadge = ({ status }) => {
  if (status === 1 || status === '1') {
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" />Selesai</span>;
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" />Proses</span>;
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────

const DeleteModal = ({ item, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-full bg-red-100"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
        <div>
          <h3 className="font-bold text-gray-800">Hapus Data DOF</h3>
          <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        Hapus DOF <strong>{item?.order_no}</strong> — total <strong>{item?.total_hari} hari</strong> ({formatCurrency(item?.total_harga)})?
      </p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} disabled={loading}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">
          Batal
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition">
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
    DofRphService.show(pid).then((r) => { setData(r.data); setLoading(false); });
  }, [pid]);

  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-5 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Detail DOF RPH</h2>
            <p className="text-sm text-green-100 mt-0.5">Rincian catatan Disetop Over Feed</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : !data ? (
            <p className="text-center text-gray-500 py-8">Data tidak ditemukan</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Nomor Order</span><p className="font-semibold font-mono">{data.order_no}</p></div>
                <div><span className="text-gray-500">Status</span><p className="mt-0.5"><StatusBadge status={data.status} /></p></div>
                <div><span className="text-gray-500">Total Hari</span><p className="font-semibold">{data.total_hari} hari</p></div>
                <div><span className="text-gray-500">Total Harga</span><p className="font-bold text-green-700">{formatCurrency(data.total_harga)}</p></div>
                <div><span className="text-gray-500">ID Pembelian Detail</span><p className="font-semibold">{data.id_tr_ho_pembelian_detail}</p></div>
                <div><span className="text-gray-500">Dibuat</span><p className="font-semibold">{formatDate(data.created_at)}</p></div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Detail Item DOF</h4>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-green-50 text-green-900 font-semibold">
                    <tr>
                      <th className="text-left px-3 py-2">No.</th>
                      <th className="text-left px-3 py-2">ID Tarif DOF</th>
                      <th className="text-right px-3 py-2">Tanggal DOF</th>
                      <th className="text-right px-3 py-2">Harga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.detail || []).map((d, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                        <td className="px-3 py-2">{d.id_master_dof}</td>
                        <td className="px-3 py-2 text-right">{formatDate(d.tgl_dof)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{formatCurrency(d.harga)}</td>
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

const EMPTY_ITEM = { id_master_dof: '', harga: '', tgl_dof: '' };

const AddEditModal = ({ mode, initial, onClose, onSaved }) => {
  const user = getCurrentUser();
  const idOffice = user?.id_office;

  const [orderNo, setOrderNo] = useState('');
  const [idPembelianDetail, setIdPembelianDetail] = useState('');
  const [status, setStatus] = useState('0');
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [tarifList, setTarifList] = useState([]);
  const [loadingTarif, setLoadingTarif] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Load tarif list on mount
  useEffect(() => {
    if (!idOffice) return;
    setLoadingTarif(true);
    DofRphService.getTarif({ idOffice }).then((r) => {
      if (r.success) setTarifList(r.data);
      setLoadingTarif(false);
    });
  }, [idOffice]);

  // Pre-fill on edit — load existing detail items
  useEffect(() => {
    if (mode === 'edit' && initial?.pid) {
      setOrderNo(initial.order_no || '');
      setIdPembelianDetail(initial.id_tr_ho_pembelian_detail || '');
      setStatus(String(initial.status ?? 0));
      // Load full detail
      DofRphService.show(initial.pid).then((r) => {
        if (r.success && r.data?.detail?.length) {
          setItems(r.data.detail.map((d) => ({
            id_master_dof: String(d.id_master_dof || ''),
            harga: d.harga || '',
            tgl_dof: d.tgl_dof ? d.tgl_dof.split('T')[0] : '',
          })));
        }
      });
    }
  }, [mode, initial]);

  const handleTarifChange = (i, idTarif) => {
    const tarif = tarifList.find((t) => String(t.id) === String(idTarif));
    setItems((prev) => prev.map((row, idx) =>
      idx === i ? { ...row, id_master_dof: idTarif, harga: tarif?.harga ?? row.harga } : row
    ));
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const setItemField = (i, k, v) => setItems((prev) => prev.map((row, idx) => idx === i ? { ...row, [k]: v } : row));

  const validate = () => {
    const e = {};
    if (!orderNo.trim()) e.orderNo = 'Nomor order wajib diisi';
    if (!idPembelianDetail) e.idPembelianDetail = 'ID Pembelian Detail wajib diisi';
    if (!items.length || items.some((it) => !it.id_master_dof || !it.harga || !it.tgl_dof)) {
      e.items = 'Isi semua kolom setiap baris (tarif, harga, tanggal)';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setSaving(true);
    try {
      const mappedItems = items.map((it) => ({
        id_master_dof: Number(it.id_master_dof),
        harga: Number(it.harga),
        tgl_dof: it.tgl_dof,
      }));

      let result;
      if (mode === 'edit') {
        result = await DofRphService.update({
          pid: initial.pid,
          order_no: orderNo,
          status: Number(status),
          items: mappedItems,
        });
      } else {
        result = await DofRphService.store({
          id_tr_ho_pembelian_detail: Number(idPembelianDetail),
          order_no: orderNo,
          items: mappedItems,
        });
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
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-5 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{mode === 'edit' ? 'Edit' : 'Tambah'} DOF RPH</h2>
            <p className="text-sm text-green-100 mt-0.5">Catatan biaya pakan/perawatan per ekor ternak</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          {errors._general && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{errors._general}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nomor Order DOF" error={errors.orderNo} required>
              <input
                type="text"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                placeholder="DOF-202605170001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono"
              />
            </Field>

            <Field label="ID Pembelian HO Detail" error={errors.idPembelianDetail} required>
              <input
                type="number"
                min="1"
                value={idPembelianDetail}
                onChange={(e) => setIdPembelianDetail(e.target.value)}
                placeholder="ID ternak dari tr_pembelian_ho_detail"
                disabled={mode === 'edit'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-0.5">ID baris ternak dari tabel detail pembelian HO</p>
            </Field>

            {mode === 'edit' && (
              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="0">Proses</option>
                  <option value="1">Selesai</option>
                </select>
              </Field>
            )}
          </div>

          {/* Detail Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Detail Tarif DOF <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-1">(satu baris per hari)</span>
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-green-700 hover:text-green-900 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-green-50 transition"
              >
                <Plus className="w-3 h-3" /> Tambah Baris
              </button>
            </div>
            {errors.items && <p className="text-xs text-red-500 mb-2">{errors.items}</p>}
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <select
                    value={it.id_master_dof}
                    onChange={(e) => handleTarifChange(i, e.target.value)}
                    disabled={loadingTarif}
                    className="flex-1 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 min-w-0"
                  >
                    <option value="">{loadingTarif ? 'Memuat...' : '-- Pilih Tarif --'}</option>
                    {tarifList.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} — {formatCurrency(t.harga)}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={it.harga}
                    onChange={(e) => setItemField(i, 'harga', e.target.value)}
                    placeholder="Harga"
                    className="w-32 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <input
                    type="date"
                    value={it.tgl_dof}
                    onChange={(e) => setItemField(i, 'tgl_dof', e.target.value)}
                    className="w-36 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {items.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {items.length} hari — Total: <strong>{formatCurrency(items.reduce((s, it) => s + (Number(it.harga) || 0), 0))}</strong>
              </p>
            )}
          </div>
        </form>

        <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 disabled:opacity-50 flex items-center gap-2 transition"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const DofRphPage = () => {
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

  const [modal, setModal] = useState(null); // null | { type: 'add'|'edit'|'detail'|'delete', item }

  const searchTimer = useRef(null);

  const showNotif = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
  }, []);

  const fetchData = useCallback(async (page = 1, rows = perPage) => {
    setLoading(true);
    const result = await DofRphService.getData({
      draw: page,
      start: (page - 1) * rows,
      length: rows,
      search,
      startDate,
      endDate,
    });
    if (result.success) {
      setData(result.data);
      setTotalRecords(result.recordsFiltered);
    }
    setLoading(false);
  }, [search, startDate, endDate, perPage]);

  useEffect(() => {
    document.title = 'DOF RPH | TernaSys';
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
    const result = await DofRphService.hapus(modal.item.pid);
    if (result.success) {
      showNotif(result.message || 'Data berhasil dihapus');
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
      name: 'Nomor Order',
      selector: (r) => r.order_no,
      cell: (r) => <span className="font-mono text-xs font-semibold text-green-800 bg-green-50 px-1.5 py-0.5 rounded">{r.order_no}</span>,
    },
    {
      name: 'Total Hari',
      selector: (r) => r.total_hari,
      cell: (r) => <span className="text-sm font-medium">{r.total_hari} hari</span>,
      width: '110px',
      center: true,
    },
    {
      name: 'Total Harga',
      selector: (r) => r.total_harga,
      cell: (r) => <span className="text-sm font-semibold text-green-700">{formatCurrency(r.total_harga)}</span>,
      right: true,
    },
    {
      name: 'Status',
      cell: (r) => <StatusBadge status={r.status} />,
      width: '110px',
      center: true,
    },
    {
      name: 'Dibuat',
      selector: (r) => r.created_at,
      cell: (r) => <span className="text-sm text-gray-600">{formatDate(r.created_at)}</span>,
      width: '130px',
    },
    {
      name: 'Aksi',
      width: '120px',
      center: true,
      cell: (r) => (
        <div className="flex gap-1">
          <button
            onClick={() => setModal({ type: 'detail', item: r })}
            title="Detail"
            className="p-1.5 rounded hover:bg-green-50 text-green-600 hover:text-green-800 transition"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setModal({ type: 'edit', item: r })}
            title="Edit"
            className="p-1.5 rounded hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setModal({ type: 'delete', item: r })}
            title="Hapus"
            className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], [currentPage, perPage]);

  return (
    <div className="space-y-5">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
          notification.type === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {notification.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-xl"><Activity className="w-6 h-6" /></div>
          <div>
            <h1 className="text-xl font-bold">DOF RPH</h1>
            <p className="text-green-100 text-sm mt-0.5">Kelola data Disetop Over Feed — biaya pakan & perawatan ternak per hari</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nomor order..."
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-52 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <span className="text-gray-400 text-sm">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <button
              onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); }}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchData(currentPage, perPage)}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setModal({ type: 'add', item: null })}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg transition"
            >
              <Plus className="w-4 h-4" /> Tambah DOF
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
          progressComponent={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          }
          pagination
          paginationServer
          paginationTotalRows={totalRecords}
          paginationDefaultPage={currentPage}
          onChangePage={handlePageChange}
          onChangeRowsPerPage={handlePerRowsChange}
          customStyles={tableStyles}
          noDataComponent={
            <div className="py-12 text-center text-gray-500">
              <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium">Belum ada data DOF RPH</p>
              <button
                onClick={() => setModal({ type: 'add', item: null })}
                className="mt-3 text-green-700 hover:text-green-800 text-sm font-medium flex items-center gap-1 mx-auto"
              >
                <Plus className="w-4 h-4" /> Tambah data pertama
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

export default DofRphPage;
