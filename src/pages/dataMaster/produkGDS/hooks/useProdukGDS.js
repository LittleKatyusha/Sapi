import { useState, useMemo } from 'react';

const useProdukGDS = () => {
    // Mock data untuk produk GDS - data dummy yang realistis
    const [produkGDS] = useState([
        {
            id: "PRD001",
            pubid: "produk-001",
            name: "Daging Sapi Premium A5",
            category: "Daging Sapi",
            price: 150000,
            stock: 250,
            unit: "Kg",
            status: 1, // 1 = tersedia, 0 = habis
            supplier: "PT. Sumber Rejeki",
            description: "Daging sapi premium grade A5 dengan marbling terbaik, cocok untuk steak dan BBQ",
            lastUpdated: "2024-01-14",
            minimumStock: 50,
            location: "Gudang A - Rak 1"
        },
        {
            id: "PRD002", 
            pubid: "produk-002",
            name: "Daging Sapi Rendang",
            category: "Daging Sapi",
            price: 120000,
            stock: 180,
            unit: "Kg",
            status: 1,
            supplier: "CV. Ternak Nusantara",
            description: "Daging sapi pilihan untuk rendang dan gulai, tekstur empuk dan rasa autentik",
            lastUpdated: "2024-01-13",
            minimumStock: 30,
            location: "Gudang A - Rak 2"
        },
        {
            id: "PRD003",
            pubid: "produk-003", 
            name: "Daging Kambing Muda",
            category: "Daging Kambing",
            price: 135000,
            stock: 75,
            unit: "Kg",
            status: 1,
            supplier: "UD. Kambing Sejahtera",
            description: "Daging kambing muda segar, ideal untuk sate, gulai, dan tongseng",
            lastUpdated: "2024-01-12",
            minimumStock: 20,
            location: "Gudang B - Rak 1"
        },
        {
            id: "PRD004",
            pubid: "produk-004",
            name: "Daging Domba Import",
            category: "Daging Domba",
            price: 180000,
            stock: 0,
            unit: "Kg",
            status: 0,
            supplier: "PT. Import Premium",
            description: "Daging domba import Australia, kualitas premium untuk fine dining",
            lastUpdated: "2024-01-10",
            minimumStock: 15,
            location: "Gudang C - Rak 1"
        },
        {
            id: "PRD005",
            pubid: "produk-005",
            name: "Jeroan Sapi Mix",
            category: "Jeroan",
            price: 45000,
            stock: 120,
            unit: "Kg",
            status: 1,
            supplier: "CV. Ternak Nusantara",
            description: "Campuran jeroan sapi segar (hati, limpa, usus) untuk soto dan gule",
            lastUpdated: "2024-01-14",
            minimumStock: 25,
            location: "Gudang A - Rak 3"
        },
        {
            id: "PRD006",
            pubid: "produk-006",
            name: "Tulang Sapi Sumsum",
            category: "Tulang",
            price: 35000,
            stock: 95,
            unit: "Kg",
            status: 1,
            supplier: "PT. Sumber Rejeki",
            description: "Tulang sapi dengan sumsum untuk kaldu dan sup, kaya nutrisi",
            lastUpdated: "2024-01-13",
            minimumStock: 20,
            location: "Gudang B - Rak 2"
        }
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');

    // Filter dan search data
    const filteredData = useMemo(() => {
        return produkGDS.filter(item => {
            const matchesSearch = 
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = filterStatus === 'all' || 
                (filterStatus === 'available' && item.status === 1) ||
                (filterStatus === 'out_of_stock' && item.status === 0);
                
            const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
            
            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [produkGDS, searchTerm, filterStatus, filterCategory]);

    // Statistics
    const stats = useMemo(() => {
        const total = produkGDS.length;
        const available = produkGDS.filter(item => item.status === 1).length;
        const outOfStock = produkGDS.filter(item => item.status === 0).length;
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

    // Simulate API functions
    const fetchProdukGDS = async () => {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ success: true, data: produkGDS });
            }, 500);
        });
    };

    const createProdukGDS = async (produkData) => {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ 
                    success: true, 
                    message: 'Produk berhasil ditambahkan',
                    data: { ...produkData, id: `PRD${String(produkGDS.length + 1).padStart(3, '0')}` }
                });
            }, 1000);
        });
    };

    const updateProdukGDS = async (pubid, produkData) => {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ 
                    success: true, 
                    message: 'Produk berhasil diperbarui',
                    data: produkData
                });
            }, 1000);
        });
    };

    const deleteProdukGDS = async (pubid) => {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ 
                    success: true, 
                    message: 'Produk berhasil dihapus'
                });
            }, 1000);
        });
    };

    const updateStock = async (pubid, newStock) => {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ 
                    success: true, 
                    message: 'Stok berhasil diperbarui',
                    data: { stock: newStock }
                });
            }, 800);
        });
    };

    return {
        produkGDS: filteredData,
        loading: false,
        error: null,
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
        deleteProdukGDS,
        updateStock
    };
};

export default useProdukGDS;