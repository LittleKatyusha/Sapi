import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, CheckCircle2, AlertCircle, Calendar, FileText, BookOpen } from 'lucide-react';
import accountingService from '../../services/accountingService';
import SearchableSelect from '../../components/shared/SearchableSelect';

export const JOURNAL_TYPES = [
  'MEMORIAL', 'ADJUSTMENT', 'YEAR_END', 'PURCHASE', 'PURCHASE_RETURN',
  'PURCHASE_PAYMENT', 'SALES', 'SALES_RETURN', 'SALES_PAYMENT',
  'INVENTORY_IN', 'INVENTORY_COGS', 'INVENTORY_ADJUSTMENT',
  'BANK_CHARGE', 'CASH_TRANSFER', 'BANK_INTEREST',
];

// Opsi tipe jurnal untuk SearchableSelect (template selectbox aplikasi).
const JOURNAL_TYPE_OPTIONS = JOURNAL_TYPES.map((tipe) => ({ value: tipe, label: tipe }));

const emptyLine = () => ({ coa_id: '', debit: 0, credit: 0, keterangan: '' });
const emptyForm = () => ({
  tanggal: new Date().toISOString().slice(0, 10),
  tipe_jurnal: 'MEMORIAL',
  keterangan: '',
  lines: [emptyLine(), emptyLine()],
});

const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

