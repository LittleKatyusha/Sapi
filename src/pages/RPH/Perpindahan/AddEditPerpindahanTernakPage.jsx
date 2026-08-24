import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader, Truck, Trash2, Search, ChevronLeft, ChevronRight,
  CheckCircle, Plus, Beef, Scale, Tag, MapPin, Calendar, Wallet, FileText,
  AlertCircle, Package, Filter, X, RotateCcw,
} from 'lucide-react';
import perpindahanTernakService from '../../../services/perpindahanTernakService';
import systemService from '../../../services/systemService';
import SearchableSelect from '../../../components/shared/SearchableSelect';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { useNotification } from '../../../components/shared/Notification';

const GOLONGAN_SAPI_OPTIONS = [
  { value: '1,2', label: 'Boning / Karkas' },
  { value: '3', label: 'Qurban' },
];

const GOLONGAN_TUJUAN_OPTIONS = [
  { value: '1', label: 'Boning' },
  { value: '2', label: 'Karkas' },
  { value: '3', label: 'Qurban' },
];

const blueStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '42px',
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none',
    borderRadius: '0.75rem',
    backgroundColor: '#ffffff',
    '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#d1d5db' },
    fontSize: '14px',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#dbeafe' : 'white',
    color: state.isSelected ? 'white' : '#374151',
    fontSize: '14px',
  }),
  placeholder: (provided) => ({ ...provided, color: '#9ca3af', fontSize: '14px' }),
  singleValue: (provided) => ({ ...provided, color: '#374151', fontSize: '14px' }),
  indicatorSeparator: (provided) => ({ ...provided, backgroundColor: '#e5e7eb' }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? '#3b82f6' : '#9ca3af',
    '&:hover': { color: '#3b82f6' },
  }),
  clearIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? '#3b82f6' : '#9ca3af',
    '&:hover': { color: '#3b82f6' },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    borderRadius: '0.75rem',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  }),
};

const Field = ({ label, required, icon: Icon, children, hint }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-[11px] text-gray-400 leading-relaxed">{hint}</p>}
  </div>
);

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition';

