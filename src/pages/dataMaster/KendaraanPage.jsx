import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Truck, FileBadge2, AlertTriangle, Trash2, X, Save,
  Users,
} from 'lucide-react';

import useDocumentTitle from '../../hooks/useDocumentTitle';
import SearchableSelect from '../../components/shared/SearchableSelect';
import KendaraanService from '../../services/kendaraanService';
import MasterDataTablePage from './pembeliHo/components/MasterDataTablePage';
import useMasterService from './hooks/useMasterService';

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

const TABS = [
  { key: 'kendaraan', label: 'Kendaraan', icon: Truck, entityLabel: 'Kendaraan' },
  { key: 'dokumen', label: 'Dokumen', icon: FileBadge2, entityLabel: 'Dokumen Kendaraan' },
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
/* Add/Edit modal: Kendaraan                                          */
/* ------------------------------------------------------------------ */
const AddEditKendaraanModal = ({ item, onClose, onSave, loading = false }) => {
  const [form, setForm] = useState({ jenis_kendaraan: '', plat_nomor: '', status: 'AKTIF' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        jenis_kendaraan: item.jenis_kendaraan || '',
        plat_nomor: item.plat_nomor || '',
        status: item.status || 'AKTIF',
      });
    } else {
      setForm({ jenis_kendaraan: '', plat_nomor: '', status: 'AKTIF' });
    }
    setError('');
  }, [item]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.jenis_kendaraan.trim() || !form.plat_nomor.trim()) {
      setError('Jenis kendaraan dan plat nomor wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        jenis_kendaraan: form.jenis_kendaraan.trim(),
        plat_nomor: form.plat_nomor.trim(),
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
            <h3 className="text-base font-semibold text-slate-900">
              {item ? 'Edit Kendaraan' : 'Tambah Kendaraan'}
            </h3>
            <p className="text-xs text-slate-500">Kelola data kendaraan ekspedisi</p>
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
            <label className="mb-1 block text-xs font-semibold text-slate-700">Jenis Kendaraan</label>
            <input
              className={textInputClass}
              value={form.jenis_kendaraan}
              onChange={(e) => updateField('jenis_kendaraan', e.target.value)}
              placeholder="Contoh: Pick Up, Truk, Box"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Plat Nomor</label>
            <input
              className={textInputClass}
              value={form.plat_nomor}
              onChange={(e) => updateField('plat_nomor', e.target.value)}
              placeholder="Contoh: B 1234 ABC"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Status</label>
            <select
              className={textInputClass}
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
            >
              {STATUS_KENDARAAN_OPTIONS.map((opt) => (
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
/* Add/Edit modal: Dokumen Kendaraan                                  */
/* ------------------------------------------------------------------ */
const AddEditDokumenModal = ({ item, onClose, onSave, loading = false, options = { kendaraan: [] } }) => {
  const [form, setForm] = useState({
    id_kendaraan_ekspedisi: '',
    jenis_dokumen: 'STNK',
    status: 'ON',
    tgl_berlaku_mulai: '',
    tgl_berlaku_sampai: '',
    keterangan: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        id_kendaraan_ekspedisi: String(item.id_kendaraan_ekspedisi || ''),
        jenis_dokumen: item.jenis_dokumen || 'STNK',
        status: item.status || 'ON',
        tgl_berlaku_mulai: item.tgl_berlaku_mulai || '',
        tgl_berlaku_sampai: item.tgl_berlaku_sampai || '',
        keterangan: item.keterangan || '',
      });
    } else {
      setForm({
        id_kendaraan_ekspedisi: '',
        jenis_dokumen: 'STNK',
        status: 'ON',
        tgl_berlaku_mulai: '',
        tgl_berlaku_sampai: '',
        keterangan: '',
      });
    }
    setError('');
  }, [item]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id_kendaraan_ekspedisi) {
      setError('Kendaraan wajib dipilih');
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
              {item ? 'Edit Dokumen' : 'Tambah Dokumen'}
            </h3>
            <p className="text-xs text-slate-500">Kelola dokumen STNK, PLAT, dan KIR</p>
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
            <label className="mb-1 block text-xs font-semibold text-slate-700">Kendaraan</label>
            <SearchableSelect
              options={options.kendaraan}
              value={form.id_kendaraan_ekspedisi}
              onChange={(value) => updateField('id_kendaraan_ekspedisi', value || '')}
              placeholder="Pilih Kendaraan"
              isClearable
              accentColor="orange"
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Jenis Dokumen</label>
              <select
                className={textInputClass}
                value={form.jenis_dokumen}
                onChange={(e) => updateField('jenis_dokumen', e.target.value)}
              >
                {JENIS_DOKUMEN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Status</label>
              <select
                className={textInputClass}
                value={form.status}
                onChange={(e) => updateField('status', e.target.value)}
              >
                {STATUS_DOKUMEN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Tgl Berlaku Mulai</label>
              <input
                type="date"
                className={textInputClass}
                value={form.tgl_berlaku_mulai}
                onChange={(e) => updateField('tgl_berlaku_mulai', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Tgl Berlaku Sampai</label>
              <input
                type="date"
                className={textInputClass}
                value={form.tgl_berlaku_sampai}
                onChange={(e) => updateField('tgl_berlaku_sampai', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Keterangan</label>
            <textarea
              className={`${textInputClass} min-h-[80px]`}
              value={form.keterangan}
              onChange={(e) => updateField('keterangan', e.target.value)}
              placeholder="Keterangan tambahan..."
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
/* Tab panel                                                          */
/* ------------------------------------------------------------------ */
const TabPanel = ({ resource, config }) => {
  const hook = useMasterService(KendaraanService, resource);
  const [options, setOptions] = useState(config.options || { kendaraan: [] });

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
const KendaraanPage = () => {
  useDocumentTitle('Kendaraan');
  const [activeTabKey, setActiveTabKey] = useState('kendaraan');

  const loadKendaraanOptions = useCallback(async () => {
    const res = await KendaraanService.getAll('kendaraan');
    return {
      kendaraan: (res.data || []).map((item) => ({
        value: String(item.id || item.pid || ''),
        label: `${item.jenis_kendaraan || '-'} / ${item.plat_nomor || '-'}`,
      })),
    };
  }, []);

  const configs = useMemo(
    () => ({
      kendaraan: {
        storageKey: 'kendaraan_tab_state_v1',
        title: 'Data Kendaraan',
        subtitle: 'Kelola kendaraan ekspedisi',
        entityLabel: 'Kendaraan',
        icon: Truck,
        rowNameKey: 'plat_nomor',
        filterFields: [
          { key: 'jenis_kendaraan', placeholder: 'Jenis kendaraan' },
          { key: 'plat_nomor', placeholder: 'Plat nomor' },
        ],
        extraColumns: [
          {
            name: <span>Jenis Kendaraan</span>,
            grow: 1.6,
            minWidth: '220px',
            cell: (row) => (
              <div className="flex items-center gap-2 py-1">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                  <Truck className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-800">{row.jenis_kendaraan}</div>
                </div>
              </div>
            ),
          },
          {
            name: <span>Plat Nomor</span>,
            width: '160px',
            cell: (row) => (
              <span className={statusBadge(true)}>{row.plat_nomor}</span>
            ),
          },
          {
            name: <span>Status</span>,
            width: '120px',
            cell: (row) => (
              <span className={statusBadge(row.status === 'AKTIF')}>
                {row.status || '-'}
              </span>
            ),
          },
        ],
        AddEditModal: AddEditKendaraanModal,
        options: { kendaraan: [] },
      },
      dokumen: {
        storageKey: 'kendaraan_dokumen_tab_state_v1',
        title: 'Dokumen Kendaraan',
        subtitle: 'Kelola STNK, PLAT, dan KIR',
        entityLabel: 'Dokumen Kendaraan',
        icon: FileBadge2,
        rowNameKey: 'kendaraan_label',
        filterFields: [
          { key: 'kendaraan_label', placeholder: 'Kendaraan' },
          { key: 'jenis_dokumen', placeholder: 'Jenis dokumen' },
        ],
        extraColumns: [
          {
            name: <span>Kendaraan</span>,
            grow: 1.6,
            minWidth: '220px',
            cell: (row) => (
              <div className="flex items-center gap-2 py-1">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-800">{row.kendaraan_label || '-'}</div>
                </div>
              </div>
            ),
          },
          {
            name: <span>Jenis Dokumen</span>,
            width: '130px',
            cell: (row) => (
              <span className="text-xs font-medium text-slate-700">{row.jenis_dokumen}</span>
            ),
          },
          {
            name: <span>Status</span>,
            width: '110px',
            cell: (row) => (
              <span className={statusBadge(row.status === 'ON')}>{row.status || '-'}</span>
            ),
          },
          {
            name: <span>Mulai</span>,
            width: '120px',
            cell: (row) => <span className="text-xs text-slate-500">{row.tgl_berlaku_mulai || '-'}</span>,
          },
          {
            name: <span>Sampai</span>,
            width: '120px',
            cell: (row) => <span className="text-xs text-slate-500">{row.tgl_berlaku_sampai || '-'}</span>,
          },
          {
            name: <span>Keterangan</span>,
            grow: 1.4,
            minWidth: '180px',
            cell: (row) => <span className="line-clamp-2 text-xs text-slate-600">{row.keterangan || '-'}</span>,
          },
        ],
        AddEditModal: AddEditDokumenModal,
        loadOptions: loadKendaraanOptions,
        options: { kendaraan: [] },
      },
    }),
    [loadKendaraanOptions]
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
              <h1 className="text-base font-bold tracking-tight text-slate-900 truncate">Master Kendaraan</h1>
              <p className="hidden text-xs text-slate-500 truncate sm:block">Data kendaraan ekspedisi dan dokumennya</p>
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

export default KendaraanPage;
