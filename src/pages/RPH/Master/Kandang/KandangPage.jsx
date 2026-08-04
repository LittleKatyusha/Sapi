import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, Loader2, Search, RotateCcw, Home } from 'lucide-react';
import KandangService from '../../../../services/kandangService';
import useDocumentTitle from '../../../../hooks/useDocumentTitle';

const emptyForm = { pid: '', kode: '', nama: '', lokasi: '', kapasitas: '', keterangan: '', is_aktif: 1 };

const KandangPage = () => {
  useDocumentTitle('Master Kandang - RPH | TernaSys');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [notification, setNotification] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [deleteItem, setDeleteItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async (page, search) => {
    setLoading(true);
    setError('');
    try {
      const response = await KandangService.getData({
        draw: 1,
        start: (page - 1) * 10,
        length: 10,
        search,
      });
      if (response.success) {
        setRows(response.data || []);
        setTotalRecords(response.recordsTotal ?? 0);
        setLastPage(Math.max(1, Math.ceil((response.recordsFiltered ?? response.recordsTotal ?? 0) / 10)));
      } else {
        setError(response.message || 'Gagal memuat data kandang');
        setRows([]);
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat memuat data');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(currentPage, appliedSearch);
  }, [currentPage, appliedSearch, fetchData]);

  useEffect(() => {
    if (!notification || notification.type === 'info') return undefined;
    const t = setTimeout(() => setNotification(null), 3500);
    return () => clearTimeout(t);
  }, [notification]);

  const handleSearch = () => { setAppliedSearch(searchInput.trim()); setCurrentPage(1); };
  const handleResetSearch = () => { setSearchInput(''); setAppliedSearch(''); setCurrentPage(1); };
  const handleKeyDownSearch = (e) => { if (e.key === 'Enter') handleSearch(); };

  const handleAdd = () => { setFormData(emptyForm); setSubmitError(''); setModalOpen(true); };

  const handleEdit = (row) => {
    setFormData({
      pid: row.pid,
      kode: row.kode || '',
      nama: row.nama || '',
      lokasi: row.lokasi || '',
      kapasitas: row.kapasitas || '',
      keterangan: row.keterangan || '',
      is_aktif: row.is_aktif ?? 1,
    });
    setSubmitError('');
    setModalOpen(true);
  };

  const handleModalClose = () => { setModalOpen(false); setFormData(emptyForm); setSubmitError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!formData.kode.trim() || !formData.nama.trim()) {
      setSubmitError('Kode dan nama kandang wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        kode: formData.kode.trim(),
        nama: formData.nama.trim(),
        lokasi: formData.lokasi?.trim() || '',
        kapasitas: formData.kapasitas !== '' ? parseInt(formData.kapasitas, 10) : 0,
        keterangan: formData.keterangan?.trim() || '',
        is_aktif: formData.is_aktif,
      };
      if (formData.pid) payload.pid = formData.pid;

      const response = formData.pid
        ? await KandangService.update(payload)
        : await KandangService.store(payload);

      if (response.success) {
        setModalOpen(false);
        setFormData(emptyForm);
        fetchData(currentPage, appliedSearch);
        setNotification({ type: 'success', message: response?.message || 'Kandang berhasil disimpan' });
      } else {
        setSubmitError(response.message || 'Gagal menyimpan kandang.');
      }
    } catch (err) {
      setSubmitError(err?.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (row) => { setDeleteItem(row); };
  const handleDeleteConfirm = async () => {
    if (!deleteItem?.pid) return;
    setIsDeleting(true);
    try {
      const resp = await KandangService.delete(deleteItem.pid);
      if (resp.success) {
        setDeleteItem(null);
        fetchData(currentPage, appliedSearch);
        setNotification({ type: 'success', message: resp?.message || 'Kandang berhasil dihapus' });
      } else {
        setNotification({ type: 'error', message: resp?.message || 'Gagal menghapus kandang' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: err?.message || 'Terjadi kesalahan saat menghapus' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/40">
      <div className="mx-auto max-w-full space-y-4 p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/30">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Master Kandang</h1>
                  <span className="hidden sm:inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">RPH</span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">Kelola kandang sapi — untuk pengelompokan di form pemberian pakan</p>
              </div>
            </div>
            <button onClick={handleAdd} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:from-amber-600 hover:to-orange-700 transition-all">
              <Plus className="w-4 h-4" /> Buat Kandang
            </button>
          </div>
        </div>

        {notification && (
          <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm border ${
            notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="break-words">{notification.message}</span>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDownSearch}
              placeholder="Cari kode / nama / lokasi kandang..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 outline-none"
            />
          </div>
          <button onClick={handleSearch} className="px-3 py-2 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700">Cari</button>
          {appliedSearch && (
            <button onClick={handleResetSearch} className="px-3 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat data...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mr-2" /> {error}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400">
              <Home className="w-10 h-10 mb-2 text-slate-300" />
              Belum ada kandang. Klik "Buat Kandang" untuk menambah master kandang.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                    <th className="px-4 py-3">Kode</th>
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3">Lokasi</th>
                    <th className="px-4 py-3 text-center">Kapasitas</th>
                    <th className="px-4 py-3 text-center">Jumlah Sapi</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.pid} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{row.kode}</td>
                      <td className="px-4 py-3 text-slate-700">{row.nama}</td>
                      <td className="px-4 py-3 text-slate-500">{row.lokasi || '-'}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{row.kapasitas || 0}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-700 border border-sky-100">
                          {row.jumlah_sapi || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.is_aktif ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">Aktif</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 border border-slate-200">Nonaktif</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(row)} title="Edit kandang" className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteClick(row)} title="Hapus kandang" className="rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {lastPage > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 bg-slate-50 text-xs">
              <span className="text-slate-500">Hal {currentPage} / {lastPage} — {totalRecords} total</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1 || loading} className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-white">‹</button>
                <button onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))} disabled={currentPage === lastPage || loading} className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-white">›</button>
              </div>
            </div>
          )}
        </div>

        {/* Modal create/edit */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={!isSubmitting ? handleModalClose : undefined}></div>
              <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Home className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{formData.pid ? 'Edit Kandang' : 'Buat Kandang'}</h3>
                        <p className="text-amber-100 text-sm">Master kandang sapi per RPH</p>
                      </div>
                    </div>
                    <button onClick={handleModalClose} disabled={isSubmitting} className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors disabled:opacity-50">
                      ×
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Kode <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={formData.kode}
                        onChange={(e) => setFormData((p) => ({ ...p, kode: e.target.value }))}
                        disabled={isSubmitting}
                        required
                        placeholder="cth: KDG-A1"
                        className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 rounded-lg bg-slate-50 focus:bg-white transition-all outline-none disabled:opacity-60"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Nama <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={formData.nama}
                        onChange={(e) => setFormData((p) => ({ ...p, nama: e.target.value }))}
                        disabled={isSubmitting}
                        required
                        placeholder="cth: KANDANG PEMBESARAN A"
                        className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 rounded-lg bg-slate-50 focus:bg-white transition-all outline-none disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Lokasi</label>
                    <input
                      type="text"
                      value={formData.lokasi}
                      onChange={(e) => setFormData((p) => ({ ...p, lokasi: e.target.value }))}
                      disabled={isSubmitting}
                      placeholder="Opsional"
                      className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 rounded-lg bg-slate-50 focus:bg-white transition-all outline-none disabled:opacity-60"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Kapasitas (ekor)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.kapasitas}
                        onChange={(e) => setFormData((p) => ({ ...p, kapasitas: e.target.value }))}
                        disabled={isSubmitting}
                        placeholder="0"
                        className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 rounded-lg bg-slate-50 focus:bg-white transition-all outline-none disabled:opacity-60"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</label>
                      <select
                        value={formData.is_aktif}
                        onChange={(e) => setFormData((p) => ({ ...p, is_aktif: parseInt(e.target.value, 10) }))}
                        disabled={isSubmitting}
                        className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 rounded-lg bg-slate-50 focus:bg-white transition-all outline-none disabled:opacity-60"
                      >
                        <option value={1}>Aktif</option>
                        <option value={0}>Nonaktif</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Keterangan</label>
                    <textarea
                      value={formData.keterangan}
                      onChange={(e) => setFormData((p) => ({ ...p, keterangan: e.target.value }))}
                      disabled={isSubmitting}
                      rows={2}
                      placeholder="Opsional"
                      className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 rounded-lg bg-slate-50 focus:bg-white transition-all outline-none disabled:opacity-60 resize-none"
                    />
                  </div>

                  {submitError && (
                    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="break-words">{submitError}</span>
                    </div>
                  )}
                </form>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={handleModalClose} disabled={isSubmitting} className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50">Tutup</button>
                    <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Home className="w-4 h-4" /> {formData.pid ? 'Update' : 'Simpan'}</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deleteItem && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={!isDeleting ? () => setDeleteItem(null) : undefined}></div>
              <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Hapus Kandang?</h3>
                      <p className="text-sm text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-5">
                  <p className="text-sm text-slate-600">
                    Anda akan menghapus kandang <strong className="text-slate-800">{deleteItem.kode} — {deleteItem.nama}</strong>.
                    {Number(deleteItem.jumlah_sapi) > 0 ? (
                      <span className="block mt-2 text-red-600 font-medium">Kandang ini masih terikat ke {deleteItem.jumlah_sapi} sapi. Pindahkan sapi ke kandang lain sebelum menghapus.</span>
                    ) : null}
                  </p>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                  <button type="button" onClick={() => setDeleteItem(null)} disabled={isDeleting} className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50">Batal</button>
                  <button type="button" onClick={handleDeleteConfirm} disabled={isDeleting || Number(deleteItem.jumlah_sapi) > 0} className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50">
                    {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Menghapus...</> : <><Trash2 className="w-4 h-4" /> Hapus</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KandangPage;
