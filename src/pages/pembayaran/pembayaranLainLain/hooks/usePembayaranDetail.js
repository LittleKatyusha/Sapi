import { useState, useEffect, useRef, useCallback } from 'react';

export const usePembayaranDetail = (id, getPembayaranDetail) => {
    const [pembayaranData, setPembayaranData] = useState(null);
    const [detailData, setDetailData] = useState([]);
    const [notification, setNotification] = useState(null);
    const hasFetchedData = useRef(false);

    // Refresh function to force re-fetch data from server
    const refreshData = useCallback(async () => {
        if (!id) return { success: false, message: 'No ID provided' };
        
        try {
            // Call getPembayaranDetail to get fresh data from server
            const result = await getPembayaranDetail(id);
            
            if (result.success) {
                // Use data from hook response structure
                const paymentData = result.header || {};  // Header data from hook
                const detailItems = result.data || [];     // Detail data from hook

                if (paymentData) {
                    // Use payment header data from hook response
                    setPembayaranData({
                        id: paymentData.id || paymentData.encryptedPid || paymentData.pid || id,
                        encryptedPid: paymentData.encryptedPid || paymentData.pid || id,
                        id_pembelian: paymentData.id_pembelian || '',
                        purchase_type: paymentData.purchase_type || 5,
                        due_date: paymentData.due_date || '',
                        settlement_date: paymentData.settlement_date || '',
                        payment_status: paymentData.payment_status || 0,
                        created_at: paymentData.created_at || '',
                        updated_at: paymentData.updated_at || '',
                        total_tagihan: paymentData.total_tagihan || 0,
                        total_terbayar: paymentData.total_terbayar || 0,
                        nota: paymentData.pembelian?.nota || '',
                        nota_sistem: paymentData.pembelian?.nota_sistem || ''
                    });
                }

                // Transform detail items for frontend structure
                const transformedDetailItems = detailItems.map((item, index) => ({
                    id: item.id,
                    rowNumber: index + 1,
                    amount: parseFloat(item.amount) || 0,
                    payment_date: item.payment_date || '',
                    note: item.note || item.description || '',
                    created_at: item.created_at || '',
                    updated_at: item.updated_at || ''
                }));

                setDetailData(transformedDetailItems);
                
                return { success: true, data: transformedDetailItems, header: paymentData };
            }
            
            return { success: false, message: 'Failed to refresh data' };
        } catch (err) {
            console.error('Error refreshing pembayaran detail:', err);
            return { success: false, message: err.message || 'Failed to refresh data' };
        }
    }, [id, getPembayaranDetail]);

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
                        // Use data from hook response structure
                        const paymentData = result.header || {};  // Header data from hook
                        const detailItems = result.data || [];     // Detail data from hook

                        if (paymentData) {
                            // Use payment header data from hook response
                            setPembayaranData({
                                id: paymentData.id || paymentData.encryptedPid || paymentData.pid || id,  // Add id field
                                encryptedPid: paymentData.encryptedPid || paymentData.pid || id,
                                id_pembelian: paymentData.id_pembelian || '',
                                purchase_type: paymentData.purchase_type || 5,
                                due_date: paymentData.due_date || '',
                                settlement_date: paymentData.settlement_date || '',
                                payment_status: paymentData.payment_status || 0,
                                created_at: paymentData.created_at || '',
                                updated_at: paymentData.updated_at || '',
                                total_tagihan: paymentData.total_tagihan || 0,
                                total_terbayar: paymentData.total_terbayar || 0,
                                nota: paymentData.pembelian?.nota || '',
                                nota_sistem: paymentData.pembelian?.nota_sistem || ''
                            });
                        } else if (detailItems.length > 0) {
                            // Fallback: use info from first detail item if header not available
                            const firstItem = detailItems[0];
                            setPembayaranData({
                                id: firstItem.id_pembayaran || firstItem.pid || id,  // Add id field
                                encryptedPid: firstItem.pid || id,
                                id_pembelian: firstItem.id_pembelian || '',
                                purchase_type: firstItem.purchase_type || 5,
                                due_date: firstItem.due_date || '',
                                settlement_date: firstItem.settlement_date || '',
                                payment_status: firstItem.payment_status || 0,
                                created_at: firstItem.created_at || '',
                                updated_at: firstItem.updated_at || '',
                                total_tagihan: 0,
                                total_terbayar: 0
                            });
                        } else {
                            // If no data at all
                            setPembayaranData({
                                id: id,  // Add id field
                                encryptedPid: id,
                                id_pembelian: '',
                                purchase_type: 5,
                                due_date: '',
                                settlement_date: '',
                                payment_status: 0,
                                created_at: '',
                                updated_at: '',
                                total_tagihan: 0,
                                total_terbayar: 0
                            });
                        }

                        // Transform detail items for frontend structure
                        const transformedDetailItems = detailItems.map((item, index) => ({
                            id: item.id, // Keep the actual database ID
                            rowNumber: index + 1, // Add row number for display
                            amount: parseFloat(item.amount) || 0,
                            payment_date: item.payment_date || '',
                            note: item.note || item.description || '',
                            created_at: item.created_at || '',
                            updated_at: item.updated_at || ''
                        }));

                        setDetailData(transformedDetailItems);
                    } else if (isMounted) {
                        console.warn('No detail data found for pembayaran:', id);
                        setPembayaranData({
                            id: id,  // Add id field
                            encryptedPid: id,
                            id_pembelian: '',
                            purchase_type: 5,
                            due_date: '',
                            settlement_date: '',
                            payment_status: 0,
                            created_at: '',
                            updated_at: ''
                        });
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
        setPembayaranData,
        detailData,
        setDetailData,
        notification,
        setNotification,
        refreshData  // Export the refresh function
    };
};

export default usePembayaranDetail;