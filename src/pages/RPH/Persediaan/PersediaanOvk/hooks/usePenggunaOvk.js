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

const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(formatDate(date));
  }
  return days;
};

const usePenggunaOvk = () => {
  // State
  const [selectedDates, setSelectedDates] = useState(getLast7Days);
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

  // Generate available dates (last 7 days) for the date picker
  const availableDates = useMemo(() => getLast7Days(), []);

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
        width: '100px',
      },
    ];

    // Add dynamic date columns
    selectedDates.forEach((dateStr) => {
      cols.push({
        key: `tanggal_${dateStr}`,
        label: formatDisplayDate(dateStr),
        dateKey: dateStr, // the key to look up in data.tanggal object
        sortable: false,
        width: '120px',
        align: 'center',
      });
    });

    return cols;
  }, [selectedDates]);

  // Transform data for table rows
  const tableData = useMemo(() => {
    return penggunaData.map((item) => {
      const row = {
        id: item.id,
        namaOvk: item.nama_produk,
        satuan: item.satuan,
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
