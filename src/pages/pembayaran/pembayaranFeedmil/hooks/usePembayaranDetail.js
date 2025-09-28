import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing payment detail data and state
 */
export const usePembayaranDetail = (id, getPembayaranDetail) => {
  // State for payment data
  const [pembayaranData, setPembayaranData] = useState(null);
  const [detailData, setDetailData] = useState([]);
  const [notification, setNotification] = useState(null);
  
  // Ref to track if we've already fetched the data
  const hasFetchedData = useRef(false);
  
  // Function to reset the fetched data flag (useful for force refresh)
  const resetFetchedDataFlag = useCallback(() => {
    hasFetchedData.current = false;
  }, []);

  // Create default payment data structure
  const createDefaultPaymentData = (id, fallbackData = null) => ({
    encryptedPid: fallbackData?.pid || id,
    id_pembelian: fallbackData?.id_pembelian || '',
    purchase_type: fallbackData?.purchase_type || 2,
    due_date: fallbackData?.due_date || '',
    settlement_date: fallbackData?.settlement_date || '',
    payment_status: fallbackData?.payment_status || 0,
    created_at: fallbackData?.created_at || '',
    updated_at: fallbackData?.updated_at || '',
    total_tagihan: fallbackData?.total_tagihan || 0,
    total_terbayar: fallbackData?.total_terbayar || 0,
    pembelian: fallbackData?.pembelian || null
  });

  // Transform detail items for frontend structure
  const transformDetailItems = (detailItems) => {
    return detailItems.map((item, index) => ({
      id: item.id,
      rowNumber: index + 1,
      amount: parseFloat(item.amount) || 0,
      payment_date: item.payment_date || '',
      note: item.note || item.description || '',
      created_at: item.created_at || '',
      updated_at: item.updated_at || ''
    }));
  };

  // Process payment data from API response
  const processPaymentData = (result, id) => {
    const paymentData = result.header || {};
    const detailItems = result.data || [];

    if (paymentData && Object.keys(paymentData).length > 0) {
      // Use payment header data from hook response
      return createDefaultPaymentData(id, {
        ...paymentData,
        encryptedPid: paymentData.encryptedPid || paymentData.pid || id
      });
    } else if (detailItems.length > 0) {
      // Fallback: use information from first detail item if header not available
      return createDefaultPaymentData(id, detailItems[0]);
    } else {
      // No data available
      return createDefaultPaymentData(id);
    }
  };

  // Load payment detail data
  useEffect(() => {
    let isMounted = true;
    
    const fetchDetail = async () => {
      if (id && !hasFetchedData.current) {
        try {
          const result = await getPembayaranDetail(id);
          
          // Mark that we've fetched the data to prevent future fetches
          hasFetchedData.current = true;
          
          // Only update state if component is still mounted
          if (isMounted && result.success) {
            const processedPaymentData = processPaymentData(result, id);
            const transformedDetailItems = transformDetailItems(result.data || []);

            setPembayaranData(processedPaymentData);
            setDetailData(transformedDetailItems);
          } else if (isMounted) {
            console.warn('No detail data found for pembayaran:', id);
            setPembayaranData(createDefaultPaymentData(id));
            setDetailData([]);
          }
        } catch (err) {
          // Only update state if component is still mounted
          if (isMounted) {
            console.error('Error fetching pembayaran detail:', err);
            setNotification({
              type: 'error',
              message: err.message || 'Gagal memuat detail pembayaran'
            });
            setPembayaranData(null);
            setDetailData([]);
          }
        }
      }
    };
    
    fetchDetail();
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [id, getPembayaranDetail]);
  
  // Reset the fetched data flag when ID changes
  useEffect(() => {
    hasFetchedData.current = false;
  }, [id]);

  // Auto hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return {
    pembayaranData,
    detailData,
    setDetailData,
    notification,
    setNotification,
    resetFetchedDataFlag
  };
};