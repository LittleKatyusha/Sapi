import { useState, useMemo } from 'react';

const usePelanggan = () => {
    // Mock data untuk pelanggan - data dummy yang realistis
    const [pelanggan] = useState([
        {
            id: "CUST001",
            pubid: "pelanggan-001",
            name: "PT. Sumber Rejeki",
            email: "info@sumberrejeki.com",
            phone: "021-8876543",
            address: "Jl. Raya Jakarta No. 123, Jakarta Timur",
            type: "Premium",
            status: 1, // 1 = aktif, 0 = tidak aktif
            joinDate: "2020-01-15",
            totalOrders: 145,
            lastOrder: "2024-01-10",
            creditLimit: 50000000,
            description: "Perusahaan distributor daging premium dengan jaringan restoran di Jakarta"
        },
        {
            id: "CUST002", 
            pubid: "pelanggan-002",
            name: "Warung Sate Pak Joko",
            email: "satepakjoko@gmail.com",
            phone: "081234567890",
            address: "Jl. Kemang Raya No. 45, Jakarta Selatan",
            type: "Regular",
            status: 1,
            joinDate: "2021-03-20",
            totalOrders: 89,
            lastOrder: "2024-01-12",
            creditLimit: 5000000,
            description: "Warung sate tradisional yang sudah berdiri sejak 1995"
        },
        {
            id: "CUST003",
            pubid: "pelanggan-003", 
            name: "Hotel Grand Indonesia",
            email: "procurement@grandindonesia.com",
            phone: "021-7765432",
            address: "Jl. MH Thamrin No. 1, Jakarta Pusat",
            type: "Premium",
            status: 1,
            joinDate: "2019-06-10",
            totalOrders: 267,
            lastOrder: "2024-01-13",
            creditLimit: 100000000,
            description: "Hotel bintang 5 dengan kebutuhan daging premium untuk restaurant dan banquet"
        },
        {
            id: "CUST004",
            pubid: "pelanggan-004",
            name: "Ibu Sarah",
            email: "sarah.rumahan@gmail.com", 
            phone: "085678901234",
            address: "Jl. Fatmawati No. 67, Jakarta Selatan",
            type: "Regular",
            status: 0,
            joinDate: "2022-11-05",
            totalOrders: 23,
            lastOrder: "2023-12-20",
            creditLimit: 2000000,
            description: "Pelanggan individual untuk kebutuhan rumah tangga"
        },
        {
            id: "CUST005",
            pubid: "pelanggan-005",
            name: "Restoran Padang Sederhana",
            email: "padangsederhana@yahoo.com",
            phone: "021-4432109",
            address: "Jl. Cipete Raya No. 156, Jakarta Selatan",
            type: "Regular", 
            status: 1,
            joinDate: "2020-08-30",
            totalOrders: 178,
            lastOrder: "2024-01-11",
            creditLimit: 15000000,
            description: "Restoran Padang dengan 3 cabang di Jakarta, supplier daging rendang dan gulai"
        },
        {
            id: "CUST006",
            pubid: "pelanggan-006",
            name: "Catering Bunda Bahagia",
            email: "bundabahagia.catering@gmail.com",
            phone: "081987654321",
            address: "Jl. Pondok Indah No. 88, Jakarta Selatan",
            type: "Premium",
            status: 1,
            joinDate: "2021-05-15",
            totalOrders: 234,
            lastOrder: "2024-01-14",
            creditLimit: 25000000,
            description: "Catering untuk acara corporate dan wedding dengan kapasitas besar"
        }
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');

    // Filter dan search data
    const filteredData = useMemo(() => {
        return pelanggan.filter(item => {
            const matchesSearch = 
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = filterStatus === 'all' || 
                (filterStatus === 'active' && item.status === 1) ||
                (filterStatus === 'inactive' && item.status === 0);
                
            const matchesType = filterType === 'all' || item.type === filterType;
            
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [pelanggan, searchTerm, filterStatus, filterType]);

    // Statistics
    const stats = useMemo(() => {
        const total = pelanggan.length;
        const active = pelanggan.filter(item => item.status === 1).length;
        const regular = pelanggan.filter(item => item.type === 'Regular').length;
        const premium = pelanggan.filter(item => item.type === 'Premium').length;
        const totalOrders = pelanggan.reduce((sum, item) => sum + item.totalOrders, 0);
        
        return {
            total,
            active,
            regular, 
            premium,
            totalOrders
        };
    }, [pelanggan]);

    // Simulate API functions
    const fetchPelanggan = async () => {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ success: true, data: pelanggan });
            }, 500);
        });
    };

    const createPelanggan = async (pelangganData) => {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ 
                    success: true, 
                    message: 'Pelanggan berhasil ditambahkan',
                    data: { ...pelangganData, id: `CUST${String(pelanggan.length + 1).padStart(3, '0')}` }
                });
            }, 1000);
        });
    };

    const updatePelanggan = async (pubid, pelangganData) => {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ 
                    success: true, 
                    message: 'Pelanggan berhasil diperbarui',
                    data: pelangganData
                });
            }, 1000);
        });
    };

    const deletePelanggan = async (pubid) => {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ 
                    success: true, 
                    message: 'Pelanggan berhasil dihapus'
                });
            }, 1000);
        });
    };

    return {
        pelanggan: filteredData,
        loading: false,
        error: null,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        filterType,
        setFilterType,
        stats,
        fetchPelanggan,
        createPelanggan,
        updatePelanggan,
        deletePelanggan
    };
};

export default usePelanggan;