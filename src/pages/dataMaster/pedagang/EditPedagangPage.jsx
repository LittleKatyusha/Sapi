import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save, User, MapPin, Phone, Store, Hash, Calendar,
  ChevronDown, ChevronUp, DollarSign, Building2, ArrowLeft,
  CheckCircle, XCircle,
} from 'lucide-react';
import { CUT_PARTS, getEmptyHarga } from './constants/cutParts';
import usePedagang from './hooks/usePedagang';
import useOfficeData from '../../ho/tandaTerima/hooks/useOfficeData';
import PedagangService from '../../../services/pedagangService';

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
  id_office: '',
};

const EditPedagangPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { updatePedagang } = usePedagang();
  const { officeOptions } = useOfficeData();

  const [activeTab, setActiveTab] = useState('identitas');
  const [formData, setFormData] = useState({ ...initialFormData });
  const [harga, setHarga] = useState(getEmptyHarga());
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hargaExpanded, setHargaExpanded] = useState(false);
  const [detailLoading, setDetailLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Fetch pedagang detail on mount
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setDetailLoading(true);
        const result = await PedagangService.show(id);
        if (result.success && result.data) {
          const d = result.data;
          setFormData({
            nama_identitas: d.nama_identitas || '',
            nama_alias: d.nama_alias || '',
            nik: d.nik || '',
            tempat_lahir: d.tempat_lahir || '',
            tanggal_lahir: d.tanggal_lahir || '',
            jenis_kelamin: d.jenis_kelamin || '',
            agama: d.agama || '',
            pekerjaan: d.pekerjaan || '',
            status_kawin: d.status_kawin || '',
            id_provinsi: d.id_provinsi || '',
            id_kabupaten: d.id_kabupaten || '',
            id_kecamatan: d.id_kecamatan || '',
            id_kelurahan: d.id_kelurahan || '',
            status_rumah: d.status_rumah || '',
            no_hp: d.no_hp || '',
            alamat: d.alamat || '',
            pasar: d.pasar || '',
            saldo_awal: d.saldo_awal || '',
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
        } else {
          showNotification('Data pedagang tidak ditemukan', 'error');
          setTimeout(() => {
            navigate('/data-master/pedagang');
          }, 1500);
        }
      } catch {
        showNotification('Gagal memuat data pedagang', 'error');
        setTimeout(() => {
          navigate('/data-master/pedagang');
        }, 1500);
      } finally {
        setDetailLoading(false);
      }
    };

    if (id) {
      fetchDetail();
    }
  }, [id, navigate]);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value, type } = e.target;
    let finalValue = value;

    if (name === 'nama_alias') {
      finalValue = value.toUpperCase();
    } else if (name === 'nik') {
      finalValue = value.replace(/[^0-9]/g, '').slice(0, 16);
    } else if (name === 'no_hp') {
      finalValue = value.replace(/[^0-9+\-\s()]/g, '').slice(0, 16);
    } else if (type === 'number') {
      finalValue = value === '' ? '' : Number(value);
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleHargaChange = useCallback((key, value) => {
    const numericValue = value === '' ? '' : Number(value);
    setHarga(prev => ({ ...prev, [key]: numericValue }));
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
      payload.pid = id;

      // Add nested harga object
      const hargaPayload = {};
      CUT_PARTS.forEach(({ key }) => {
        if (harga[key] !== '' && harga[key] != null) {
          hargaPayload[key] = Number(harga[key]);
        }
      });
      payload.harga = hargaPayload;

      const result = await updatePedagang(payload);
      if (result.success) {
        showNotification(result.message || 'Pedagang berhasil diperbarui');
        setTimeout(() => {
          navigate('/data-master/pedagang');
        }, 1500);
      } else {
        showNotification(result.message || 'Gagal menyimpan data', 'error');
      }
    } catch {
      showNotification('Terjadi kesalahan saat menyimpan data', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/data-master/pedagang');
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white flex items-center gap-2`}>
          {notification.type === 'error' ? (
            <XCircle className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          {notification.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 mr-4"
                title="Kembali"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mr-4">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Edit Data Pedagang
                </h3>
                <p className="text-gray-500 text-sm">
                  Perbarui informasi pedagang
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 pt-4 border-b border-gray-100 bg-white">
            <div className="flex gap-1 overflow-x-auto">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    activeTab === key
                      ? 'bg-amber-50 text-amber-600 border-b-2 border-amber-500'
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
          <form onSubmit={handleSubmit} className="p-6 bg-white">
            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mr-3"></div>
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
                    {renderInput('id_provinsi', 'Provinsi', 'text', <MapPin className="w-4 h-4 inline" />, false, 'Kode provinsi')}
                    {renderInput('id_kabupaten', 'Kabupaten/Kota', 'text', <MapPin className="w-4 h-4 inline" />, false, 'Kode kabupaten')}
                    {renderInput('id_kecamatan', 'Kecamatan', 'text', <MapPin className="w-4 h-4 inline" />, false, 'Kode kecamatan')}
                    {renderInput('id_kelurahan', 'Kelurahan/Desa', 'text', <MapPin className="w-4 h-4 inline" />, false, 'Kode kelurahan')}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderInput('pasar', 'Pasar', 'text', <Store className="w-4 h-4 inline" />, false, 'Nama pasar')}
                    {renderInput('saldo_awal', 'Saldo Awal', 'number', <DollarSign className="w-4 h-4 inline" />, false, '0', { min: 0 })}
                    {renderSelect('id_office', 'Office', officeOptions, <Building2 className="w-4 h-4 inline" />, 'Pilih Office')}
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
                                type="number"
                                value={harga[key]}
                                onChange={(e) => handleHargaChange(key, e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                                placeholder="0"
                                min="0"
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

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || detailLoading}
                    className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPedagangPage;
