import { useState, useEffect, useMemo, useCallback } from 'react';
import { PersediaanOvkService } from '../../../../../services/persediaanOvkService';

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
      const response = await PersediaanOvkService.getPenggunaData(selectedDates);
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

  // Toggle a date selection
  const toggleDate = useCallback((dateStr) => {
    setSelectedDates((prev) => {
      if (prev.includes(dateStr)) {
        // Don't allow deselecting if it would leave 0 dates
        if (prev.length <= 1) return prev;
        return prev.filter((d) => d !== dateStr);
      }
      // Don't allow more than 7 dates
      if (prev.length >= 7) return prev;
      // Add date and sort chronologically
      const next = [...prev, dateStr].sort();
      return next;
    });
  }, []);

  // Select all 7 days
  const selectAllDates = useCallback(() => {
    setSelectedDates(availableDates);
  }, [availableDates]);

  // Clear all except today
  const clearDates = useCallback(() => {
    setSelectedDates([availableDates[6]]); // today is the last one
  }, [availableDates]);

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
        namaOvk: item.namaOvk,
        satuan: item.satuan,
      };

      // Add dynamic date values
      selectedDates.forEach((dateStr) => {
        row[`tanggal_${dateStr}`] = item.tanggal?.[dateStr] ?? '-';
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
    toggleDate,
    selectAllDates,
    clearDates,
    refresh: fetchPenggunaData,
  };
};

export default usePenggunaOvk;
