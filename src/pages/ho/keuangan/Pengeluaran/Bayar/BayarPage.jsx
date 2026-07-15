import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Wallet, Loader2, AlertCircle, Banknote, CheckCircle, Clock, Upload, FileText, X, Eye
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import HttpClient from '../../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../../config/api';
import { useNotification } from '../../../../../components/shared/Notification';

const formatRupiah = (val) => 'Rp ' + (Number(val) || 0).toLocaleString('id-ID');
const parseNumber = (str) => parseFloat(String(str || '').replace(/[^0-9]/g, '')) || 0;

const BayarPengeluaranHoPage = () => {
  const { pid } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [pembayaran, setPembayaran] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nominal, setNominal] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const mapHistoryItems = (items) =>
    (Array.isArray(items) ? items : []).map((item, index) => ({
      id: item.id ?? item.id_detail ?? `row-${index}`,
      rowNumber: index + 1,
      amount: parseFloat(item.amount ?? item.nominal_pembayaran ?? item.nominal) || 0,
      payment_date: item.payment_date || item.tanggal_pembayaran || item.created_at || '',
      note: item.note || item.description || item.catatan || '',
      bukti_pembayaran_url: item.bukti_pembayaran_url || item.bukti_url || null,
    }));

  // Refresh list riwayat via /api/ho/payment/details?id_pembayaran=...
  // cache:false wajib — HttpClient GET di-cache 5 menit, tanpa ini list tetap stale setelah bayar
  const refreshPaymentDetails = useCallback(async (idPembayaran) => {
    if (!idPembayaran) return null;
    const detailRes = await HttpClient.get(
      `${API_ENDPOINTS.HO.PAYMENT.DETAILS}?id_pembayaran=${idPembayaran}`,
      { cache: false }
    );
    if (!(detailRes && (detailRes.success || detailRes.status === 'ok'))) {
      return null;
    }

    const raw = detailRes.data;
    const items = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.details)
          ? raw.details
          : [];
    const mapped = mapHistoryItems(items);
    setHistory(mapped);

    // Header totals sering ada di item[0].pembayaran
    const header = items[0]?.pembayaran || detailRes.pembayaran || {};
    const totalFromList = mapped.reduce((sum, row) => sum + (row.amount || 0), 0);
    const totalTagihan = parseFloat(header.total_tagihan);
    const totalTerbayarHeader = parseFloat(header.total_terbayar);
    // Prefer sum dari list (source of truth untuk riwayat) bila header kosong/stale
    const nextTerbayar = totalFromList > 0
      ? totalFromList
      : (!Number.isNaN(totalTerbayarHeader) ? totalTerbayarHeader : 0);

    setPembayaran((prev) => {
      if (!prev && !header.id && !header.id_pembayaran) return prev;
      const nextTagihan = !Number.isNaN(totalTagihan)
        ? totalTagihan
        : (prev?.total_tagihan || 0);
      return {
        ...(prev || {}),
        ...header,
        id_pembayaran: header.id_pembayaran || header.id || idPembayaran || prev?.id_pembayaran,
        no_po: header.nota || header.nota_sistem || prev?.no_po || '-',
        total_tagihan: nextTagihan,
        total_terbayar: nextTerbayar,
        sisa_pembayaran: Math.max(0, nextTagihan - nextTerbayar),
      };
    });

    return mapped;
  }, []);

  const loadDetail = useCallback(async ({ silent = false } = {}) => {
    if (!pid) return;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const infoRes = await HttpClient.post(API_ENDPOINTS.HO.PENGELUARAN.SHOW, { pid });
      if (!(infoRes && (infoRes.success || infoRes.status === 'ok'))) {
        throw new Error(infoRes?.message || 'Gagal memuat data pengeluaran');
      }

      const info = infoRes.data || {};
      const idPembayaran = info.id_pembayaran;
      const totalTagihan = parseFloat(info.total_tagihan) || 0;
      const totalTerbayar = parseFloat(info.total_terbayar) || 0;
      setPembayaran({
        ...info,
        pid: info.pid || pid,
        id_pembayaran: idPembayaran,
        no_po: info.nota || info.nota_sistem || '-',
        total_tagihan: totalTagihan,
        total_terbayar: totalTerbayar,
        sisa_pembayaran: Math.max(0, totalTagihan - totalTerbayar),
      });

      if (idPembayaran) {
        await refreshPaymentDetails(idPembayaran);
      } else {
        setHistory([]);
      }
    } catch (err) {
      if (!silent) {
        setError(err.message || 'Gagal memuat detail pembayaran');
        setPembayaran(null);
        setHistory([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [pid, refreshPaymentDetails]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const sisa = pembayaran?.sisa_pembayaran || 0;

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
    const input = document.getElementById('file-pengeluaran-ho');
    if (input) input.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const nominalValue = parseNumber(nominal);

    if (!nominalValue || nominalValue <= 0) newErrors.nominal = 'Nominal wajib diisi';
    else if (nominalValue > sisa) newErrors.nominal = `Maksimal ${formatRupiah(sisa)}`;
    if (!paymentDate) newErrors.payment_date = 'Tanggal pembayaran wajib diisi';

    const idPembayaran = parseInt(pembayaran?.id_pembayaran, 10);
    if (!idPembayaran || Number.isNaN(idPembayaran)) {
      showError('ID Pembayaran tidak valid');
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setSubmitLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('id_pembayaran', idPembayaran);
      submitData.append('amount', nominalValue);
      submitData.append('payment_date', paymentDate);
      submitData.append('note', note ? String(note).trim() : '');
      if (selectedFile) {
        submitData.append('file_upload', selectedFile);
      }

      const result = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.ADD_PAYMENT, submitData);
      if (result.success || result.status === 'ok') {
        showSuccess(result.message || 'Pembayaran berhasil dicatat');

        setNominal('');
        setNote('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setSelectedFile(null);
        setFormErrors({});
        const input = document.getElementById('file-pengeluaran-ho');
        if (input) input.value = '';

        // Refresh list via /api/ho/payment/details?id_pembayaran=...
        await refreshPaymentDetails(idPembayaran);
      } else {
        showError(result.message || 'Gagal mencatat pembayaran');
      }
    } catch (err) {
      showError(err.message || 'Gagal mencatat pembayaran');
    } finally {
      setSubmitLoading(false);
    }
  };

  const historyColumns = [
    {
      name: 'No.',
      width: '50px',
      center: true,
      cell: (_, idx) => <span className="text-xs text-gray-400">{idx + 1}</span>,
    },
    {
      name: 'Tanggal',
      selector: (r) => r.payment_date,
      sortable: true,
      cell: (r) => <span className="text-sm text-gray-700">{r.payment_date || '-'}</span>,
    },
    {
      name: 'Nominal',
      selector: (r) => r.amount,
      sortable: true,
      right: true,
      cell: (r) => <span className="text-sm font-bold text-emerald-600">{formatRupiah(r.amount)}</span>,
    },
    {
      name: 'Catatan',
      selector: (r) => r.note,
      cell: (r) => <span className="text-sm text-gray-600">{r.note || '-'}</span>,
    },
    {
      name: 'Bukti',
      selector: (r) => r.bukti_pembayaran_url,
      center: true,
      cell: (r) => r.bukti_pembayaran_url ? (
        <a
          href={r.bukti_pembayaran_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
          title="Lihat bukti pembayaran"
        >
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

  if (loading && !pembayaran) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Memuat detail pembayaran...</p>
        </div>
      </div>
    );
  }

  if (error && !pembayaran) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-800 mb-1">Data Tidak Ditemukan</h2>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate('/ho/keuangan/pengeluaran')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition"
          >
            Kembali ke Daftar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-[1400px] mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/ho/keuangan/pengeluaran')}
            className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Banknote className="w-6 h-6 text-emerald-600" />
              Pembayaran Pengeluaran
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">{pembayaran?.no_po || '...'}</p>
          </div>
        </div>

        {pembayaran && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase">No Nota</p>
              <p className="text-sm font-bold text-gray-800 truncate">{pembayaran.no_po || '-'}</p>
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
                  {formErrors.nominal && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.nominal}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Pembayaran</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => {
                      setPaymentDate(e.target.value);
                      if (formErrors.payment_date) setFormErrors((p) => ({ ...p, payment_date: '' }));
                    }}
                    disabled={submitLoading || sisa <= 0}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                  />
                  {formErrors.payment_date && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.payment_date}
                    </p>
                  )}
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Catatan <span className="text-gray-400 font-normal">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Catatan pembayaran"
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
                      id="file-pengeluaran-ho"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={submitLoading || sisa <= 0}
                    />
                    <label
                      htmlFor="file-pengeluaran-ho"
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
                  {formErrors.file && (
                    <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.file}
                    </p>
                  )}
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

        {error && pembayaran && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default BayarPengeluaranHoPage;
