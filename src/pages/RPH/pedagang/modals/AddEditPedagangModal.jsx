import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X, Save, User, MapPin, Phone, Store, Hash, Calendar,
  ChevronDown, ChevronUp, DollarSign, Loader2,
} from 'lucide-react';
import PedagangService from '../../../../services/pedagangService';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';
import useOfficeData from '../../../../hooks/useOfficeData';
import useWilayah from '../hooks/useWilayah';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

const formatRupiah = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '';
  const intValue = Math.round(numValue);
  const absNum = Math.abs(intValue);
  const formatted = String(absNum).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return intValue < 0 ? `-${formatted}` : formatted;
};

const parseRupiah = (str) => {
  if (!str || str === '') return '';
  const cleaned = String(str).replace(/[^0-9-]/g, '');
  if (!cleaned) return '';
  return Number(cleaned);
};

const TABS = [
  { key: 'identitas', label: 'Identitas', icon: User },
  { key: 'alamat', label: 'Alamat', icon: MapPin },
  { key: 'pasar', label: 'Pasar & Saldo', icon: Store },
  { key: 'harga', label: 'Harga Karkas', icon: DollarSign },
];

const initialFormData = {
  nama_identitas: '', nama_alias: '', nik: '', tempat_lahir: '', tanggal_lahir: '',
  jenis_kelamin: '', agama: '', pekerjaan: '', status_kawin: '', tipe_pedagang: '',
  id_provinsi: '', id_kabupaten: '', id_kecamatan: '', id_kelurahan: '',
  status_rumah: '', no_hp: '', alamat: '', pasar: '',
  saldo_awal: '', tabungan: '', kulit: '', saldo_beku: '', id_office: '',
};

const HARGA_PARAMETER_GROUPS = 'itemboning,itempotong';
const CURRENCY_FIELDS = ['saldo_awal', 'tabungan', 'kulit', 'saldo_beku'];

const STATIC_OPTIONS = {
  jenis_kelamin: [
    { value: 1, label: 'Laki-laki' },
    { value: 2, label: 'Perempuan' },
  ],
  agama: [
    { value: 1, label: 'Islam' },
    { value: 2, label: 'Kristen' },
    { value: 3, label: 'Katolik' },
    { value: 4, label: 'Hindu' },
    { value: 5, label: 'Buddha' },
    { value: 6, label: 'Konghucu' },
  ],
  status_kawin: [
    { value: 1, label: 'Belum Kawin' },
    { value: 2, label: 'Kawin' },
    { value: 3, label: 'Cerai Hidup' },
    { value: 4, label: 'Cerai Mati' },
  ],
  tipe_pedagang: [
    { value: 1, label: 'Terdaftar (Tipe 1)' },
    { value: 2, label: 'Non-Terdaftar/Umum (Tipe 2)' },
  ],
  status_rumah: [
    { value: 1, label: 'Milik Sendiri' },
    { value: 2, label: 'Kontrak' },
    { value: 3, label: 'Sewa' },
    { value: 4, label: 'Lainnya' },
  ],
};

