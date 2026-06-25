import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, PlusCircle, Trash2, ShoppingCart,
  User, Truck, Scissors, CreditCard, Beef,
} from 'lucide-react';

import usePenjualanSapiUtuh from '../../../hooks/usePenjualanSapiUtuh';
import { useQuery } from '@tanstack/react-query';
import HttpClient from '../../../services/httpClient';
import Notification from '../../../components/shared/Notification';

const PENJUAL_OPTIONS = [
  { value: 'cv_puput', label: 'CV Puput' },
  { value: 'reseller', label: 'Reseller' },
];

const TIPE_PENJUALAN_OPTIONS = [
  { value: 'tunai', label: 'TUNAI' },
  { value: 'kredit', label: 'KREDIT' },
];

const JANGKA_WAKTU_OPTIONS = [
  ...Array.from({ length: 30 }, (_, i) => ({ value: `${i + 1} hari`, label: `${i + 1} hari` })),
  ...Array.from({ length: 12 }, (_, i) => ({ value: `${i + 1} bulan`, label: `${i + 1} bulan` })),
];

const PENGIRIMAN_OPTIONS = [
  { value: 'dikirim', label: 'Dikirim' },
  { value: 'dipotong_rph_dikirim', label: 'Dipotong di RPH dan Dikirim' },
  { value: 'dipotong_rph_diambil', label: 'Dipotong di RPH dan Diambil' },
  { value: 'diambil', label: 'Diambil' },
  { value: 'belum_diketahui', label: 'Belum Diketahui' },
];

const JENIS_PEMOTONGAN_OPTIONS = [
  { value: 'dibelah_4', label: 'Dibelah 4' },
  { value: 'dibelah_8', label: 'Dibelah 8' },
  { value: 'prosot', label: 'Prosot' },
  { value: 'cash', label: 'Cash' },
];

const PACKING_OPTIONS = [
  { value: 'disediakan', label: 'Disediakan' },
  { value: 'tidak', label: 'Tidak' },
];

const METODE_PEMBAYARAN_OPTIONS = [
  { value: 'tunai', label: 'Tunai' },
  { value: 'transfer', label: 'Transfer' }
];

const defaultFormData = {
  pic: '', penjual: 'cv_puput', reseller_id: '', nama_pembeli: '', no_hp_pembeli: '',
  tanggal_transaksi: new Date().toISOString().split('T')[0], tipe_penjualan: 'tunai', jangka_waktu: '',
  pengiriman: 'belum_diketahui', tanggal_terima: '', tempat_terima: '', biaya_kirim: '',
  alamat_pengiriman: '', nama_penerima: '', no_hp_penerima: '',
  jenis_pemotongan: '', biaya_potong: '', tanggal_potong: '', packing: 'tidak', catatan: '',
  nominal_pembayaran: '', metode_pembayaran: '', nama_pembayar: '', bukti_bayar: null,
  details: [],
};

