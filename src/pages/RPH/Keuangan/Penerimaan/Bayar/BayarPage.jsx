import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Wallet, Loader2, AlertCircle, Banknote, CheckCircle, Clock, FileText, X, Eye, Upload
} from 'lucide-react';
import usePenjualanSapiUtuh from '../../../../../hooks/usePenjualanSapiUtuh';
import PenjualanBoningService from '../../../../../services/penjualanBoningService';
import PenjualanKarkasService from '../../../../../services/penjualanKarkasService';
import PenjualanKulitService from '../../../../../services/penjualanKulitService.js';
import { useNotification } from '../../../../../components/shared/Notification';
import SearchableSelect from '../../../../../components/shared/SearchableSelect';
import DataTable from 'react-data-table-component';

const METODE_OPTIONS = [
  { value: 'tunai', label: 'Tunai' },
  { value: 'transfer_bank', label: 'Transfer Bank' },
  { value: 'transfer_bca', label: 'Transfer BCA' },
  { value: 'transfer_bni', label: 'Transfer BNI' },
  { value: 'transfer_bri', label: 'Transfer BRI' },
];

const formatRupiah = (val) => 'Rp ' + (val || 0).toLocaleString('id-ID');
const parseNumber = (str) => parseFloat((str || '').replace(/[^0-9]/g, '')) || 0;
const formatBankLabel = (data) => {
  if (!data?.nama_bank) return '-';
  return data.kode_bank ? `${data.nama_bank} (${data.kode_bank})` : data.nama_bank;
};
const resolveBoningMetode = (data) => {
  if (String(data?.tipe_pembayaran) !== '2') return 'tunai';

  const bankRef = `${data?.kode_bank || ''} ${data?.nama_bank || ''}`.toLowerCase();
  if (bankRef.includes('bca')) return 'transfer_bca';
  if (bankRef.includes('bni')) return 'transfer_bni';
  if (bankRef.includes('bri')) return 'transfer_bri';

  return 'transfer_bank';
};
const resolveRphMetode = (data) => {
  if (String(data?.tipe_pembayaran) !== '2') return 'tunai';
  const bankRef = `${data?.kode_bank || ''} ${data?.nama_bank || ''}`.toLowerCase();
  if (bankRef.includes('bca')) return 'transfer_bca';
  if (bankRef.includes('bni')) return 'transfer_bni';
  if (bankRef.includes('bri')) return 'transfer_bri';
  return 'transfer_bank';
};

