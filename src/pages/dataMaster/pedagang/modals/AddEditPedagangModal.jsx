import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X, Save, User, MapPin, Phone, Store, Hash, Calendar,
  ChevronDown, ChevronUp, DollarSign, Building2,
} from 'lucide-react';
import { CUT_PARTS, getEmptyHarga } from '../constants/cutParts';
import PedagangService from '../../../../services/pedagangService';
import useOfficeData from '../../../ho/tandaTerima/hooks/useOfficeData';
import useWilayah from '../hooks/useWilayah';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

// Format number to Rupiah display (e.g. 5700000 → "5.700.000")
// Handles decimal strings from backend (e.g. "300.00" → "300")
const formatRupiah = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  // Parse as float first to handle decimal strings like "300.00"
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '';
  // Round to integer (harga values should be integers)
  const intValue = Math.round(numValue);
  const absNum = Math.abs(intValue);
  const formatted = String(absNum).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return intValue < 0 ? `-${formatted}` : formatted;
};

// Parse formatted Rupiah string back to number (e.g. "5.700.000" → 5700000)
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
  nama_identitas: '',
  nama_alias: '',
  nik: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  jenis_kelamin: '',
  agama: '',
  pekerjaan: '',
  status_kawin: '',
  id_provinsi: '',
  id_kabupaten: '',
  id_kecamatan: '',
  id_kelurahan: '',
  status_rumah: '',
  no_hp: '',
  alamat: '',
  pasar: '',
  saldo_awal: '',
  tabungan: '',
  kulit: '',
  saldo_beku: '',
  id_office: '',
};

