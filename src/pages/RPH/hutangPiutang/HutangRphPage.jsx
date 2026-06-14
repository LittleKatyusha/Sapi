import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Loader2, RefreshCw, Search, Eye, CreditCard, X, CheckCircle2, AlertCircle } from 'lucide-react';
import HutangPiutangRphService from '../../../services/hutangPiutangRphService';

const money = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(v || 0));
const dateFmt = (v) => (v ? new Date(v).toLocaleDateString('id-ID') : '-');

export default function HutangRphPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notification, setNotification] = useState(null);

  const fetchHutang = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await HutangPiutangRphService.getHutang({ search });
      setData(res?.data ?? []);
    } catch (e) {
      setError(e.message || 'Error fetching hutang');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchHutang(); }, [fetchHutang]);

  const loadDetail = async (pid) => {
      try {
          const res = await HutangPiutangRphService.getHutangDetail(pid);
          setDetail(res.data);
      } catch (e) {
          showNotification('error', e.message || 'Gagal memuat detail hutang');
      }
  };

  const handlePay = async (e) => {
      e.preventDefault();
      if (!paymentAmount || Number(paymentAmount) <= 0) {
          return showNotification('error', 'Jumlah pembayaran tidak valid');
      }

      setIsPaying(true);
      try {
          const res = await HutangPiutangRphService.payHutang({
              pid: paymentModal.pid,
              amount: Number(paymentAmount),
              payment_date: paymentDate,
              note: paymentNote
          });
          showNotification('success', res.message);
          setPaymentModal(null);
          setPaymentAmount('');
          setPaymentNote('');
          fetchHutang();
      } catch (err) {
          showNotification('error', err.response?.data?.message || err.message || 'Gagal memproses pembayaran');
      } finally {
          setIsPaying(false);
      }
  };

  const showNotification = (type, message) => {
      setNotification({ type, message });
      setTimeout(() => setNotification(null), 5000);
  };

  const columns = useMemo(() => [
    { name: 'Kreditur', cell: r => (
        <div>
            <div className="font-semibold text-gray-900">{r.creditor_name || '-'}</div>
            <div className="text-xs text-gray-500">{r.jenis_hutang}</div>
        </div>
    ), grow: 1.5 },
    { name: 'Tipe Pembelian', selector: r => r.purchase_type ?? '-', grow: 1 },
    { name: 'Jatuh Tempo', selector: r => dateFmt(r.due_date), grow: 1 },
    { name: 'Tagihan', selector: r => money(r.total_tagihan), grow: 1, sortable: true },
    { name: 'Sisa Tagihan', cell: r => (
        <span className="font-bold text-red-600">{money(r.sisa_tagihan)}</span>
    ), grow: 1, sortable: true },
    { name: 'Status', cell: r => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${r.payment_status === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {r.payment_status === 1 ? 'Lunas' : 'Belum Lunas'}
        </span>
    ), width: '120px' },
    { name: 'Aksi', width: '120px', cell: r => (
        <div className="flex gap-2">
            <button onClick={() => loadDetail(r.pid)} title="Detail" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => {
                setPaymentModal(r);
                setPaymentAmount(r.sisa_tagihan);
            }} title="Bayar" className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                <CreditCard className="w-4 h-4" />
            </button>
        </div>
    ) },
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Hutang RPH (Vendor & HO)</h1>
            <p className="text-sm text-gray-600 mt-1">Hutang operasional RPH ke Vendor (Hewan) dan HEAD OFFICE.</p>
          </div>
          <button onClick={fetchHutang} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden p-1">
          <DataTable 
             columns={columns} 
             data={data} 
             progressPending={loading} 
             progressComponent={<div className="py-12 flex items-center gap-2 text-blue-600"><Loader2 className="w-5 h-5 animate-spin" /> Memuat data hutang...</div>} 
             pagination 
             highlightOnHover 
             responsive 
             noDataComponent={<div className="py-12 text-gray-500">Tidak ada data hutang</div>}
          />
        </div>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-xl font-bold text-gray-900">Detail Hutang</h2>
                <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between"><span className="text-gray-500">Kreditur:</span> <span className="font-semibold text-gray-900">{detail.creditor_name} ({detail.jenis_hutang})</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tipe Pembelian:</span> <span className="font-medium text-gray-800">{detail.purchase_type}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total Tagihan:</span> <span className="font-semibold text-gray-900">{money(detail.total_tagihan)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total Terbayar:</span> <span className="font-medium text-emerald-600">{money(detail.total_terbayar)}</span></div>
                <div className="flex justify-between pt-2 border-t"><span className="font-bold text-gray-700">Sisa Tagihan:</span> <span className="font-bold text-red-600 text-lg">{money(detail.sisa_tagihan)}</span></div>
            </div>

            {detail.details?.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Riwayat Pembayaran</h3>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2 border">
                        {detail.details.map(d => (
                            <div key={d.id} className="flex justify-between items-center text-xs pb-2 border-b last:border-0 last:pb-0">
                                <div>
                                    <div className="font-medium text-gray-800">{dateFmt(d.payment_date)}</div>
                                    <div className="text-gray-500">{d.note || '-'}</div>
                                </div>
                                <div className="font-semibold text-emerald-600">{money(d.amount)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button onClick={() => setDetail(null)} className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl py-2.5 font-semibold transition-colors">Tutup</button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPaymentModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Bayar Hutang</h2>
                <button onClick={() => setPaymentModal(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl mb-6">
                <p className="text-sm">Kreditur: <span className="font-semibold">{paymentModal.creditor_name}</span></p>
                <p className="text-xl font-bold mt-1">Sisa: {money(paymentModal.sisa_tagihan)}</p>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Jumlah Bayar <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-gray-500">Rp</span>
                        <input 
                            type="number" 
                            required 
                            min="1" 
                            max={paymentModal.sisa_tagihan}
                            value={paymentAmount} 
                            onChange={e => setPaymentAmount(e.target.value)} 
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Pembayaran <span className="text-red-500">*</span></label>
                    <input 
                        type="date" 
                        required 
                        value={paymentDate} 
                        onChange={e => setPaymentDate(e.target.value)} 
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Catatan</label>
                    <textarea 
                        rows="2" 
                        value={paymentNote} 
                        onChange={e => setPaymentNote(e.target.value)} 
                        placeholder="Contoh: Pembayaran transfer BCA"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                    ></textarea>
                </div>

                <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setPaymentModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50">Batal</button>
                    <button type="submit" disabled={isPaying} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold shadow-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} 
                        {isPaying ? 'Memproses...' : 'Proses Pembayaran'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-[10000]">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border-l-4 ${notification.type === 'success' ? 'bg-white border-emerald-500' : 'bg-red-50 border-red-500 text-red-800'}`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
            <span className="font-medium text-sm">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
