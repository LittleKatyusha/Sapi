import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckSquare, FileText, Save, ShoppingCart, Sparkles } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';
import usePersetujuanRphSelect from '../Pembelian Sapi/hooks/usePersetujuanRphSelect';
import PilihPakanOvkModal from './modals/PilihPakanOvkModal';

const PAGE_VARIANTS = {
  pakan: {
    key: 'pakan',
    entityName: 'Pakan',
    pageTitle: 'Tambah Pembelian Pakan',
    subtitle:
      'Ajukan kebutuhan pembelian pakan RPH dengan alur yang ringkas, jelas, dan mudah ditindaklanjuti.',
    itemFieldLabel: 'Pilih Pakan',
    itemSelectLabel: 'Pakan',
    itemPlaceholder: 'Pilih Pakan',
    mengetahuiLabel: 'Mengetahui',
    notesLabel: 'Catatan',
    notesPlaceholder: 'Tambahkan catatan pembelian pakan bila diperlukan',
    ctaText: 'Ajukan ke Feedmill & Simpan',
    helperTitle: 'Persediaan Pakan',
    helperDescription:
      'Klik area ini untuk membuka modal pemilihan item atau melihat persediaan pakan yang tersedia.',
    emptySelectionText: 'Belum ada pakan yang dipilih',
    itemPreviewLabel: 'Pakan terpilih',
    accentClass: 'from-emerald-500 via-green-500 to-cyan-500',
    softAccentClass: 'from-emerald-50 via-white to-cyan-50',
    iconBgClass: 'bg-emerald-100 text-emerald-700',
    ctaClass: 'from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700'
  },
  ovk: {
    key: 'ovk',
    entityName: 'OVK',
    pageTitle: 'Tambah Pembelian OVK',
    subtitle:
      'Ajukan kebutuhan pembelian OVK RPH agar proses persetujuan dan pencatatan permintaan tetap terstruktur.',
    itemFieldLabel: 'Pilih OVK',
    itemSelectLabel: 'OVK',
    itemPlaceholder: 'Pilih OVK',
    mengetahuiLabel: 'Mengetahui',
    notesLabel: 'Catatan',
    notesPlaceholder: 'Tambahkan catatan pembelian OVK bila diperlukan',
    ctaText: 'Ajukan OVK & Simpan',
    helperTitle: 'Persediaan OVK',
    helperDescription:
      'Klik area ini untuk membuka modal pemilihan item atau melihat persediaan OVK yang tersedia.',
    emptySelectionText: 'Belum ada OVK yang dipilih',
    itemPreviewLabel: 'OVK terpilih',
    accentClass: 'from-violet-500 via-fuchsia-500 to-cyan-500',
    softAccentClass: 'from-violet-50 via-white to-cyan-50',
    iconBgClass: 'bg-violet-100 text-violet-700',
    ctaClass: 'from-violet-500 to-cyan-600 hover:from-violet-600 hover:to-cyan-700'
  }
};

const ITEM_OPTIONS = {
  pakan: [
    {
      id: 'pakan-001',
      name: 'Pakan Konsentrat Super',
      stock: '1.200 kg',
      unit: 'Kg',
      code: 'PKN-001',
      supplier: 'PT Agro Makmur',
      priceOptions: [7500, 8200]
    },
    {
      id: 'pakan-002',
      name: 'Pakan Hijauan Premium',
      stock: '800 kg',
      unit: 'Kg',
      code: 'PKN-002',
      supplier: 'CV Hijau Lestari',
      priceOptions: [6200, 7000]
    },
    {
      id: 'pakan-003',
      name: 'Pakan Fermentasi',
      stock: '450 kg',
      unit: 'Kg',
      code: 'PKN-003',
      supplier: 'UD Mitra Peternak',
      priceOptions: [9800, 10500]
    }
  ],
  ovk: [
    {
      id: 'ovk-001',
      name: 'Vitamin Ternak A',
      stock: '120 botol',
      unit: 'Botol',
      code: 'OVK-001',
      supplier: 'PT Sehat Farm',
      priceOptions: [18500, 21000]
    },
    {
      id: 'ovk-002',
      name: 'Disinfektan Kandang',
      stock: '85 botol',
      unit: 'Botol',
      code: 'OVK-002',
      supplier: 'CV Bio Clean',
      priceOptions: [26000, 29500]
    },
    {
      id: 'ovk-003',
      name: 'Antibiotik Spektrum',
      stock: '60 botol',
      unit: 'Botol',
      code: 'OVK-003',
      supplier: 'PT Vet Farma',
      priceOptions: [42000, 45000]
    }
  ]
};


const formatCurrency = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value || 0);

const FormField = ({ label, helperText, required = false, children }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {required && <span className="ml-1 text-rose-500">*</span>}
    </label>
    {children}
    {helperText ? <p className="text-xs text-slate-400">{helperText}</p> : null}
  </div>
);


