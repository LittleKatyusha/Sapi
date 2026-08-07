import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Truck, BadgeInfo, FileBadge2, AlertTriangle, Trash2, X, Save,
  User, CreditCard,
} from 'lucide-react';

import useDocumentTitle from '../../hooks/useDocumentTitle';
import SearchableSelect from '../../components/shared/SearchableSelect';
import SopirService from '../../services/sopirService';
import MasterDataTablePage from './pembeliHo/components/MasterDataTablePage';
import useMasterService from './hooks/useMasterService';

const STATUS_OPTIONS = [
  { value: 'AKTIF', label: 'AKTIF' },
  { value: 'NONAKTIF', label: 'NONAKTIF' },
];

const TABS = [
  { key: 'pengirim', label: 'Supir', icon: Truck, entityLabel: 'Supir' },
  { key: 'sim', label: 'SIM', icon: BadgeInfo, entityLabel: 'SIM' },
  { key: 'pengirimsim', label: 'Pengirim SIM', icon: FileBadge2, entityLabel: 'Pengirim SIM' },
];

const textInputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20';

const statusBadge = (active) =>
  active
    ? 'inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700'
    : 'inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600';

/* ------------------------------------------------------------------ */
/* Generic delete modal                                               */
/* ------------------------------------------------------------------ */
const DeleteModal = ({ isOpen, item, itemName, message, onConfirm, onCancel, isDeleting }) => {
  if (!isOpen || !item) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
          </div>
        </div>
        <p className="mb-6 text-sm text-slate-600">
          {message || `Apakah Anda yakin ingin menghapus ${itemName ? `"${itemName}"` : 'data ini'}?`}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Hapus</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ------------------------------------------------------------------ */
/* Add/Edit modal: Supir                                              */
/* ------------------------------------------------------------------ */
const AddEditSupirModal = ({ item, onClose, onSave, loading = false }) => {
  const [form, setForm] = useState({ nama: '', no_hp: '', alamat: '', status: 'AKTIF' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        nama: item.nama || '',
        no_hp: item.no_hp || '',
        alamat: item.alamat || '',
        status: item.status || 'AKTIF',
      });
    } else {
      setForm({ nama: '', no_hp: '', alamat: '', status: 'AKTIF' });
    }
    setError('');
  }, [item]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama.trim()) {
      setError('Nama supir wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        nama: form.nama.trim(),
        no_hp: form.no_hp.trim(),
        alamat: form.alamat.trim(),
        status: form.status,
      });
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{item ? 'Edit Supir' : 'Tambah Supir'}</h3>
            <p className="text-xs text-slate-500">Kelola data supir / pengirim</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Nama Supir</label>
            <input
              className={textInputClass}
              value={form.nama}
              onChange={(e) => updateField('nama', e.target.value)}
              placeholder="Nama lengkap"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">No HP</label>
            <input
              className={textInputClass}
              value={form.no_hp}
              onChange={(e) => updateField('no_hp', e.target.value)}
              placeholder="08xx-xxxx-xxxx"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Alamat</label>
            <textarea
              className={`${textInputClass} min-h-[80px]`}
              value={form.alamat}
              onChange={(e) => updateField('alamat', e.target.value)}
              placeholder="Alamat supir"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Status</label>
            <select
              className={textInputClass}
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving || loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