const AddEditPedagangModal = ({ isOpen, onClose, onSave, editData, loading }) => {
  const [activeTab, setActiveTab] = useState('identitas');
  const [formData, setFormData] = useState({ ...initialFormData });
  const [harga, setHarga] = useState(getEmptyHarga());
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hargaExpanded, setHargaExpanded] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Office data for dropdown
  const { officeOptions } = useOfficeData();

  // Wilayah cascading dropdowns
  const wilayahInitialValues = useMemo(() => ({
    id_provinsi: formData.id_provinsi,
    id_kabupaten: formData.id_kabupaten,
    id_kecamatan: formData.id_kecamatan,
  }), [formData.id_provinsi, formData.id_kabupaten, formData.id_kecamatan]);

  const {
    provinsiOptions,
    kabupatenOptions,
    kecamatanOptions,
    kelurahanOptions,
    loadingProvinsi,
    loadingKabupaten,
    loadingKecamatan,
    loadingKelurahan,
    fetchKabupaten,
    fetchKecamatan,
    fetchKelurahan,
  } = useWilayah(wilayahInitialValues);

  // Reset form when modal opens/closes or editData changes
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({ ...initialFormData });
        setHarga(getEmptyHarga());
        setDetailLoading(true);
        setActiveTab('identitas');
        setHargaExpanded(false);

        // Fetch full detail for edit
        const fetchDetail = async () => {
          try {
            const result = await PedagangService.show(editData.pid);
            if (result.success && result.data) {
              const d = result.data;
              setFormData({
                nama_identitas: d.nama_identitas || '',
                nama_alias: d.nama_alias || '',
                nik: d.nik != null ? String(d.nik) : '',
                tempat_lahir: d.tempat_lahir || '',
                tanggal_lahir: d.tanggal_lahir || '',
                jenis_kelamin: d.jenis_kelamin || '',
                agama: d.agama || '',
                pekerjaan: d.pekerjaan || '',
                status_kawin: d.status_kawin || '',
                id_provinsi: d.id_provinsi ? Number(d.id_provinsi) : '',
                id_kabupaten: d.id_kabupaten ? Number(d.id_kabupaten) : '',
                id_kecamatan: d.id_kecamatan ? Number(d.id_kecamatan) : '',
                id_kelurahan: d.id_kelurahan != null ? String(d.id_kelurahan) : '',
                status_rumah: d.status_rumah || '',
                no_hp: d.no_hp != null ? String(d.no_hp) : '',
                alamat: d.alamat || '',
                pasar: d.pasar || '',
                saldo_awal: d.saldo_awal || '',
                tabungan: d.tabungan || '',
                kulit: d.kulit || '',
                saldo_beku: d.saldo_beku || '',
                id_office: d.id_office || '',
              });
              if (d.harga) {
                const filledHarga = getEmptyHarga();
                CUT_PARTS.forEach(({ key }) => {
                  if (d.harga[key] != null && d.harga[key] !== '') {
                    filledHarga[key] = d.harga[key];
                  }
                });
                setHarga(filledHarga);
              }
            }
          } catch {
            // Use editData fields as fallback
            setFormData(prev => ({
              ...prev,
              nama_identitas: editData.nama_identitas || '',
              nama_alias: editData.nama_alias || '',
              nik: editData.nik != null ? String(editData.nik) : '',
              no_hp: editData.no_hp != null ? String(editData.no_hp) : '',
              alamat: editData.alamat || '',
              pasar: editData.pasar || '',
            }));
          } finally {
            setDetailLoading(false);
          }
        };
        fetchDetail();
      } else {
        setFormData({ ...initialFormData });
        setHarga(getEmptyHarga());
        setActiveTab('identitas');
        setHargaExpanded(false);
      }
      setErrors({});
    }
  }, [isOpen, editData]);


  const CURRENCY_FIELDS = ['saldo_awal', 'tabungan', 'kulit', 'saldo_beku'];

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
      // Store raw number for currency fields
      finalValue = parseRupiah(value);
    } else if (type === 'number') {
      finalValue = value === '' ? '' : Number(value);
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleHargaChange = useCallback((key, value) => {
    // Parse formatted Rupiah string back to number
    const numericValue = parseRupiah(value);
    setHarga(prev => ({ ...prev, [key]: numericValue }));
  }, []);

  const handleProvinsiChange = useCallback((value) => {
    setFormData(prev => ({
      ...prev,
      id_provinsi: value || '',
      id_kabupaten: '',
      id_kecamatan: '',
      id_kelurahan: '',
    }));
    if (value) {
      fetchKabupaten(value);
    }
  }, [fetchKabupaten]);

  const handleKabupatenChange = useCallback((value) => {
    setFormData(prev => ({
      ...prev,
      id_kabupaten: value || '',
      id_kecamatan: '',
      id_kelurahan: '',
    }));
    if (value) {
      fetchKecamatan(value);
    }
  }, [fetchKecamatan]);

  const handleKecamatanChange = useCallback((value) => {
    setFormData(prev => ({
      ...prev,
      id_kecamatan: value || '',
      id_kelurahan: '',
    }));
    if (value) {
      fetchKelurahan(value);
    }
  }, [fetchKelurahan]);

  const handleKelurahanChange = useCallback((value) => {
    setFormData(prev => ({
      ...prev,
      id_kelurahan: value || '',
    }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.nama_identitas.trim()) {
      newErrors.nama_identitas = 'Nama identitas wajib diisi';
    }
    if (!formData.nama_alias.trim()) {
      newErrors.nama_alias = 'Nama alias wajib diisi';
    }
    if (formData.nik && formData.nik.length !== 16) {
      newErrors.nik = 'NIK harus 16 digit';
    }
    if (formData.no_hp && formData.no_hp.length > 16) {
      newErrors.no_hp = 'No HP maksimal 16 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = { ...formData };

      // Convert numeric fields
      if (payload.saldo_awal !== '') {
        payload.saldo_awal = Number(payload.saldo_awal);
      }
      if (payload.tabungan !== '') {
        payload.tabungan = Number(payload.tabungan);
      }
      if (payload.kulit !== '') {
        payload.kulit = Number(payload.kulit);
      }
      if (payload.saldo_beku !== '') {
        payload.saldo_beku = Number(payload.saldo_beku);
      }
      if (payload.id_office !== '') {
        payload.id_office = Number(payload.id_office);
      }
      if (payload.jenis_kelamin !== '') {
        payload.jenis_kelamin = Number(payload.jenis_kelamin);
      }
      if (payload.agama !== '') {
        payload.agama = Number(payload.agama);
      }
      if (payload.pekerjaan !== '') {
        payload.pekerjaan = Number(payload.pekerjaan);
      }
      if (payload.status_kawin !== '') {
        payload.status_kawin = Number(payload.status_kawin);
      }
      if (payload.status_rumah !== '') {
        payload.status_rumah = Number(payload.status_rumah);
      }

      // Add pid for update
      if (editData?.pid) {
        payload.pid = editData.pid;
      }

      // Add nested harga object
      const hargaPayload = {};
      CUT_PARTS.forEach(({ key }) => {
        if (harga[key] !== '' && harga[key] != null) {
          hargaPayload[key] = Number(harga[key]);
        }
      });
      payload.harga = hargaPayload;

      await onSave(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  if (!isOpen) return null;

  const renderInput = (name, label, type = 'text', icon = null, required = false, placeholder = '', extraProps = {}) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={`pedagang-${name}`}>
        {icon && <span className="inline mr-2">{icon}</span>}
        {label} {required && '*'}
      </label>
      <input
        id={`pedagang-${name}`}
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
          errors[name] ? 'border-red-500' : 'border-gray-300'
        }`}
        placeholder={placeholder}
        disabled={isSubmitting || detailLoading}
        aria-required={required}
        {...extraProps}
      />
      {errors[name] && <p className="mt-1 text-sm text-red-600">{errors[name]}</p>}
    </div>
  );

  const renderCurrencyInput = (name, label, icon = null, required = false, placeholder = '0') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={`pedagang-${name}`}>
        {icon && <span className="inline mr-2">{icon}</span>}
        {label} {required && '*'}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">Rp</span>
        <input
          id={`pedagang-${name}`}
          type="text"
          name={name}
          value={formatRupiah(formData[name])}
          onChange={handleInputChange}
          inputMode="numeric"
          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
            errors[name] ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={placeholder}
          disabled={isSubmitting || detailLoading}
          aria-required={required}
        />
      </div>
      {errors[name] && <p className="mt-1 text-sm text-red-600">{errors[name]}</p>}
    </div>
  );

  const renderTextarea = (name, label, icon = null, rows = 3) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={`pedagang-${name}`}>
        {icon && <span className="inline mr-2">{icon}</span>}
        {label}
      </label>
      <textarea
        id={`pedagang-${name}`}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        rows={rows}
        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none ${
          errors[name] ? 'border-red-500' : 'border-gray-300'
        }`}
        disabled={isSubmitting || detailLoading}
      />
      {errors[name] && <p className="mt-1 text-sm text-red-600">{errors[name]}</p>}
    </div>
  );

  const renderSelect = (name, label, options, icon = null, placeholder = 'Pilih...') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={`pedagang-${name}`}>
        {icon && <span className="inline mr-2">{icon}</span>}
        {label}
      </label>
      <select
        id={`pedagang-${name}`}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
        disabled={isSubmitting || detailLoading}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center mr-4">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {editData ? 'Edit Data Pedagang' : 'Tambah Pedagang Baru'}
              </h3>
              <p className="text-gray-500 text-sm">
                {editData ? 'Perbarui informasi pedagang' : 'Tambahkan pedagang baru ke sistem'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-gray-100">
          <div className="flex gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === key
                    ? 'bg-red-50 text-red-600 border-b-2 border-red-500'
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
        <form onSubmit={handleSubmit} className="p-6">
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mr-3"></div>
              <span className="text-gray-500">Memuat data pedagang...</span>
            </div>
          ) : (
            <>
              {/* Tab: Identitas */}
              {activeTab === 'identitas' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderInput('nama_identitas', 'Nama Identitas', 'text', <User className="w-4 h-4 inline" />, true, 'Masukkan nama identitas')}
                  {renderInput('nama_alias', 'Nama Alias', 'text', <User className="w-4 h-4 inline" />, true, 'Otomatis huruf kapital')}
                  {renderInput('nik', 'NIK', 'text', <Hash className="w-4 h-4 inline" />, false, '16 digit NIK', { maxLength: 16, inputMode: 'numeric' })}
                  {renderInput('tempat_lahir', 'Tempat Lahir', 'text', <MapPin className="w-4 h-4 inline" />, false, 'Kota/Kabupaten')}
                  {renderInput('tanggal_lahir', 'Tanggal Lahir', 'date', <Calendar className="w-4 h-4 inline" />, false)}
                  {renderSelect('jenis_kelamin', 'Jenis Kelamin', [
                    { value: 1, label: 'Laki-laki' },
                    { value: 2, label: 'Perempuan' },
                  ], <User className="w-4 h-4 inline" />)}
                  {renderSelect('agama', 'Agama', [
                    { value: 1, label: 'Islam' },
                    { value: 2, label: 'Kristen' },
                    { value: 3, label: 'Katolik' },
                    { value: 4, label: 'Hindu' },
                    { value: 5, label: 'Buddha' },
                    { value: 6, label: 'Konghucu' },
                  ])}
                  {renderInput('pekerjaan', 'Pekerjaan', 'text', null, false, 'Pekerjaan')}
                  {renderSelect('status_kawin', 'Status Kawin', [
                    { value: 1, label: 'Belum Kawin' },
                    { value: 2, label: 'Kawin' },
                    { value: 3, label: 'Cerai Hidup' },
                    { value: 4, label: 'Cerai Mati' },
                  ])}
                </div>
              )}

              {/* Tab: Alamat */}
              {activeTab === 'alamat' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Provinsi
                    </label>
                    <SearchableSelect
                      options={provinsiOptions}
                      value={formData.id_provinsi}
                      onChange={handleProvinsiChange}
                      isLoading={loadingProvinsi}
                      placeholder="Pilih Provinsi..."
                      isDisabled={isSubmitting || detailLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Kabupaten/Kota
                    </label>
                    <SearchableSelect
                      options={kabupatenOptions}
                      value={formData.id_kabupaten}
                      onChange={handleKabupatenChange}
                      isLoading={loadingKabupaten}
                      placeholder="Pilih Kabupaten/Kota..."
                      isDisabled={isSubmitting || detailLoading || !formData.id_provinsi}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Kecamatan
                    </label>
                    <SearchableSelect
                      options={kecamatanOptions}
                      value={formData.id_kecamatan}
                      onChange={handleKecamatanChange}
                      isLoading={loadingKecamatan}
                      placeholder="Pilih Kecamatan..."
                      isDisabled={isSubmitting || detailLoading || !formData.id_kabupaten}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Kelurahan/Desa
                    </label>
                    <SearchableSelect
                      options={kelurahanOptions}
                      value={formData.id_kelurahan}
                      onChange={handleKelurahanChange}
                      isLoading={loadingKelurahan}
                      placeholder="Pilih Kelurahan/Desa..."
                      isDisabled={isSubmitting || detailLoading || !formData.id_kecamatan}
                    />
                  </div>
                  {renderSelect('status_rumah', 'Status Rumah', [
                    { value: 1, label: 'Milik Sendiri' },
                    { value: 2, label: 'Kontrak' },
                    { value: 3, label: 'Sewa' },
                    { value: 4, label: 'Lainnya' },
                  ])}
                  {renderInput('no_hp', 'No HP', 'tel', <Phone className="w-4 h-4 inline" />, false, '08xxxxxxxxxx', { maxLength: 16 })}
                  <div className="md:col-span-2">
                    {renderTextarea('alamat', 'Alamat', <MapPin className="w-4 h-4 inline" />, 3)}
                  </div>
                </div>
              )}

              {/* Tab: Pasar & Saldo */}
              {activeTab === 'pasar' && (
                <div className="space-y-6">
                  {/* Pasar & Office */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderInput('pasar', 'Pasar', 'text', <Store className="w-4 h-4 inline" />, false, 'Nama pasar')}
                    {renderSelect('id_office', 'Office', officeOptions, <Building2 className="w-4 h-4 inline" />, 'Pilih Office')}
                  </div>

                  {/* Saldo Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-red-500" />
                      Informasi Saldo
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderCurrencyInput('saldo_awal', 'Saldo Awal', <DollarSign className="w-4 h-4 inline" />)}
                      {renderCurrencyInput('tabungan', 'Tabungan', <DollarSign className="w-4 h-4 inline" />)}
                      {renderCurrencyInput('kulit', 'Kulit', <DollarSign className="w-4 h-4 inline" />)}
                      {renderCurrencyInput('saldo_beku', 'Saldo Beku', <DollarSign className="w-4 h-4 inline" />)}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Harga Karkas */}
              {activeTab === 'harga' && (
                <div>
                  {/* Collapsible toggle */}
                  <button
                    type="button"
                    onClick={() => setHargaExpanded(!hargaExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors mb-4"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      Daftar Harga Karkas (27 bagian)
                    </span>
                    {hargaExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {hargaExpanded && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {CUT_PARTS.map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor={`harga-${key}`}>
                            {label}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                            <input
                              id={`harga-${key}`}
                              type="text"
                              value={formatRupiah(harga[key])}
                              onChange={(e) => handleHargaChange(key, e.target.value)}
                              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                              placeholder="0"
                              disabled={isSubmitting}
                              inputMode="numeric"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || detailLoading}
              className="px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
