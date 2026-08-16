import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Wallet, Loader2, AlertCircle, Banknote, CheckCircle, Clock, Upload, FileText, X, Eye
} from 'lucide-react';
import usePengeluaranRph from '../../../../../hooks/usePengeluaranRph';
import { useNotification } from '../../../../../components/shared/Notification';
import SearchableSelect from '../../../../../components/shared/SearchableSelect';
import DataTable from 'react-data-table-component';

const METODE_OPTIONS = [
  { value: 'tunai', label: 'Tunai' },
  { value: 'transfer_bca', label: 'Transfer BCA' },
  { value: 'transfer_bni', label: 'Transfer BNI' },
  { value: 'transfer_bri', label: 'Transfer BRI' },
];

const formatRupiah = (val) => 'Rp ' + (val || 0).toLocaleString('id-ID');
const parseNumber = (str) => parseFloat((str || '').replace(/[^0-9]/g, '')) || 0;

const BayarPengeluaranPage = () => {
  const { pid } = useParams();
  const navigate = useNavigate();
  const { loading, error, bayar, fetchDetail } = usePengeluaranRph();
  const { showSuccess, showError } = useNotification();

  const [pembayaran, setPembayaran] = useState(null);
  const [history, setHistory] = useState([]);
  const [nominal, setNominal] = useState('');
  const [metode, setMetode] = useState('');
  const [namaPembayar, setNamaPembayar] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const loadDetail = async () => {
    const result = await fetchDetail(pid);
    if (result.success && result.data) {
      setPembayaran(result.data.pembayaran);
      setHistory(result.data.history || []);
    }
  };

  useEffect(() => {
    if (pid) loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  const sisa = pembayaran?.sisa_pembayaran || 0;
  const nomorTransaksi = pembayaran?.no_po || pembayaran?.nota_sistem || pembayaran?.nota || '-';

  const handleNominalChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setNominal(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
    if (formErrors.nominal) setFormErrors((p) => ({ ...p, nominal: '' }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      setFormErrors((p) => ({ ...p, file: 'Ukuran file maksimal 2MB' }));
      e.target.value = '';
      return;
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowed.includes(f.type)) {
      setFormErrors((p) => ({ ...p, file: 'Format file harus JPG, JPEG, PNG, atau PDF' }));
      e.target.value = '';
      return;
    }
    setSelectedFile(f);
    setFormErrors((p) => ({ ...p, file: '' }));
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    const input = document.getElementById('file-pengeluaran');
    if (input) input.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const nominalValue = parseNumber(nominal);

    if (!nominalValue || nominalValue <= 0) newErrors.nominal = 'Nominal wajib diisi';
    else if (nominalValue > sisa) newErrors.nominal = `Maksimal ${formatRupiah(sisa)}`;
    if (!metode) newErrors.metode = 'Pilih metode pembayaran';

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setSubmitLoading(true);
    const result = await bayar({
      pid,
      nominal_pembayaran: nominalValue,
      metode_pembayaran: metode,
      nama_pembayar: namaPembayar || undefined,
      file: selectedFile || undefined,
    });
    setSubmitLoading(false);

    if (result.success) {
      showSuccess('Pembayaran berhasil dicatat');
      setNominal('');
      setMetode('');
      setSelectedFile(null);
      const input = document.getElementById('file-pengeluaran');
      if (input) input.value = '';
      loadDetail();
    } else {
      showError(result.message || 'Gagal mencatat pembayaran');
    }
  };

  const historyColumns = [
    { name: 'No.', width: '50px', center: true, cell: (_, idx) => <span className="text-xs text-gray-400">{idx + 1}</span> },
    {
      name: 'Tanggal',
      selector: (r) => r.payment_date || r.created_at,
      sortable: true,
      cell: (r) => <span className="text-sm text-gray-700">{r.payment_date || r.created_at}</span>,
    },
    {
      name: 'Nominal',
      selector: (r) => r.nominal_pembayaran,
      sortable: true,
      right: true,
      cell: (r) => <span className="text-sm font-bold text-emerald-600">{formatRupiah(r.nominal_pembayaran)}</span>,
    },
    {
      name: 'Metode',
      selector: (r) => r.metode_pembayaran,
      sortable: true,
      center: true,
      cell: (r) => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold">
          {r.metode_pembayaran?.replace('_', ' ')?.toUpperCase()}
        </span>
      ),
    },
    {
      name: 'Pembayar',
      selector: (r) => r.nama_pembayar,
      cell: (r) => <span className="text-sm text-gray-600">{r.nama_pembayar || '-'}</span>,
    },
    {
      name: 'Bukti',
      selector: (r) => r.bukti_pembayaran,
      center: true,
      cell: (r) => r.bukti_pembayaran_url ? (
        <a href={r.bukti_pembayaran_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="Lihat bukti pembayaran">
          <Eye className="w-4 h-4" />
        </a>
      ) : <span className="text-xs text-gray-300">-</span>,
    },
  ];

  const customStyles = {
    headRow: { style: { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', minHeight: '40px' } },
    headCells: { style: { fontSize: '11px', fontWeight: '700', color: '#64748b', padding: '8px 12px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.03em' } },
    rows: { style: { minHeight: '44px', borderBottom: '1px solid #f1f5f9' } },
    cells: { style: { padding: '8px 12px', fontSize: '13px', color: '#334155' } },
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-[1400px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Banknote className="w-6 h-6 text-emerald-600" />
              Pembayaran Pengeluaran
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">{pembayaran ? nomorTransaksi : '...'}</p>
          </div>
        </div>

        {/* Info Cards */}
        {pembayaran && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase">No PO / Nota</p>
              <p className="text-sm font-bold text-gray-800 truncate">{nomorTransaksi}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase">Total Tagihan</p>
              <p className="text-sm font-bold text-gray-800">{formatRupiah(pembayaran.total_tagihan)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase">Sudah Dibayar</p>
              <p className="text-sm font-bold text-emerald-600">{formatRupiah(pembayaran.total_terbayar)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase">Sisa</p>
              <p className={`text-sm font-bold ${sisa > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {formatRupiah(sisa)}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Form Bayar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                Input Pembayaran
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nominal</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                      <input
                        type="text"
                        value={nominal}
                        onChange={handleNominalChange}
                        placeholder="0"
                        disabled={submitLoading || sisa <= 0}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (sisa > 0) {
                          setNominal(sisa.toLocaleString('id-ID'));
                          if (formErrors.nominal) setFormErrors((p) => ({ ...p, nominal: '' }));
                        }
                      }}
                      disabled={submitLoading || sisa <= 0}
                      className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition disabled:opacity-50"
                    >
                      Maks
                    </button>
                  </div>
                  {formErrors.nominal && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formErrors.nominal}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Metode</label>
                  <SearchableSelect
                    options={METODE_OPTIONS}
                    value={metode}
                    onChange={(val) => { setMetode(val || ''); if (formErrors.metode) setFormErrors((p) => ({ ...p, metode: '' })); }}
                    placeholder="Pilih metode"
                    isClearable={false}
                    isDisabled={submitLoading || sisa <= 0}
                  />
                  {formErrors.metode && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formErrors.metode}</p>}
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nama Pembayar <span className="text-gray-400 font-normal">(opsional)</span></label>
                  <input
                    type="text"
                    value={namaPembayar}
                    onChange={(e) => setNamaPembayar(e.target.value)}
                    placeholder="Nama orang yang membayar"
                    disabled={submitLoading || sisa <= 0}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                  />
                </div>

                <div className="mb-5">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
                    <Upload className="w-3.5 h-3.5" />
                    Bukti Pembayaran <span className="text-gray-400 font-normal">(opsional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      id="file-pengeluaran"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={submitLoading || sisa <= 0}
                    />
                    <label
                      htmlFor="file-pengeluaran"
                      className={`flex items-center justify-center w-full px-4 py-5 border-2 border-dashed rounded-lg cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 ${
                        submitLoading || sisa <= 0 ? 'opacity-50 cursor-not-allowed border-gray-200' : 'border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-gray-600 mb-1 text-sm">
                          {selectedFile ? (
                            <span className="inline-flex items-center gap-2 font-medium text-emerald-600">
                              <FileText className="w-4 h-4" />
                              {selectedFile.name}
                            </span>
                          ) : (
                            <span>Klik untuk upload file</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Format: JPG, JPEG, PNG, PDF (Maks. 2MB)</p>
                      </div>
                    </label>
                  </div>
                  {selectedFile && (
                    <button type="button" onClick={handleRemoveFile} className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                      <X className="w-3 h-3" /> Hapus file
                    </button>
                  )}
                  {formErrors.file && <p className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {formErrors.file}</p>}
                </div>

                <button
                  type="submit"
                  disabled={submitLoading || sisa <= 0}
                  className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {submitLoading ? 'Menyimpan...' : 'Simpan Pembayaran'}
                </button>

                {sisa <= 0 && pembayaran && (
                  <p className="text-center text-xs text-emerald-600 mt-3 font-medium flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Tagihan sudah lunas
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Riwayat Pembayaran
                <span className="ml-auto text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {history.length} record
                </span>
              </h2>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <DataTable
                  columns={historyColumns}
                  data={history}
                  pagination
                  paginationPerPage={10}
                  progressPending={loading && !pembayaran}
                  noDataComponent={
                    <div className="py-10 text-center">
                      <Wallet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Belum ada pembayaran</p>
                    </div>
                  }
                  customStyles={customStyles}
                  highlightOnHover
                  responsive
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default BayarPengeluaranPage;