/* ------------------------------------------------------------------ */
/* Add/Edit modal: SIM                                                */
/* ------------------------------------------------------------------ */
const AddEditSimModal = ({ item, onClose, onSave, loading = false }) => {
  const [form, setForm] = useState({ kode: '', nama: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({ kode: item.kode || '', nama: item.nama || '' });
    } else {
      setForm({ kode: '', nama: '' });
    }
    setError('');
  }, [item]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.kode.trim() || !form.nama.trim()) {
      setError('Kode dan nama SIM wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await onSave({ kode: form.kode.trim(), nama: form.nama.trim() });
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{item ? 'Edit SIM' : 'Tambah SIM'}</h3>
            <p className="text-xs text-slate-500">Kelola data master SIM</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Kode SIM</label>
            <input
              className={textInputClass}
              value={form.kode}
              onChange={(e) => updateField('kode', e.target.value)}
              placeholder="Contoh: A, B1, B2, C"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Nama SIM</label>
            <input
              className={textInputClass}
              value={form.nama}
              onChange={(e) => updateField('nama', e.target.value)}
              placeholder="Contoh: SIM A Umum"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving || loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

/* ------------------------------------------------------------------ */
/* Add/Edit modal: Pengirim SIM                                       */
/* ------------------------------------------------------------------ */
const AddEditPengirimSimModal = ({ item, onClose, onSave, loading = false, options = { pengirim: [], sim: [] } }) => {
  const [form, setForm] = useState({
    id_pengirim: '',
    id_sim: '',
    status: 'AKTIF',
    nomor_sim: '',
    tgl_berlaku: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        id_pengirim: String(item.id_pengirim || ''),
        id_sim: String(item.id_sim || ''),
        status: item.status || 'AKTIF',
        nomor_sim: item.nomor_sim || '',
        tgl_berlaku: item.tgl_berlaku || '',
      });
    } else {
      setForm({ id_pengirim: '', id_sim: '', status: 'AKTIF', nomor_sim: '', tgl_berlaku: '' });
    }
    setError('');
  }, [item]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id_pengirim || !form.id_sim) {
      setError('Supir dan SIM wajib dipilih');
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form });
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {item ? 'Edit Pengirim SIM' : 'Tambah Pengirim SIM'}
            </h3>
            <p className="text-xs text-slate-500">Kelola relasi supir dan SIM</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Supir</label>
            <SearchableSelect
              options={options.pengirim}
              value={form.id_pengirim}
              onChange={(value) => updateField('id_pengirim', value || '')}
              placeholder="Pilih Supir"
              isClearable
              accentColor="orange"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">SIM</label>
            <SearchableSelect
              options={options.sim}
              value={form.id_sim}
              onChange={(value) => updateField('id_sim', value || '')}
              placeholder="Pilih SIM"
              isClearable
              accentColor="orange"
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Nomor SIM</label>
              <input
                className={textInputClass}
                value={form.nomor_sim}
                onChange={(e) => updateField('nomor_sim', e.target.value)}
                placeholder="Nomor SIM"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Tgl Berlaku</label>
              <input
                type="date"
                className={textInputClass}
                value={form.tgl_berlaku}
                onChange={(e) => updateField('tgl_berlaku', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Status</label>
            <select
              className={textInputClass}
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving || loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

/* ------------------------------------------------------------------ */
/* Tab panel                                                          */
/* ------------------------------------------------------------------ */
const TabPanel = ({ resource, config }) => {
  const hook = useMasterService(SopirService, resource);
  const [options, setOptions] = useState(config.options || { pengirim: [], sim: [] });

  useEffect(() => {
    if (config.loadOptions) {
      config.loadOptions().then(setOptions);
    }
  }, [config]);

  return (
    <MasterDataTablePage
      key={resource}
      storageKey={config.storageKey}
      title={config.title}
      subtitle={config.subtitle}
      accent="amber"
      icon={config.icon}
      hook={{
        loading: hook.loading,
        error: hook.error,
        fetch: hook.fetch,
        create: hook.create,
        update: hook.update,
        remove: hook.remove,
      }}
      filterFields={config.filterFields}
      extraColumns={config.extraColumns}
      AddEditModal={config.AddEditModal}
      DeleteModal={DeleteModal}
      addEditModalExtraProps={options}
      addLabel="Tambah"
      entityLabel={config.entityLabel}
      rowNameKey={config.rowNameKey}
    />
  );
};

/* ------------------------------------------------------------------ */
/* Main page                                                          */
/* ------------------------------------------------------------------ */
const SopirPage = () => {
  useDocumentTitle('Sopir');
  const [activeTabKey, setActiveTabKey] = useState('pengirim');

  const loadPengirimSimOptions = useCallback(async () => {
    const [pengirimRes, simRes] = await Promise.all([
      SopirService.getAll('pengirim'),
      SopirService.getAll('sim'),
    ]);

    return {
      pengirim: (pengirimRes.data || []).map((item) => ({
        value: String(item.id || item.pid || ''),
        label: item.nama || '-',
      })),
      sim: (simRes.data || []).map((item) => ({
        value: String(item.id || item.pid || ''),
        label: `${item.kode || '-'} - ${item.nama || '-'}`,
      })),
    };
  }, []);

  const configs = useMemo(
    () => ({
      pengirim: {
        storageKey: 'sopir_tab_state_v1',
        title: 'Data Supir',
        subtitle: 'Kelola data supir / pengirim',
        entityLabel: 'Supir',
        icon: Truck,
        rowNameKey: 'nama',
        filterFields: [
          { key: 'nama', placeholder: 'Nama supir' },
          { key: 'no_hp', placeholder: 'No HP' },
        ],
        extraColumns: [
          {
            name: <span>Nama</span>,
            grow: 1.6,
            minWidth: '220px',
            cell: (row) => (
              <div className="flex items-center gap-2 py-1">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-800">{row.nama}</div>
                </div>
              </div>
            ),
          },
          {
            name: <span>No HP</span>,
            width: '160px',
            cell: (row) => <span className="text-xs text-slate-600">{row.no_hp || '-'}</span>,
          },
          {
            name: <span>Alamat</span>,
            grow: 1.4,
            minWidth: '200px',
            cell: (row) => <span className="line-clamp-2 text-xs text-slate-600">{row.alamat || '-'}</span>,
          },
          {
            name: <span>Status</span>,
            width: '120px',
            cell: (row) => <span className={statusBadge(row.status === 'AKTIF')}>{row.status || '-'}</span>,
          },
        ],
        AddEditModal: AddEditSupirModal,
        options: { pengirim: [], sim: [] },
      },
      sim: {
        storageKey: 'sim_tab_state_v1',
        title: 'Data SIM',
        subtitle: 'Kelola data master SIM',
        entityLabel: 'SIM',
        icon: BadgeInfo,
        rowNameKey: 'kode',
        filterFields: [
          { key: 'kode', placeholder: 'Kode SIM' },
          { key: 'nama', placeholder: 'Nama SIM' },
        ],
        extraColumns: [
          {
            name: <span>Kode</span>,
            width: '140px',
            cell: (row) => (
              <span className={statusBadge(true)}>{row.kode}</span>
            ),
          },
          {
            name: <span>Nama</span>,
            grow: 1.6,
            minWidth: '220px',
            cell: (row) => (
              <div className="flex items-center gap-2 py-1">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                  <CreditCard className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-800">{row.nama}</div>
                </div>
              </div>
            ),
          },
        ],
        AddEditModal: AddEditSimModal,
        options: { pengirim: [], sim: [] },
      },
      pengirimsim: {
        storageKey: 'pengirim_sim_tab_state_v1',
        title: 'Data Pengirim SIM',
        subtitle: 'Kelola relasi supir dan SIM',
        entityLabel: 'Pengirim SIM',
        icon: FileBadge2,
        rowNameKey: 'pengirim_nama',
        filterFields: [
          { key: 'pengirim_nama', placeholder: 'Nama supir' },
          { key: 'sim_kode', placeholder: 'Kode SIM' },
          { key: 'nomor_sim', placeholder: 'Nomor SIM' },
        ],
        extraColumns: [
          {
            name: <span>Supir</span>,
            grow: 1.4,
            minWidth: '180px',
            cell: (row) => (
              <div className="flex items-center gap-2 py-1">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-800">{row.pengirim_nama || '-'}</div>
                </div>
              </div>
            ),
          },
          {
            name: <span>SIM</span>,
            width: '160px',
            cell: (row) => (
              <span className="text-xs font-medium text-slate-700">
                {row.sim_kode ? `${row.sim_kode} - ${row.sim_nama || ''}` : '-'}
              </span>
            ),
          },
          {
            name: <span>Nomor SIM</span>,
            width: '150px',
            cell: (row) => <span className="text-xs text-slate-600">{row.nomor_sim || '-'}</span>,
          },
          {
            name: <span>Berlaku</span>,
            width: '120px',
            cell: (row) => <span className="text-xs text-slate-500">{row.tgl_berlaku || '-'}</span>,
          },
          {
            name: <span>Status</span>,
            width: '120px',
            cell: (row) => <span className={statusBadge(row.status === 'AKTIF')}>{row.status || '-'}</span>,
          },
        ],
        AddEditModal: AddEditPengirimSimModal,
        loadOptions: loadPengirimSimOptions,
        options: { pengirim: [], sim: [] },
      },
    }),
    [loadPengirimSimOptions]
  );

  const activeTab = TABS.find((t) => t.key === activeTabKey) || TABS[0];
  const activeConfig = configs[activeTab.key];

  return (
    <div className="flex min-h-dvh flex-col overflow-hidden bg-slate-50">
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Truck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-slate-900 truncate">Master Sopir</h1>
              <p className="hidden text-xs text-slate-500 truncate sm:block">Data supir, SIM, dan relasi pengirim SIM</p>
            </div>
          </div>
        </div>
      </header>

      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-2 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab.key === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTabKey(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4 sm:px-6">
        <TabPanel resource={activeTab.key} config={activeConfig} />
      </div>
    </div>
  );
};

export default SopirPage;
