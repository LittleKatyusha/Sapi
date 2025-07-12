import { useState, useCallback } from 'react';

/**
 * Custom hook for managing purchase data and operations
 * @param {Array} initialPurchases - Initial purchase data
 * @returns {Object} Purchase operations and state
 */
export const usePurchases = (initialPurchases = []) => {
    const [purchases, setPurchases] = useState(initialPurchases);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const addPurchase = useCallback((newItemData) => {
        setLoading(true);
        setError(null);
        
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const newItem = {
                        ...newItemData,
                        id: `TXN-P-${String(Math.floor(Math.random() * 9000) + 1000)}`,
                    };
                    setPurchases(prev => [newItem, ...prev]);
                    setLoading(false);
                    resolve(newItem);
                } catch (err) {
                    setError('Gagal menambahkan transaksi pembelian');
                    setLoading(false);
                    reject(err);
                }
            }, 500);
        });
    }, []);

    const updatePurchase = useCallback((updatedItemData) => {
        setLoading(true);
        setError(null);
        
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    setPurchases(prev => 
                        prev.map(item => 
                            item.id === updatedItemData.id ? updatedItemData : item
                        )
                    );
                    setLoading(false);
                    resolve(updatedItemData);
                } catch (err) {
                    setError('Gagal memperbarui transaksi pembelian');
                    setLoading(false);
                    reject(err);
                }
            }, 500);
        });
    }, []);

    const deletePurchase = useCallback((purchaseId) => {
        setLoading(true);
        setError(null);
        
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    setPurchases(prev => prev.filter(item => item.id !== purchaseId));
                    setLoading(false);
                    resolve();
                } catch (err) {
                    setError('Gagal menghapus transaksi pembelian');
                    setLoading(false);
                    reject(err);
                }
            }, 500);
        });
    }, []);

    return { 
        purchases, 
        addPurchase, 
        updatePurchase, 
        deletePurchase, 
        loading,
        error 
    };
};