const AddPembelianPakanOvkPage = () => {
  const navigate = useNavigate();
  const { type } = useParams();

  const config = PAGE_VARIANTS[type] || PAGE_VARIANTS.ovk;
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedMengetahui, setSelectedMengetahui] = useState(null);
  const [notes, setNotes] = useState('');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  const { persetujuanOptions, loading: persetujuanLoading } = usePersetujuanRphSelect();
  const itemOptions = useMemo(() => ITEM_OPTIONS[config.key] || [], [config.key]);

  const handleApplyItems = (items) => {
    setSelectedItems(items);
    setIsItemModalOpen(false);
  };

  const handleBack = () => navigate('/rph/pembelian-pakan-ovk');

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.softAccentClass} p-3 sm:p-5 md:p-6`}>
      <div className="w-full space-y-6">
        <section className="overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.25)]">
          <div className={`h-1.5 w-full bg-gradient-to-r ${config.accentClass}`} />
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                aria-label="Kembali"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className={`rounded-3xl p-4 ${config.iconBgClass}`}>
                  <ShoppingCart className="h-7 w-7" />
                </div>
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                    <Sparkles className="h-3.5 w-3.5" />
                    Form Pengajuan RPH
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {config.pageTitle}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
                    {config.subtitle}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                form="pembelian-pakan-ovk-form"
                className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all ${config.ctaClass}`}
              >
                <Save className="h-4 w-4" />
                {config.ctaText}
              </button>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <form
            id="pembelian-pakan-ovk-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Data Pengajuan</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Isi data utama pembelian, pilih item, dan lengkapi catatan sesuai kebutuhan operasional.
                  </p>
                </div>

                <div className="hidden rounded-2xl bg-slate-50 px-4 py-3 text-right sm:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Tipe Form
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{config.entityName}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <FormField
                  label={config.itemFieldLabel}
                  helperText={`Gunakan field ini untuk memilih ${config.itemSelectLabel.toLowerCase()} yang akan diajukan.`}
                  required
                >
                  <button
                    type="button"
                    onClick={() => setIsItemModalOpen(true)}
                    className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-600 transition hover:border-emerald-300 hover:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  >
                    {selectedItems.length === 0 ? (
                      <span className="text-slate-400">{config.itemPlaceholder}</span>
                    ) : (
                      <span className="text-slate-600">
                        {selectedItems.length} item dipilih • klik untuk ubah pilihan
                      </span>
                    )}
                  </button>
                </FormField>

                <FormField
                  label={config.mengetahuiLabel}
                  helperText="Pilih pihak yang mengetahui pengajuan ini."
                  required
                >
                  <SearchableSelect
                    value={selectedMengetahui}
                    onChange={setSelectedMengetahui}
                    options={persetujuanOptions.filter((option) => option.value !== '')}
                    placeholder={persetujuanLoading ? 'Loading...' : `Pilih ${config.mengetahuiLabel}`}
                    isLoading={persetujuanLoading}
                    isDisabled={persetujuanLoading}
                  />
                </FormField>

                <div className="md:col-span-2">
                  <FormField
                    label={config.notesLabel}
                    helperText="Catatan ini bersifat opsional dan dapat digunakan untuk kebutuhan internal."
                  >
                    <div className="relative">
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        rows={5}
                        className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        placeholder={config.notesPlaceholder}
                      />
                      <div className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-400 shadow-sm">
                        <FileText className="h-3.5 w-3.5" />
                        {notes.length}/255
                      </div>
                    </div>
                  </FormField>
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Detail Produk ({selectedItems.length} item)
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedItems.length === 0
                      ? config.emptySelectionText
                      : `Total ${selectedItems.length} item dipilih dari modal.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Tambah Produk
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-xs">
                  <thead className="bg-emerald-50 text-slate-600">
                    <tr className="border-b border-emerald-100">
                      <th className="w-12 px-4 py-2 text-left font-semibold">Pilih</th>
                      <th className="px-4 py-2 text-left font-semibold">Nama Produk</th>
                      <th className="px-4 py-2 text-left font-semibold">Persediaan</th>
                      <th className="px-4 py-2 text-left font-semibold">Satuan</th>
                      <th className="px-4 py-2 text-left font-semibold">Pilih Harga</th>
                      <th className="px-4 py-2 text-left font-semibold">Jumlah Pembelian</th>
                      <th className="px-4 py-2 text-left font-semibold">Kode Barang</th>
                      <th className="px-4 py-2 text-left font-semibold">Pemasok</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                          {config.emptySelectionText}
                        </td>
                      </tr>
                    ) : (
                      selectedItems.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="px-4 py-2">
                            <CheckSquare className="h-4 w-4 text-emerald-600" />
                          </td>
                          <td className="px-4 py-2 font-semibold text-slate-700">{item.name}</td>
                          <td className="px-4 py-2 text-slate-600">{item.stock}</td>
                          <td className="px-4 py-2 text-slate-600">{item.unit}</td>
                          <td className="px-4 py-2 text-slate-700">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-2 text-slate-700">{item.qty}</td>
                          <td className="px-4 py-2 text-slate-600">{item.code}</td>
                          <td className="px-4 py-2 text-slate-600">{item.supplier}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

          </form>
        </div>
      </div>

      <PilihPakanOvkModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        items={itemOptions}
        initialSelected={selectedItems}
        onApply={handleApplyItems}
        title={config.helperTitle}
        accentClass={config.accentClass}
      />
    </div>
  );
};

export default AddPembelianPakanOvkPage;