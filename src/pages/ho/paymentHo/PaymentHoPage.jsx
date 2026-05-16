import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import DataTable from 'react-data-table-component';
import {
  CreditCard, Search, X, Loader2, RefreshCw, Plus, Eye, Trash2,
  CheckSquare, Square, CheckCheck, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Clock, DollarSign, Layers,
  FileText, CalendarDays, Upload, ExternalLink
} from 'lucide-react';
import PaymentHoService, { PURCHASE_TYPES, PAYMENT_STATUS } from '../../../services/paymentHoService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const tableCustomStyles = {
  headRow: { style: { backgroundColor: '#f0fdf4', fontWeight: '700', fontSize: '13px', color: '#166534' } },
  rows: { style: { fontSize: '13px', '&:hover': { backgroundColor: '#f0fdf4' } } },
  pagination: { style: { borderTop: '1px solid #86efac' } },
};

// ─── Shared UI ─────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const s = PAYMENT_STATUS[status] ?? { label: String(status ?? '-'), bgClass: 'bg-gray-100', textClass: 'text-gray-600' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${s.bgClass} ${s.textClass}`}>
      {status === 1 && <CheckCircle className="w-3 h-3" />}
      {status === 0 && <Clock className="w-3 h-3" />}
      {status === 2 && <AlertTriangle className="w-3 h-3" />}
      {s.label}
    </span>
  );
};

const SisaBadge = ({ tagihan, terbayar }) => {
  const sisa = (tagihan || 0) - (terbayar || 0);
  if (sisa <= 0) return <span className="text-green-700 font-semibold text-xs">Lunas</span>;
  return <span className="font-semibold text-xs text-orange-700">{fmt(sisa)}</span>;
};

// ─── Add Cicilan Modal ─────────────────────────────────────────────────────────