const AddEditPedagangModal = ({ isOpen, onClose, onSave, editData, loading }) => {
  const [activeTab, setActiveTab] = useState('identitas');
  const [formData, setFormData] = useState({ ...initialFormData });
  const [harga, setHarga] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hargaExpanded, setHargaExpanded] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pekerjaanOptions, setPekerjaanOptions] = useState([]);
  const [loadingPekerjaan, setLoadingPekerjaan] = useState(false);
  const [itemBoningOptions, setItemBoningOptions] = useState([]);
  const [loadingItemBoning, setLoadingItemBoning] = useState(false);

  const { officeOptions } = useOfficeData();

  const fetchItemBoningOptions = useCallback(async () => {
    setLoadingItemBoning(true);
    try {
      const response = await HttpClient.get('/api/master/parameter/data', {
        params: { groups: HARGA_PARAMETER_GROUPS },
        cache: false,
      });
      const source = response?.data?.[0] || response?.data || response || {};
      const rows = Array.isArray(source.itemboning)
        ? source.itemboning
        : Array.isArray(source.itempotong)
          ? source.itempotong
          : [];
      const normalized = rows
        .map((item) => ({
          id: item.id ?? item.value ?? item.pid,
          name: item.name || item.label || `Item ${item.id ?? item.value ?? item.pid}`,
          id_jenis_potong: Number(item.id_jenis_potong ?? item.type ?? item.golongan ?? 0) || 0,
        }))
        .filter((item) => item.id != null);
      setItemBoningOptions(normalized);
    } catch {
      setItemBoningOptions([]);
    } finally {
      setLoadingItemBoning(false);
    }
  }, []);

  const fetchPekerjaanOptions = useCallback(async () => {
    if (pekerjaanOptions.length > 0) return;
    setLoadingPekerjaan(true);
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PARAMETERS}/dataByGroup`, { group: 'pekerjaan' });
      if (response.data && Array.isArray(response.data)) {
        setPekerjaanOptions(response.data.map(item => ({ value: parseInt(item.value), label: item.name })));
      }
    } catch {
      setPekerjaanOptions([]);
    } finally {
      setLoadingPekerjaan(false);
    }
  }, [pekerjaanOptions.length]);

  const wilayahInitialValues = useMemo(() => ({
    id_provinsi: formData.id_provinsi,
    id_kabupaten: formData.id_kabupaten,
    id_kecamatan: formData.id_kecamatan,
  }), [formData.id_provinsi, formData.id_kabupaten, formData.id_kecamatan]);

  const {
    provinsiOptions, kabupatenOptions, kecamatanOptions, kelurahanOptions,
    loadingProvinsi, loadingKabupaten, loadingKecamatan, loadingKelurahan,
    fetchKabupaten, fetchKecamatan, fetchKelurahan,
  } = useWilayah(wilayahInitialValues);

  useEffect(() => {
    if (isOpen) {
      fetchPekerjaanOptions();
      fetchItemBoningOptions();
      if (editData) {
        setFormData({ ...initialFormData });
        setHarga({});
        setDetailLoading(true);
        setActiveTab('identitas');
        setHargaExpanded(false);
        const fetchDetail = async () => {
          try {
            const result = await PedagangService.show(editData.pid);
            if (result.success && result.data) {
              const d = result.data;
              setFormData({
                nama_identitas: d.nama_identitas || '', nama_alias: d.nama_alias || '',
                nik: d.nik != null ? String(d.nik) : '', tempat_lahir: d.tempat_lahir || '',
                tanggal_lahir: d.tanggal_lahir || '', jenis_kelamin: d.jenis_kelamin || '',
                agama: d.agama || '', pekerjaan: d.pekerjaan || '', status_kawin: d.status_kawin || '',
                id_provinsi: d.id_provinsi ? Number(d.id_provinsi) : '',
                id_kabupaten: d.id_kabupaten ? Number(d.id_kabupaten) : '',
                id_kecamatan: d.id_kecamatan ? Number(d.id_kecamatan) : '',
                id_kelurahan: d.id_kelurahan != null ? String(d.id_kelurahan) : '',
                status_rumah: d.status_rumah || '', no_hp: d.no_hp != null ? String(d.no_hp) : '',
                alamat: d.alamat || '', pasar: d.pasar || '',
                saldo_awal: d.saldo_awal || '', tabungan: d.tabungan || '',
                kulit: d.kulit || '', saldo_beku: d.saldo_beku || '',
                id_office: d.id_office || '',
                tipe_pedagang: d.tipe_pedagang != null ? String(d.tipe_pedagang) : '',
              });
              if (Array.isArray(d.harga)) {
                const filledHarga = {};
                d.harga.forEach((row) => {
                  const itemId = row?.id_item_potong ?? row?.item_potong?.id ?? row?.itemPotong?.id;
                  if (itemId == null) return;
                  if (row.nominal != null && row.nominal !== '') {
                    filledHarga[String(itemId)] = row.nominal;
                  }
                });
                setHarga(filledHarga);
              }
            }
          } catch {
            setFormData(prev => ({
              ...prev,
              nama_identitas: editData.nama_identitas || '',
              nama_alias: editData.nama_alias || '',
              nik: editData.nik != null ? String(editData.nik) : '',
              no_hp: editData.no_hp != null ? String(editData.no_hp) : '',
              alamat: editData.alamat || '', pasar: editData.pasar || '',
            }));
          } finally {
            setDetailLoading(false);
          }
        };
        fetchDetail();
      } else {
        setFormData({ ...initialFormData });
        setHarga({});
        setActiveTab('identitas');
        setHargaExpanded(false);
      }
      setErrors({});
    }
  }, [isOpen, editData, fetchPekerjaanOptions, fetchItemBoningOptions]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    if (name === 'nama_alias') {
      finalValue = value.toUpperCase();
    } else if (name === 'nik') {
      finalValue = value.replace(/[^0-9]/g, '').slice(0, 16);
    } else if (name === 'no_hp') {
      finalValue = value.replace(/[^0-9+\-\s()]/g, '').slice(0, 16);
    } else if (CURRENCY_FIELDS.includes(name)) {
      finalValue = parseRupiah(value);
    } else if (type === 'number') {
      finalValue = value === '' ? '' : Number(value);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    setErrors(prev => prev[name] ? { ...prev, [name]: '' } : prev);
  }, []);

  const handleHargaChange = useCallback((key, value) => {
    setHarga(prev => ({ ...prev, [String(key)]: parseRupiah(value) }));
  }, []);

  const handleSelectChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value ?? '' }));
    setErrors(prev => prev[name] ? { ...prev, [name]: '' } : prev);
  }, []);

  const handleProvinsiChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, id_provinsi: value || '', id_kabupaten: '', id_kecamatan: '', id_kelurahan: '' }));
    if (value) fetchKabupaten(value);
  }, [fetchKabupaten]);

  const handleKabupatenChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, id_kabupaten: value || '', id_kecamatan: '', id_kelurahan: '' }));
    if (value) fetchKecamatan(value);
  }, [fetchKecamatan]);

  const handleKecamatanChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, id_kecamatan: value || '', id_kelurahan: '' }));
    if (value) fetchKelurahan(value);
  }, [fetchKelurahan]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.nama_identitas.trim()) newErrors.nama_identitas = 'Nama identitas wajib diisi';
    if (!formData.nama_alias.trim()) newErrors.nama_alias = 'Nama alias wajib diisi';
    if (formData.nik && formData.nik.length !== 16) newErrors.nik = 'NIK harus 16 digit';
    if (formData.no_hp && formData.no_hp.length > 16) newErrors.no_hp = 'No HP maksimal 16 karakter';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loadingItemBoning) return;
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      ['saldo_awal', 'tabungan', 'kulit', 'saldo_beku', 'id_office', 'jenis_kelamin', 'agama', 'pekerjaan', 'status_kawin', 'status_rumah', 'tipe_pedagang'].forEach((f) => {
        if (payload[f] !== '') payload[f] = Number(payload[f]);
      });
      if (editData?.pid) payload.pid = editData.pid;
      payload.harga = itemBoningOptions
        .filter((item) => harga[String(item.id)] !== '' && harga[String(item.id)] != null)
        .map((item) => ({ id_item_potong: Number(item.id), nominal: Number(harga[String(item.id)]) }));
      await onSave(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => { if (!isSubmitting) onClose(); };

  const renderInput = (name, label, type = 'text', icon = null, required = false, placeholder = '', extraProps = {}) => (
    <div>
      <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5" htmlFor={`pedagang-${name}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          id={`pedagang-${name}`}
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleInputChange}
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
            errors[name] ? 'border-red-500' : 'border-gray-200'
          }`}
          placeholder={placeholder}
          disabled={isSubmitting || detailLoading}
          aria-required={required}
          {...extraProps}
        />
      </div>
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>}
    </div>
  );

  const renderCurrencyInput = (name, label, required = false, placeholder = '0') => (
    <div>
      <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5" htmlFor={`pedagang-${name}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">Rp</span>
        <input
          id={`pedagang-${name}`}
          type="text"
          name={name}
          value={formatRupiah(formData[name])}
          onChange={handleInputChange}
          inputMode="numeric"
          className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
            errors[name] ? 'border-red-500' : 'border-gray-200'
          }`}
          placeholder={placeholder}
          disabled={isSubmitting || detailLoading}
        />
      </div>
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>}
    </div>
  );

  const renderSelect = (name, label, options, placeholder = 'Pilih...', required = false) => (
    <div>
      <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <SearchableSelect
        options={options}
        value={formData[name]}
        onChange={(val) => handleSelectChange(name, val)}
        placeholder={placeholder}
        isSearchable={true}
        isClearable={true}
        accentColor="green"
        menuZIndex={100000}
        className="text-sm"
        isDisabled={isSubmitting || detailLoading}
      />
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>}
    </div>
  );

  const renderHargaInput = (item) => (
    <div key={item.id}>
      <label className="block text-[11px] font-semibold text-gray-600 mb-1" htmlFor={`harga-${item.id}`}>
        {item.name}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
        <input
          id={`harga-${item.id}`}
          type="text"
          value={formatRupiah(harga[String(item.id)])}
          onChange={(e) => handleHargaChange(item.id, e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          placeholder="0"
          disabled={isSubmitting}
          inputMode="numeric"
        />
      </div>
    </div>
  );

  const renderTextarea = (name, label, rows = 3) => (
    <div>
      <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5" htmlFor={`pedagang-${name}`}>
        {label}
      </label>
      <textarea
        id={`pedagang-${name}`}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        rows={rows}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition resize-none ${
          errors[name] ? 'border-red-500' : 'border-gray-200'
        }`}
        disabled={isSubmitting || detailLoading}
      />
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>}
    </div>
  );

  const hargaBoning = useMemo(() => itemBoningOptions.filter((i) => Number(i.id_jenis_potong) === 1), [itemBoningOptions]);
  const hargaKarkas = useMemo(() => itemBoningOptions.filter((i) => Number(i.id_jenis_potong) === 2), [itemBoningOptions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">
                {editData ? 'Edit Data Pedagang' : 'Tambah Pedagang Baru'}
              </h3>
              <p className="text-xs text-gray-500">
                {editData ? 'Perbarui informasi pedagang' : 'Tambahkan pedagang baru ke sistem'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-gray-100">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${
                  activeTab === key
                    ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5">
          {detailLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm">Memuat data pedagang...</p>
            </div>
          ) : (
            <>
              {/* Tab: Identitas */}
              {activeTab === 'identitas' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderInput('nama_identitas', 'Nama Identitas', 'text', <User className="w-4 h-4" />, true, 'Masukkan nama identitas')}
                  {renderInput('nama_alias', 'Nama Alias', 'text', <User className="w-4 h-4" />, true, 'Otomatis huruf kapital')}
                  {renderInput('nik', 'NIK', 'text', <Hash className="w-4 h-4" />, false, '16 digit NIK', { maxLength: 16, inputMode: 'numeric' })}
                  {renderInput('tempat_lahir', 'Tempat Lahir', 'text', <MapPin className="w-4 h-4" />, false, 'Kota/Kabupaten')}
                  {renderInput('tanggal_lahir', 'Tanggal Lahir', 'date', <Calendar className="w-4 h-4" />)}
                  {renderSelect('jenis_kelamin', 'Jenis Kelamin', STATIC_OPTIONS.jenis_kelamin, 'Pilih jenis kelamin')}
                  {renderSelect('agama', 'Agama', STATIC_OPTIONS.agama, 'Pilih agama')}
                  {renderSelect('pekerjaan', 'Pekerjaan', pekerjaanOptions, loadingPekerjaan ? 'Memuat...' : 'Pilih pekerjaan')}
                  {renderSelect('status_kawin', 'Status Kawin', STATIC_OPTIONS.status_kawin, 'Pilih status kawin')}
                  {renderSelect('tipe_pedagang', 'Tipe Pedagang', STATIC_OPTIONS.tipe_pedagang, 'Pilih tipe pedagang')}
                </div>
              )}

              {/* Tab: Alamat */}
              {activeTab === 'alamat' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Provinsi</label>
                    <SearchableSelect
                      options={provinsiOptions}
                      value={formData.id_provinsi}
                      onChange={handleProvinsiChange}
                      isLoading={loadingProvinsi}
                      placeholder="Pilih Provinsi..."
                      isDisabled={isSubmitting || detailLoading}
                      accentColor="green"
                      menuZIndex={100000}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Kabupaten/Kota</label>
                    <SearchableSelect
                      options={kabupatenOptions}
                      value={formData.id_kabupaten}
                      onChange={handleKabupatenChange}
                      isLoading={loadingKabupaten}
                      placeholder="Pilih Kabupaten/Kota..."
                      isDisabled={isSubmitting || detailLoading || !formData.id_provinsi}
                      accentColor="green"
                      menuZIndex={100000}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Kecamatan</label>
                    <SearchableSelect
                      options={kecamatanOptions}
                      value={formData.id_kecamatan}
                      onChange={handleKecamatanChange}
                      isLoading={loadingKecamatan}
                      placeholder="Pilih Kecamatan..."
                      isDisabled={isSubmitting || detailLoading || !formData.id_kabupaten}
                      accentColor="green"
                      menuZIndex={100000}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Kelurahan/Desa</label>
                    <SearchableSelect
                      options={kelurahanOptions}
                      value={formData.id_kelurahan}
                      onChange={(val) => handleSelectChange('id_kelurahan', val)}
                      isLoading={loadingKelurahan}
                      placeholder="Pilih Kelurahan/Desa..."
                      isDisabled={isSubmitting || detailLoading || !formData.id_kecamatan}
                      accentColor="green"
                      menuZIndex={100000}
                      className="text-sm"
                    />
                  </div>
                  {renderSelect('status_rumah', 'Status Rumah', STATIC_OPTIONS.status_rumah, 'Pilih status rumah')}
                  {renderInput('no_hp', 'No HP', 'tel', <Phone className="w-4 h-4" />, false, '08xxxxxxxxxx', { maxLength: 16 })}
                  <div className="md:col-span-2">
                    {renderTextarea('alamat', 'Alamat', 3)}
                  </div>
                </div>
              )}

              {/* Tab: Pasar & Saldo */}
              {activeTab === 'pasar' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInput('pasar', 'Pasar', 'text', <Store className="w-4 h-4" />, false, 'Nama pasar')}
                    {renderSelect('id_office', 'Office', officeOptions, 'Pilih office')}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      Informasi Saldo
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderCurrencyInput('saldo_awal', 'Saldo Awal')}
                      {renderCurrencyInput('tabungan', 'Tabungan')}
                      {renderCurrencyInput('kulit', 'Kulit')}
                      {renderCurrencyInput('saldo_beku', 'Saldo Beku')}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Harga Karkas */}
              {activeTab === 'harga' && (
                <div>
                  <button
                    type="button"
                    onClick={() => setHargaExpanded(!hargaExpanded)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition mb-4"
                  >
                    <span className="text-sm font-medium text-gray-700">Daftar Harga Karkas & Boning</span>
                    {hargaExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  {hargaExpanded && (
                    <div className="space-y-5">
                      {loadingItemBoning ? (
                        <div className="py-8 text-center text-gray-400 flex flex-col items-center">
                          <Loader2 className="w-6 h-6 animate-spin mb-2" />
                          <p className="text-sm">Memuat daftar harga...</p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Karkas</h4>
                            {hargaKarkas.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {hargaKarkas.map(renderHargaInput)}
                              </div>
                            ) : <p className="text-sm text-gray-400">Tidak ada item karkas.</p>}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Boning</h4>
                            {hargaBoning.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {hargaBoning.map(renderHargaInput)}
                              </div>
                            ) : <p className="text-sm text-gray-400">Tidak ada item boning.</p>}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || detailLoading || loadingItemBoning}
              className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {editData ? 'Menyimpan...' : 'Menambahkan...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editData ? 'Simpan Perubahan' : 'Tambah Pedagang'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditPedagangModal;