// Sapi Picker Popup
const SapiPickerModal = ({ isOpen, onClose, onConfirm, fetchSapiByGolongan, selectedTernak }) => {
  const [step, setStep] = useState(1);
  const [golongan, setGolongan] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [picked, setPicked] = useState([]);
  const [sapiOptions, setSapiOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setGolongan('');
      setSearchInput('');
      setAppliedSearch('');
      setPicked([]);
      setSapiOptions([]);
      setMeta(null);
      setPage(1);
    }
  }, [isOpen]);

  const handleSelectGolongan = (val) => {
    setGolongan(val);
  };

  const loadSapi = async (opts = {}) => {
    const targetPage = opts.page ?? page;
    const targetSearch = opts.search ?? appliedSearch;
    const targetPerPage = opts.per_page ?? perPage;
    setLoading(true);
    try {
      const res = await fetchSapiByGolongan({
        golongan,
        search: targetSearch,
        page: targetPage,
        per_page: targetPerPage,
      });
      setSapiOptions(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setSapiOptions([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!golongan) return;
    setPage(1);
    setAppliedSearch('');
    setSearchInput('');
    setLoading(true);
    try {
      const res = await fetchSapiByGolongan({ golongan, search: '', page: 1, per_page: perPage });
      setSapiOptions(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setSapiOptions([]);
      setMeta(null);
    } finally {
      setLoading(false);
      setStep(2);
    }
  };

  const handleSearch = () => {
    const trimmed = searchInput.trim();
    setAppliedSearch(trimmed);
    setPage(1);
    loadSapi({ search: trimmed, page: 1 });
  };

  const handleReset = () => {
    setSearchInput('');
    setAppliedSearch('');
    setPage(1);
    loadSapi({ search: '', page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || (meta && newPage > meta.last_page)) return;
    setPage(newPage);
    loadSapi({ page: newPage });
  };

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
    setPage(1);
    loadSapi({ per_page: newPerPage, page: 1 });
  };

  const filteredSapi = useMemo(() => {
    if (!sapiOptions) return [];
    return sapiOptions.filter((s) => {
      const alreadySelected = selectedTernak.some((t) => (t.pubid || t.pid) === (s.pubid || s.pid));
      return !alreadySelected;
    });
  }, [sapiOptions, selectedTernak]);

  const handleTogglePick = (sapi) => {
    setPicked((prev) =>
      prev.find((p) => (p.pubid || p.pid) === (sapi.pubid || sapi.pid))
        ? prev.filter((p) => (p.pubid || p.pid) !== (sapi.pubid || sapi.pid))
        : [
            ...prev,
            {
              pid: sapi.pid,
              pubid: sapi.pubid,
              eartag: sapi.eartag,
              jenis_ternak: sapi.jenis_ternak,
              klasifikasi: sapi.klasifikasi,
              nama_rph: sapi.nama_rph,
              bobot: sapi.bobot || 0,
              keterangan: '',
            },
          ]
    );
  };

  const handleConfirm = () => {
    onConfirm(picked);
    onClose();
  };

  if (!isOpen) return null;

  const golonganLabel = (g) => ({ 1: 'Boning', 2: 'Karkas', 3: 'Qurban' }[g] || '-');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-cyan-600 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Beef className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Pilih Ternak</h3>
              <p className="text-blue-50 text-xs">
                {step === 1 ? 'Langkah 1: Pilih golongan sapi' : `Langkah 2: Pilih sapi ${golonganLabel(golongan)}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-0.5">Pilih golongan terlebih dahulu</p>
                  <p className="text-blue-700 text-xs leading-relaxed">
                    Pilih jenis sapi yang akan dipindahkan untuk menampilkan daftar ternak tersedia.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {GOLONGAN_SAPI_OPTIONS.map((opt) => {
                  const active = golongan === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelectGolongan(opt.value)}
                      className={`relative p-5 rounded-xl border-2 text-left transition ${
                        active
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          <Beef className="w-5 h-5" />
                        </div>
                        {active && <CheckCircle className="w-5 h-5 text-blue-600" />}
                      </div>
                      <p className="text-base font-bold text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Klik untuk pilih</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari eartag, jenis, klasifikasi..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
                <div className="inline-flex items-center gap-2">
                  <button
                    onClick={handleSearch}
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition shadow-sm"
                  >
                    <Search className="w-4 h-4" /> Cari
                  </button>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-medium text-sm transition"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                </div>
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-xl text-xs font-semibold border border-blue-100">
                  <Filter className="w-3.5 h-3.5" />
                  Golongan: {golonganLabel(golongan)}
                  <button
                    onClick={() => { setStep(1); setGolongan(''); }}
                    className="ml-1 text-blue-500 hover:text-blue-700 underline"
                  >
                    ubah
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-gray-500">
                  <Loader className="inline h-6 w-6 animate-spin" />
                  <p className="mt-2 text-sm">Memuat daftar sapi...</p>
                </div>
              ) : filteredSapi.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Beef className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-medium">Tidak ada sapi tersedia</p>
                  <p className="text-gray-300 text-sm mt-1">Coba kata kunci lain atau reset pencarian</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[40vh] overflow-y-auto pr-1">
                    {filteredSapi.map((sapi) => {
                      const isPicked = picked.find((p) => (p.pubid || p.pid) === (sapi.pubid || sapi.pid));
                      return (
                        <button
                          key={sapi.pid}
                          onClick={() => handleTogglePick(sapi)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                            isPicked
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isPicked ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                            <Beef className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-gray-800 truncate">{sapi.eartag}</span>
                              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {sapi.klasifikasi}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                              <span className="font-medium text-blue-600">RPH: {sapi.nama_rph || '-'}</span>
                              <span className="text-gray-300">·</span>
                              <span>{sapi.jenis_ternak}</span>
                              <span className="text-gray-300">·</span>
                              <span className="flex items-center gap-0.5">
                                <Scale className="w-3 h-3" /> {sapi.bobot} kg
                              </span>
                            </div>
                          </div>
                          {isPicked && <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {meta && meta.total > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        Menampilkan {meta.from}-{meta.to} dari {meta.total} sapi
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={perPage}
                          onChange={(e) => handlePerPageChange(Number(e.target.value))}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={10}>10 / hal</option>
                          <option value={25}>25 / hal</option>
                          <option value={50}>50 / hal</option>
                          <option value={100}>100 / hal</option>
                        </select>
                        <button
                          onClick={() => handlePageChange(meta.current_page - 1)}
                          disabled={meta.current_page <= 1}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-gray-600 font-medium">
                          Hal {meta.current_page} / {meta.last_page}
                        </span>
                        <button
                          onClick={() => handlePageChange(meta.current_page + 1)}
                          disabled={meta.current_page >= meta.last_page}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 p-4 flex items-center justify-between bg-slate-50">
          <div className="text-sm text-gray-600">
            {step === 2 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                  {picked.length}
                </span>
                ternak dipilih
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-medium text-sm transition"
              >
                <ChevronLeft className="w-4 h-4" /> Kembali
              </button>
            )}
            {step === 1 ? (
              <button
                onClick={handleNext}
                disabled={!golongan}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl font-medium text-sm transition shadow-sm"
              >
                Lanjut <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={picked.length === 0}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl font-medium text-sm transition shadow-sm"
              >
                <Plus className="w-4 h-4" /> Tambah {picked.length > 0 && `(${picked.length})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AddEditPerpindahanTernakPage = () => {
  const { pid } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(pid);
  useDocumentTitle(isEdit ? 'Edit Perpindahan Ternak' : 'Tambah Perpindahan Ternak');
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lokasiAsalId, setLokasiAsalId] = useState(null);

  const [formData, setFormData] = useState({
    tanggal_perpindahan: new Date().toISOString().split('T')[0],
    id_lokasi_tujuan: '',
    id_alasan: '',
    is_pindah_golongan: false,
    golongan_tujuan: '',
    armada_pengiriman: '',
    plat_nomor: '',
    sopir: '',
    biaya_kirim: '',
    keterangan: '',
  });

  const [selectedTernak, setSelectedTernak] = useState([]);
  const [lokasiOptions, setLokasiOptions] = useState([]);
  const [alasanOptions, setAlasanOptions] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    loadMasterData();
    if (isEdit && pid) {
      loadDetailData(pid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, isEdit]);

  const loadMasterData = async () => {
    try {
      const [lokasiRes, alasanRes] = await Promise.all([
        systemService.getOffice(),
        systemService.getParameterByGroup('ALASAN_PERPINDAHAN'),
      ]);
      if (lokasiRes.success) {
        setLokasiOptions((lokasiRes.data || []).map((l) => ({ value: String(l.id), label: l.name })));
      }
      if (alasanRes.success) {
        setAlasanOptions((alasanRes.data || []).map((a) => ({ value: String(a.id), label: a.name })));
      }
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  };

  const fetchSapiByGolongan = async (params) => {
    return perpindahanTernakService.getSapiList(params);
  };

  const loadDetailData = async (selectedPid) => {
    setLoading(true);
    try {
      const response = await perpindahanTernakService.show(selectedPid);
      if (response.success) {
        const { header, details } = response.data;
        setLokasiAsalId(header.id_lokasi_asal);
        setFormData({
          tanggal_perpindahan: header.tanggal_perpindahan,
          id_lokasi_tujuan: String(header.id_lokasi_tujuan),
          id_alasan: String(header.id_alasan),
          is_pindah_golongan: !!Number(header.is_pindah_golongan),
          golongan_tujuan: header.golongan_tujuan ? String(header.golongan_tujuan) : '',
          armada_pengiriman: header.armada_pengiriman || '',
          plat_nomor: header.plat_nomor || '',
          sopir: header.sopir || '',
          biaya_kirim: header.biaya_kirim || '',
          keterangan: header.keterangan || '',
        });
        setSelectedTernak(
          details.map((d) => ({
            pid: d.pid_sapi,
            pubid: d.pid_sapi_plain,
            eartag: d.eartag,
            jenis_ternak: d.jenis_ternak,
            klasifikasi: d.klasifikasi,
            bobot: d.bobot,
            keterangan: d.keterangan || '',
          }))
        );
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value ?? '' }));
  };

  const formatRupiah = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = String(value).replace(/[^0-9]/g, '');
    if (num === '') return '';
    return new Intl.NumberFormat('id-ID').format(Number(num));
  };

  const parseRupiah = (value) => {
    const num = String(value).replace(/[^0-9]/g, '');
    return num;
  };

  const handleBiayaKirimChange = (e) => {
    const raw = parseRupiah(e.target.value);
    setFormData((prev) => ({ ...prev, biaya_kirim: raw }));
  };

  const handleRemoveTernak = (ternakKey) => {
    setSelectedTernak((prev) => prev.filter((t) => (t.pubid || t.pid) !== ternakKey));
  };

  const handleTernakBobotChange = (ternakKey, bobot) => {
    setSelectedTernak((prev) =>
      prev.map((t) => ((t.pubid || t.pid) === ternakKey ? { ...t, bobot: parseFloat(bobot) || 0 } : t))
    );
  };

  const handleTernakKeteranganChange = (ternakKey, keterangan) => {
    setSelectedTernak((prev) =>
      prev.map((t) => ((t.pubid || t.pid) === ternakKey ? { ...t, keterangan } : t))
    );
  };

  const handlePickerConfirm = (picked) => {
    setSelectedTernak((prev) => [...prev, ...picked]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.id_alasan) {
      setError('Pilih alasan perpindahan');
      return;
    }
    if (!formData.id_lokasi_tujuan) {
      setError('Pilih lokasi tujuan');
      return;
    }
    if (isEdit && lokasiAsalId && Number(formData.id_lokasi_tujuan) === Number(lokasiAsalId)) {
      setError('Lokasi tujuan tidak boleh sama dengan lokasi asal');
      return;
    }
    if (selectedTernak.length === 0) {
      setError('Pilih minimal 1 ternak untuk dipindahkan');
      return;
    }
    if (formData.is_pindah_golongan && !formData.golongan_tujuan) {
      setError('Golongan tujuan wajib dipilih jika pindah golongan');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        tanggal_perpindahan: formData.tanggal_perpindahan,
        id_lokasi_tujuan: Number(formData.id_lokasi_tujuan),
        id_alasan: Number(formData.id_alasan),
        is_pindah_golongan: formData.is_pindah_golongan ? 1 : 0,
        golongan_tujuan: formData.is_pindah_golongan ? Number(formData.golongan_tujuan) : null,
        armada_pengiriman: formData.armada_pengiriman || null,
        plat_nomor: formData.plat_nomor || null,
        sopir: formData.sopir || null,
        biaya_kirim: formData.biaya_kirim ? Number(formData.biaya_kirim) : null,
        keterangan: formData.keterangan || null,
        ternak: selectedTernak.map((t) => ({
          pid: t.pid,
          bobot: t.bobot,
          keterangan: t.keterangan,
        })),
      };

      const response = isEdit
        ? await perpindahanTernakService.update(pid, payload)
        : await perpindahanTernakService.store(payload);

      if (response.success) {
        showSuccess(response.message || (isEdit ? 'Perpindahan ternak berhasil diupdate' : 'Perpindahan ternak berhasil disimpan'));
        navigate('/rph/perpindahan-ternak');
      } else {
        showError(response.message || 'Gagal menyimpan data');
      }
    } catch (err) {
      showError(err?.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const totalBobot = selectedTernak.reduce((s, t) => s + parseFloat(t.bobot || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/rph/perpindahan-ternak')}
            className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-800 transition border border-gray-200 bg-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-6 h-6 text-blue-600" />
              {isEdit ? 'Edit Perpindahan Ternak' : 'Tambah Perpindahan Ternak'}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Lengkapi data perpindahan dan pilih ternak yang akan dipindah</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Section: Data Perpindahan */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              Data Perpindahan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Tanggal Perpindahan" required icon={Calendar}>
                <input
                  type="date"
                  name="tanggal_perpindahan"
                  value={formData.tanggal_perpindahan}
                  onChange={handleInputChange}
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="Lokasi Tujuan" required icon={MapPin}>
                <SearchableSelect
                  options={lokasiOptions}
                  value={formData.id_lokasi_tujuan}
                  onChange={(val) => handleSelectChange('id_lokasi_tujuan', val)}
                  placeholder="Pilih lokasi tujuan"
                  isClearable
                  isSearchable
                  styles={blueStyles}
                />
              </Field>

              <Field label="Alasan Perpindahan" required icon={Tag}>
                <SearchableSelect
                  options={alasanOptions}
                  value={formData.id_alasan}
                  onChange={(val) => handleSelectChange('id_alasan', val)}
                  placeholder="Pilih alasan"
                  isClearable
                  isSearchable
                  styles={blueStyles}
                />
              </Field>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-blue-50/30 transition">
                  <input
                    type="checkbox"
                    name="is_pindah_golongan"
                    checked={formData.is_pindah_golongan}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>
                    <span className="font-semibold">Pindah Golongan</span>
                    <span className="block text-xs text-gray-500 font-normal">Centang jika perpindahan mengubah golongan ternak (mis. ke Qurban)</span>
                  </span>
                </label>
                {formData.is_pindah_golongan && (
                  <div className="mt-3 ml-1">
                    <Field label="Golongan Tujuan" required icon={Package}
                      hint="Field golongan di tr_pembelian_ho_detail akan diupdate ke golongan tujuan.">
                      <div className="sm:w-1/2">
                        <SearchableSelect
                          options={GOLONGAN_TUJUAN_OPTIONS}
                          value={formData.golongan_tujuan}
                          onChange={(val) => handleSelectChange('golongan_tujuan', val)}
                          placeholder="Pilih golongan tujuan"
                          isClearable
                          isSearchable={false}
                          styles={blueStyles}
                        />
                      </div>
                    </Field>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Pengiriman */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center">
                <Truck className="w-4 h-4 text-cyan-600" />
              </div>
              Info Pengiriman
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Armada Pengiriman" icon={Truck}>
                <input
                  type="text"
                  name="armada_pengiriman"
                  value={formData.armada_pengiriman}
                  onChange={handleInputChange}
                  placeholder="Colt Diesel, Engkel..."
                  className={inputClass}
                />
              </Field>
              <Field label="Plat Nomor">
                <input
                  type="text"
                  name="plat_nomor"
                  value={formData.plat_nomor}
                  onChange={handleInputChange}
                  placeholder="B 1234 XYZ"
                  className={`${inputClass} font-mono`}
                />
              </Field>
              <Field label="Nama Sopir">
                <input
                  type="text"
                  name="sopir"
                  value={formData.sopir}
                  onChange={handleInputChange}
                  placeholder="Bapak Rahman"
                  className={inputClass}
                />
              </Field>
              <Field label="Biaya Kirim (Rp)" icon={Wallet}>
                <input
                  type="text"
                  name="biaya_kirim"
                  value={formatRupiah(formData.biaya_kirim)}
                  onChange={handleBiayaKirimChange}
                  placeholder="150.000"
                  inputMode="numeric"
                  className={inputClass}
                />
              </Field>
              <div className="sm:col-span-2 lg:col-span-4">
                <Field label="Keterangan">
                  <textarea
                    name="keterangan"
                    value={formData.keterangan}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Catatan tambahan..."
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Section: Pilih Ternak */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Beef className="w-4 h-4 text-emerald-600" />
                </div>
                Pilih Ternak <span className="text-red-500">*</span>
              </h3>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition shadow-sm"
              >
                <Plus className="w-4 h-4" /> Pilih Sapi
              </button>
            </div>

            {selectedTernak.length > 0 ? (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Eartag</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">RPH</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Jenis</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Klasifikasi</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Bobot (kg)</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Keterangan</th>
                        <th className="px-3 py-2.5 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedTernak.map((ternak) => {
                        const ternakKey = ternak.pubid || ternak.pid;
                        return (
                        <tr key={ternakKey} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2.5 font-semibold text-gray-800 font-mono text-xs">{ternak.eartag}</td>
                          <td className="px-3 py-2.5 text-gray-600">{ternak.nama_rph || '-'}</td>
                          <td className="px-3 py-2.5 text-gray-600">{ternak.jenis_ternak}</td>
                          <td className="px-3 py-2.5">
                            <span className="inline-block text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {ternak.klasifikasi}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="number"
                              value={ternak.bobot}
                              onChange={(e) => handleTernakBobotChange(ternakKey, e.target.value)}
                              className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="text"
                              value={ternak.keterangan}
                              onChange={(e) => handleTernakKeteranganChange(ternakKey, e.target.value)}
                              placeholder="Catatan"
                              className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveTernak(ternakKey)}
                              className="rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-gray-200">
                      <tr>
                        <td colSpan="3" className="px-3 py-2.5 text-sm font-semibold text-gray-700">
                          Total: {selectedTernak.length} ekor
                        </td>
                        <td className="px-3 py-2.5 text-sm font-bold text-gray-800">
                          {totalBobot.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Beef className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium text-sm">Belum ada ternak dipilih</p>
                <p className="text-gray-400 text-xs mt-1">Klik tombol "Pilih Sapi" untuk menambah ternak</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/rph/perpindahan-ternak')}
              disabled={loading}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 h-4" /> Simpan
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <SapiPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handlePickerConfirm}
        fetchSapiByGolongan={fetchSapiByGolongan}
        selectedTernak={selectedTernak}
      />
    </div>
  );
};

export default AddEditPerpindahanTernakPage;
