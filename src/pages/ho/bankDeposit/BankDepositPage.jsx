import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import DataTable from 'react-data-table-component';
import {
  Search, X, Loader2, RefreshCw, Building2, DollarSign, Layers,
  Plus, Eye, Pencil, Trash2, FileImage, ExternalLink, Calendar,
  User, Upload, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import BankDepositService from '../../../services/bankDepositService';
import useBanksAPILazy from '../../../hooks/useBanksAPILazy';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const formatDate = (val) => {
  if (!val) return '-';
  return new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const tableCustomStyles = {
  headRow: { style: { backgroundColor: '#eff6ff', fontWeight: '700', fontSize: '13px', color: '#1e40af' } },
  rows: { style: { fontSize: '13px', '&:hover': { backgroundColor: '#eff6ff' } } },
  pagination: { style: { borderTop: '1px solid #93c5fd' } },
};

// ─── Proof Status Badge ────────────────────────────────────────────────────────

const ProofBadge = ({ status, url }) => {
  if (status === null || status === undefined) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Tanpa Bukti</span>;
  }
  if (status === 0) {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
        <Clock className="w-3 h-3" /> Uploading
      </span>
    );
  }
  if (status === 1 && url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition">
        <CheckCircle className="w-3 h-3" /> Lihat Bukti
      </a>
    );
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Ada Bukti</span>;
};

// ─── Summary Cards ─────────────────────────────────────────────────────────────

const SummaryCard = ({ icon: Icon, label, value, color }) => (
  <div className={`${color} rounded-xl p-4 shadow-sm border flex items-start gap-3`}>
    <div className="p-2 rounded-lg bg-white/60 shrink-0"><Icon className="w-5 h-5" /></div>
    <div className="min-w-0">
      <p className="text-xs font-medium opacity-70 truncate">{label}</p>
      <p className="text-lg font-bold truncate">{value}</p>
    </div>
  </div>
);

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────