const SearchableSelect = ({ label, value, options, onSelect, required, error, disabled, placeholder, displayField = 'label', valueField = 'value' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) { setTimeout(() => inputRef.current.focus(), 50); }
  }, [isOpen]);

  const selectedOption = options.find((o) => String(o[valueField]) === String(value));
  const filtered = search.trim()
    ? options.filter((o) => String(o[displayField]).toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = (option) => {
    onSelect(option[valueField]);
    setSearch('');
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((p) => Math.min(p + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((p) => Math.max(p - 1, 0)); }
    else if (e.key === 'Enter' && filtered[highlighted]) { handleSelect(filtered[highlighted]); }
    else if (e.key === 'Escape') { setIsOpen(false); }
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = String(text).split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => part.toLowerCase() === query.toLowerCase() ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark> : part);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full px-4 py-2.5 border rounded-lg text-left text-sm flex items-center justify-between transition-all duration-200 ${error ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300 hover:border-green-400'} ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white hover:shadow-md'} focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
      >
        <span className={`truncate ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption[displayField] : (placeholder || 'Pilih...')}
        </span>
        <span className="flex items-center gap-2">
          {selectedOption && !disabled && (
            <span
              onClick={(e) => { e.stopPropagation(); onSelect(''); }}
              className="p-0.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </span>
          )}
          <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </span>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-[100] w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-72 overflow-hidden">
          <div className="sticky top-0 bg-gray-50 border-b border-gray-100 p-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setHighlighted(0); }}
                onKeyDown={handleKeyDown}
                placeholder={`Cari ${label.toLowerCase()}...`}
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
              />
              {search && (
                <button onClick={() => { setSearch(''); inputRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto max-h-56 scrollbar-thin">
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center">
                <svg className="mx-auto h-10 w-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm text-gray-400">Tidak ada data yang cocok</p>
                <p className="text-xs text-gray-300 mt-1">Coba kata kunci lain</p>
              </div>
            )}
            {filtered.map((option, idx) => (
              <button
                key={option[valueField]}
                type="button"
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlighted(idx)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-150 flex items-center gap-3 ${idx === highlighted ? 'bg-green-50' : ''} ${String(option[valueField]) === String(value) ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${String(option[valueField]) === String(value) ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                  {String(option[valueField]) === String(value) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                </span>
                <span className="truncate">{highlightMatch(option[displayField], search)}</span>
              </button>
            ))}
          </div>
          {filtered.length > 0 && (
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
              {filtered.length} dari {options.length} item
            </div>
          )}
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{error}</p>}
    </div>
  );
};

const InputField = ({ label, name, type = 'text', required, options, value, error, onChange, disabled, placeholder, accept, min, step, filePreview }) => {
  const inputClass = `w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${error ? 'border-red-500' : 'border-gray-300'} ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`;
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
      {type === 'select' ? (
        <select name={name} value={value} onChange={onChange} disabled={disabled} className={inputClass}>
          <option value="">{placeholder || 'Pilih...'}</option>
          {options?.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
      ) : type === 'file' ? (
        <div>
          <input type="file" name={name} onChange={onChange} accept={accept} className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 ${inputClass}`} />
          {filePreview && (<div className="mt-2"><a href={filePreview} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline">Lihat file yang diupload</a></div>)}
        </div>
      ) : type === 'textarea' ? (
        <textarea name={name} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} rows={3} className={inputClass} />
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} min={min} step={step} className={inputClass} />
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

const CurrencyInput = ({ label, name, required, value, error, onChange, disabled, placeholder, min }) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        setDisplayValue(num.toLocaleString('id-ID'));
      } else {
        setDisplayValue('');
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    if (raw === '') {
      setDisplayValue('');
      onChange({ target: { name, value: '' } });
      return;
    }
    const num = parseInt(raw, 10);
    setDisplayValue(num.toLocaleString('id-ID'));
    onChange({ target: { name, value: String(num) } });
  };

  const inputClass = `w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${error ? 'border-red-500' : 'border-gray-300'} ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rp</span>
        <input
          type="text"
          name={name}
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder || '0'}
          className={`${inputClass} pl-10`}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

const AddPenjualanSapiUtuhPageV2 = () => {
  const navigate = useNavigate();
  const { pid } = useParams();
  const isEdit = !!pid;

  const { loading, create, update, fetchDetail, fetchAvailableSapi } = usePenjualanSapiUtuh();
  const [notification, setNotification] = useState({ isVisible: false, type: 'info', message: '' });
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ ...defaultFormData });
  const [availableSapi, setAvailableSapi] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [buktiBayarPreview, setBuktiBayarPreview] = useState(null);

  const { data: resellers = [] } = useQuery({
    queryKey: ['resellers'],
    queryFn: async () => {
      const response = await HttpClient.get('/api/master/reseller/data?length=1000');
      return response.data || [];
    },
  });

  useEffect(() => {
    const loadSapi = async () => {
      const result = await fetchAvailableSapi();
      if (result.success) setAvailableSapi(result.data || []);
    };
    loadSapi();
  }, [fetchAvailableSapi]);

  const loadEditData = useCallback(async () => {
    const result = await fetchDetail(pid);
    if (result.success && result.data) {
      const d = result.data;
      setFormData({
        pic: d.pic || '', penjual: d.penjual || 'cv_puput', reseller_id: d.reseller_id || '',
        nama_pembeli: d.nama_pembeli || '', no_hp_pembeli: d.no_hp_pembeli || '',
        tanggal_transaksi: d.tanggal_transaksi || new Date().toISOString().split('T')[0],
        tipe_penjualan: d.tipe_penjualan || 'tunai', jangka_waktu: d.jangka_waktu || '',
        pengiriman: d.pengiriman || 'belum_diketahui', tanggal_terima: d.tanggal_terima || '',
        tempat_terima: d.tempat_terima || '', biaya_kirim: d.biaya_kirim || '',
        alamat_pengiriman: d.alamat_pengiriman || '', nama_penerima: d.nama_penerima || '',
        no_hp_penerima: d.no_hp_penerima || '', jenis_pemotongan: d.jenis_pemotongan || '',
        biaya_potong: d.biaya_potong || '', tanggal_potong: d.tanggal_potong ? d.tanggal_potong.slice(0, 16) : '',
        packing: d.packing || 'tidak', catatan: d.catatan || '',
        nominal_pembayaran: d.nominal_pembayaran || '', metode_pembayaran: d.metode_pembayaran || '',
        nama_pembayar: d.nama_pembayar || '', bukti_bayar: null,
        details: d.details?.map((item) => ({
          sapi_id: item.sapi_id || '', no_eartag: item.no_eartag || '', merk: item.merk || '',
          berat: item.berat || '', harga_jual: item.harga_jual || item.subtotal || '',
          keterangan: item.keterangan || '',
        })) || [],
      });
      // Merge current transaction's sapi into availableSapi so they show in dropdown during edit
      setAvailableSapi((prev) => {
        const existingIds = new Set(prev.map((s) => String(s.sapi_id)));
        const transactionSapi = d.details?.filter((item) => item.sapi_id && !existingIds.has(String(item.sapi_id))).map((item) => ({
          sapi_id: item.sapi_id,
          no_eartag: item.no_eartag || '',
          jenis_sapi: item.merk || 'Sapi',
          berat: item.berat || '',
          harga_beli: '',
        })) || [];
        return [...prev, ...transactionSapi];
      });
      if (d.bukti_bayar_url) setBuktiBayarPreview(d.bukti_bayar_url);
    }
  }, [fetchDetail, pid]);

  useEffect(() => {
    if (isEdit && pid) loadEditData();
  }, [isEdit, pid, loadEditData]);

  const showNotif = useCallback((type, message) => {
    setNotification({ isVisible: true, type, message });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      setFormData((prev) => ({ ...prev, [name]: file }));
      if (file) setBuktiBayarPreview(URL.createObjectURL(file));
    } else {
      let sanitizedValue = value;
      // Only allow numbers for phone fields
      if (name === 'no_hp_pembeli' || name === 'no_hp_penerima') {
        sanitizedValue = value.replace(/\D/g, '');
      }
      setFormData((prev) => {
        const updates = { [name]: sanitizedValue };
        // Clear reseller_id when penjual switches to cv_puput
        if (name === 'penjual' && sanitizedValue === 'cv_puput') {
          updates.reseller_id = '';
        }
        return { ...prev, ...updates };
      });
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      details: [...prev.details, { sapi_id: '', no_eartag: '', merk: '', berat: '', harga_jual: '', keterangan: '' }],
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({ ...prev, details: prev.details.filter((_, i) => i !== index) }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const newDetails = [...prev.details];
      newDetails[index] = { ...newDetails[index], [field]: value };
      if (field === 'sapi_id') {
        const selectedSapi = availableSapi.find((s) => String(s.sapi_id) === String(value));
        if (selectedSapi) {
          newDetails[index].no_eartag = selectedSapi.no_eartag || '';
          newDetails[index].berat = selectedSapi.berat || '';
        }
      }
      return { ...prev, details: newDetails };
    });
    if (errors[`detail_${index}_${field}`]) setErrors((prev) => ({ ...prev, [`detail_${index}_${field}`]: '' }));
  };

  const totals = useMemo(() => {
    const totalBerat = formData.details.reduce((sum, item) => sum + (parseFloat(item.berat) || 0), 0);
    const totalHarga = formData.details.reduce((sum, item) => sum + (parseFloat(item.harga_jual) || 0), 0);
    const biayaKirim = parseFloat(formData.biaya_kirim) || 0;
    const biayaPotong = parseFloat(formData.biaya_potong) || 0;
    const grandTotal = totalHarga + biayaKirim + biayaPotong;
    const nominalPembayaran = parseFloat(formData.nominal_pembayaran) || 0;
    const sisaPembayaran = grandTotal - nominalPembayaran;
    return { totalBerat, totalHarga, biayaKirim, biayaPotong, grandTotal, nominalPembayaran, sisaPembayaran };
  }, [formData.details, formData.biaya_kirim, formData.biaya_potong, formData.nominal_pembayaran]);

  const validate = () => {
    const newErrors = {};
    if (!formData.pic.trim()) newErrors.pic = 'PIC wajib diisi';
    if (!formData.penjual) newErrors.penjual = 'Penjual wajib dipilih';
    if (formData.penjual === 'reseller' && !formData.reseller_id) newErrors.reseller_id = 'Reseller wajib dipilih';
    if (!formData.nama_pembeli.trim()) newErrors.nama_pembeli = 'Nama pembeli wajib diisi';
    if (!formData.no_hp_pembeli.trim()) newErrors.no_hp_pembeli = 'No HP pembeli wajib diisi';
    if (!formData.tanggal_transaksi) newErrors.tanggal_transaksi = 'Tanggal transaksi wajib diisi';
    if (!formData.tipe_penjualan) newErrors.tipe_penjualan = 'Tipe penjualan wajib dipilih';
    if (formData.tipe_penjualan === 'kredit' && !formData.jangka_waktu) newErrors.jangka_waktu = 'Jangka waktu wajib diisi';
    if (!formData.pengiriman) newErrors.pengiriman = 'Pengiriman wajib dipilih';
    if (!formData.packing) newErrors.packing = 'Packing wajib dipilih';
    if (formData.details.length === 0) newErrors.details = 'Minimal harus ada 1 item sapi';
    formData.details.forEach((item, index) => {
      if (!item.sapi_id) newErrors[`detail_${index}_sapi_id`] = 'Sapi wajib dipilih';
      if (!item.harga_jual || parseFloat(item.harga_jual) <= 0) newErrors[`detail_${index}_harga_jual`] = 'Harga jual harus lebih dari 0';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildFormData = () => {
    const fd = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === 'details') fd.append(key, JSON.stringify(formData.details));
      else if (key === 'bukti_bayar') { if (formData[key] instanceof File) fd.append(key, formData[key]); }
      else if (formData[key] !== null && formData[key] !== undefined) fd.append(key, formData[key]);
    });
    if (isEdit) fd.append('pid', pid);
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { showNotif('error', 'Mohon lengkapi semua field yang wajib diisi'); return; }
    const payload = buildFormData();
    const result = isEdit ? await update(payload) : await create(payload);
    if (result.success) {
      showNotif('success', isEdit ? 'Penjualan berhasil diperbarui' : 'Penjualan berhasil ditambahkan');
      setTimeout(() => navigate('/rph/penjualan-sapi-utuh'), 1500);
    } else {
      showNotif('error', result.message || 'Gagal menyimpan penjualan');
    }
  };

  const isResellerDisabled = formData.penjual === 'cv_puput';
  const isJangkaWaktuVisible = formData.tipe_penjualan === 'kredit';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 p-4 md:p-6">
      <div className="max-w-full mx-4 md:mx-8 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/rph/penjualan-sapi-utuh')} className="p-2 hover:bg-gray-100 rounded-lg transition"><ArrowLeft className="w-5 h-5" /></button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl"><ShoppingCart className="h-7 w-7 text-green-600" /></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Penjualan Sapi Utuh' : 'Tambah Penjualan Sapi Utuh'}</h1>
                <p className="text-gray-500 text-sm">{isEdit ? 'Perbarui data penjualan' : 'Buat transaksi penjualan baru'}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow border border-gray-100">
            <div className="flex overflow-x-auto border-b border-gray-200">
              {[
                { id: 0, label: 'PIC & Penjual', icon: User, color: 'green' },
                { id: 1, label: 'Transaksi', icon: CreditCard, color: 'blue' },
                { id: 2, label: 'Pengiriman', icon: Truck, color: 'orange' },
                { id: 3, label: 'Pemotongan', icon: Scissors, color: 'purple' },
                { id: 4, label: 'Detail Sapi', icon: Beef, color: 'red' },
                { id: 5, label: 'Pembayaran', icon: CreditCard, color: 'teal' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const c = {
                  green: isActive ? 'border-green-500 text-green-700 bg-green-50' : 'border-transparent text-gray-500 hover:text-green-600 hover:bg-green-50',
                  blue: isActive ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-blue-50',
                  orange: isActive ? 'border-orange-500 text-orange-700 bg-orange-50' : 'border-transparent text-gray-500 hover:text-orange-600 hover:bg-orange-50',
                  purple: isActive ? 'border-purple-500 text-purple-700 bg-purple-50' : 'border-transparent text-gray-500 hover:text-purple-600 hover:bg-purple-50',
                  red: isActive ? 'border-red-500 text-red-700 bg-red-50' : 'border-transparent text-gray-500 hover:text-red-600 hover:bg-red-50',
                  teal: isActive ? 'border-teal-500 text-teal-700 bg-teal-50' : 'border-transparent text-gray-500 hover:text-teal-600 hover:bg-teal-50',
                }[tab.color];
                return (
                  <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition ${c}`}>
                    <tab.icon className="w-4 h-4" />{tab.label}
                  </button>
                );
              })}
            </div>
            <div className="p-6">
              {activeTab === 0 && (
                <div>
                  <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2"><User className="w-5 h-5" />PIC & Penjual</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Nama PIC" name="pic" required value={formData.pic} error={errors.pic} onChange={handleChange} placeholder="Nama PIC" />
                    <SearchableSelect
                      label="Penjual"
                      required
                      value={formData.penjual}
                      options={PENJUAL_OPTIONS}
                      onSelect={(val) => {
                        setFormData((prev) => {
                          const updates = { penjual: val };
                          if (val === 'cv_puput') updates.reseller_id = '';
                          return { ...prev, ...updates };
                        });
                        if (errors.penjual) setErrors((prev) => ({ ...prev, penjual: '' }));
                      }}
                      error={errors.penjual}
                      placeholder="Pilih Penjual"
                    />
                    <SearchableSelect
                      label="Nama Reseller"
                      value={formData.reseller_id}
                      required={formData.penjual === 'reseller'}
                      options={resellers.map((r) => ({ value: r.id, label: `${r.kode_reseller} - ${r.nama_reseller}` }))}
                      onSelect={(val) => setFormData((prev) => ({ ...prev, reseller_id: val }))}
                      error={errors.reseller_id}
                      disabled={isResellerDisabled}
                      placeholder={isResellerDisabled ? 'Disabled (CV Puput)' : 'Pilih Reseller'}
                    />
                    <InputField label="Nama Pembeli" name="nama_pembeli" required value={formData.nama_pembeli} error={errors.nama_pembeli} onChange={handleChange} placeholder="Nama pembeli" />
                    <InputField label="No HP Pembeli" name="no_hp_pembeli" type="tel" required value={formData.no_hp_pembeli} error={errors.no_hp_pembeli} onChange={handleChange} placeholder="081234567890" />
                  </div>
                </div>
              )}
              {activeTab === 1 && (
                <div>
                  <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" />Transaksi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField label="Tanggal Pembelian" name="tanggal_transaksi" type="date" required value={formData.tanggal_transaksi} error={errors.tanggal_transaksi} onChange={handleChange} />
                    <SearchableSelect
                      label="Tipe Penjualan"
                      required
                      value={formData.tipe_penjualan}
                      options={TIPE_PENJUALAN_OPTIONS}
                      onSelect={(val) => {
                        setFormData((prev) => ({ ...prev, tipe_penjualan: val }));
                        if (errors.tipe_penjualan) setErrors((prev) => ({ ...prev, tipe_penjualan: '' }));
                      }}
                      error={errors.tipe_penjualan}
                      placeholder="Pilih Tipe Penjualan"
                    />
                    {isJangkaWaktuVisible && (
                      <SearchableSelect
                        label="Jangka Waktu"
                        required
                        value={formData.jangka_waktu}
                        options={JANGKA_WAKTU_OPTIONS}
                        onSelect={(val) => {
                          setFormData((prev) => ({ ...prev, jangka_waktu: val }));
                          if (errors.jangka_waktu) setErrors((prev) => ({ ...prev, jangka_waktu: '' }));
                        }}
                        error={errors.jangka_waktu}
                        placeholder="Pilih jangka waktu"
                      />
                    )}
                  </div>
                </div>
              )}
              {activeTab === 2 && (
                <div>
                  <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2"><Truck className="w-5 h-5" />Pengiriman</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SearchableSelect
                      label="Pengiriman"
                      required
                      value={formData.pengiriman}
                      options={PENGIRIMAN_OPTIONS}
                      onSelect={(val) => {
                        setFormData((prev) => ({ ...prev, pengiriman: val }));
                        if (errors.pengiriman) setErrors((prev) => ({ ...prev, pengiriman: '' }));
                      }}
                      error={errors.pengiriman}
                      placeholder="Pilih Pengiriman"
                    />
                    <InputField label="Tanggal Penerimaan" name="tanggal_terima" type="date" value={formData.tanggal_terima} error={errors.tanggal_terima} onChange={handleChange} />
                    <InputField label="Tempat Menerima" name="tempat_terima" value={formData.tempat_terima} error={errors.tempat_terima} onChange={handleChange} placeholder="Alamat / Lokasi" />
                    <CurrencyInput label="Biaya Kirim" name="biaya_kirim" value={formData.biaya_kirim} error={errors.biaya_kirim} onChange={handleChange} placeholder="0" />
                    <div className="md:col-span-2">
                      <InputField label="Alamat Pengiriman" name="alamat_pengiriman" type="textarea" value={formData.alamat_pengiriman} error={errors.alamat_pengiriman} onChange={handleChange} placeholder="Alamat lengkap pengiriman" />
                    </div>
                    <InputField label="Nama Penerima" name="nama_penerima" value={formData.nama_penerima} error={errors.nama_penerima} onChange={handleChange} placeholder="Nama penerima" />
                    <InputField label="No HP Penerima" name="no_hp_penerima" type="tel" value={formData.no_hp_penerima} error={errors.no_hp_penerima} onChange={handleChange} placeholder="081234567890" />
                  </div>
                </div>
              )}
              {activeTab === 3 && (
                <div>
                  <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2"><Scissors className="w-5 h-5" />Pemotongan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SearchableSelect
                      label="Jenis Pemotongan"
                      value={formData.jenis_pemotongan}
                      options={JENIS_PEMOTONGAN_OPTIONS}
                      onSelect={(val) => {
                        setFormData((prev) => ({ ...prev, jenis_pemotongan: val }));
                        if (errors.jenis_pemotongan) setErrors((prev) => ({ ...prev, jenis_pemotongan: '' }));
                      }}
                      error={errors.jenis_pemotongan}
                      placeholder="Pilih jenis pemotongan"
                    />
                    <CurrencyInput label="Biaya Potong" name="biaya_potong" value={formData.biaya_potong} error={errors.biaya_potong} onChange={handleChange} placeholder="0" />
                    <InputField label="Tanggal Potong" name="tanggal_potong" type="datetime-local" value={formData.tanggal_potong} error={errors.tanggal_potong} onChange={handleChange} />
                    <SearchableSelect
                      label="Packing"
                      required
                      value={formData.packing}
                      options={PACKING_OPTIONS}
                      onSelect={(val) => {
                        setFormData((prev) => ({ ...prev, packing: val }));
                        if (errors.packing) setErrors((prev) => ({ ...prev, packing: '' }));
                      }}
                      error={errors.packing}
                      placeholder="Pilih Packing"
                    />
                    <div className="md:col-span-2">
                      <InputField label="Catatan" name="catatan" type="textarea" value={formData.catatan} error={errors.catatan} onChange={handleChange} placeholder="Catatan tambahan" />
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 4 && (
                <div>
                  <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2"><Beef className="w-5 h-5" />Detail Sapi</h3>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">Pilih sapi yang akan dijual</p>
                    <button type="button" onClick={handleAddItem} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm font-medium transition">
                      <PlusCircle className="w-4 h-4" />Tambah Sapi
                    </button>
                  </div>
                  {errors.details && (<div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{errors.details}</div>)}
                  <div className="space-y-4">
                    {formData.details.map((item, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-xl bg-gray-50 relative">
                        <button type="button" onClick={() => handleRemoveItem(index)} className="absolute top-2 right-2 p-1.5 hover:bg-red-100 rounded-lg text-red-600 transition" title="Hapus Item"><Trash2 className="w-4 h-4" /></button>
                        <div className="flex flex-col xl:flex-row gap-3 items-end">
                          <div className="w-full xl:w-64">
                            <SearchableSelect
                              label="Pilih Sapi"
                              required
                              value={item.sapi_id}
                              options={availableSapi.map((s) => ({ value: s.sapi_id, label: `${s.no_eartag} - ${s.jenis_sapi} (${s.berat} kg)` }))}
                              onSelect={(val) => handleItemChange(index, 'sapi_id', val)}
                              error={errors[`detail_${index}_sapi_id`]}
                              placeholder="Pilih Sapi"
                            />
                          </div>
                          <div className="w-full xl:w-32">
                            <label className="block text-xs font-medium text-gray-700 mb-1">No. Eartag</label>
                            <input type="text" value={item.no_eartag} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-600" />
                          </div>
                          <div className="w-full xl:w-40">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Merk</label>
                            <input type="text" value={item.merk} onChange={(e) => handleItemChange(index, 'merk', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Merk sapi" />
                          </div>
                          <div className="w-full xl:w-28">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Berat (kg)</label>
                            <input type="number" value={item.berat} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-600" />
                          </div>
                          <div className="w-full xl:w-44">
                            <CurrencyInput label="Harga Jual" name={`detail_${index}_harga_jual`} required value={item.harga_jual} error={errors[`detail_${index}_harga_jual`]} onChange={(e) => handleItemChange(index, 'harga_jual', e.target.value)} placeholder="0" />
                          </div>
                          <div className="w-full xl:w-48">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Keterangan</label>
                            <input type="text" value={item.keterangan} onChange={(e) => handleItemChange(index, 'keterangan', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Catatan" />
                          </div>
                        </div>
                      </div>
                    ))}
                    {formData.details.length === 0 && (
                      <div className="text-center py-8 text-gray-400"><Beef className="mx-auto h-12 w-12 mb-3 opacity-40" /><p>Belum ada item sapi. Klik "Tambah Sapi" untuk menambahkan.</p></div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 5 && (
                <div>
                  <h3 className="text-lg font-bold text-teal-800 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" />Pembayaran</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CurrencyInput label="Nominal Pembayaran" name="nominal_pembayaran" value={formData.nominal_pembayaran} error={errors.nominal_pembayaran} onChange={handleChange} placeholder="0" />
                    <SearchableSelect
                      label="Metode Pembayaran"
                      value={formData.metode_pembayaran}
                      options={METODE_PEMBAYARAN_OPTIONS}
                      onSelect={(val) => {
                        setFormData((prev) => ({ ...prev, metode_pembayaran: val }));
                        if (errors.metode_pembayaran) setErrors((prev) => ({ ...prev, metode_pembayaran: '' }));
                      }}
                      error={errors.metode_pembayaran}
                      placeholder="Pilih metode"
                    />
                    <InputField label="Nama Pembayar" name="nama_pembayar" value={formData.nama_pembayar} error={errors.nama_pembayar} onChange={handleChange} placeholder="Nama pembayar" />
                    <div className="md:col-span-3">
                      <InputField label="Upload Bukti Bayar" name="bukti_bayar" type="file" accept=".jpg,.jpeg,.png,.pdf" value="" error={errors.bukti_bayar} onChange={handleChange} filePreview={buktiBayarPreview} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Ringkasan Transaksi</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-sm opacity-80">Total Berat</p><p className="text-2xl font-bold">{totals.totalBerat.toFixed(2)} kg</p></div>
              <div><p className="text-sm opacity-80">Total Harga Sapi</p><p className="text-2xl font-bold">Rp {totals.totalHarga.toLocaleString('id-ID')}</p></div>
              <div><p className="text-sm opacity-80">Biaya Kirim</p><p className="text-2xl font-bold">Rp {totals.biayaKirim.toLocaleString('id-ID')}</p></div>
              <div><p className="text-sm opacity-80">Biaya Potong</p><p className="text-2xl font-bold">Rp {totals.biayaPotong.toLocaleString('id-ID')}</p></div>
              <div className="md:col-span-2"><p className="text-sm opacity-80">Grand Total</p><p className="text-3xl font-bold">Rp {totals.grandTotal.toLocaleString('id-ID')}</p></div>
              <div><p className="text-sm opacity-80">Nominal Pembayaran</p><p className="text-2xl font-bold">Rp {totals.nominalPembayaran.toLocaleString('id-ID')}</p></div>
              <div><p className="text-sm opacity-80">Sisa Pembayaran</p><p className="text-2xl font-bold">Rp {totals.sisaPembayaran.toLocaleString('id-ID')}</p></div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => navigate('/rph/penjualan-sapi-utuh')} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Batal</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 font-medium">
              <Save className="w-5 h-5" />{loading ? 'Menyimpan...' : isEdit ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
      <Notification notification={notification.isVisible ? { type: notification.type, message: notification.message } : null} onClose={() => setNotification({ isVisible: false, type: 'info', message: '' })} />
    </div>
  );
};

export default AddPenjualanSapiUtuhPageV2;
