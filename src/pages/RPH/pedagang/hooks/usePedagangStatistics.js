/**
 * Hook for fetching and managing pedagang statistics data
 */
import { useState, useEffect, useCallback } from 'react';
import pedagangService from '../../../../services/pedagangService';

/**
 * Mock statistics data matching the API response structure
 * Used as fallback when API is unavailable
 */
const MOCK_STATISTICS = {
  summary: {
    total_pedagang: 15,
    total_saldo_awal: 92800000,
    total_angkatan: 29700000,
    total_setoran: 28600000,
    total_saldo: 93900000,
    total_tabungan: 4395000,
    total_kulit: 1430000,
    total_saldo_beku: 1220000,
    total_saldo_akhir: 87665000,
    total_deposit_pedagang: -93900000,
    total_saldo_keseluruhan: 182785000,
    total_kenaikan_saldo: 4800000,
    total_penurunan_saldo: 3700000,
    avg_saldo_akhir: 5844333.33,
    max_saldo_akhir: 9375000,
    min_saldo_akhir: 3870000,
    total_transaksi: 0,
    total_ekor_karkas: 0,
  },
  by_status: [
    { status: 1, label: 'Deposit', jumlah: 8, total_saldo_akhir: 39160000, total_saldo_keseluruhan: 81690000, avg_saldo_akhir: 4895000 },
    { status: 2, label: 'Peringatan', jumlah: 4, total_saldo_akhir: 23990000, total_saldo_keseluruhan: 49820000, avg_saldo_akhir: 5997500 },
    { status: 3, label: 'Macet', jumlah: 3, total_saldo_akhir: 24515000, total_saldo_keseluruhan: 51275000, avg_saldo_akhir: 8171666.67 },
  ],
  by_pasar: [
    { pasar: 'Pasar 16 Ilir', jumlah_pedagang: 1, total_saldo_awal: 9000000, total_angkatan: 3000000, total_setoran: 2000000, total_saldo_akhir: 9375000, total_saldo_keseluruhan: 19525000, avg_saldo_akhir: 9375000 },
    { pasar: 'Pasar Kenten', jumlah_pedagang: 2, total_saldo_awal: 12000000, total_angkatan: 4000000, total_setoran: 3500000, total_saldo_akhir: 12500000, total_saldo_keseluruhan: 26000000, avg_saldo_akhir: 6250000 },
    { pasar: 'Pasar Aman', jumlah_pedagang: 2, total_saldo_awal: 11000000, total_angkatan: 3500000, total_setoran: 3000000, total_saldo_akhir: 11500000, total_saldo_keseluruhan: 24000000, avg_saldo_akhir: 5750000 },
    { pasar: 'Pasar Cinde', jumlah_pedagang: 1, total_saldo_awal: 8000000, total_angkatan: 2500000, total_setoran: 2200000, total_saldo_akhir: 8300000, total_saldo_keseluruhan: 17300000, avg_saldo_akhir: 8300000 },
    { pasar: 'Pasar Sako', jumlah_pedagang: 1, total_saldo_awal: 7500000, total_angkatan: 2400000, total_setoran: 2100000, total_saldo_akhir: 7800000, total_saldo_keseluruhan: 16250000, avg_saldo_akhir: 7800000 },
    { pasar: 'Pasar Sukarame', jumlah_pedagang: 1, total_saldo_awal: 7200000, total_angkatan: 2300000, total_setoran: 2000000, total_saldo_akhir: 7500000, total_saldo_keseluruhan: 15625000, avg_saldo_akhir: 7500000 },
    { pasar: 'Pasar Talang', jumlah_pedagang: 1, total_saldo_awal: 6800000, total_angkatan: 2200000, total_setoran: 1900000, total_saldo_akhir: 7100000, total_saldo_keseluruhan: 14790000, avg_saldo_akhir: 7100000 },
    { pasar: 'Pasar Pahlawan', jumlah_pedagang: 1, total_saldo_awal: 6500000, total_angkatan: 2100000, total_setoran: 1800000, total_saldo_akhir: 6800000, total_saldo_keseluruhan: 14167000, avg_saldo_akhir: 6800000 },
    { pasar: 'Pasar Km 5', jumlah_pedagang: 1, total_saldo_awal: 6200000, total_angkatan: 2000000, total_setoran: 1700000, total_saldo_akhir: 6500000, total_saldo_keseluruhan: 13542000, avg_saldo_akhir: 6500000 },
    { pasar: 'Pasar Km 12', jumlah_pedagang: 1, total_saldo_awal: 5800000, total_angkatan: 1900000, total_setoran: 1600000, total_saldo_akhir: 6100000, total_saldo_keseluruhan: 12708000, avg_saldo_akhir: 6100000 },
    { pasar: 'Pasar Seberang Ulu', jumlah_pedagang: 1, total_saldo_awal: 5500000, total_angkatan: 1800000, total_setoran: 1500000, total_saldo_akhir: 5800000, total_saldo_keseluruhan: 12083000, avg_saldo_akhir: 5800000 },
    { pasar: 'Pasar Ilir Barat', jumlah_pedagang: 1, total_saldo_awal: 5200000, total_angkatan: 1700000, total_setoran: 1400000, total_saldo_akhir: 5500000, total_saldo_keseluruhan: 11458000, avg_saldo_akhir: 5500000 },
    { pasar: 'Pasar Ilir Timur', jumlah_pedagang: 1, total_saldo_awal: 4800000, total_angkatan: 1600000, total_setoran: 1300000, total_saldo_akhir: 5100000, total_saldo_keseluruhan: 10625000, avg_saldo_akhir: 5100000 },
    { pasar: 'Pasar Bukit Besar', jumlah_pedagang: 1, total_saldo_awal: 4200000, total_angkatan: 1400000, total_setoran: 1200000, total_saldo_akhir: 4400000, total_saldo_keseluruhan: 9167000, avg_saldo_akhir: 4400000 },
    { pasar: 'Pasar Alang-Alang Lebar', jumlah_pedagang: 1, total_saldo_awal: 3800000, total_angkatan: 1200000, total_setoran: 1100000, total_saldo_akhir: 3900000, total_saldo_keseluruhan: 8125000, avg_saldo_akhir: 3900000 },
  ],
  saldo_trend: [
    { bulan: '2026-02', pedagang_baru: 15, total_saldo_awal: 92800000, total_saldo_akhir: 87665000, total_saldo_keseluruhan: 182785000, total_angkatan: 29700000, total_setoran: 28600000 },
  ],
  transaksi_trend: [],
  top_saldo: [
    { pid: 'abc1', id_pedagang: 'RDHHER202602020008', nama_alias: 'Heri', pasar: 'Pasar 16 Ilir', status_pedagang: 3, status_label: 'Macet', saldo_akhir: 9375000, saldo_keseluruhan: 19525000, angkatan_terakhir: 3000000, setoran_terakhir: 2000000 },
    { pid: 'abc2', id_pedagang: 'RDHHER202602020007', nama_alias: 'Budi', pasar: 'Pasar Kenten', status_pedagang: 2, status_label: 'Peringatan', saldo_akhir: 8200000, saldo_keseluruhan: 17083000, angkatan_terakhir: 2500000, setoran_terakhir: 1800000 },
    { pid: 'abc3', id_pedagang: 'RDHHER202602020006', nama_alias: 'Siti', pasar: 'Pasar Aman', status_pedagang: 1, status_label: 'Deposit', saldo_akhir: 7800000, saldo_keseluruhan: 16250000, angkatan_terakhir: 2400000, setoran_terakhir: 1700000 },
    { pid: 'abc4', id_pedagang: 'RDHHER202602020005', nama_alias: 'Ahmad', pasar: 'Pasar Cinde', status_pedagang: 1, status_label: 'Deposit', saldo_akhir: 7500000, saldo_keseluruhan: 15625000, angkatan_terakhir: 2300000, setoran_terakhir: 1600000 },
    { pid: 'abc5', id_pedagang: 'RDHHER202602020004', nama_alias: 'Dewi', pasar: 'Pasar Sako', status_pedagang: 2, status_label: 'Peringatan', saldo_akhir: 7200000, saldo_keseluruhan: 15000000, angkatan_terakhir: 2200000, setoran_terakhir: 1500000 },
    { pid: 'abc6', id_pedagang: 'RDHHER202602020003', nama_alias: 'Rudi', pasar: 'Pasar Sukarame', status_pedagang: 3, status_label: 'Macet', saldo_akhir: 6900000, saldo_keseluruhan: 14375000, angkatan_terakhir: 2100000, setoran_terakhir: 1400000 },
    { pid: 'abc7', id_pedagang: 'RDHHER202602020002', nama_alias: 'Maya', pasar: 'Pasar Talang', status_pedagang: 1, status_label: 'Deposit', saldo_akhir: 6500000, saldo_keseluruhan: 13542000, angkatan_terakhir: 2000000, setoran_terakhir: 1300000 },
    { pid: 'abc8', id_pedagang: 'RDHHER202602020001', nama_alias: 'Joko', pasar: 'Pasar Pahlawan', status_pedagang: 1, status_label: 'Deposit', saldo_akhir: 6200000, saldo_keseluruhan: 12917000, angkatan_terakhir: 1900000, setoran_terakhir: 1200000 },
    { pid: 'abc9', id_pedagang: 'RDHHER202602020010', nama_alias: 'Lina', pasar: 'Pasar Km 5', status_pedagang: 2, status_label: 'Peringatan', saldo_akhir: 5800000, saldo_keseluruhan: 12083000, angkatan_terakhir: 1800000, setoran_terakhir: 1100000 },
    { pid: 'abc10', id_pedagang: 'RDHHER202602020009', nama_alias: 'Agus', pasar: 'Pasar Km 12', status_pedagang: 3, status_label: 'Macet', saldo_akhir: 5400000, saldo_keseluruhan: 11250000, angkatan_terakhir: 1700000, setoran_terakhir: 1000000 },
  ],
  top_angkatan: [],
};

const usePedagangStatistics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistics = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await pedagangService.getStatistic(params);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        // Fallback to mock data if API returns no data
        setData(MOCK_STATISTICS);
        if (result.message && !result.success) {
          setError(result.message);
        }
      }
    } catch (err) {
      // Fallback to mock data on error
      setData(MOCK_STATISTICS);
      setError(err?.message || 'Gagal memuat statistik, menggunakan data contoh');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    data,
    loading,
    error,
    refetch: fetchStatistics,
  };
};

export default usePedagangStatistics;
