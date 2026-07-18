import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Loader2, MoreVertical, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import PenjualanKarkasService from '../../../../services/penjualanKarkasService';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

const money = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n) || 0);
const formatNumberInput = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(number) : '';
};
const parseNumberInput = (value) => String(value || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
const blankItem = (harga = 0) => ({ id_pembelian_ho_detail: '', berat_paha_depan_kg: '', berat_paha_belakang_kg: '', harga_karkas_aktual: harga || '', berat_kulit_kg: 0, perlakuan_kulit: 'DITABUNG', nominal_kulit: '', alasan_perubahan_harga: '' });
const initial = (harga = 0) => ({ id_pedagang: '', tanggal_penjualan: new Date().toISOString().slice(0, 10), tipe_pembayaran: '1', id_syarat_pembelian: '', pengiriman: 'DIAMBIL', biaya_pengiriman: 0, alamat_pengiriman: '', id_pengirim: '', id_kendaraan_ekspedisi: '', nama_penerima: '', keterangan: '', items: [blankItem(harga)] });
const optionRows = (response) => Array.isArray(response) ? response : (response?.data || []);
const toSelectOptions = (items) => items.map((item) => ({ value: String(item.id), label: item.label }));
const sapiCode = (item) => item.code_eartag || String(item.label || '').split(' - ')[0].split(' \u2014 ')[0].split(' \u00e2\u20ac\u201d ')[0] || item.eartag || '-';
const toSapiOptions = (items) => items.map((item) => ({
  value: String(item.id),
  label: item.label,
  eartag: sapiCode(item),
  klasifikasi: item.klasifikasi || '-',
  berat: Number(item.berat || 0),
}));
const PAYMENT_OPTIONS = [{ value: '1', label: 'Tunai' }, { value: '2', label: 'Kredit' }];
const SKIN_TREATMENT_OPTIONS = [{ value: 'DITABUNG', label: 'Ditabung' }, { value: 'DIAMBIL', label: 'Diambil' }];
const SHIPPING_OPTIONS = [{ value: 'DIAMBIL', label: 'Diambil' }, { value: 'DIANTAR', label: 'Diantar' }];
const paymentStatusLabel = (row) => {
  if (row.status_transaksi === 'BATAL') return 'Batal';
  if (row.payment_status_label) return row.payment_status_label;
  return Number(row.payment_status) === 1 ? 'Lunas' : (Number(row.payment_status) === 0 ? 'DP' : 'Belum Dibayar');
};
const paymentStatusClass = (row) => {
  if (row.status_transaksi === 'BATAL') return 'bg-rose-100 text-rose-700';
  if (Number(row.payment_status) === 1) return 'bg-emerald-100 text-emerald-700';
  if (Number(row.payment_status) === 0) return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-700';
};
const isPaidRow = (row) => Number(row.payment_status) === 1 || String(row.payment_status_label || '').toLowerCase() === 'lunas';
const formatSapiOption = (option, { context }) => {
  if (context === 'value') {
    return `${option.eartag} - ${option.klasifikasi} - ${option.berat.toFixed(2)} kg`;
  }

  return (
    <div className="py-1">
      <div className="font-semibold text-slate-800">{option.eartag}</div>
      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
        <span>{option.klasifikasi}</span>
        <span className="h-1 w-1 rounded-full bg-slate-300" />
        <span>{option.berat.toFixed(2)} kg</span>
      </div>
    </div>
  );
};

const Field = ({ label, children, className = '' }) => <label className={`block ${className}`}><span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>{children}</label>;
const Input = (props) => <input {...props} className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 ${props.className || ''}`} />;
const MoneyInput = ({ value, onChange, ...props }) => <Input {...props} type="text" inputMode="decimal" value={formatNumberInput(value)} onChange={e => onChange(parseNumberInput(e.target.value))} />;

const RowActionMenu = ({ row, anchorRef, onClose, onDetail, onEdit, onDelete, disabled = false }) => {
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);
  const locked = disabled || row.status_transaksi === 'BATAL' || isPaidRow(row);

  useEffect(() => {
    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: Math.max(12, rect.right - 192),
        zIndex: 200,
      });
    };

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && anchorRef.current && !anchorRef.current.contains(event.target)) {
        onClose();
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [anchorRef, onClose]);

  if (!menuStyle) return null;

  return createPortal(
    <div ref={menuRef} style={menuStyle} className="w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl" role="menu" aria-label="Menu aksi">
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Menu Aksi</p>
      </div>
      <div className="p-1.5">
        <button type="button" onClick={() => { onDetail(row); onClose(); }} disabled={disabled} className="mt-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40" role="menuitem">
          <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><Eye className="h-4 w-4" /></span>
          <span className="text-xs font-semibold">Detail</span>
        </button>
        <button type="button" onClick={() => { onEdit(row); onClose(); }} disabled={locked} title={isPaidRow(row) ? 'Transaksi sudah dibayar, tidak bisa diedit.' : undefined} className="mt-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40" role="menuitem">
          <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><Pencil className="h-4 w-4" /></span>
          <span className="text-xs font-semibold">Edit</span>
        </button>
        <button type="button" onClick={() => { onDelete(row); onClose(); }} disabled={locked} title={isPaidRow(row) ? 'Transaksi sudah dibayar, tidak bisa dihapus.' : undefined} className="mt-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40" role="menuitem">
          <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600"><Trash2 className="h-4 w-4" /></span>
          <span className="text-xs font-semibold">Hapus</span>
        </button>
      </div>
    </div>,
    document.body
  );
};

const RowActionButton = ({ row, isOpen, onToggle, onClose, onDetail, onEdit, onDelete, disabled = false }) => {
  const buttonRef = useRef(null);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          onToggle(row.pid);
        }}
        className={`rounded-lg border p-2 text-slate-600 shadow-sm transition-all hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 ${isOpen ? 'border-rose-400 bg-rose-50 text-rose-600' : 'border-slate-300 bg-white'}`}
        aria-label={`Menu aksi ${row.nama_pedagang || 'penjualan karkas'}`}
        aria-expanded={isOpen}
      >
        <MoreVertical className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen ? (
        <RowActionMenu row={row} anchorRef={buttonRef} onClose={onClose} onDetail={onDetail} onEdit={onEdit} onDelete={onDelete} disabled={disabled} />
      ) : null}
    </div>
  );
};

const KarkasFormModal = ({
  form,
  saving,
  totals,
  pedagang,
  banks,
  pengirim,
  kendaraan,
  available,
  onClose,
  onSubmit,
  selectPedagang,
  selectPaymentType,
  selectShipping,
  setHeader,
  setItem,
  addItem,
  removeItem,
}) => (
  <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
    <form onSubmit={onSubmit} className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{form.pid ? 'Edit' : 'Tambah'} Penjualan Karkas</h2>
          <p className="mt-1 text-sm text-slate-500">Lengkapi data pedagang, detail sapi, dan pengiriman.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6 px-6 py-5">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Pedagang">
                <SearchableSelect required value={String(form.id_pedagang || '')} onChange={v => selectPedagang(v || '')} options={toSelectOptions(pedagang)} placeholder="Pilih pedagang" accentColor="red" />
              </Field>
              <Field label="Tanggal Penjualan">
                <Input required type="date" value={String(form.tanggal_penjualan || '').slice(0, 10)} onChange={e => setHeader('tanggal_penjualan', e.target.value)} />
              </Field>
              <Field label="Pembayaran">
                <SearchableSelect value={String(form.tipe_pembayaran || '1')} onChange={selectPaymentType} options={PAYMENT_OPTIONS} placeholder="Pilih pembayaran" accentColor="red" isClearable={false} />
              </Field>
              {String(form.tipe_pembayaran || '1') === '2' && (
                <Field label="Bank">
                  <SearchableSelect required value={String(form.id_syarat_pembelian || '')} onChange={v => setHeader('id_syarat_pembelian', v || '')} options={toSelectOptions(banks)} placeholder="Pilih bank" accentColor="red" />
                </Field>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Pengiriman">
              <SearchableSelect value={form.pengiriman || 'DIAMBIL'} onChange={selectShipping} options={SHIPPING_OPTIONS} placeholder="Pilih pengiriman" accentColor="red" isClearable={false} />
            </Field>

            {form.pengiriman === 'DIANTAR' && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Biaya Pengiriman">
                    <MoneyInput min="0" value={form.biaya_pengiriman} onChange={value => setHeader('biaya_pengiriman', value)} />
                  </Field>
                  <Field label="Nama Penerima">
                    <Input required value={form.nama_penerima} onChange={e => setHeader('nama_penerima', e.target.value)} />
                  </Field>
                </div>
                <Field label="Alamat Pengiriman">
                  <textarea required value={form.alamat_pengiriman} onChange={e => setHeader('alamat_pengiriman', e.target.value)} className="min-h-[96px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" rows="3" />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Pengirim">
                    <SearchableSelect required value={String(form.id_pengirim || '')} onChange={v => setHeader('id_pengirim', v || '')} options={toSelectOptions(pengirim)} placeholder="Pilih pengirim" accentColor="red" />
                  </Field>
                  <Field label="Kendaraan Ekspedisi">
                    <SearchableSelect required value={String(form.id_kendaraan_ekspedisi || '')} onChange={v => setHeader('id_kendaraan_ekspedisi', v || '')} options={toSelectOptions(kendaraan)} placeholder="Pilih kendaraan" accentColor="red" />
                  </Field>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Detail Sapi Penjualan</h3>
              <p className="text-sm text-slate-500">Pilih sapi berdasarkan code eartag, isi berat karkas, harga, dan perlakuan kulit.</p>
            </div>
            <button type="button" onClick={addItem} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">
              <Plus className="h-4 w-4" /> Tambah Sapi
            </button>
          </div>

          <div className="space-y-4">
            {form.items.map((x, i) => {
              const totalBerat = Number(x.berat_paha_depan_kg || 0) + Number(x.berat_paha_belakang_kg || 0);
              const nominalKarkas = totalBerat * Number(x.harga_karkas_aktual || 0);
              const nominalKulit = Number(x.nominal_kulit || 0);
              return (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                    <Field label="Sapi">
                      <SearchableSelect required value={String(x.id_pembelian_ho_detail || '')} onChange={v => setItem(i, 'id_pembelian_ho_detail', v || '')} options={toSapiOptions(available(x.id_pembelian_ho_detail))} placeholder="Pilih sapi" accentColor="red" maxMenuHeight={280} formatOptionLabel={formatSapiOption} filterOption={(candidate, input) => candidate.data.label.toLowerCase().includes(input.toLowerCase())} />
                    </Field>
                    <Field label="Paha Depan (kg)">
                      <Input required type="number" min="0.01" step="0.01" value={x.berat_paha_depan_kg} onChange={e => setItem(i, 'berat_paha_depan_kg', e.target.value)} />
                    </Field>
                    <Field label="Paha Belakang (kg)">
                      <Input required type="number" min="0.01" step="0.01" value={x.berat_paha_belakang_kg} onChange={e => setItem(i, 'berat_paha_belakang_kg', e.target.value)} />
                    </Field>
                    <Field label="Harga / kg">
                      <MoneyInput required min="0.01" value={x.harga_karkas_aktual} onChange={value => setItem(i, 'harga_karkas_aktual', value)} />
                    </Field>
                    <div className="flex items-end">
                      <button type="button" onClick={() => removeItem(i)} disabled={form.items.length === 1} className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-4">
                    <Field label="Berat Kulit (kg)">
                      <Input type="number" min="0" step="0.01" value={x.berat_kulit_kg} onChange={e => setItem(i, 'berat_kulit_kg', e.target.value)} />
                    </Field>
                    <Field label="Perlakuan Kulit">
                      <SearchableSelect value={x.perlakuan_kulit || 'DITABUNG'} onChange={v => setItem(i, 'perlakuan_kulit', v || 'DITABUNG')} options={SKIN_TREATMENT_OPTIONS} placeholder="Pilih perlakuan kulit" accentColor="red" isClearable={false} />
                    </Field>
                    {['DIAMBIL', 'DITABUNG'].includes(x.perlakuan_kulit) && (
                      <Field label="Nominal Kulit">
                        <MoneyInput required min="0" value={x.nominal_kulit} onChange={value => setItem(i, 'nominal_kulit', value)} />
                      </Field>
                    )}
                    <Field label="Alasan Perubahan Harga" className={x.perlakuan_kulit === 'DIAMBIL' ? '' : 'lg:col-span-2'}>
                      <Input value={x.alasan_perubahan_harga} onChange={e => setItem(i, 'alasan_perubahan_harga', e.target.value)} />
                    </Field>
                  </div>

                  <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm sm:grid-cols-3">
                    <div><span className="text-slate-500">Total berat</span><div className="font-semibold text-slate-800">{totalBerat.toFixed(2)} kg</div></div>
                    <div><span className="text-slate-500">Nominal karkas</span><div className="font-semibold text-slate-800">{money(nominalKarkas)}</div></div>
                    <div><span className="text-slate-500">Subtotal item</span><div className="font-semibold text-slate-800">{money(nominalKarkas + (x.perlakuan_kulit === 'DIAMBIL' ? nominalKulit : 0))}</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Field label="Keterangan">
          <textarea value={form.keterangan || ''} onChange={e => setHeader('keterangan', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" rows="2" />
        </Field>

        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">Total Berat</div>
            <div className="mt-1 text-lg font-bold text-slate-900">{totals.w.toFixed(2)} kg</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">Kulit Ditabung</div>
            <div className="mt-1 text-lg font-bold text-slate-900">{money(totals.kulitDitabung)}</div>
            <div className="mt-1 text-xs text-slate-500">Tidak masuk grand total</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">Biaya Pengiriman</div>
            <div className="mt-1 text-lg font-bold text-slate-900">{money(form.pengiriman === 'DIANTAR' ? form.biaya_pengiriman : 0)}</div>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="text-sm text-rose-600">Grand Total Tagihan</div>
            <div className="mt-1 text-lg font-bold text-rose-700">{money(totals.n + (form.pengiriman === 'DIANTAR' ? Number(form.biaya_pengiriman || 0) : 0))}</div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">Batal</button>
          <button disabled={saving} className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </div>
    </form>
  </div>
);

export default function PenjualanKarkasPage() {
  const [rows, setRows] = useState([]); const [pedagang, setPedagang] = useState([]); const [sapi, setSapi] = useState([]); const [banks, setBanks] = useState([]); const [pengirim, setPengirim] = useState([]); const [kendaraan, setKendaraan] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [modal, setModal] = useState(null); const [form, setForm] = useState(initial()); const [saving, setSaving] = useState(false); const [detail, setDetail] = useState(null); const [openMenuId, setOpenMenuId] = useState(null); const [actionLoading, setActionLoading] = useState('');
  const perPage = 10;
  const load = async () => { setLoading(true); try { const r = await PenjualanKarkasService.getData({ start: (page - 1) * perPage, length: perPage, draw: page, 'search[value]': search }); setRows(r.data || []); setTotal(r.recordsFiltered || 0); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [page, search]);
  useEffect(() => {
    PenjualanKarkasService.optionsPedagang()
      .then((r) => setPedagang(optionRows(r)))
      .catch((e) => setError(e.message || 'Gagal memuat daftar pedagang'));
    PenjualanKarkasService.optionsSapi()
      .then((r) => setSapi(optionRows(r)))
      .catch((e) => setError(e.message || 'Gagal memuat daftar sapi'));
    PenjualanKarkasService.optionsBank()
      .then((r) => setBanks(optionRows(r)))
      .catch((e) => setError(e.message || 'Gagal memuat daftar bank'));
    PenjualanKarkasService.optionsPengirim()
      .then((r) => setPengirim(optionRows(r)))
      .catch((e) => setError(e.message || 'Gagal memuat daftar pengirim'));
    PenjualanKarkasService.optionsKendaraan()
      .then((r) => setKendaraan(optionRows(r)))
      .catch((e) => setError(e.message || 'Gagal memuat daftar kendaraan ekspedisi'));
  }, []);
  const openCreate = () => { setForm(initial()); setModal('form'); };
  const openEdit = async (row) => { if (isPaidRow(row)) { setError('Transaksi yang sudah dibayar tidak bisa diedit.'); return; } setActionLoading('Memuat data edit...'); try { const r = await PenjualanKarkasService.show(row.pid); setForm({ ...initial(), ...r.data.penjualan, id_pedagang: r.data.penjualan.id_pedagang, items: (r.data.details || []).map(x => ({ ...x, nominal_kulit: x.nominal_kulit ?? '' })) }); setModal('form'); } catch (e) { setError(e.message); } finally { setActionLoading(''); } };
  const setHeader = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const setItem = (i, key, value) => setForm(f => ({ ...f, items: f.items.map((x, n) => n === i ? { ...x, [key]: value } : x) }));
  const selectPaymentType = (value) => setForm(f => ({ ...f, tipe_pembayaran: value || '1', id_syarat_pembelian: value === '2' ? f.id_syarat_pembelian : '' }));
  const selectShipping = (value) => setForm(f => ({ ...f, pengiriman: value || 'DIAMBIL', ...(value === 'DIANTAR' ? {} : { biaya_pengiriman: 0, alamat_pengiriman: '', id_pengirim: '', id_kendaraan_ekspedisi: '', nama_penerima: '' }) }));
  const selectPedagang = async (id) => { setHeader('id_pedagang', id); try { const r = await PenjualanKarkasService.getHarga(id); const harga = r.data?.nominal || ''; setForm(f => ({ ...f, id_pedagang: id, items: f.items.map(x => x.harga_diedit ? x : { ...x, harga_karkas_aktual: harga }) })); } catch {} };
  const totals = useMemo(() => form.items.reduce((a, x) => {
    const w = Number(x.berat_paha_depan_kg || 0) + Number(x.berat_paha_belakang_kg || 0);
    const nominalKarkas = w * Number(x.harga_karkas_aktual || 0);
    const nominalKulit = Number(x.nominal_kulit || 0);
    return {
      w: a.w + w,
      karkas: a.karkas + nominalKarkas,
      kulitDiambil: a.kulitDiambil + (x.perlakuan_kulit === 'DIAMBIL' ? nominalKulit : 0),
      kulitDitabung: a.kulitDitabung + (x.perlakuan_kulit === 'DITABUNG' ? nominalKulit : 0),
      n: a.n + nominalKarkas + (x.perlakuan_kulit === 'DIAMBIL' ? nominalKulit : 0),
    };
  }, { w: 0, karkas: 0, kulitDiambil: 0, kulitDitabung: 0, n: 0 }), [form.items]);
  const save = async (e) => { e.preventDefault(); setSaving(true); setActionLoading('Menyimpan transaksi...'); setError(''); try { if (form.tipe_pembayaran === '2' && !form.id_syarat_pembelian) throw new Error('Bank wajib dipilih untuk pembayaran kredit.'); if (form.pengiriman === 'DIANTAR' && !form.id_pengirim) throw new Error('Pengirim wajib dipilih untuk pengiriman diantar.'); if (form.pengiriman === 'DIANTAR' && !form.id_kendaraan_ekspedisi) throw new Error('Kendaraan ekspedisi wajib dipilih untuk pengiriman diantar.'); const payload = { ...form, pid: form.pid, id_pedagang: Number(form.id_pedagang), id_syarat_pembelian: form.tipe_pembayaran === '2' ? Number(form.id_syarat_pembelian) : null, biaya_pengiriman: form.pengiriman === 'DIANTAR' ? Number(form.biaya_pengiriman || 0) : 0, alamat_pengiriman: form.pengiriman === 'DIANTAR' ? form.alamat_pengiriman : null, id_pengirim: form.pengiriman === 'DIANTAR' ? Number(form.id_pengirim) : null, id_kendaraan_ekspedisi: form.pengiriman === 'DIANTAR' ? Number(form.id_kendaraan_ekspedisi) : null, nama_penerima: form.pengiriman === 'DIANTAR' ? form.nama_penerima : null, items: form.items.map(x => ({ ...x, id_pembelian_ho_detail: Number(x.id_pembelian_ho_detail), berat_paha_depan_kg: Number(x.berat_paha_depan_kg), berat_paha_belakang_kg: Number(x.berat_paha_belakang_kg), harga_karkas_aktual: Number(x.harga_karkas_aktual), berat_kulit_kg: Number(x.berat_kulit_kg || 0), nominal_kulit: Number(x.nominal_kulit || 0) })) }; const r = form.pid ? await PenjualanKarkasService.update(payload) : await PenjualanKarkasService.store(payload); if (r.success === false) throw new Error(r.message); setModal(null); await load(); } catch (e) { setError(e.message); } finally { setSaving(false); setActionLoading(''); } };
  const cancel = async (row) => { if (isPaidRow(row)) { setError('Transaksi yang sudah dibayar tidak bisa dihapus.'); return; } if (!window.confirm(`Hapus transaksi ${row.no_kwitansi}?`)) return; setActionLoading('Menghapus transaksi...'); try { await PenjualanKarkasService.hapus(row.pid); await load(); } catch (e) { setError(e.message); } finally { setActionLoading(''); } };
  const openDetail = async (row) => { setActionLoading('Memuat detail transaksi...'); try { const x = await PenjualanKarkasService.show(row.pid); setDetail(x.data); } catch (e) { setError(e.message); } finally { setActionLoading(''); } };
  const available = (selected) => sapi.filter(x => !form.items.some(i => String(i.id_pembelian_ho_detail) === String(x.id) && String(x.id) !== String(selected)));

  return <div className="min-h-screen bg-slate-50"><div className="space-y-6 px-4 py-5 sm:px-6 lg:px-8">
    <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-xl shadow-rose-100/50">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Penjualan Karkas RPH</h1><p className="mt-1 text-sm text-slate-500">Kelola transaksi penjualan karkas berdasarkan sapi aktif RPH.</p></div>
        <button onClick={openCreate} disabled={Boolean(actionLoading) || saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"><Plus size={20}/> Tambah Penjualan</button>
      </div>
    </div>
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
      <div className="relative w-full max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} placeholder="Cari no kwitansi atau pedagang" className="w-full rounded-2xl border border-slate-300 py-3 pl-10 pr-10 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"/>
        {search && <button type="button" disabled={loading || Boolean(actionLoading)} onClick={() => { setPage(1); setSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"><X className="h-4 w-4"/></button>}
      </div>
    </div>
    {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">{error}<button onClick={() => setError('')} className="float-right text-rose-500 hover:text-rose-700"><X size={16}/></button></div>}
    {actionLoading && <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/25"><div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-2xl"><Loader2 className="h-5 w-5 animate-spin text-rose-600" />{actionLoading}</div></div>}
    <div className="overflow-visible rounded-3xl border border-slate-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div><div className="text-sm font-semibold text-slate-800">Daftar Penjualan Karkas</div><div className="text-xs text-slate-500">Total data {total}</div></div>
      </div>
      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-white text-left text-xs font-semibold uppercase text-slate-500"><tr><th className="px-5 py-4 text-center">No</th><th className="px-5 py-4 text-center">Aksi</th><th className="px-5 py-4">No. Kwitansi</th><th className="px-5 py-4">Tanggal</th><th className="px-5 py-4">Pedagang</th><th className="px-5 py-4">Sapi</th><th className="px-5 py-4">Total Berat</th><th className="px-5 py-4">Total Tagihan</th><th className="px-5 py-4">Status</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan="9" className="p-12 text-center text-slate-500">Memuat data penjualan karkas...</td></tr> : rows.length === 0 ? <tr><td colSpan="9" className="p-12 text-center text-slate-500">Belum ada transaksi penjualan karkas.</td></tr> : rows.map((r, index) => <tr key={r.pid} className="transition hover:bg-rose-50/40"><td className="px-5 py-4 text-center font-semibold text-slate-500">{((page - 1) * perPage) + index + 1}</td><td className="px-5 py-4"><div className="flex justify-center"><RowActionButton row={r} isOpen={openMenuId === r.pid} onToggle={(pid) => setOpenMenuId((current) => (current === pid ? null : pid))} onClose={() => setOpenMenuId(null)} onDetail={openDetail} onEdit={openEdit} onDelete={cancel} disabled={Boolean(actionLoading) || saving} /></div></td><td className="px-5 py-4"><span className="rounded-lg bg-rose-50 px-2 py-1 font-mono text-xs text-rose-700">{r.no_kwitansi || '-'}</span></td><td className="px-5 py-4 text-slate-700">{String(r.tanggal_penjualan || '').slice(0, 10)}</td><td className="px-5 py-4 font-semibold text-slate-800">{r.nama_pedagang || '-'}</td><td className="px-5 py-4 text-slate-700">{r.jumlah_sapi}</td><td className="px-5 py-4 font-medium text-slate-700">{Number(r.total_berat || 0).toFixed(2)} kg</td><td className="px-5 py-4 font-semibold text-emerald-700">{money(r.total_bayar || r.total_harga)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paymentStatusClass(r)}`}>{paymentStatusLabel(r)}</span></td></tr>)}</tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"><span className="text-sm text-slate-600">Menampilkan <strong>{total ? ((page - 1) * perPage) + 1 : 0}</strong> sampai <strong>{Math.min(page * perPage, total)}</strong> dari <strong>{total}</strong> data</span><div className="flex items-center gap-2"><button disabled={page <= 1 || loading || Boolean(actionLoading)} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50">Prev</button><span className="text-sm font-medium text-slate-700">{page}</span><button disabled={page * perPage >= total || loading || Boolean(actionLoading)} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50">Next</button></div></div>
    </div>
