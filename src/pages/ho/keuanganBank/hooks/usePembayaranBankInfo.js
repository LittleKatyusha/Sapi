import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing payment info card data for Keuangan Bank
 * Fetches data from /api/ho/pengeluaran/show endpoint
 */
export const usePembayaranBankInfo = (pid, getInfoCard) => {
  // State for info card data
  const [infoData, setInfoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Ref to track if we've already fetched the data
  const hasFetchedData = useRef(false);
  
  // Function to reset the fetched data flag (useful for force refresh)
  const resetFetchedDataFlag = useCallback(() => {
    hasFetchedData.current = false;
  }, []);

  // Create default info data structure
  const createDefaultInfoData = (pid, fallbackData = null) => ({
    id_pembayaran: fallbackData?.id_pembayaran || null,
    id_pembelian: fallbackData?.id_pembelian || null,
    purchase_type: fallbackData?.purchase_type || null,
    purchase_type_name: fallbackData?.purchase_type_name || '-',
    due_date: fallbackData?.due_date || null,
    settlement_date: fallbackData?.settlement_date || null,
    payment_status: fallbackData?.payment_status || 0,
    total_tagihan: fallbackData?.total_tagihan || '0',
    total_terbayar: fallbackData?.total_terbayar || '0',
    status_pelunasan: fallbackData?.status_pelunasan || 'belum lunas',
    nota: fallbackData?.nota || '-',
    nota_sistem: fallbackData?.nota_sistem || '-',
    tgl_masuk: fallbackData?.tgl_masuk || null,
    tipe_pembayaran: fallbackData?.tipe_pembayaran || null,
    tipe_pembayaran_name: fallbackData?.tipe_pembayaran_name || 'UNKNOWN',
    pid: fallbackData?.pid || pid
  });

  // Load info card data
  useEffect(() => {
    let isMounted = true;
    
    const fetchInfo = async () => {
      if (pid && !hasFetchedData.current) {
        setLoading(true);
        setError(null);
        
        try {
          const result = await getInfoCard(pid);
          
          // Mark that we've fetched the data to prevent future fetches
          hasFetchedData.current = true;
          
          // Only update state if component is still mounted
          if (isMounted && result.success) {
            const processedData = createDefaultInfoData(pid, result.data);
            setInfoData(processedData);
            setLoading(false);
          } else if (isMounted) {
            console.warn('No info data found for pembayaran bank:', pid);
            setInfoData(createDefaultInfoData(pid));
            setLoading(false);
          }
        } catch (err) {
          // Only update state if component is still mounted
          if (isMounted) {
            console.error('Error fetching pembayaran bank info:', err);
            setError(err.message || 'Gagal memuat info pembayaran bank');
            setInfoData(null);
            setLoading(false);
          }
        }
      }
    };
    
    fetchInfo();
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [pid, getInfoCard]);
  
  // Reset the fetched data flag when PID changes
  useEffect(() => {
    hasFetchedData.current = false;
  }, [pid]);

  return {
    infoData,
    loading,
    error,
    resetFetchedDataFlag
  };
};