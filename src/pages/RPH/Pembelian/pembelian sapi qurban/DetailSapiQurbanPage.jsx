import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Beef, MapPin, User, Calendar, Loader2, AlertCircle } from 'lucide-react';
import QurbanService from '../../../../services/qurban/qurbanService';

const DetailSapiQurbanPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true);
      const result = await QurbanService.getDetail(id);
      console.log('Qurban detail result:', result);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.message || 'Gagal memuat data');
      }
      setLoading(false);
    };
    if (id) loadDetail();
  }, [id]);

  const formatCurrency = (value) => {
    if (!value) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const hewanList = useMemo(() => {
    if (!data?.details || !Array.isArray(data.details)) return [];
    return data.details.flatMap(d => {
      const hewan = d.hewan_details || d.hewanDetails || d.hewan || d.tr_pembelian_ho_detail;
      return hewan ? [{ ...hewan, harga_beli: d.harga_beli }] : [];
    });
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-green-500" />
          <span>Memuat detail sapi...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Detail Sapi</h1>
              <p className="text-gray-500 text-sm">{data?.nota_sistem || '-'} • {data?.pemasok?.nama || data?.nama_penerima || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Pemasok</p>
              <p className="text-sm font-bold text-gray-800">{data?.pemasok?.nama || data?.nama_penerima || '-'}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Tempat Tiba</p>
              <p className="text-sm font-bold text-gray-800">{data?.tempat_tiba || '-'}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <Beef className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Jumlah Sapi</p>
              <p className="text-sm font-bold text-gray-800">{hewanList.length} Ekor</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Tanggal</p>
              <p className="text-sm font-bold text-gray-800">{data?.tanggal_pemesanan ? new Date(data.tanggal_pemesanan).toLocaleDateString('id-ID') : '-'}</p>
            </div>
          </div>
        </div>

        {/* Sapi List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Beef className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-gray-800">Daftar Sapi</h2>
            <span className="ml-auto bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold">{hewanList.length} Ekor</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-6 py-3">#</th>
                  <th className="text-left px-6 py-3">Eartag</th>
                  <th className="text-left px-6 py-3">Eartag Supplier</th>
                  <th className="text-left px-6 py-3">Code</th>
                  <th className="text-right px-6 py-3">Berat (kg)</th>
                  <th className="text-right px-6 py-3">Harga Beli</th>
                </tr>
              </thead>
              <tbody>
                {hewanList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      Tidak ada data sapi
                    </td>
                  </tr>
                ) : (
                  hewanList.map((hewan, i) => (
                    <tr key={hewan.id || i} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="px-6 py-3 text-gray-500">{i + 1}</td>
                      <td className="px-6 py-3 font-semibold text-gray-800">{hewan.eartag || '-'}</td>
                      <td className="px-6 py-3 text-gray-600">{hewan.eartag_supplier || '-'}</td>
                      <td className="px-6 py-3 text-gray-600 font-mono text-xs">{hewan.code_eartag || '-'}</td>
                      <td className="px-6 py-3 text-right font-medium text-gray-700">{hewan.berat || '-'}</td>
                      <td className="px-6 py-3 text-right font-semibold text-emerald-600">{formatCurrency(hewan.harga_beli || hewan.total_harga)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailSapiQurbanPage;