const BayarPage = () => {
  const { pid } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loading, error, bayar, fetchPembayaranHistory } = usePenjualanSapiUtuh();
  const { showSuccess, showError } = useNotification();
  const jenis = searchParams.get('jenis');
  const mode = searchParams.get('mode');
  const isBoning = jenis === 'boning';
  const isKarkas = jenis === 'karkas';
  const isKulit = jenis === 'kulit';
  const isDetailOnly = mode === 'detail';

  const [penjualan, setPenjualan] = useState(null);
  const [history, setHistory] = useState([]);
  const [nominal, setNominal] = useState('');
  const [metode, setMetode] = useState('');
  const [namaPembayar, setNamaPembayar] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');

  const loadHistory = async () => {
    setPageError(null);
    const result = isBoning
      ? await PenjualanBoningService.getPembayaranHistory(pid)
      : isKarkas
      ? await PenjualanKarkasService.getPembayaranHistory(pid)
      : isKulit
      ? await PenjualanKulitService.getPembayaranHistory(pid)
      : await fetchPembayaranHistory(pid);
    if (result.success && result.data) {
      setPenjualan(result.data.penjualan);
      setHistory(result.data.history || []);
      setNamaPembayar(result.data.penjualan?.nama_pembeli || '');
      if (isBoning || isKarkas || isKulit) {
        setMetode(isBoning ? resolveBoningMetode(result.data.penjualan) : resolveRphMetode(result.data.penjualan));
      }
    } else {
      setPageError(result.message || 'Gagal memuat detail pembayaran');
    }
  };

  useEffect(() => {
    if (pid) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, isBoning, isKarkas, isKulit]);

  const grandTotal = (penjualan?.total_harga || 0) + (penjualan?.biaya_kirim || 0) + (penjualan?.biaya_potong || 0);
  const sisa = penjualan?.sisa_pembayaran || 0;
  const pageTitle = useMemo(() => {
    if (isBoning) {
      return isDetailOnly ? 'Detail Penerimaan Boning' : 'Pembayaran Penerimaan Boning';
    }
    if (isKarkas) {
      return isDetailOnly ? 'Detail Penerimaan Karkas' : 'Pembayaran Penerimaan Karkas';
    }
    if (isKulit) {
      return isDetailOnly ? 'Detail Penerimaan Kulit' : 'Pembayaran Penerimaan Kulit';
    }
    return 'Pembayaran / Pelunasan';
  }, [isBoning, isKarkas, isKulit, isDetailOnly]);

  const handleNominalChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setNominal(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
    if (formErrors.nominal) setFormErrors((p) => ({ ...p, nominal: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('File harus bertipe: JPG, JPEG, PNG, atau PDF');
      setSelectedFile(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFileError('Ukuran file maksimal 2MB');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const nominalValue = parseNumber(nominal);

    if (!nominalValue || nominalValue <= 0) newErrors.nominal = 'Nominal wajib diisi';
    else if (nominalValue > sisa) newErrors.nominal = `Maksimal ${formatRupiah(sisa)}`;
    if (!metode) newErrors.metode = (isBoning || isKarkas || isKulit)
      ? `Metode pembayaran belum bisa ditentukan dari data penjualan ${isKarkas ? 'karkas' : (isKulit ? 'kulit' : 'boning')}.`
      : 'Pilih metode pembayaran';

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setSubmitLoading(true);
    const result = isBoning
      ? await PenjualanBoningService.bayar({
        pid,
        nominal_pembayaran: nominalValue,
        metode_pembayaran: metode,
        nama_pembayar: namaPembayar || undefined,
      })
      : isKarkas
      ? await PenjualanKarkasService.bayar({
        pid,
        nominal_pembayaran: nominalValue,
        metode_pembayaran: metode,
        nama_pembayar: namaPembayar || undefined,
      })
      : isKulit
      ? await PenjualanKulitService.bayar({
        pid,
        nominal_pembayaran: nominalValue,
        metode_pembayaran: metode,
        nama_pembayar: namaPembayar || undefined,
      })
      : await bayar({
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
      const input = document.getElementById('file-penerimaan-rph');
      if (input) input.value = '';
      loadHistory();
    } else {
      showError(result.message || 'Gagal mencatat pembayaran');
    }
  };

  const historyColumns = [
    { name: 'No.', width: '50px', center: true, cell: (_, idx) => <span className="text-xs text-gray-400">{idx + 1}</span> },
    {
      name: 'Tanggal',
      selector: (r) => r.created_at,
      sortable: true,
      cell: (r) => <span className="text-sm text-gray-700">{r.created_at}</span>,
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
              {pageTitle}
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">{penjualan?.no_transaksi || '...'}</p>
          </div>
        </div>

        {/* Info Cards */}
        {penjualan && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase">Pembeli</p>
              <p className="text-sm font-bold text-gray-800 truncate">{penjualan.nama_pembeli || '-'}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase">Total Tagihan</p>
              <p className="text-sm font-bold text-gray-800">{formatRupiah(grandTotal)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase">Sudah Dibayar</p>
              <p className="text-sm font-bold text-emerald-600">{formatRupiah(penjualan.nominal_pembayaran)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase">Sisa</p>
              <p className={`text-sm font-bold ${sisa > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {formatRupiah(sisa)}
              </p>
            </div>
          </div>
        )}

        {(isBoning || isKarkas || isKulit) && penjualan && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase">Tipe Pembayaran Penjualan</p>
              <p className="text-sm font-bold text-gray-800">{penjualan.tipe_pembayaran_label || '-'}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase">Bank Dipilih</p>
              <p className="text-sm font-bold text-gray-800">{String(penjualan.tipe_pembayaran) === '2' ? formatBankLabel(penjualan) : 'Cash / Tunai'}</p>
            </div>
            <div className="bg-sky-50 rounded-xl border border-sky-100 p-4 shadow-sm">
              <p className="text-xs text-sky-700 font-medium uppercase">Saldo Pedagang Digunakan</p>
              <p className="text-sm font-bold text-sky-800">{formatRupiah(Number(penjualan.penggunaan_saldo || 0))}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {!isDetailOnly && (
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
                      placeholder={(isBoning || isKarkas || isKulit) ? `Metode diambil dari penjualan ${isKarkas ? 'karkas' : (isKulit ? 'kulit' : 'boning')}` : 'Pilih metode'}
                      isClearable={false}
                      isDisabled={submitLoading || sisa <= 0 || isBoning || isKarkas || isKulit}
                    />
                    {formErrors.metode && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formErrors.metode}</p>}
                    {(isBoning || isKarkas || isKulit) && !formErrors.metode && (
                      <p className="text-xs text-gray-500 mt-1">
                        Metode pembayaran mengikuti data penjualan awal.
                      </p>
                    )}
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

                  {!isBoning && !isKarkas && !isKulit && (
                    <div className="mb-5">
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
                        <Upload className="w-3.5 h-3.5" />
                        Bukti Pembayaran <span className="text-gray-400 font-normal">(opsional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          id="file-penerimaan-rph"
                          accept="image/jpeg,image/jpg,image/png,application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                          disabled={submitLoading || sisa <= 0}
                        />
                        <label
                          htmlFor="file-penerimaan-rph"
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
                        <button
                          type="button"
                          onClick={() => { setSelectedFile(null); const input = document.getElementById('file-penerimaan-rph'); if (input) input.value = ''; }}
                          className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Hapus file
                        </button>
                      )}
                      {fileError && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {fileError}</p>}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitLoading || sisa <= 0}
                    className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {submitLoading ? 'Menyimpan...' : 'Simpan Pembayaran'}
                  </button>

                  {sisa <= 0 && penjualan && (
                    <p className="text-center text-xs text-emerald-600 mt-3 font-medium flex items-center justify-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Transaksi sudah lunas
                    </p>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* History */}
          <div className={isDetailOnly ? 'lg:col-span-3' : 'lg:col-span-2'}>
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
                  progressPending={loading && !penjualan}
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

        {(error || pageError) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error || pageError}
          </div>
        )}
      </div>
    </div>
  );
};

export default BayarPage;
