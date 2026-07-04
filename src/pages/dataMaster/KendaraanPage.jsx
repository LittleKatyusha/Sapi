import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Edit2, Trash2, Truck, FileBadge2 } from 'lucide-react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import SearchableSelect from '../../components/shared/SearchableSelect';
import KendaraanService from '../../services/kendaraanService';

const TABS = [
  { key: 'kendaraan', label: 'Kendaraan', icon: Truck },
  { key: 'dokumen', label: 'Dokumen', icon: FileBadge2 },
];

const STATUS_KENDARAAN_OPTIONS = [
  { value: 'AKTIF', label: 'AKTIF' },
  { value: 'NONAKTIF', label: 'NONAKTIF' },
];

const STATUS_DOKUMEN_OPTIONS = [
  { value: 'ON', label: 'ON' },
  { value: 'OFF', label: 'OFF' },
];

const JENIS_DOKUMEN_OPTIONS = [
  { value: 'STNK', label: 'STNK' },
  { value: 'PLAT', label: 'PLAT' },
  { value: 'KIR', label: 'KIR' },
];

const INITIAL_FORM = {
  kendaraan: { jenis_kendaraan: '', plat_nomor: '', status: 'AKTIF' },
  dokumen: {
    id_kendaraan_ekspedisi: '',
    jenis_dokumen: 'STNK',
    status: 'ON',
    tgl_berlaku_mulai: '',
    tgl_berlaku_sampai: '',
    keterangan: '',
  },
};

const FIELD_LABELS = {
  kendaraan: 'Kendaraan',
  dokumen: 'Dokumen Kendaraan',
};

const textInputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';

const toastClass = (type) => ({
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
}[type] || 'border-slate-200 bg-slate-50 text-slate-700');

const LoadingOverlay = ({ show, message = 'Memproses...' }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-5 py-3 shadow-lg">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
        <span className="text-sm font-medium text-slate-700">{message}</span>
      </div>
    </div>
  );
};

