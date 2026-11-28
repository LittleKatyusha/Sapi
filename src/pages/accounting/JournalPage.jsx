import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import accountingService from '../../services/accountingService';
import SearchableSelect from '../../components/shared/SearchableSelect';
import CreateJournalModal, { JOURNAL_TYPES } from './CreateJournalModal';

const STATUS_OPTIONS = ['', 'draft', 'submitted', 'posted', 'void'];

// Opsi selectbox memakai template aplikasi (SearchableSelect) => format { value, label }.
const STATUS_SELECT_OPTIONS = STATUS_OPTIONS.map((s) => ({ value: s, label: s || 'Semua' }));
const JOURNAL_TYPE_SELECT_OPTIONS = [
  { value: '', label: 'Semua' },
  ...JOURNAL_TYPES.map((t) => ({ value: t, label: t })),
];

const statusClass = (status) => {
  switch (status) {
    case 'draft': return 'bg-yellow-100 text-yellow-700';
    case 'submitted': return 'bg-blue-100 text-blue-700';
    case 'posted': return 'bg-green-100 text-green-700';
    case 'void': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

export default function JournalPage() {
  const [settings, setSettings] = useState([]);
  const [selectedSettingId, setSelectedSettingId] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter tipe jurnal bisa di-deep-link dari laporan lain, mis.
  // /akuntansi/jurnal?tipe_jurnal=ADJUSTMENT dari halaman Neraca Saldo.
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('tipe_jurnal') || '';

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState(JOURNAL_TYPES.includes(initialType) ? initialType : '');
  const [filterPeriodId, setFilterPeriodId] = useState('');
  const [periods, setPeriods] = useState([]);

  // Opsi entitas untuk SearchableSelect (template selectbox aplikasi).
  const settingOptions = useMemo(
    () => settings.map((s) => ({ value: String(s.id), label: `${s.nama_perusahaan} (${s.entitas})` })),
    [settings]
  );

  // Opsi periode untuk SearchableSelect (template selectbox aplikasi).
  const periodOptions = useMemo(
    () => [
      { value: '', label: 'Semua' },
      ...periods.map((p) => ({ value: String(p.id), label: p.nama_periode })),
    ],
    [periods]
  );

  const loadBootstrap = async () => {
    try {
      setError('');
      const [settingsRes, coaRes] = await Promise.all([
        accountingService.getSettings(),
        accountingService.getCoa(),
      ]);
      const s = settingsRes?.data ?? [];
      setSettings(s);
      setAccounts((coaRes?.data ?? []).filter((a) => a.is_posting));
      if (s.length) setSelectedSettingId(String(s[0].id));
    } catch (e) {
      setError(e.message || 'Gagal memuat master akunting.');
    }
  };

  const loadPeriods = useCallback(async (sid) => {
    if (!sid) return;
    try {
      const r = await accountingService.getPeriods({ setting_id: Number(sid) });
      setPeriods(r?.data ?? []);
    } catch (_) { /* silent */ }
  }, []);

  const loadJournals = useCallback(async (sid) => {
    if (!sid) return;
    try {
      setLoading(true);
      setError('');
      const params = { setting_id: sid };
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.tipe_jurnal = filterType;
      if (filterPeriodId) params.period_id = filterPeriodId;
      const r = await accountingService.getJournals(params);
      setJournals(r?.data ?? []);
    } catch (e) {
      setError(e.message || 'Gagal memuat jurnal.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType, filterPeriodId]);

  useEffect(() => { loadBootstrap(); }, []);
  useEffect(() => {
    loadPeriods(selectedSettingId);
    loadJournals(selectedSettingId);
  }, [selectedSettingId, loadPeriods, loadJournals]);

  const runAction = async (action, id) => {
    try {
      setSaving(true);
      setError('');
      if (action === 'submit') await accountingService.submitJournal(id);
      if (action === 'post') await accountingService.postJournal(id);
      if (action === 'void') {
        const reason = window.prompt('Alasan void jurnal:');
        if (reason === null) { setSaving(false); return; }
        await accountingService.voidJournal(id, { void_reason: reason.trim() || null });
      }
      await loadJournals(selectedSettingId);
    } catch (ex) {
      setError(ex.message || `Gagal ${action} jurnal.`);
    } finally {
      setSaving(false);
    }
  };

  const isReadOnly = (status) => status === 'posted' || status === 'void';

  const currentSetting = useMemo(
    () => settings.find((s) => String(s.id) === String(selectedSettingId)),
    [settings, selectedSettingId]
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jurnal Umum</h1>
          <p className="mt-1 text-sm text-gray-500">Buat, kelola, dan posting jurnal akunting.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-64">
            <SearchableSelect
              options={settingOptions}
              value={selectedSettingId}
              onChange={(val) => setSelectedSettingId(val ?? '')}
              placeholder="Pilih entitas"
              isSearchable={true}
              isClearable={false}
              accentColor="blue"
              className="text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!selectedSettingId}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Jurnal Draft</span>
          </button>
        </div>
      </header>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {/* Filters */}
      <section className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <div className="text-sm text-gray-700">
          Status
          <SearchableSelect
            options={STATUS_SELECT_OPTIONS}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val ?? '')}
            placeholder="Semua"
            isClearable={false}
            isSearchable={false}
            accentColor="blue"
            className="mt-1"
          />
        </div>
        <div className="text-sm text-gray-700">
          Tipe Jurnal
          <SearchableSelect
            options={JOURNAL_TYPE_SELECT_OPTIONS}
            value={filterType}
            onChange={(val) => setFilterType(val ?? '')}
            placeholder="Semua"
            isClearable={false}
            isSearchable={true}
            accentColor="blue"
            className="mt-1"
          />
        </div>
        <div className="text-sm text-gray-700">
          Periode
          <SearchableSelect
            options={periodOptions}
            value={filterPeriodId}
            onChange={(val) => setFilterPeriodId(val ?? '')}
            placeholder="Semua"
            isClearable={false}
            isSearchable={true}
            accentColor="blue"
            className="mt-1"
          />
        </div>
        <div className="flex items-end">
          <button type="button" onClick={() => loadJournals(selectedSettingId)} disabled={loading || !selectedSettingId} className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Memuat...' : 'Filter'}
          </button>
        </div>
      </section>

      {/* Journals Table */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">Nomor</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Tipe</th>
                <th className="p-3">Keterangan</th>
                <th className="p-3 text-right">Debit</th>
                <th className="p-3 text-right">Kredit</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {journals.map((j) => (
                <tr key={j.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono cursor-pointer text-indigo-600 hover:underline" onClick={() => setExpandedId(expandedId === j.id ? null : j.id)}>{j.nomor_jurnal || 'DRAFT'}</td>
                  <td className="p-3">{j.tanggal}</td>
                  <td className="p-3 text-xs">{j.tipe_jurnal}</td>
                  <td className="p-3">{j.keterangan || '-'}</td>
                  <td className="p-3 text-right">{formatNumber(j.total_debit)}</td>
                  <td className="p-3 text-right">{formatNumber(j.total_credit)}</td>
                  <td className="p-3 text-center"><span className={`rounded-full px-2 py-1 text-xs font-medium uppercase ${statusClass(j.status)}`}>{j.status}</span></td>
                  <td className="p-3 text-center space-x-2">
                    {j.status === 'draft' && <button onClick={() => runAction('submit', j.id)} disabled={saving} className="text-xs text-indigo-600 hover:underline disabled:opacity-50">Submit</button>}
                    {j.status === 'submitted' && <button onClick={() => runAction('post', j.id)} disabled={saving} className="text-xs text-green-600 hover:underline disabled:opacity-50">Post</button>}
                    {j.status === 'posted' && <button onClick={() => runAction('void', j.id)} disabled={saving} className="text-xs text-red-600 hover:underline disabled:opacity-50">Void</button>}
                  </td>
                </tr>
              ))}

              {/* Expanded detail row */}
              {journals.filter((j) => expandedId === j.id).map((j) => (
                <tr key={`detail-${j.id}`}>
                  <td colSpan="8" className={`p-4 ${isReadOnly(j.status) ? 'bg-gray-50' : 'bg-indigo-50'}`}>
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span>ID: {j.id}</span>
                      {j.ref_table && <span>| Ref: {j.ref_table} #{j.ref_id}</span>}
                      {j.void_reason && <span className="text-red-600">| Void: {j.void_reason}</span>}
                      {isReadOnly(j.status) && <span className="ml-auto rounded bg-gray-200 px-2 py-0.5 font-medium text-gray-600">Read-only</span>}
                    </div>
                    <table className="w-full text-xs">
                      <thead className="text-gray-500">
                        <tr><th className="pb-1 text-left">Akun</th><th className="pb-1 text-right">Debit</th><th className="pb-1 text-right">Kredit</th><th className="pb-1 text-left">Keterangan</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(j.details ?? j.lines ?? []).map((l, idx) => (
                          <tr key={l.id ?? idx}>
                            <td className="py-1 font-mono">
                              {(l.coa?.kode_akun ?? l.kode_akun)
                                ? `${l.coa?.kode_akun ?? l.kode_akun} - ${l.coa?.nama_akun ?? l.nama_akun ?? ''}`
                                : '-'}
                            </td>
                            <td className="py-1 text-right">{formatNumber(l.debit)}</td>
                            <td className="py-1 text-right">{formatNumber(l.credit)}</td>
                            <td className="py-1">{l.keterangan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              ))}

              {!loading && !journals.length && <tr><td colSpan="8" className="p-8 text-center text-gray-500">Belum ada jurnal.</td></tr>}
              {loading && <tr><td colSpan="8" className="p-8 text-center text-gray-500">Memuat data...</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Buat Jurnal Draft */}
      <CreateJournalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadJournals(selectedSettingId)}
        selectedSettingId={selectedSettingId}
        settingName={currentSetting ? `${currentSetting.nama_perusahaan} (${currentSetting.entitas})` : ''}
        accounts={accounts}
      />
    </div>
  );
}
