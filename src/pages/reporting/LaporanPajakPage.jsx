import React, { useState } from 'react';
import { FileText, Download, Calendar, AlertCircle, FileCheck, Receipt, CalendarDays, Calculator } from 'lucide-react';
import LaporanPembelianService from '../../services/laporanPembelianService';

const LaporanPajakPage = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Set default dates (current month)
  React.useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

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
      const blob = await LaporanPembelianService.downloadPdfReport('getReportSupplierTax', {
        start_date: startDate,
        end_date: endDate
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LAPORAN_PAJAK_SUPPLIER_${startDate}_${endDate}.pdf`;
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

  // Quick date presets
  const setQuickDate = (type) => {
    const today = new Date();
    let start, end;

    switch (type) {
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisQuarter':
        const quarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), quarter * 3, 1);
        end = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      default:
        return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Clear messages after 5 seconds
  React.useEffect(() => {
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
            <Receipt className="mr-3 text-purple-600" size={24} />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Laporan Pajak</h1>
              <p className="text-gray-600 text-sm">Generate laporan pajak pembelian dari supplier berdasarkan periode</p>
            </div>
          </div>
          <div className="hidden md:flex items-center bg-purple-50 px-4 py-2 rounded-lg">
            <Calendar className="mr-2 text-purple-600" size={16} />
            <span className="text-purple-600 text-sm font-medium">
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
            {/* Quick Date Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Pilih Periode Cepat
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setQuickDate('thisMonth')}
                  className="px-3 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('lastMonth')}
                  className="px-3 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                >
                  Bulan Lalu
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('thisQuarter')}
                  className="px-3 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                >
                  Kuartal Ini
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('thisYear')}
                  className="px-3 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                >
                  Tahun Ini
                </button>
              </div>
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
                className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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

      {/* Tax Information Card */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
              <Calculator className="text-purple-600" size={20} />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Informasi Laporan Pajak</h3>
            <div className="text-purple-700 space-y-1">
              <p className="flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                Laporan akan menampilkan rincian pajak dari semua transaksi pembelian dalam periode yang dipilih
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                Termasuk PPN, PPh, dan pajak lainnya yang terkait dengan transaksi pembelian
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                Format laporan: PDF dengan detail perhitungan pajak per supplier dan total keseluruhan
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                Laporan ini dapat digunakan untuk keperluan pelaporan pajak bulanan atau tahunan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="text-blue-600" size={20} />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">PPN (11%)</p>
              <p className="text-lg font-semibold text-gray-800">Pajak Pertambahan Nilai</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calculator className="text-green-600" size={20} />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">PPh Pasal 23</p>
              <p className="text-lg font-semibold text-gray-800">Pajak Penghasilan</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="text-orange-600" size={20} />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Pajak Lainnya</p>
              <p className="text-lg font-semibold text-gray-800">Pajak Tambahan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaporanPajakPage;