const CrudModal = ({ isOpen, mode, resource, item, onClose, onSave, options = { kendaraan: [] } }) => {
  const [form, setForm] = useState(INITIAL_FORM[resource]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');

    if (mode === 'edit' && item) {
      if (resource === 'kendaraan') {
        setForm({
          jenis_kendaraan: item.jenis_kendaraan || '',
          plat_nomor: item.plat_nomor || '',
          status: item.status || 'AKTIF',
        });
      } else {
        setForm({
          id_kendaraan_ekspedisi: String(item.id_kendaraan_ekspedisi || ''),
          jenis_dokumen: item.jenis_dokumen || 'STNK',
          status: item.status || 'ON',
          tgl_berlaku_mulai: item.tgl_berlaku_mulai || '',
          tgl_berlaku_sampai: item.tgl_berlaku_sampai || '',
          keterangan: item.keterangan || '',
        });
      }
    } else {
      setForm(INITIAL_FORM[resource]);
    }
  }, [isOpen, mode, item, resource]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (resource === 'dokumen' && !form.id_kendaraan_ekspedisi) {
      setError('Kendaraan wajib dipilih');
      setSaving(false);
      return;
    }

    const payload = { ...form };
    if (mode === 'edit' && item?.pid) {
      payload.pid = item.pid;
    }

    const result = await onSave(payload);
    if (!result.success) {
      setError(result.message || 'Gagal menyimpan data');
      setSaving(false);
      return;
    }

    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900">
            {mode === 'edit' ? 'Edit' : 'Tambah'} {FIELD_LABELS[resource]}
          </h3>
          <p className="text-sm text-slate-500">Kelola data master {FIELD_LABELS[resource].toLowerCase()}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {resource === 'kendaraan' && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Jenis Kendaraan</label>
                <input className={textInputClass} value={form.jenis_kendaraan} onChange={(e) => updateField('jenis_kendaraan', e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Plat Nomor</label>
                <input className={textInputClass} value={form.plat_nomor} onChange={(e) => updateField('plat_nomor', e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                <select className={textInputClass} value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                  {STATUS_KENDARAAN_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </>
          )}

          {resource === 'dokumen' && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Kendaraan</label>
                <SearchableSelect
                  options={options.kendaraan}
                  value={form.id_kendaraan_ekspedisi}
                  onChange={(value) => updateField('id_kendaraan_ekspedisi', value || '')}
                  placeholder="Pilih Kendaraan"
                  isClearable
                  accentColor="green"
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Jenis Dokumen</label>
                  <select className={textInputClass} value={form.jenis_dokumen} onChange={(e) => updateField('jenis_dokumen', e.target.value)}>
                    {JENIS_DOKUMEN_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                  <select className={textInputClass} value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                    {STATUS_DOKUMEN_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Tgl Berlaku Mulai</label>
                  <input type="date" className={textInputClass} value={form.tgl_berlaku_mulai || ''} onChange={(e) => updateField('tgl_berlaku_mulai', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Tgl Berlaku Sampai</label>
                  <input type="date" className={textInputClass} value={form.tgl_berlaku_sampai || ''} onChange={(e) => updateField('tgl_berlaku_sampai', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Keterangan</label>
                <textarea className={`${textInputClass} min-h-[100px]`} value={form.keterangan} onChange={(e) => updateField('keterangan', e.target.value)} />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
              Batal
            </button>
            <button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteModal = ({ isOpen, item, resource, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;

  const label = resource === 'dokumen'
    ? `${item?.kendaraan_label || '-'} / ${item?.jenis_dokumen || '-'}`
    : `${item?.jenis_kendaraan || '-'} / ${item?.plat_nomor || '-'}`;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-slate-900">Hapus data?</h3>
        <p className="mt-2 text-sm text-slate-600">
          Data <span className="font-semibold text-slate-900">{label}</span> akan dihapus.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ResourceTab = ({ resource, title, description, columns, loadOptions }) => {
  const [data, setData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [notification, setNotification] = useState(null);
  const [options, setOptions] = useState({ kendaraan: [] });

  const refresh = useCallback(async (currentPage = 1, currentPerPage = 10, currentSearch = '') => {
    setTableLoading(true);
    const response = await KendaraanService.getData(resource, {
      draw: currentPage,
      start: (currentPage - 1) * currentPerPage,
      length: currentPerPage,
      search: currentSearch,
      order: [{ column: 0, dir: 'asc' }],
    });

    if (response.success) {
      setData(response.data);
      setTotalRows(response.recordsFiltered || 0);
    } else {
      setNotification({ type: 'error', message: response.message || 'Gagal memuat data' });
    }

    setTableLoading(false);
  }, [resource]);

  useEffect(() => {
    setPage(1);
    setPerPage(10);
    setSearchInput('');
    setSearch('');
  }, [resource]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    refresh(page, perPage, search);
  }, [page, perPage, refresh, search]);

  useEffect(() => {
    if (!loadOptions) return;
    let mounted = true;

    (async () => {
      const nextOptions = await loadOptions();
      if (mounted) setOptions(nextOptions);
    })();

    return () => { mounted = false; };
  }, [loadOptions, resource]);

  const handleSave = async (payload) => {
    setActionLoading(true);
    setActionMessage(mode === 'edit' ? 'Menyimpan perubahan...' : 'Menyimpan data...');
    const response = mode === 'edit'
      ? await KendaraanService.update(resource, payload)
      : await KendaraanService.store(resource, payload);
    setActionLoading(false);
    setActionMessage('');

    if (response.success) {
      setNotification({ type: 'success', message: response.message || 'Data berhasil disimpan' });
      setModalOpen(false);
      setEditingItem(null);
      await refresh(page, perPage, search);
    }

    return response;
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setActionLoading(true);
    setActionMessage('Menghapus data...');
    const response = await KendaraanService.delete(resource, deleteItem.pid);
    setActionLoading(false);
    setActionMessage('');

    if (response.success) {
      setNotification({ type: 'success', message: response.message || 'Data berhasil dihapus' });
      setDeleteItem(null);
      await refresh(page, perPage, search);
      return;
    }

    setNotification({ type: 'error', message: response.message || 'Gagal menghapus data' });
  };

  return (
    <div className="space-y-4">
      {notification && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${toastClass(notification.type)}`}>
          {notification.message}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={`Cari ${title.toLowerCase()}...`}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 md:w-72"
            />
          </div>
          <button
            type="button"
            onClick={() => { setMode('create'); setEditingItem(null); setModalOpen(true); }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Tambah
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <LoadingOverlay show={tableLoading || actionLoading} message={actionLoading ? actionMessage : 'Memuat data...'} />
        <DataTable
          columns={columns({
            onEdit: (row) => { setMode('edit'); setEditingItem(row); setModalOpen(true); },
            onDelete: (row) => setDeleteItem(row),
          })}
          data={data}
          progressPending={tableLoading}
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          onChangePage={(nextPage) => setPage(nextPage)}
          onChangeRowsPerPage={(nextPerPage, nextPage) => { setPerPage(nextPerPage); setPage(nextPage); }}
          paginationPerPage={perPage}
          paginationRowsPerPageOptions={[10, 15, 25, 50]}
          highlightOnHover
          responsive
          noDataComponent={<div className="py-12 text-sm text-slate-500">Tidak ada data.</div>}
        />
      </div>

      <CrudModal
        isOpen={modalOpen}
        mode={mode}
        resource={resource}
        item={editingItem}
        options={options}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        onSave={handleSave}
      />

      <DeleteModal
        isOpen={!!deleteItem}
        resource={resource}
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        loading={actionLoading}
      />
    </div>
  );
};

const KendaraanPage = () => {
  useDocumentTitle('Kendaraan');
  const [activeTab, setActiveTab] = useState('kendaraan');

  const loadDokumenOptions = useCallback(async () => {
    const kendaraanRes = await KendaraanService.getAll('kendaraan');

    return {
      kendaraan: (kendaraanRes.data || []).map((item) => ({
        value: String(item.id),
        label: `${item.jenis_kendaraan} / ${item.plat_nomor}`,
      })),
    };
  }, []);

  const activeConfig = useMemo(() => ({
    kendaraan: {
      title: 'Kendaraan',
      description: 'Kelola data kendaraan ekspedisi.',
      resource: 'kendaraan',
      columns: ({ onEdit, onDelete }) => [
        { name: 'Jenis Kendaraan', selector: (row) => row.jenis_kendaraan, sortable: true, cell: (row) => <span className="font-medium">{row.jenis_kendaraan}</span> },
        { name: 'Plat Nomor', selector: (row) => row.plat_nomor, sortable: true, width: '180px', cell: (row) => <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">{row.plat_nomor}</span> },
        { name: 'Status', selector: (row) => row.status, width: '120px', cell: (row) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{row.status}</span> },
        { name: 'Aksi', width: '130px', cell: (row) => (
          <div className="flex gap-2">
            <button onClick={() => onEdit(row)} className="rounded-lg bg-amber-50 p-2 text-amber-700"><Edit2 className="h-4 w-4" /></button>
            <button onClick={() => onDelete(row)} className="rounded-lg bg-rose-50 p-2 text-rose-700"><Trash2 className="h-4 w-4" /></button>
          </div>
        ) },
      ],
    },
    dokumen: {
      title: 'Dokumen Kendaraan',
      description: 'Kelola dokumen STNK, PLAT, dan KIR kendaraan.',
      resource: 'dokumen',
      columns: ({ onEdit, onDelete }) => [
        { name: 'Kendaraan', selector: (row) => row.kendaraan_label, sortable: true, cell: (row) => <span className="font-medium">{row.kendaraan_label || '-'}</span> },
        { name: 'Jenis Dokumen', selector: (row) => row.jenis_dokumen, sortable: true, width: '140px' },
        { name: 'Status', selector: (row) => row.status, width: '110px', cell: (row) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === 'ON' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{row.status}</span> },
        { name: 'Mulai', selector: (row) => row.tgl_berlaku_mulai, sortable: true, width: '130px' },
        { name: 'Sampai', selector: (row) => row.tgl_berlaku_sampai, sortable: true, width: '130px' },
        { name: 'Keterangan', selector: (row) => row.keterangan, sortable: false, cell: (row) => <span className="line-clamp-2">{row.keterangan || '-'}</span> },
        { name: 'Aksi', width: '130px', cell: (row) => (
          <div className="flex gap-2">
            <button onClick={() => onEdit(row)} className="rounded-lg bg-amber-50 p-2 text-amber-700"><Edit2 className="h-4 w-4" /></button>
            <button onClick={() => onDelete(row)} className="rounded-lg bg-rose-50 p-2 text-rose-700"><Trash2 className="h-4 w-4" /></button>
          </div>
        ) },
      ],
    },
  }), []);

  const activeTabComponent = activeConfig[activeTab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/50 to-cyan-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-lg">
          <h1 className="text-2xl font-bold text-slate-900">Kendaraan</h1>
          <p className="mt-1 text-sm text-slate-500">CRUD kendaraan ekspedisi dan dokumennya.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                    active ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <ResourceTab
          key={activeTab}
          resource={activeTabComponent.resource}
          title={activeTabComponent.title}
          description={activeTabComponent.description}
          columns={activeTabComponent.columns}
          loadOptions={activeTab === 'dokumen' ? loadDokumenOptions : null}
        />
      </div>
    </div>
  );
};

export default KendaraanPage;
