import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2, Calendar, Package, User, FileText, AlertTriangle } from 'lucide-react';
import StokSapiService from '../../../../services/stokSapiService';

const SapiMatiModal = ({ isOpen, onClose, cowData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (isOpen && cowData?.pid) {
      fetchData();
    }
  }, [isOpen, cowData]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const response = await StokSapiService.getSapiMati(cowData.pid);

    if (response.success && response.data) {
      setData(response.data.data);
    } else {
      setError(response.message || 'Gagal memuat data sapi mati.');
    }

    setLoading(false);
  };

  const handleClose = () => {
    setData(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl transform transition-all">
        <div className="h-1.5 w-full bg-gradient-to-r from-slate-500 via-gray-500 to-slate-600" />

        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-slate-500 to-gray-600 p-3 text-white">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Detail Sapi Mati</h2>
              <p className="text-sm text-slate-500">Informasi kematian sapi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
              <span className="ml-3 text-sm text-slate-500">Memuat data sapi mati...</span>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Gagal Memuat Data</h3>
              <p className="text-sm text-slate-500 mb-4">{error}</p>
              <button
                type="button"
                onClick={fetchData}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Informasi Umum</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">RPH</p>
                    <p className="font-semibold text-slate-900">{data.rph || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Klasifikasi Hewan</p>
                    <p className="font-semibold text-slate-900">{data.klasifikasi_hewan || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Eartag</p>
                    <p className="font-semibold text-slate-900">{data.eartag || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">No. Surat Jalan</p>
                    <p className="font-semibold text-slate-900">{data.sapi || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-3">Informasi Kematian</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Tanggal Kematian</p>
                    <p className="font-semibold text-slate-900">{data.tgl_kematian || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Sebab Kematian</p>
                    <p className="font-semibold text-slate-900">{data.sebab_kematian || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Mengetahui</p>
                    <p className="font-semibold text-slate-900">{data.mengetahui || '-'}</p>
                  </div>
                  {data.file && (
                    <div>
                      <p className="text-slate-500">File</p>
                      <p className="font-semibold text-emerald-600">{data.file}</p>
                    </div>
                  )}
                </div>
                {data.keterangan && (
                  <div className="mt-4 pt-4 border-t border-red-100">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">Keterangan</p>
                    <p className="text-sm text-slate-700">{data.keterangan}</p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Informasi Sistem</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Dibuat</p>
                    <p className="font-semibold text-slate-900">{data.created_at || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Diperbarui</p>
                    <p className="font-semibold text-slate-900">{data.updated_at || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end p-5 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default SapiMatiModal;