const DeleteModal = ({ isOpen, item, onConfirm, onCancel, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-red-100">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Hapus Bank Deposit</h3>
            <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Apakah Anda yakin ingin menghapus setoran dari <strong>{item?.depositor_name}</strong> ke{' '}
          <strong>{item?.nama_bank}</strong> sebesar <strong>{formatCurrency(item?.amount)}</strong>?
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Add/Edit Modal ────────────────────────────────────────────────────────────

const EMPTY_FORM = { deposit_date: '', id_bank: '', depositor_name: '', depositor_name2: '', amount: '', proof_of_deposit: null };

const AddEditModal = ({ isOpen, mode, initial, bankOptions, onClose, onSaved }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initial) {
      setForm({
        deposit_date: initial.deposit_date || '',
        id_bank: initial.id_bank ? String(initial.id_bank) : '',
        depositor_name: initial.depositor_name || '',
        depositor_name2: initial.depositor_name2 || initial.depositor_name_2 || '',
        amount: initial.amount ? String(initial.amount) : '',
        proof_of_deposit: null,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [isOpen, mode, initial]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.deposit_date) e.deposit_date = 'Tanggal setor wajib diisi';
    if (!form.id_bank) e.id_bank = 'Bank wajib dipilih';
    if (!form.depositor_name.trim()) e.depositor_name = 'Nama penyetor wajib diisi';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = 'Jumlah harus lebih dari 0';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setSaving(true);
    try {
      const fd = BankDepositService.createFormData({
        deposit_date: form.deposit_date,
        id_bank: form.id_bank,
        depositor_name: form.depositor_name.trim(),
        depositor_name_2: form.depositor_name2.trim(),
        amount: Number(form.amount),
        proof_of_deposit: form.proof_of_deposit,
      });
      if (mode === 'edit') {
        await BankDepositService.updateBankDeposit(initial.pid, fd);
      } else {
        await BankDepositService.createBankDeposit(fd);
      }
      onSaved(mode === 'edit' ? 'Data berhasil diperbarui.' : 'Data berhasil disimpan.');
    } catch (err) {
      setErrors({ _general: err?.message || 'Gagal menyimpan data.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const Field = ({ label, error, children, required }) => (
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {mode === 'edit' ? 'Edit Bank Deposit' : 'Tambah Bank Deposit'}
              </h2>
              <p className="text-sm text-blue-100 mt-0.5">Setoran kas ke rekening bank</p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6">
          {errors._general && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex gap-2">
              <X className="w-4 h-4 shrink-0 mt-0.5" />{errors._general}
            </div>
          )}
          <div className="space-y-4">
            <Field label="Tanggal Setor" error={errors.deposit_date} required>
              <input type="date" value={form.deposit_date} onChange={(e) => set('deposit_date', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none ${errors.deposit_date ? 'border-red-400' : 'border-gray-300'}`} />
            </Field>

            <Field label="Bank Tujuan" error={errors.id_bank} required>
              <select value={form.id_bank} onChange={(e) => set('id_bank', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none ${errors.id_bank ? 'border-red-400' : 'border-gray-300'}`}>
                <option value="">-- Pilih Bank --</option>
                {bankOptions.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </Field>

            <Field label="Nama Penyetor 1" error={errors.depositor_name} required>
              <input type="text" value={form.depositor_name} onChange={(e) => set('depositor_name', e.target.value)}
                placeholder="Nama penyetor utama"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none ${errors.depositor_name ? 'border-red-400' : 'border-gray-300'}`} />
            </Field>

            <Field label="Nama Penyetor 2" error={errors.depositor_name2}>
              <input type="text" value={form.depositor_name2} onChange={(e) => set('depositor_name2', e.target.value)}
                placeholder="Opsional"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none" />
            </Field>

            <Field label="Jumlah Setoran (Rp)" error={errors.amount} required>
              <input type="number" min="0" value={form.amount} onChange={(e) => set('amount', e.target.value)}
                placeholder="0"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none ${errors.amount ? 'border-red-400' : 'border-gray-300'}`} />
            </Field>

            <Field label="Bukti Setoran" error={errors.proof_of_deposit}>
              <div
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                {form.proof_of_deposit ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
                    <FileImage className="w-4 h-4" />
                    <span className="truncate max-w-xs">{form.proof_of_deposit.name}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); set('proof_of_deposit', null); }} className="text-red-500 hover:text-red-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                    <span>Klik untuk upload bukti setoran</span>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF — maks 2MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
                onChange={(e) => set('proof_of_deposit', e.target.files?.[0] || null)} />
            </Field>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Detail Modal ──────────────────────────────────────────────────────────────

const DetailModal = ({ isOpen, onClose, pid }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !pid) return;
    setLoading(true);
    setData(null);
    BankDepositService.getBankDepositDetail(pid)
      .then((res) => setData(res.data || res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [isOpen, pid]);

  if (!isOpen) return null;

  const Row = ({ icon: Icon, label, value, iconColor }) => (
    <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
      <div className={`p-2 rounded-lg ${iconColor || 'bg-blue-100'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );

  const statusInfo = data ? BankDepositService.getProofStatusInfo(data.proof_status) : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-5 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Detail Bank Deposit</h2>
            <p className="text-sm text-blue-100 mt-0.5">Informasi lengkap setoran bank</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" /> Memuat detail...
            </div>
          ) : !data ? (
            <p className="py-12 text-center text-gray-400 text-sm">Gagal memuat detail.</p>
          ) : (
            <div className="space-y-3">
              <Row icon={Calendar} label="Tanggal Setor" value={formatDate(data.deposit_date)} iconColor="bg-blue-100" />
              <Row icon={Building2} label="Bank Tujuan" value={data.bank?.nama || data.nama_bank || '-'} iconColor="bg-purple-100" />
              <Row icon={User} label="Nama Penyetor 1" value={data.depositor_name || '-'} iconColor="bg-green-100" />
              {data.depositor_name2 && (
                <Row icon={User} label="Nama Penyetor 2" value={data.depositor_name2} iconColor="bg-green-100" />
              )}
              <Row icon={DollarSign} label="Jumlah Setoran" value={formatCurrency(data.amount)} iconColor="bg-emerald-100" />
              {(data.proof_of_deposit || statusInfo) && (
                <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <FileImage className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Bukti Setoran</p>
                    {statusInfo && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.bgClass} ${statusInfo.textClass} mt-1`}>
                        {statusInfo.label}
                      </span>
                    )}
                    {data.proof_of_deposit_url && (
                      <a href={data.proof_of_deposit_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1">
                        <ExternalLink className="w-3 h-3" /> Buka File
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Page Component ────────────────────────────────────────────────────────────

const BankDepositPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [addEditModal, setAddEditModal] = useState({ open: false, mode: 'add', data: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [detailModal, setDetailModal] = useState({ open: false, pid: null });
  const [deleting, setDeleting] = useState(false);

  // Summary
  const [totalAmount, setTotalAmount] = useState(0);

  const { bankOptions, loading: banksLoading } = useBanksAPILazy();

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchData = useCallback(async (page = currentPage, limit = perPage, q = search, sd = startDate, ed = endDate) => {
    setLoading(true);
    setError(null);
    try {
      const res = await BankDepositService.getBankDeposits({ page, perPage: limit, search: q, startDate: sd || null, endDate: ed || null });
      const transformed = (res.data || []).map((d) => BankDepositService.transformData(d));
      setRows(transformed);
      setTotalRecords(res.recordsFiltered || 0);
      setTotalAmount(transformed.reduce((acc, r) => acc + (Number(r.amount) || 0), 0));
    } catch (err) {
      setError(err?.message || 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, search, startDate, endDate]);

  useEffect(() => { fetchData(); }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(1, perPage, search, startDate, endDate);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    fetchData(1, perPage, '', '', '');
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchData(page, perPage, search, startDate, endDate);
  };

  const handlePerRowsChange = (newPerPage, page) => {
    setPerPage(newPerPage);
    setCurrentPage(page);
    fetchData(page, newPerPage, search, startDate, endDate);
  };

  const handleDelete = async () => {
    if (!deleteModal.item?.pid) return;
    setDeleting(true);
    try {
      await BankDepositService.deleteBankDeposit(deleteModal.item.pid);
      setDeleteModal({ open: false, item: null });
      showToast('Data berhasil dihapus.');
      fetchData(currentPage, perPage, search, startDate, endDate);
    } catch (err) {
      showToast(err?.message || 'Gagal menghapus data.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaved = (msg) => {
    setAddEditModal({ open: false, mode: 'add', data: null });
    showToast(msg);
    setCurrentPage(1);
    fetchData(1, perPage, search, startDate, endDate);
  };

  const openEdit = async (pid) => {
    try {
      const res = await BankDepositService.getBankDepositDetail(pid);
      const detail = BankDepositService.transformData(res.data || res);
      setAddEditModal({ open: true, mode: 'edit', data: detail });
    } catch {
      showToast('Gagal memuat data untuk edit.', 'error');
    }
  };

  const columns = useMemo(() => [
    {
      name: 'No',
      cell: (_, i) => (currentPage - 1) * perPage + i + 1,
      width: '56px',
      center: true,
    },
    {
      name: 'Tanggal Setor',
      selector: (r) => r.deposit_date,
      sortable: true,
      cell: (r) => formatDate(r.deposit_date),
      minWidth: '130px',
    },
    {
      name: 'Bank',
      selector: (r) => r.nama_bank,
      sortable: true,
      minWidth: '140px',
    },
    {
      name: 'Nama Penyetor',
      selector: (r) => r.depositor_name,
      sortable: true,
      wrap: true,
      minWidth: '160px',
    },
    {
      name: 'Jumlah',
      selector: (r) => r.amount,
      sortable: true,
      right: true,
      cell: (r) => formatCurrency(r.amount),
      minWidth: '140px',
    },
    {
      name: 'Bukti',
      cell: (r) => <ProofBadge status={r.proof_status} url={r.proof_of_deposit_url} />,
      center: true,
      width: '120px',
    },
    {
      name: 'Aksi',
      cell: (r) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setDetailModal({ open: true, pid: r.pid })}
            title="Detail" className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => openEdit(r.pid)}
            title="Edit" className="p-1.5 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-600 transition">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteModal({ open: true, item: r })}
            title="Hapus" className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
      width: '110px',
      right: true,
    },
  ], [currentPage, perPage]);

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 transition-all
          ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Bank Deposit HO
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manajemen setoran kas ke rekening bank</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchData()} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 text-sm font-medium transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => setAddEditModal({ open: true, mode: 'add', data: null })}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <SummaryCard icon={Layers} label="Total Record (Halaman Ini)" value={rows.length}
          color="bg-blue-50 border-blue-200 text-blue-800" />
        <SummaryCard icon={Layers} label="Total Record (Keseluruhan)" value={totalRecords}
          color="bg-indigo-50 border-indigo-200 text-indigo-800" />
        <SummaryCard icon={DollarSign} label="Total Setoran (Halaman Ini)" value={formatCurrency(totalAmount)}
          color="bg-emerald-50 border-emerald-200 text-emerald-800" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Cari nama penyetor atau bank..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none" />
          {search && (
            <button onClick={() => { setSearch(''); fetchData(1, perPage, '', startDate, endDate); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none" />
        <button onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
          Cari
        </button>
        {(search || startDate || endDate) && (
          <button onClick={handleClearFilters}
            className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition flex items-center gap-1">
            <X className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex gap-2">
          <X className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* DataTable */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={rows}
          progressPending={loading}
          progressComponent={
            <div className="py-10 flex items-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" /> Memuat data...
            </div>
          }
          noDataComponent={
            <div className="py-10 text-gray-400 text-sm">
              {search || startDate || endDate ? 'Tidak ada data sesuai filter.' : 'Belum ada data bank deposit.'}
            </div>
          }
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
        />
      </div>

      {/* Modals */}
      <AddEditModal
        isOpen={addEditModal.open}
        mode={addEditModal.mode}
        initial={addEditModal.data}
        bankOptions={bankOptions}
        onClose={() => setAddEditModal({ open: false, mode: 'add', data: null })}
        onSaved={handleSaved}
      />
      <DetailModal
        isOpen={detailModal.open}
        pid={detailModal.pid}
        onClose={() => setDetailModal({ open: false, pid: null })}
      />
      <DeleteModal
        isOpen={deleteModal.open}
        item={deleteModal.item}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, item: null })}
        loading={deleting}
      />
    </div>
  );
};

export default BankDepositPage;