const AddCicilanModal = ({ isOpen, payment, onClose, onSaved }) => {
  const [form, setForm] = useState({ amount: '', payment_date: '', note: '', file_upload: null });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  useEffect(() => {
    if (isOpen) { setForm({ amount: '', payment_date: '', note: '', file_upload: null }); setErrors({}); }
  }, [isOpen]);

  const sisa = payment ? (payment.total_tagihan || 0) - (payment.total_terbayar || 0) : 0;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = 'Jumlah harus > 0';
    if (sisa > 0 && Number(form.amount) > sisa) e.amount = `Melebihi sisa tagihan (${fmt(sisa)})`;
    if (!form.payment_date) e.payment_date = 'Tanggal pembayaran wajib diisi';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setSaving(true);
    try {
      await PaymentHoService.storeDetail({
        id_pembayaran: payment.id,
        amount: Number(form.amount),
        payment_date: form.payment_date,
        note: form.note.trim() || undefined,
        file_upload: form.file_upload,
      });
      onSaved('Cicilan berhasil ditambahkan.');
    } catch (err) {
      setErrors({ _general: err?.message || 'Gagal menyimpan cicilan.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Tambah Cicilan</h2>
            <p className="text-sm text-green-100 mt-0.5">{payment.nota_sistem || payment.nota || `ID ${payment.id}`}</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors._general && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex gap-2">
              <X className="w-4 h-4 shrink-0 mt-0.5" />{errors._general}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 bg-green-50 rounded-lg p-3 text-sm">
            <div><p className="text-xs text-green-600 font-medium">Total Tagihan</p><p className="font-bold text-green-800">{fmt(payment.total_tagihan)}</p></div>
            <div><p className="text-xs text-green-600 font-medium">Sisa Hutang</p><p className="font-bold text-orange-700">{fmt(sisa)}</p></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Cicilan (Rp) <span className="text-red-500">*</span></label>
            <input type="number" min="0" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-300 focus:border-green-400 outline-none ${errors.amount ? 'border-red-400' : 'border-gray-300'}`} />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pembayaran <span className="text-red-500">*</span></label>
            <input type="date" value={form.payment_date} onChange={(e) => set('payment_date', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-300 focus:border-green-400 outline-none ${errors.payment_date ? 'border-red-400' : 'border-gray-300'}`} />
            {errors.payment_date && <p className="text-xs text-red-500 mt-1">{errors.payment_date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <input type="text" value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Opsional"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-300 focus:border-green-400 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bukti Pembayaran</label>
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition text-sm text-gray-500">
              {form.file_upload ? (
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <FileText className="w-4 h-4" />
                  <span className="truncate max-w-xs">{form.file_upload.name}</span>
                  <button type="button" onClick={(ev) => { ev.stopPropagation(); set('file_upload', null); }} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div><Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" /><span>Klik untuk upload</span><p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — maks 5MB</p></div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={(e) => set('file_upload', e.target.files?.[0] || null)} />
          </div>
        </form>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">Batal</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}Simpan Cicilan
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Detail Panel Modal ────────────────────────────────────────────────────────

const DetailModal = ({ isOpen, payment, onClose, onAddCicilan }) => {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    if (!payment?.id) return;
    setLoading(true);
    PaymentHoService.getPaymentDetails(payment.id)
      .then((d) => setDetails(Array.isArray(d) ? d : d?.data || []))
      .catch(() => setDetails([]))
      .finally(() => setLoading(false));
  }, [payment?.id]);

  useEffect(() => { if (isOpen) load(); }, [isOpen, load]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await PaymentHoService.deleteDetail(id);
      load();
    } catch { /* silently fail */ }
    finally { setDeleting(null); }
  };

  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-green-700 to-teal-700 px-6 py-5 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Detail Pembayaran</h2>
            <p className="text-sm text-green-100 mt-0.5">{payment.nota_sistem || payment.nota || `ID #${payment.id}`}</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition"><X className="w-5 h-5" /></button>
        </div>

        {/* Summary Row */}
        <div className="px-6 py-3 bg-green-50 border-b border-green-100 grid grid-cols-3 gap-3 shrink-0">
          <div className="text-sm">
            <p className="text-xs text-green-600 font-medium">Total Tagihan</p>
            <p className="font-bold text-green-800">{fmt(payment.total_tagihan)}</p>
          </div>
          <div className="text-sm">
            <p className="text-xs text-green-600 font-medium">Total Terbayar</p>
            <p className="font-bold text-green-800">{fmt(payment.total_terbayar)}</p>
          </div>
          <div className="text-sm">
            <p className="text-xs text-green-600 font-medium">Sisa</p>
            <SisaBadge tagihan={payment.total_tagihan} terbayar={payment.total_terbayar} />
          </div>
        </div>

        {/* Details List */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 text-sm">Riwayat Cicilan ({details.length})</h3>
            <button onClick={onAddCicilan}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition">
              <Plus className="w-3.5 h-3.5" /> Tambah Cicilan
            </button>
          </div>
          {loading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /> Memuat...</div>
          ) : details.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">Belum ada cicilan.</div>
          ) : (
            <div className="space-y-3">
              {details.map((d, i) => (
                <div key={d.id || i} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 shrink-0">
                      <DollarSign className="w-4 h-4 text-green-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{fmt(d.amount)}</p>
                      <p className="text-xs text-gray-500">{d.payment_date || '-'}{d.note ? ` — ${d.note}` : ''}</p>
                      {d.bukti_pembayaran_url && (
                        <a href={d.bukti_pembayaran_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                          <ExternalLink className="w-3 h-3" /> Lihat Bukti
                        </a>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(d.id)} disabled={deleting === d.id}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition disabled:opacity-50 shrink-0">
                    {deleting === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Bulk Action Bar ───────────────────────────────────────────────────────────

const BulkActionBar = ({ selected, onClear, onBulkUpdate, updating }) => {
  const [status, setStatus] = useState('1');
  const [settlementDate, setSettlementDate] = useState('');

  if (!selected.length) return null;

  const handleUpdate = () => onBulkUpdate({ payment_status: Number(status), settlement_date: settlementDate || null });

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 flex-wrap max-w-xl">
      <span className="text-sm font-semibold">{selected.length} dipilih</span>
      <select value={status} onChange={(e) => setStatus(e.target.value)}
        className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-600 outline-none">
        <option value="1">Lunas</option>
        <option value="0">Belum Lunas</option>
        <option value="2">Belum Bayar</option>
      </select>
      <input type="date" value={settlementDate} onChange={(e) => setSettlementDate(e.target.value)}
        className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-600 outline-none" />
      <button onClick={handleUpdate} disabled={updating}
        className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 transition flex items-center gap-1">
        {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
        Update Status
      </button>
      <button onClick={onClear} className="p-1.5 text-gray-400 hover:text-white transition"><X className="w-4 h-4" /></button>
    </div>
  );
};

// ─── Payment Table Per Tab ─────────────────────────────────────────────────────

const PaymentTable = ({ purchaseType, onOpenDetail }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [toggleCleared, setToggleCleared] = useState(false);

  // Summary
  const [totalTagihan, setTotalTagihan] = useState(0);
  const [totalTerbayar, setTotalTerbayar] = useState(0);

  const fetch = useCallback(async (page = currentPage, limit = perPage, q = search, sd = startDate, ed = endDate) => {
    setLoading(true);
    setError(null);
    try {
      const res = await PaymentHoService.getPayments({ page, perPage: limit, search: q, startDate: sd || null, endDate: ed || null, purchaseType });
      setRows(res.data || []);
      setTotalRecords(res.recordsFiltered || 0);
      const data = res.data || [];
      setTotalTagihan(data.reduce((a, r) => a + (Number(r.total_tagihan) || 0), 0));
      setTotalTerbayar(data.reduce((a, r) => a + (Number(r.total_terbayar) || 0), 0));
    } catch (err) {
      setError(err?.message || 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, search, startDate, endDate, purchaseType]);

  useEffect(() => { fetch(1, perPage, '', '', ''); }, [purchaseType]);

  const handleSearch = () => { setCurrentPage(1); fetch(1, perPage, search, startDate, endDate); };
  const handleClear = () => { setSearch(''); setStartDate(''); setEndDate(''); setCurrentPage(1); fetch(1, perPage, '', '', ''); };
  const handlePageChange = (p) => { setCurrentPage(p); fetch(p, perPage, search, startDate, endDate); };
  const handlePerRowsChange = (pp, p) => { setPerPage(pp); setCurrentPage(p); fetch(p, pp, search, startDate, endDate); };

  const handleBulkUpdate = async ({ payment_status, settlement_date }) => {
    setBulkUpdating(true);
    try {
      await PaymentHoService.bulkUpdateStatus({ payment_ids: selectedRows.map((r) => r.id), payment_status, settlement_date });
      setToggleCleared((v) => !v);
      setSelectedRows([]);
      fetch(currentPage, perPage, search, startDate, endDate);
    } catch { /* silently fail */ }
    finally { setBulkUpdating(false); }
  };

  const columns = useMemo(() => [
    {
      name: 'No',
      cell: (_, i) => (currentPage - 1) * perPage + i + 1,
      width: '50px',
      center: true,
    },
    {
      name: 'Nota Sistem',
      selector: (r) => r.nota_sistem,
      sortable: true,
      cell: (r) => <span className="font-mono text-xs text-green-700">{r.nota_sistem || '-'}</span>,
      minWidth: '140px',
    },
    {
      name: 'Tgl Masuk',
      selector: (r) => r.tgl_masuk,
      sortable: true,
      cell: (r) => r.tgl_masuk || '-',
      minWidth: '110px',
    },
    {
      name: 'Total Tagihan',
      selector: (r) => r.total_tagihan,
      sortable: true,
      right: true,
      cell: (r) => <span className="font-semibold text-xs">{fmt(r.total_tagihan)}</span>,
      minWidth: '130px',
    },
    {
      name: 'Terbayar',
      selector: (r) => r.total_terbayar,
      right: true,
      cell: (r) => <span className="text-xs text-green-700 font-semibold">{fmt(r.total_terbayar)}</span>,
      minWidth: '120px',
    },
    {
      name: 'Sisa',
      right: true,
      cell: (r) => <SisaBadge tagihan={r.total_tagihan} terbayar={r.total_terbayar} />,
      minWidth: '110px',
    },
    {
      name: 'Status',
      center: true,
      cell: (r) => <StatusBadge status={r.payment_status} />,
      minWidth: '120px',
    },
    {
      name: 'Jatuh Tempo',
      selector: (r) => r.due_date,
      cell: (r) => r.due_date || '-',
      minWidth: '110px',
    },
    {
      name: 'Aksi',
      cell: (r) => (
        <button onClick={() => onOpenDetail(r)} title="Detail & Cicilan"
          className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition">
          <Eye className="w-4 h-4" />
        </button>
      ),
      width: '70px',
      center: true,
    },
  ], [currentPage, perPage, onOpenDetail]);

  return (
    <div className="space-y-4">
      {/* Mini summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-800">
          <p className="text-xs font-medium opacity-70">Record (Halaman Ini)</p>
          <p className="text-lg font-bold">{rows.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-800">
          <p className="text-xs font-medium opacity-70">Total Tagihan (Halaman)</p>
          <p className="text-base font-bold">{fmt(totalTagihan)}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800">
          <p className="text-xs font-medium opacity-70">Total Terbayar (Halaman)</p>
          <p className="text-base font-bold">{fmt(totalTerbayar)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Cari nota..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 outline-none" />
          {search && (
            <button onClick={() => { setSearch(''); fetch(1, perPage, '', startDate, endDate); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-300 outline-none" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-300 outline-none" />
        <button onClick={handleSearch} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition">Cari</button>
        {(search || startDate || endDate) && (
          <button onClick={handleClear} className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition flex items-center gap-1">
            <X className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Bulk select hint */}
      {selectedRows.length > 0 && (
        <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <CheckSquare className="w-4 h-4" />{selectedRows.length} baris dipilih — scroll ke bawah untuk update status
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex gap-2">
          <X className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={rows}
          progressPending={loading}
          progressComponent={<div className="py-8 flex items-center gap-2 text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /> Memuat data...</div>}
          noDataComponent={<div className="py-8 text-gray-400 text-sm">Belum ada data pembayaran.</div>}
          customStyles={tableCustomStyles}
          pagination
          paginationServer
          paginationTotalRows={totalRecords}
          paginationDefaultPage={currentPage}
          onChangePage={handlePageChange}
          onChangeRowsPerPage={handlePerRowsChange}
          paginationPerPage={perPage}
          paginationRowsPerPageOptions={[10, 25, 50]}
          highlightOnHover
          striped
          dense
          selectableRows
          onSelectedRowsChange={({ selectedRows: sel }) => setSelectedRows(sel)}
          clearSelectedRows={toggleCleared}
        />
      </div>

      <BulkActionBar
        selected={selectedRows}
        onClear={() => { setToggleCleared((v) => !v); setSelectedRows([]); }}
        onBulkUpdate={handleBulkUpdate}
        updating={bulkUpdating}
      />
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const PaymentHoPage = () => {
  const [activeTab, setActiveTab] = useState(1);
  const [detailModal, setDetailModal] = useState({ open: false, payment: null });
  const [cicilanModal, setCicilanModal] = useState({ open: false, payment: null });
  const [toast, setToast] = useState(null);
  const detailReloadRef = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleOpenDetail = useCallback((row) => {
    setDetailModal({ open: true, payment: row });
  }, []);

  const handleCicilanSaved = useCallback((msg) => {
    setCicilanModal({ open: false, payment: null });
    showToast(msg);
    // Trigger detail reload by briefly closing and reopening
    const current = detailModal;
    setDetailModal({ open: false, payment: null });
    setTimeout(() => setDetailModal({ open: true, payment: current.payment }), 50);
  }, [detailModal, showToast]);

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2
          ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            Pembayaran HO
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manajemen pembayaran & cicilan tagihan pembelian Head Office
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 flex overflow-x-auto">
          {PURCHASE_TYPES.map((pt) => (
            <button
              key={pt.value}
              onClick={() => setActiveTab(pt.value)}
              className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px ${
                activeTab === pt.value
                  ? 'border-green-600 text-green-700 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {pt.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {PURCHASE_TYPES.map((pt) => (
            activeTab === pt.value && (
              <PaymentTable key={pt.value} purchaseType={pt.value} onOpenDetail={handleOpenDetail} />
            )
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <DetailModal
        isOpen={detailModal.open}
        payment={detailModal.payment}
        onClose={() => setDetailModal({ open: false, payment: null })}
        onAddCicilan={() => {
          setCicilanModal({ open: true, payment: detailModal.payment });
        }}
      />

      {/* Add Cicilan Modal */}
      <AddCicilanModal
        isOpen={cicilanModal.open}
        payment={cicilanModal.payment}
        onClose={() => setCicilanModal({ open: false, payment: null })}
        onSaved={handleCicilanSaved}
      />
    </div>
  );
};

export default PaymentHoPage;
