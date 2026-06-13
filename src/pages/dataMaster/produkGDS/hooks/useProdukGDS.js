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
            const rows = Array.isArray(response.data) ? response.data : [];
            const mappedData = rows.map(item => ({
                id: item.id || item.pubid || item.kode,
                pubid: item.pubid,
                name: item.name || item.nama || '-',
                category: item.category_name || item.category || item.id_category || 'GDS',
                price: Number(item.price || item.harga || 0),
                stock: Number(item.stock || item.stok || 0),
                unit: item.unit_name || item.unit || item.satuan || 'Pcs',
                status: item.status !== undefined ? Number(item.status) : (item.is_active !== undefined ? Number(item.is_active) : 1),
                supplier: item.supplier_name || item.nama_supplier || 'Internal',
                description: item.description || item.keterangan || '',
                lastUpdated: item.updated_at || item.created_at,
                minimumStock: Number(item.min_stock || item.minimum_stock || 10),
                location: item.location || item.lokasi || 'Warehouse'
            }));
            setProdukGDS(mappedData);
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan saat mengambil data');
        } finally {
            setLoading(false);
        }
    }, []);

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
