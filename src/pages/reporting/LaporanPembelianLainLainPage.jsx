import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, AlertCircle, FileCheck, Package, CalendarDays, Filter } from 'lucide-react';
import LaporanPembelianService from '../../services/laporanPembelianService';
import useJenisPembelianLainLain from '../ho/pembelianLainLain/hooks/useJenisPembelianLainLain';

const LaporanPembelianLainLainPage = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTipePembelian, setSelectedTipePembelian] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Fetch tipe pembelian options from pembelian lain lain
  const {
    jenisPembelianOptions: tipePembelianOptions,
    loading: loadingTipePembelian,
    error: tipePembelianError
  } = useJenisPembelianLainLain();

  // Set default dates (current month) and default tipe pembelian
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Set default tipe pembelian when options are loaded
  useEffect(() => {
    if (tipePembelianOptions.length > 0 && !selectedTipePembelian) {
      // Set the first option as default
      setSelectedTipePembelian(tipePembelianOptions[0].value);
    }
  }, [tipePembelianOptions, selectedTipePembelian]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      setError('Tanggal mulai dan tanggal akhir harus diisi');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const blob = await LaporanPembelianService.downloadPdfReport('getReportOtherHo', {
        start_date: startDate,
        end_date: endDate,
        id_tipe_pembelian: selectedTipePembelian || 1  // Use selected value or default to 1
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Get tipe pembelian label for filename
      const tipePembelianLabel = tipePembelianOptions.find(opt => opt.value === selectedTipePembelian)?.label || 'ALL';
      link.download = `LAPORAN_PEMBELIAN_LAIN_LAIN_${tipePembelianLabel}_${startDate}_${endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Laporan berhasil diunduh');
    } catch (error) {
      console.error('Error downloading report:', error);
      setError(error.message || 'Terjadi kesalahan saat mengunduh laporan');
    } finally {
      setLoading(false);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Package className="mr-3 text-blue-600" size={24} />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Laporan Pembelian Lain-lain</h1>
              <p className="text-gray-600 text-sm">Generate laporan pembelian lain-lain berdasarkan periode</p>
            </div>
          </div>
          <div className="hidden md:flex items-center bg-blue-50 px-4 py-2 rounded-lg">
            <Calendar className="mr-2 text-blue-600" size={16} />
            <span className="text-blue-600 text-sm font-medium">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipe Pembelian Filter */}
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="tipePembelian" className="block text-sm font-medium text-gray-700 mb-2">
                Tipe Pembelian
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  id="tipePembelian"
                  value={selectedTipePembelian}
                  onChange={(e) => setSelectedTipePembelian(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                  disabled={loading || loadingTipePembelian}
                >
                  {loadingTipePembelian ? (
                    <option value="">Loading...</option>
                  ) : tipePembelianOptions.length > 0 ? (
                    tipePembelianOptions.map(option => (
                      <option key={option.value || option.rawId} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  ) : (
                    <option value="">Tidak ada data tipe pembelian</option>
                  )}
                </select>
              </div>
              {tipePembelianError && (
                <p className="text-sm text-red-600 mt-1">Error: {tipePembelianError}</p>
              )}
              {!loadingTipePembelian && !tipePembelianError && tipePembelianOptions.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Pilih tipe pembelian untuk memfilter laporan
                </p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Mulai
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Akhir
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Alert Messages */}
            {error && (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="mr-2 text-red-600" size={20} />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <FileCheck className="mr-2 text-green-600" size={20} />
                <span className="text-green-700">{success}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading || !startDate || !endDate}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2" size={20} />
                    Unduh Laporan PDF
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Information Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={20} />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Informasi Laporan</h3>
            <div className="text-blue-700 space-y-1">
              <p className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                Laporan akan menampilkan transaksi pembelian lain-lain berdasarkan tipe pembelian yang dipilih
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                Format laporan: PDF dengan detail lengkap pembelian lain-lain dan total keseluruhan
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                Tipe pembelian tersedia: {tipePembelianOptions.map(opt => opt.label).join(', ') || 'Loading...'}
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                Silakan pilih rentang tanggal untuk periode laporan yang diinginkan
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaporanPembelianLainLainPage;