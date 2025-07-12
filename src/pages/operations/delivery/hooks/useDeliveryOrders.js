import { useState, useCallback } from 'react';
import { DELIVERY_STATUSES } from '../constants';

/**
 * Custom hook for managing delivery order data and operations
 * @param {Array} initialOrders - Initial delivery order data
 * @returns {Object} Delivery order operations and state
 */
export const useDeliveryOrders = (initialOrders = []) => {
    const [orders, setOrders] = useState(initialOrders);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const addOrder = useCallback(async (newOrderData) => {
        setLoading(true);
        setError(null);
        try {
            return new Promise(resolve => {
                setTimeout(() => {
                    const newOrder = {
                        ...newOrderData,
                        id: `SJ-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`,
                        status: DELIVERY_STATUSES.PENDING,
                        completionDate: null,
                    };
                    setOrders(prev => [newOrder, ...prev]);
                    setLoading(false);
                    resolve(newOrder);
                }, 500);
            });
        } catch (err) {
            setError('Failed to add delivery order');
            setLoading(false);
            throw err;
        }
    }, []);

    const updateOrder = useCallback(async (updatedOrderData) => {
        setLoading(true);
        setError(null);
        try {
            return new Promise(resolve => {
                setTimeout(() => {
                    let finalOrder = { ...updatedOrderData };
                    if (finalOrder.status === DELIVERY_STATUSES.COMPLETED && !finalOrder.completionDate) {
                        finalOrder.completionDate = new Date().toISOString().split('T')[0];
                    } else if (finalOrder.status !== DELIVERY_STATUSES.COMPLETED) {
                        finalOrder.completionDate = null;
                    }

                    setOrders(prev => prev.map(o => o.id === finalOrder.id ? finalOrder : o));
                    setLoading(false);
                    resolve(finalOrder);
                }, 500);
            });
        } catch (err) {
            setError('Failed to update delivery order');
            setLoading(false);
            throw err;
        }
    }, []);

    const deleteOrder = useCallback(async (orderId) => {
        setLoading(true);
        setError(null);
        try {
            return new Promise(resolve => {
                setTimeout(() => {
                    setOrders(prev => prev.filter(o => o.id !== orderId));
                    setLoading(false);
                    resolve();
                }, 500);
            });
        } catch (err) {
            setError('Failed to delete delivery order');
            setLoading(false);
            throw err;
        }
    }, []);

    return { 
        orders, 
        addOrder, 
        updateOrder, 
        deleteOrder, 
        loading,
        error 
    };
};
