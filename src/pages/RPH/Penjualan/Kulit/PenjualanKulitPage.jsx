import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Eye, Loader2, MoreVertical, Pencil, Plus, RefreshCcw, Search, Trash2, X } from 'lucide-react';
import PenjualanKulitService from '../../../../services/penjualanKulitService';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

const money = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
const kg = (value) => `${Math.round(Number(value || 0))} kg`;
const nominalInput = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(number) : '';
};
const parseNominalInput = (value) => String(value || '').replace(/[^\d]/g, '');
const todayInput = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const emptyForm = () => ({
  pid: null,
  tanggal_penjualan: todayInput(),
  id_pedagang: '',
  tipe_pembayaran: '1',
  gunakan_saldo: false,
  penggunaan_saldo: '',
  id_syarat_pembelian: '',
  pengiriman: 'DIAMBIL',
  id_pengirim: '',
  id_kendaraan_ekspedisi: '',
  biaya_pengiriman: '0',
  alamat_pengiriman: '',
  nama_penerima: '',
  keterangan: '',
  details: [],
});

const emptyLine = { id_stok_kulit_rph: '', berat_kulit: '', harga_per_kg: '', keterangan: '' };

function Field({ label, children, required }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}{required ? <span className="text-rose-600"> *</span> : null}</span>
      {children}
    </label>
  );
}

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
const toOptions = (items = []) => items.map((item) => ({ value: String(item.id), label: item.label }));
const isPedagangAtCreditLimit = (item) => Number(item?.is_dispensasi || 0) !== 1 && Number(item?.limit_kredit || 0) > 0 && Number(item?.saldo_beku || 0) >= Number(item.limit_kredit);
const PAYMENT_OPTIONS = [{ value: '1', label: 'Tunai' }, { value: '2', label: 'Kredit' }];
const SHIPPING_OPTIONS = [{ value: 'DIAMBIL', label: 'Diambil' }, { value: 'DIANTAR', label: 'Diantar' }];
const PAYMENT_STYLE = {
  '1': 'bg-emerald-100 text-emerald-700',
  '2': 'bg-amber-100 text-amber-700',
};
const SHIPPING_STYLE = {
  DIAMBIL: 'bg-slate-100 text-slate-700',
  DIANTAR: 'bg-sky-100 text-sky-700',
};
const STATUS_STYLE = {
  Lunas: 'bg-emerald-100 text-emerald-700',
  DP: 'bg-amber-100 text-amber-700',
  'Belum Bayar': 'bg-rose-100 text-rose-700',
  '-': 'bg-slate-100 text-slate-600',
};

function RowActionMenu({ row, anchorRef, onClose, onDetail, onEdit, onDelete }) {
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);
  const isPaidOff = Number(row.payment_status) === 1;

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
        <button type="button" onClick={() => { onDetail(row); onClose(); }} className="mt-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-blue-50" role="menuitem">
          <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><Eye className="h-4 w-4" /></span>
          <span className="text-xs font-semibold">Detail</span>
        </button>
        <button
          type="button"
          disabled={isPaidOff}
          onClick={() => { if (!isPaidOff) { onEdit(row); onClose(); } }}
          className="mt-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
          role="menuitem"
          title={isPaidOff ? 'Transaksi lunas tidak dapat diedit' : 'Edit'}
        >
          <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><Pencil className="h-4 w-4" /></span>
          <span className="text-xs font-semibold">Edit</span>
        </button>
        <button
          type="button"
          disabled={isPaidOff}
          onClick={() => { if (!isPaidOff) { onDelete(row); onClose(); } }}
          className="mt-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
          role="menuitem"
          title={isPaidOff ? 'Transaksi lunas tidak dapat dihapus' : 'Hapus'}
        >
          <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600"><Trash2 className="h-4 w-4" /></span>
          <span className="text-xs font-semibold">Hapus</span>
        </button>
      </div>
    </div>,
    document.body
  );
}