export default function CreateJournalModal({
  isOpen,
  onClose,
  onSuccess,
  selectedSettingId,
  settingName,
  accounts = [],
}) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setForm(emptyForm());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  // Formatted options for SearchableSelect
  const accountOptions = useMemo(() => {
    return (accounts || []).map((a) => ({
      value: Number(a.id),
      label: `${a.kode_akun} - ${a.nama_akun}`,
      kode_akun: a.kode_akun,
      nama_akun: a.nama_akun,
      tipe: a.tipe,
    }));
  }, [accounts]);

  const updateLine = (index, field, value) => {
    const lines = [...form.lines];
    lines[index] = { ...lines[index], [field]: value };
    setForm({ ...form, lines });
  };

  const addLine = () => {
    setForm({ ...form, lines: [...form.lines, emptyLine()] });
  };

  const removeLine = (index) => {
    if (form.lines.length <= 2) return;
    setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== index) });
  };

  const totalDebit = form.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredit = form.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSettingId) {
      setError('Pilih entitas akunting terlebih dahulu.');
      return;
    }

    const invalidLine = form.lines.find(
      (l) => !l.coa_id || (Number(l.debit || 0) === 0 && Number(l.credit || 0) === 0)
    );
    if (invalidLine) {
      setError('Setiap baris wajib memilih akun COA dan memiliki nilai debit atau kredit.');
      return;
    }

    if (!isBalanced) {
      setError('Total debit dan kredit wajib seimbang serta lebih besar dari 0.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await accountingService.createJournal({
        setting_id: Number(selectedSettingId),
        tanggal: form.tanggal,
        tipe_jurnal: form.tipe_jurnal,
        keterangan: form.keterangan || null,
        lines: form.lines.map((l) => ({
          coa_id: Number(l.coa_id),
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
          keterangan: l.keterangan || null,
        })),
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (ex) {
      setError(ex.message || 'Gagal menyimpan draft jurnal.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="flex flex-col w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/75 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Buat Jurnal Draft</h2>
              <p className="text-xs text-gray-500">
                {settingName ? `Entitas: ${settingName}` : 'Pencatatan jurnal umum manual'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} id="create-journal-form" className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Header Form: Tanggal, Tipe Jurnal, Keterangan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/60 p-4 rounded-xl border border-gray-200">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                <span className="flex items-center gap-1.5 mb-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  Tanggal *
                </span>
                <input
                  type="date"
                  required
                  value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </label>

              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                <span className="flex items-center gap-1.5 mb-1.5">
                  <FileText className="h-3.5 w-3.5 text-gray-500" />
                  Tipe Jurnal *
                </span>
                <SearchableSelect
                  options={JOURNAL_TYPE_OPTIONS}
                  value={form.tipe_jurnal}
                  onChange={(val) => setForm({ ...form, tipe_jurnal: val || 'MEMORIAL' })}
                  placeholder="Pilih tipe jurnal"
                  isClearable={false}
                  isSearchable={true}
                  accentColor="blue"
                  className="normal-case font-normal tracking-normal"
                />
              </div>

              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                <span className="flex items-center gap-1.5 mb-1.5">
                  <FileText className="h-3.5 w-3.5 text-gray-500" />
                  Keterangan / Memo
                </span>
                <input
                  type="text"
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  placeholder="Keterangan transaksi jurnal"
                  className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </label>
            </div>

            {/* Lines List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                  Baris Jurnal (Minimal 2 Baris)
                </h3>
                <span className="text-xs text-gray-500">
                  {form.lines.length} baris akun
                </span>
              </div>

              <div className="overflow-x-auto -mx-1 px-1">
                <table className="w-full text-left text-sm border-separate border-spacing-y-2.5">
                  <thead>
                    <tr className="text-xs font-semibold uppercase text-gray-500">
                      <th className="pb-1 w-[44%] min-w-[300px]">Akun COA *</th>
                      <th className="pb-1 w-[18%] min-w-[130px] text-right">Debit (Rp)</th>
                      <th className="pb-1 w-[18%] min-w-[130px] text-right">Kredit (Rp)</th>
                      <th className="pb-1 w-[18%] min-w-[150px]">Keterangan</th>
                      <th className="pb-1 w-[2%] text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.lines.map((line, index) => (
                      <tr key={index} className="align-top">
                        <td className="pr-2">
                          <SearchableSelect
                            options={accountOptions}
                            value={line.coa_id ? Number(line.coa_id) : ''}
                            onChange={(val) => updateLine(index, 'coa_id', val ? Number(val) : '')}
                            placeholder="Pilih atau cari akun..."
                            accentColor="blue"
                            className="w-full"
                            formatOptionLabel={(option, { context }) => {
                              if (context === 'value') {
                                return <span className="font-mono text-sm">{option.label}</span>;
                              }
                              return (
                                <div className="flex items-center justify-between w-full py-0.5">
                                  <span className="font-mono text-sm text-gray-800">{option.label}</span>
                                  {option.tipe && (
                                    <span className="text-[11px] font-sans px-2 py-0.5 rounded bg-gray-100 text-gray-600 ml-2 shrink-0">
                                      {option.tipe}
                                    </span>
                                  )}
                                </div>
                              );
                            }}
                          />
                        </td>
                        <td className="pr-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={line.debit || ''}
                            onChange={(e) => updateLine(index, 'debit', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 text-right border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono"
                          />
                        </td>
                        <td className="pr-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={line.credit || ''}
                            onChange={(e) => updateLine(index, 'credit', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 text-right border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono"
                          />
                        </td>
                        <td className="pr-2">
                          <input
                            type="text"
                            value={line.keterangan || ''}
                            onChange={(e) => updateLine(index, 'keterangan', e.target.value)}
                            placeholder="Memo (opsional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                          />
                        </td>
                        <td className="text-center pt-2">
                          <button
                            type="button"
                            onClick={() => removeLine(index)}
                            disabled={form.lines.length <= 2}
                            className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-20 rounded-lg hover:bg-red-50 transition-colors"
                            title="Hapus baris"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 py-1 px-2 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Baris Akun</span>
              </button>
            </div>

            {/* Summary & Balance Bar */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-5">
                <div>
                  <span className="text-xs text-gray-500 uppercase block font-medium">Total Debit</span>
                  <span className="font-mono text-base font-bold text-gray-900">Rp {formatNumber(totalDebit)}</span>
                </div>
                <div className="border-l border-gray-300 pl-5">
                  <span className="text-xs text-gray-500 uppercase block font-medium">Total Kredit</span>
                  <span className="font-mono text-base font-bold text-gray-900">Rp {formatNumber(totalCredit)}</span>
                </div>
                {difference > 0 && (
                  <div className="border-l border-gray-300 pl-5">
                    <span className="text-xs text-red-500 uppercase block font-medium">Selisih</span>
                    <span className="font-mono text-base font-bold text-red-600">Rp {formatNumber(difference)}</span>
                  </div>
                )}
              </div>

              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold ${
                    isBalanced
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}
                >
                  {isBalanced ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>SEIMBANG (BALANCED)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span>BELUM SEIMBANG</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || !isBalanced || !selectedSettingId}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {saving ? 'Menyimpan...' : 'Simpan Draft Jurnal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
