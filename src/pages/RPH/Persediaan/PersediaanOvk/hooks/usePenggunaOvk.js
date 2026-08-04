import { useState, useEffect, useMemo, useCallback } from 'react';
import PersediaanOvkService from '../../../../../services/persediaanOvkService';

const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

const formatDisplayDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); // e.g., "3 Apr"
};

const getLast31Days = () => {
  const days = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(formatDate(date));
  }
  return days;
};

const usePenggunaOvk = () => {
  // State
  const [selectedDates, setSelectedDates] = useState(getLast31Days);
  const [penggunaData, setPenggunaData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data when dates change
  const fetchPenggunaData = useCallback(async () => {
    if (selectedDates.length === 0) {
      setPenggunaData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startDate = selectedDates[0];
      const endDate = selectedDates[selectedDates.length - 1];
      const response = await PersediaanOvkService.getPenggunaData({
        startDate,
        endDate,
        length: -1, // fetch all records
      });
      if (response.success) {
        setPenggunaData(response.data);
      } else {
        setError(response.message || 'Gagal memuat data pengguna OVK');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }, [selectedDates]);

  useEffect(() => {
    fetchPenggunaData();
  }, [fetchPenggunaData]);

  // Generate available dates (last 31 days) for the date picker
  const availableDates = useMemo(() => getLast31Days(), []);

  // Handle date range change from the calendar picker
  const handleDateRangeChange = useCallback((dates) => {
    // dates should already be sorted and within 1-7 range, validated by the picker
    setSelectedDates(dates.sort());
  }, []);

  // Generate table columns dynamically
  const tableColumns = useMemo(() => {
    const cols = [
      {
        key: 'namaOvk',
        label: 'Nama OVK',
        sortable: true,
      },
      {
        key: 'satuan',
        label: 'Satuan',
        sortable: false,
        width: '90px',
      },
      {
        key: 'pemasok',
        label: 'Pemasok',
        sortable: true,
        width: '140px',
      },
    ];

    // Add dynamic date columns
    selectedDates.forEach((dateStr) => {
      cols.push({
        key: `tanggal_${dateStr}`,
        label: formatDisplayDate(dateStr),
        dateKey: dateStr,
        sortable: false,
        width: '110px',
        align: 'center',
      });
    });

    // Summary columns (fixed at right)
    cols.push(
      {
        key: 'totalMasuk',
        label: 'Total Masuk',
        sortable: true,
        width: '110px',
        align: 'center',
        isSummary: true,
      },
      {
        key: 'totalKeluar',
        label: 'Total Keluar',
        sortable: true,
        width: '110px',
        align: 'center',
        isSummary: true,
      },
      {
        key: 'saldoAkhir',
        label: 'Saldo Akhir',
        sortable: true,
        width: '120px',
        align: 'center',
        isSummary: true,
      },
    );

    return cols;
  }, [selectedDates]);

  // Transform data for table rows
  const tableData = useMemo(() => {
    return penggunaData.map((item) => {
      const row = {
        id: item.id,
        namaOvk: item.nama_produk,
        satuan: item.satuan,
        pemasok: item.pemasok || '-',
        totalMasuk: item.total_masuk ?? 0,
        totalKeluar: item.total_keluar ?? 0,
        saldoAkhir: item.saldo_akhir ?? 0,
        stokAwal: item.stok_awal ?? 0,
      };

      // Add dynamic date values with both stok_masuk and stok_keluar
      selectedDates.forEach((dateStr) => {
        const stok = item.stok?.[dateStr];
        row[`tanggal_${dateStr}`] = {
          masuk: stok?.stok_masuk ?? 0,
          keluar: stok?.stok_keluar ?? 0,
        };
      });

      return row;
    });
  }, [penggunaData, selectedDates]);

  return {
    // State
    selectedDates,
    penggunaData,
    loading,
    error,
    // Available dates for picker
    availableDates,
    // Table
    tableColumns,
    tableData,
    // Actions
    handleDateRangeChange,
    refresh: fetchPenggunaData,
  };
};

export default usePenggunaOvk;