function RowActionButton({ row, isOpen, onToggle, onClose, onDetail, onEdit, onDelete }) {
  const buttonRef = useRef(null);
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle(row.pid);
        }}
        className={`rounded-lg border p-2 text-slate-600 shadow-sm transition-all hover:bg-emerald-50 hover:text-emerald-600 ${isOpen ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-slate-300 bg-white'}`}
        aria-label={`Menu aksi ${row.nama_pedagang || 'penjualan kulit'}`}
        aria-expanded={isOpen}
      >
        <MoreVertical className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen ? <RowActionMenu row={row} anchorRef={buttonRef} onClose={onClose} onDetail={onDetail} onEdit={onEdit} onDelete={onDelete} /> : null}
    </div>
  );
}

function PenjualanKulitForm({ open, mode, initialData, master, saving, onClose, onSubmit, fullPage = false }) {
  const [form, setForm] = useState(emptyForm());
  const [line, setLine] = useState(emptyLine);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initialData?.penjualan) {
      const p = initialData.penjualan;
      setForm({
        ...emptyForm(),
        pid: p.pid,
        tanggal_penjualan: (p.tanggal_penjualan || '').replace(' ', 'T').slice(0, 16),
        id_pedagang: String(p.id_pedagang || ''),
        tipe_pembayaran: String(p.tipe_pembayaran || '1'),
        gunakan_saldo: Number(p.penggunaan_saldo || 0) > 0,
        penggunaan_saldo: Number(p.penggunaan_saldo || 0) > 0 ? String(p.penggunaan_saldo) : '',
        id_syarat_pembelian: p.id_syarat_pembelian || p.id_bank ? String(p.id_syarat_pembelian || p.id_bank) : '',
        pengiriman: p.pengiriman || 'DIAMBIL',
        id_pengirim: p.id_pengirim ? String(p.id_pengirim) : '',
        id_kendaraan_ekspedisi: p.id_kendaraan_ekspedisi ? String(p.id_kendaraan_ekspedisi) : '',
        biaya_pengiriman: String(p.biaya_pengiriman || 0),
        alamat_pengiriman: p.alamat_pengiriman || '',
        nama_penerima: p.nama_penerima || '',
        keterangan: p.keterangan || '',
        details: (initialData.details || []).map((d) => ({
          id_stok_kulit_rph: String(d.id_stok_kulit_rph),
          berat_kulit: String(Math.round(Number(d.berat_kulit || 0))),
          harga_per_kg: String(d.harga_per_kg),
          keterangan: d.keterangan || '',
          label: [d.item_potong_name || d.item_kulit_name || 'Kulit', d.klasifikasi_hewan_name].filter(Boolean).join(' - '),
          stok_tersedia: Number(d.stok_tersedia || 0) + Number(d.berat_kulit || 0),
        })),
      });
    } else {
      setForm(emptyForm());
    }
    setLine(emptyLine);
    setError('');
  }, [open, initialData]);

  const formStockOptions = useMemo(() => {
    const options = [...(master.stok_kulit || [])];
    form.details.forEach((detail) => {
      if (options.some((item) => String(item.id) === String(detail.id_stok_kulit_rph))) return;
      const stokTersedia = Number(detail.stok_tersedia || 0);
      options.push({
        id: Number(detail.id_stok_kulit_rph),
        label: `${detail.label || 'Kulit'} - Stok: ${Math.round(stokTersedia)} kg`,
        berat_tersedia: stokTersedia,
      });
    });
    return options;
  }, [form.details, master.stok_kulit]);

  const selectedStock = useMemo(
    () => formStockOptions.find((x) => String(x.id) === String(line.id_stok_kulit_rph)),
    [line.id_stok_kulit_rph, formStockOptions]
  );

  const selectedPedagang = useMemo(
    () => (master.pedagang || []).find((item) => String(item.id) === String(form.id_pedagang)) || null,
    [master.pedagang, form.id_pedagang]
  );

  const totals = useMemo(() => {
    const totalBerat = form.details.reduce((sum, item) => sum + Number(item.berat_kulit || 0), 0);
    const totalHarga = form.details.reduce((sum, item) => sum + (Number(item.berat_kulit || 0) * Number(item.harga_per_kg || 0)), 0);
    const ongkir = form.pengiriman === 'DIANTAR' ? Number(parseNominalInput(form.biaya_pengiriman) || 0) : 0;
    return { totalBerat, totalHarga, biayaPengiriman: ongkir, totalPenjualan: totalHarga + ongkir };
  }, [form.details, form.biaya_pengiriman, form.pengiriman]);

  if (!open) return null;

  const set = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'tipe_pembayaran' && value === '1') next.id_syarat_pembelian = '';
      if (key === 'pengiriman' && value === 'DIAMBIL') {
        next.id_pengirim = '';
        next.id_kendaraan_ekspedisi = '';
        next.biaya_pengiriman = '0';
        next.alamat_pengiriman = '';
        next.nama_penerima = '';
      }
      return next;
    });
  };

  const addLine = () => {
    setError('');
    if (!selectedStock) return setError('Pilih stok kulit.');
    if (form.details.some((x) => String(x.id_stok_kulit_rph) === String(line.id_stok_kulit_rph))) return setError('Kulit yang sama sudah ditambahkan.');
    if (Number(line.berat_kulit) <= 0) return setError('Berat kulit wajib lebih dari 0.');
    if (Number(line.berat_kulit) > Number(selectedStock.berat_tersedia)) return setError(`Berat melebihi stok tersedia ${kg(selectedStock.berat_tersedia)}.`);
    if (Number(line.harga_per_kg) <= 0) return setError('Harga per kg wajib lebih dari 0.');
    setForm((current) => ({
      ...current,
      details: [...current.details, {
        ...line,
        label: selectedStock.label,
        stok_tersedia: selectedStock.berat_tersedia,
      }],
    }));
    setLine(emptyLine);
  };

  const submit = (posting = false) => {
    setError('');
    if (!form.id_pedagang) return setError('Pedagang wajib dipilih.');
    if (form.gunakan_saldo && Number(form.penggunaan_saldo || 0) <= 0) return setError('Nominal penggunaan saldo wajib lebih dari 0.');
    if (form.gunakan_saldo && Number(form.penggunaan_saldo || 0) > totals.totalPenjualan) return setError('Nominal penggunaan saldo tidak boleh melebihi total tagihan.');
    if (form.tipe_pembayaran === '2' && !form.id_syarat_pembelian) return setError('Bank wajib dipilih untuk pembayaran kredit.');
    if (!form.details.length) return setError('Minimal satu detail kulit wajib ditambahkan.');
    if (form.pengiriman === 'DIANTAR' && (!form.id_pengirim || !form.id_kendaraan_ekspedisi || !form.alamat_pengiriman.trim() || !form.nama_penerima.trim())) {
      return setError('Lengkapi data pengiriman diantar.');
    }
    onSubmit({
      ...form,
      tanggal_penjualan: form.tanggal_penjualan.replace('T', ' ') + ':00',
      id_pedagang: Number(form.id_pedagang),
      id_syarat_pembelian: form.tipe_pembayaran === '2' ? Number(form.id_syarat_pembelian) : null,
      penggunaan_saldo: form.gunakan_saldo ? Number(form.penggunaan_saldo || 0) : 0,
      id_pengirim: form.pengiriman === 'DIANTAR' ? Number(form.id_pengirim) : null,
      id_kendaraan_ekspedisi: form.pengiriman === 'DIANTAR' ? Number(form.id_kendaraan_ekspedisi) : null,
      biaya_pengiriman: form.pengiriman === 'DIANTAR' ? Number(parseNominalInput(form.biaya_pengiriman) || 0).toFixed(2) : '0.00',
      details: form.details.map((d) => ({
        id_stok_kulit_rph: Number(d.id_stok_kulit_rph),
        berat_kulit: String(Math.round(Number(d.berat_kulit || 0))),
        harga_per_kg: Number(d.harga_per_kg).toFixed(2),
        keterangan: d.keterangan || null,
      })),
    }, posting);
  };

  return (
    <div className={fullPage ? 'min-h-screen bg-slate-50 p-4 md:p-6' : 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4'}>
      <div className={fullPage ? 'min-h-screen w-full overflow-hidden bg-white' : 'max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl'}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{mode === 'edit' ? 'Edit Penjualan Kulit' : 'Tambah Penjualan Kulit'}</h2>
            <p className="text-sm text-slate-500">No. kwitansi dibuat otomatis oleh server saat transaksi disimpan.</p>
          </div>
          <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[72vh] overflow-y-auto p-5">
          {error ? <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Tanggal Penjualan" required><input className={inputClass} type="datetime-local" value={form.tanggal_penjualan} onChange={(e) => set('tanggal_penjualan', e.target.value)} /></Field>
            <Field label="Pedagang" required><SearchableSelect value={form.id_pedagang} onChange={(value) => set('id_pedagang', value || '')} options={toOptions(form.pid ? (master.pedagang || []) : (master.pedagang || []).filter(item => !isPedagangAtCreditLimit(item)))} placeholder="Pilih pedagang" accentColor="green" /></Field>
            {selectedPedagang && Number(selectedPedagang.is_dispensasi) === 1 && (
              <div className="md:col-span-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg font-semibold text-xs">
                Pedagang memiliki dispensasi aktif.
              </div>
            )}
            <Field label="Metode Pembayaran" required><SearchableSelect value={form.tipe_pembayaran} onChange={(value) => set('tipe_pembayaran', value || '1')} options={PAYMENT_OPTIONS} placeholder="Pilih pembayaran" accentColor="green" isClearable={false} /></Field>
            {form.tipe_pembayaran === '2' ? <Field label="Bank" required><SearchableSelect value={form.id_syarat_pembelian} onChange={(value) => set('id_syarat_pembelian', value || '')} options={toOptions(master.banks || [])} placeholder="Pilih bank" accentColor="green" /></Field> : null}
            <Field label="Pengiriman" required><SearchableSelect value={form.pengiriman} onChange={(value) => set('pengiriman', value || 'DIAMBIL')} options={SHIPPING_OPTIONS} placeholder="Pilih pengiriman" accentColor="green" isClearable={false} /></Field>
            {form.pengiriman === 'DIANTAR' ? (
              <>
                <Field label="Pengirim" required><SearchableSelect value={form.id_pengirim} onChange={(value) => set('id_pengirim', value || '')} options={toOptions(master.pengirim || [])} placeholder="Pilih pengirim" accentColor="green" /></Field>
                <Field label="Kendaraan" required><SearchableSelect value={form.id_kendaraan_ekspedisi} onChange={(value) => set('id_kendaraan_ekspedisi', value || '')} options={toOptions(master.kendaraan || [])} placeholder="Pilih kendaraan" accentColor="green" /></Field>
                <Field label="Biaya Pengiriman" required><input className={inputClass} type="text" inputMode="numeric" value={nominalInput(form.biaya_pengiriman)} onChange={(e) => set('biaya_pengiriman', parseNominalInput(e.target.value))} /></Field>
                <Field label="Alamat Pengiriman" required><input className={inputClass} value={form.alamat_pengiriman} onChange={(e) => set('alamat_pengiriman', e.target.value)} /></Field>
                <Field label="Nama Penerima" required><input className={inputClass} value={form.nama_penerima} onChange={(e) => set('nama_penerima', e.target.value)} /></Field>
              </>
            ) : null}
            <Field label="Keterangan"><input className={inputClass} value={form.keterangan} onChange={(e) => set('keterangan', e.target.value)} /></Field>
          </div>

          <div className="mt-6 border-t pt-5">
            <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">Detail Kulit</h3>
            <div className="grid gap-3 md:grid-cols-5">
              <Field label="Kulit" required><SearchableSelect value={line.id_stok_kulit_rph} onChange={(value) => setLine((c) => ({ ...c, id_stok_kulit_rph: value || '' }))} options={toOptions(formStockOptions)} placeholder="Pilih stok kulit" accentColor="green" maxMenuHeight={280} /></Field>
              <Field label="Stok Tersedia"><input className={`${inputClass} bg-slate-50`} readOnly value={selectedStock ? kg(selectedStock.berat_tersedia) : '-'} /></Field>
              <Field label="Berat Kulit" required><input className={inputClass} type="number" min="0" step="1" value={line.berat_kulit} onChange={(e) => setLine((c) => ({ ...c, berat_kulit: e.target.value }))} /></Field>
              <Field label="Harga per Kg" required><input className={inputClass} type="text" inputMode="numeric" value={nominalInput(line.harga_per_kg)} onChange={(e) => setLine((c) => ({ ...c, harga_per_kg: parseNominalInput(e.target.value) }))} /></Field>
              <div className="flex items-end"><button type="button" className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700" onClick={addLine}><Plus className="mr-2 h-4 w-4" />Tambah Kulit</button></div>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Kulit</th><th className="px-3 py-2 text-right">Berat</th><th className="px-3 py-2 text-right">Harga/Kg</th><th className="px-3 py-2 text-right">Subtotal</th><th className="px-3 py-2"></th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {form.details.map((d, i) => <tr key={`${d.id_stok_kulit_rph}-${i}`}><td className="px-3 py-2">{d.label}</td><td className="px-3 py-2 text-right">{kg(d.berat_kulit)}</td><td className="px-3 py-2 text-right">{money(d.harga_per_kg)}</td><td className="px-3 py-2 text-right">{money(Number(d.berat_kulit) * Number(d.harga_per_kg))}</td><td className="px-3 py-2 text-right"><button className="rounded p-1 text-rose-600 hover:bg-rose-50" onClick={() => setForm((c) => ({ ...c, details: c.details.filter((_, idx) => idx !== i) }))}><Trash2 className="h-4 w-4" /></button></td></tr>)}
                  {!form.details.length ? <tr><td className="px-3 py-6 text-center text-slate-500" colSpan={5}>Belum ada detail kulit.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="border-t bg-sky-50 px-5 py-3"><label className="flex items-center gap-2 text-sm font-semibold text-sky-900"><input type="checkbox" checked={form.gunakan_saldo} onChange={(e) => setForm((prev) => ({ ...prev, gunakan_saldo: e.target.checked, penggunaan_saldo: e.target.checked ? prev.penggunaan_saldo : '' }))} /> Gunakan saldo pedagang</label><div className="mt-2 flex max-w-md gap-2"><input type="text" inputMode="numeric" min="0.01" step="0.01" required={form.gunakan_saldo} disabled={!form.gunakan_saldo} value={nominalInput(form.penggunaan_saldo)} onChange={(e) => setForm((prev) => ({ ...prev, penggunaan_saldo: String(Math.min(Number(parseNominalInput(e.target.value) || 0), totals.totalPenjualan)) }))} className={inputClass} placeholder="Nominal saldo" /><button type="button" disabled={!form.gunakan_saldo} onClick={() => setForm((prev) => ({ ...prev, penggunaan_saldo: String(Math.min(Number(selectedPedagang?.saldo_keseluruhan || 0), totals.totalPenjualan)) }))} className="rounded-lg border border-sky-300 px-3 text-xs font-bold text-sky-700 disabled:opacity-50">Maks</button></div><p className="mt-1 text-xs text-sky-700">Saldo tersedia: {money(selectedPedagang?.saldo_keseluruhan || 0)}</p></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50 px-5 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5"><div><span className="text-slate-500">Total berat</span><div className="font-bold">{kg(totals.totalBerat)}</div></div><div><span className="text-slate-500">Total kulit</span><div className="font-bold">{money(totals.totalHarga)}</div></div><div><span className="text-slate-500">Biaya pengiriman</span><div className="font-bold">{money(totals.biayaPengiriman)}</div></div><div><span className="text-slate-500">Total Tagihan</span><div className="font-bold">{money(totals.totalPenjualan)}</div></div><div className="rounded-lg bg-rose-50 px-3 py-2"><span className="text-rose-600">Sisa Tagihan</span><div className="font-bold text-rose-700">{money(Math.max(totals.totalPenjualan - (form.gunakan_saldo ? Number(form.penggunaan_saldo || 0) : 0), 0))}</div></div></div>
          <div className="flex gap-2"><button className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white" onClick={onClose}>Batal</button><button disabled={saving} className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={() => submit(mode !== 'edit')}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Simpan</button></div>
        </div>
      </div>
    </div>
  );
}

export default function PenjualanKulitPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { pid: routePid } = useParams();
  const isFormPage = location.pathname.endsWith('/add') || location.pathname.includes('/edit/');
  const [rows, setRows] = useState([]);
  const [master, setMaster] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '', tipe_pembayaran: '', pengiriman: '' });
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await PenjualanKulitService.getData(filters);
    setRows(res.data || []);
    if (!res.success) setNotice({ type: 'error', message: res.message });
    setLoading(false);
  }, [filters]);

  const loadMaster = async () => {
    const res = await PenjualanKulitService.getMasterData();
    if (res.success) setMaster(res.data || {});
  };

  useEffect(() => { load(); loadMaster(); }, [load]);

  useEffect(() => {
    if (!openMenuId) return undefined;
    const closeMenu = () => setOpenMenuId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [openMenuId]);

  const openEdit = async (row) => {
    navigate(`/rph/penjualan-kulit/edit/${row.pid}`);
  };

  const openDetail = async (row) => {
    const res = await PenjualanKulitService.show(row.pid);
    if (!res.success) return setNotice({ type: 'error', message: res.message });
    setSelected(res.data);
    setModal('detail');
  };

  const save = async (payload, posting) => {
    setSaving(true);
    const res = payload.pid ? await PenjualanKulitService.update(payload) : await PenjualanKulitService.store(payload);
    if (res.success && posting) {
      const pid = res.data?.penjualan?.pid;
      const postRes = await PenjualanKulitService.posting(pid);
      setNotice({ type: postRes.success ? 'success' : 'error', message: postRes.message });
    } else {
      setNotice({ type: res.success ? 'success' : 'error', message: res.message });
    }
    setSaving(false);
    if (res.success) {
      setModal(null);
      if (isFormPage) navigate('/rph/penjualan-kulit');
      await Promise.all([load(), loadMaster()]);
    }
  };

  const hapus = async (row) => {
    if (Number(row.payment_status) === 1) {
      setNotice({ type: 'error', message: 'Transaksi lunas tidak dapat dihapus.' });
      return;
    }
    if (!window.confirm('Hapus penjualan kulit ini?')) return;
    const res = await PenjualanKulitService.delete(row.pid);
    setNotice({ type: res.success ? 'success' : 'error', message: res.message });
    if (res.success) await load();
  };

  useEffect(() => {
    if (!isFormPage || !routePid) return;
    PenjualanKulitService.show(routePid).then((res) => {
      if (res.success) setSelected(res.data);
      else setNotice({ type: 'error', message: res.message });
    });
  }, [isFormPage, routePid]);

  if (isFormPage) return <PenjualanKulitForm fullPage open mode={routePid ? 'edit' : 'add'} initialData={routePid ? selected : null} master={master} saving={saving} onClose={() => navigate('/rph/penjualan-kulit')} onSubmit={save} />;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Penjualan Kulit</h1><p className="text-sm text-slate-500">Pencatatan penjualan dan kontrol stok kulit RPH.</p></div>
        <button className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700" onClick={() => navigate('/rph/penjualan-kulit/add')}><Plus className="mr-2 h-4 w-4" />Tambah</button>
      </div>
      {notice ? <div className={`mb-4 flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}><span>{notice.message}</span><button onClick={() => setNotice(null)}><X className="h-4 w-4" /></button></div> : null}
      <div className="mb-4 grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-5">
        <div className="relative md:col-span-2"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input className={`${inputClass} pl-9`} placeholder="Cari no kwitansi / pedagang" value={filters.search} onChange={(e) => setFilters((c) => ({ ...c, search: e.target.value }))} /></div>
        <select className={inputClass} value={filters.status} onChange={(e) => setFilters((c) => ({ ...c, status: e.target.value }))}><option value="">Semua status</option><option value="DRAFT">Draft</option><option value="TERPOSTING">Terposting</option><option value="BATAL">Batal</option></select>
        <select className={inputClass} value={filters.tipe_pembayaran} onChange={(e) => setFilters((c) => ({ ...c, tipe_pembayaran: e.target.value }))}><option value="">Semua pembayaran</option><option value="1">Tunai</option><option value="2">Kredit</option></select>
        <button className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={load}><RefreshCcw className="mr-2 h-4 w-4" />Refresh</button>
      </div>
      <div className="overflow-visible rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 text-center">Aksi</th><th className="px-4 py-3">No Kwitansi</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Pedagang</th><th className="px-4 py-3 text-right">Berat</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Pembayaran</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Pengiriman</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Memuat data...</td></tr> : rows.map((row) => (
              <tr key={row.pid} className="hover:bg-slate-50">
                <td className="px-4 py-3"><div className="flex justify-center"><RowActionButton row={row} isOpen={openMenuId === row.pid} onToggle={(pid) => setOpenMenuId((current) => (current === pid ? null : pid))} onClose={() => setOpenMenuId(null)} onDetail={openDetail} onEdit={openEdit} onDelete={hapus} /></div></td>
                <td className="px-4 py-3 font-semibold text-slate-900">{row.no_kwitansi}</td><td className="px-4 py-3">{row.tanggal_penjualan?.slice(0, 10) || '-'}</td><td className="px-4 py-3">{row.nama_pedagang}</td><td className="px-4 py-3 text-right">{kg(row.total_berat)}</td><td className="px-4 py-3 text-right">{money(row.total_penjualan)}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PAYMENT_STYLE[row.tipe_pembayaran] || 'bg-slate-100 text-slate-600'}`}>{row.tipe_pembayaran_label}</span></td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[row.payment_status_label] || STATUS_STYLE['-']}`}>{row.payment_status_label || '-'}</span></td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${SHIPPING_STYLE[row.pengiriman] || 'bg-slate-100 text-slate-600'}`}>{row.pengiriman}</span></td>
              </tr>
            ))}
            {!loading && !rows.length ? <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">Belum ada data penjualan kulit.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <PenjualanKulitForm open={modal === 'add' || modal === 'edit'} mode={modal} initialData={selected} master={master} saving={saving} onClose={() => setModal(null)} onSubmit={save} />
      {modal === 'detail' && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl"><div className="flex justify-between border-b px-5 py-4"><h2 className="text-lg font-bold">Detail {selected.penjualan.no_kwitansi}</h2><button onClick={() => setModal(null)}><X className="h-5 w-5" /></button></div><div className="p-5"><div className="grid gap-3 text-sm md:grid-cols-4"><div><span className="text-slate-500">Pedagang</span><div className="font-semibold">{selected.penjualan.nama_pedagang}</div></div><div><span className="text-slate-500">Status</span><div className="font-semibold">{selected.penjualan.status}</div></div><div><span className="text-slate-500">Total</span><div className="font-semibold">{money(selected.penjualan.total_penjualan)}</div></div><div><span className="text-slate-500">Saldo Pedagang Digunakan</span><div className="font-semibold text-sky-700">{money(selected.penjualan.penggunaan_saldo || 0)}</div></div></div><div className="mt-5 overflow-hidden rounded-lg border"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Kulit</th><th className="px-3 py-2 text-right">Berat</th><th className="px-3 py-2 text-right">Harga</th><th className="px-3 py-2 text-right">Subtotal</th></tr></thead><tbody>{selected.details.map((d) => <tr key={d.id} className="border-t"><td className="px-3 py-2">{[d.item_potong_name || d.item_kulit_name, d.klasifikasi_hewan_name].filter(Boolean).join(' - ')}</td><td className="px-3 py-2 text-right">{kg(d.berat_kulit)}</td><td className="px-3 py-2 text-right">{money(d.harga_per_kg)}</td><td className="px-3 py-2 text-right">{money(d.subtotal)}</td></tr>)}</tbody></table></div></div></div></div>
      ) : null}
    </div>
  );
}