</div>{modal === 'form' && (
  <KarkasFormModal
    form={form}
    saving={saving}
    totals={totals}
    pedagang={pedagang}
    banks={banks}
    pengirim={pengirim}
    kendaraan={kendaraan}
    available={available}
    onClose={() => setModal(null)}
    onSubmit={save}
    selectPedagang={selectPedagang}
    selectPaymentType={selectPaymentType}
    selectShipping={selectShipping}
    setHeader={setHeader}
    setItem={setItem}
    addItem={() => setForm(f => ({ ...f, items: [...f.items, blankItem()] }))}
    removeItem={(index) => setForm(f => ({ ...f, items: f.items.filter((_, n) => n !== index) }))}
  />
)}  {detail && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4"><div className="mx-auto max-w-4xl rounded-xl bg-white p-5"><div className="flex justify-between"><h2 className="font-bold">Detail {detail.penjualan?.no_kwitansi}</h2><button onClick={() => setDetail(null)}><X/></button></div><div className="mt-4 grid gap-3 md:grid-cols-4 text-sm"><div><small className="text-gray-500">Pedagang</small><p>{detail.penjualan?.nama_pedagang}</p></div><div><small className="text-gray-500">Tanggal</small><p>{String(detail.penjualan?.tanggal_penjualan || '').slice(0, 10)}</p></div><div><small className="text-gray-500">Total Berat</small><p>{detail.penjualan?.total_berat} kg</p></div><div><small className="text-gray-500">Total</small><p className="font-bold">{money(detail.penjualan?.total_bayar || detail.penjualan?.total_harga)}</p></div></div><div className="mt-4 overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="border-b text-left"><th className="py-2">Sapi</th><th>Berat</th><th>Harga/kg</th><th>Nominal</th><th>Kulit</th></tr></thead><tbody>{(detail.details || []).map(x => <tr className="border-b" key={x.id}><td className="py-2">{x.code_eartag || x.eartag || x.id_pembelian_ho_detail}</td><td>{Number(x.berat_paha_depan_kg) + Number(x.berat_paha_belakang_kg)} kg</td><td>{money(x.harga_karkas_aktual)}</td><td>{money((Number(x.berat_paha_depan_kg) + Number(x.berat_paha_belakang_kg)) * Number(x.harga_karkas_aktual))}</td><td>{x.perlakuan_kulit}</td></tr>)}</tbody></table></div></div></div>}
  </div>;
}
