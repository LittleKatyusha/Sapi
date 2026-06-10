import { useState, useMemo, useEffect, useCallback } from 'react';
import ProdukGdsService from '../../../../services/produkGdsService';

const useProdukGDS = () => {
    const [produkGDS, setProdukGDS] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');

    const fetchProdukGDS = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await ProdukGdsService.getData();
            if (response.success) {
                // Map backend data to UI format if needed
                const mappedData = response.data.map(item => ({
                    id: item.kode || item.id,
                    pubid: item.pubid,
                    name: item.name,
                    category: item.category_name || item.category || 'GDS',
                    price: Number(item.price || 0),
                    stock: Number(item.stock || 0),
                    unit: item.unit_name || item.unit || 'Pcs',
                    status: item.is_active !== undefined ? Number(item.is_active) : 1,
                    supplier: item.supplier_name || 'Internal',
                    description: item.description || '',
                    lastUpdated: item.updated_at || item.created_at,
                    minimumStock: Number(item.min_stock || 10),
                    location: item.location || 'Warehouse'
                }));
                setProdukGDS(mappedData);
            } else {
                setError(response.message || 'Gagal mengambil data produk');
            }
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan saat mengambil data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Effect to fetch on mount
    useEffect(() => {
        fetchProdukGDS();
    }, [fetchProdukGDS]);

    // Filter dan search data
    const filteredData = useMemo(() => {
        return produkGDS.filter(item => {
            const matchesSearch = 
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = filterStatus === 'all' || 
                (filterStatus === 'available' && item.stock > 0) ||
                (filterStatus === 'out_of_stock' && item.stock === 0);
                
            const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
            
            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [produkGDS, searchTerm, filterStatus, filterCategory]);

    // Statistics
    const stats = useMemo(() => {
        const total = produkGDS.length;
        const available = produkGDS.filter(item => item.stock > 0).length;
        const outOfStock = produkGDS.filter(item => item.stock === 0).length;
        const lowStock = produkGDS.filter(item => item.stock <= item.minimumStock && item.stock > 0).length;
        const totalValue = produkGDS.reduce((sum, item) => sum + (item.price * item.stock), 0);
        
        return {
            total,
            available,
            outOfStock,
            lowStock,
            totalValue
        };
    }, [produkGDS]);

    // Categories list
    const categories = useMemo(() => {
        const uniqueCategories = [...new Set(produkGDS.map(item => item.category))];
        return uniqueCategories.sort();
    }, [produkGDS]);

    const createProdukGDS = async (produkData) => {
        try {
            const result = await ProdukGdsService.store(produkData);
            if (result.success) {
                await fetchProdukGDS();
            }
            return result;
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    const updateProdukGDS = async (pubid, produkData) => {
        try {
            const result = await ProdukGdsService.update(pubid, produkData);
            if (result.success) {
                await fetchProdukGDS();
            }
            return result;
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    const deleteProdukGDS = async (pubid) => {
        try {
            const result = await ProdukGdsService.delete(pubid);
            if (result.success) {
                await fetchProdukGDS();
            }
            return result;
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    return {
        produkGDS: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        filterCategory,
        setFilterCategory,
        stats,
        categories,
        fetchProdukGDS,
        createProdukGDS,
        updateProdukGDS,
        deleteProdukGDS
    };
};

export default useProdukGDS;
