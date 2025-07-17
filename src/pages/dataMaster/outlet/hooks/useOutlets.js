import { useState, useMemo } from 'react';

const useOutlets = () => {
    // Mock data untuk outlet - data dummy yang realistis
    const [outlets] = useState([
        {
            id: "OUT001",
            pubid: "outlet-001",
            name: "Outlet Peternakan Maju",
            location: "Jl. Raya Bogor No. 123, Jakarta Timur",
            manager: "Budi Santoso",
            type: "Retail",
            status: 1, // 1 = aktif, 0 = tidak aktif
            phone: "021-8876543",
            description: "Outlet utama untuk penjualan produk sapi segar dan olahan daging",
            openTime: "06:00",
            closeTime: "18:00",
            established: "2020-01-15"
        },
        {
            id: "OUT002", 
            pubid: "outlet-002",
            name: "Outlet Ternak Sejahtera",
            location: "Jl. Sudirman No. 45, Jakarta Selatan",
            manager: "Siti Rahayu",
            type: "Wholesale",
            status: 1,
            phone: "021-7765432",
            description: "Outlet grosir untuk distribusi ke restoran dan hotel",
            openTime: "05:00",
            closeTime: "20:00",
            established: "2019-03-20"
        },
        {
            id: "OUT003",
            pubid: "outlet-003", 
            name: "Outlet Sapi Premium",
            location: "Jl. Kemang Raya No. 88, Jakarta Selatan",
            manager: "Ahmad Wijaya",
            type: "Retail",
            status: 1,
            phone: "021-6654321",
            description: "Outlet khusus produk premium dan organik",
            openTime: "07:00",
            closeTime: "21:00",
            established: "2021-06-10"
        },
        {
            id: "OUT004",
            pubid: "outlet-004",
            name: "Outlet Daging Segar",
            location: "Jl. Fatmawati No. 67, Jakarta Selatan", 
            manager: "Rina Kartika",
            type: "Retail",
            status: 0,
            phone: "021-5543210",
            description: "Sedang dalam renovasi dan upgrade fasilitas",
            openTime: "06:30",
            closeTime: "19:00",
            established: "2018-11-05"
        },
        {
            id: "OUT005",
            pubid: "outlet-005",
            name: "Outlet Ternak Nusantara",
            location: "Jl. Cipete Raya No. 156, Jakarta Selatan",
            manager: "Doni Prasetyo", 
            type: "Wholesale",
            status: 1,
            phone: "021-4432109",
            description: "Pusat distribusi regional untuk wilayah Jakarta dan sekitarnya",
            openTime: "04:00",
            closeTime: "22:00",
            established: "2017-08-30"
        }
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');

    // Filter dan search data
    const filteredData = useMemo(() => {
        return outlets.filter(item => {
            const matchesSearch = 
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = filterStatus === 'all' || 
                (filterStatus === 'active' && item.status === 1) ||
                (filterStatus === 'inactive' && item.status === 0);
                
            const matchesType = filterType === 'all' || item.type === filterType;
            
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [outlets, searchTerm, filterStatus, filterType]);

    // Statistics
    const stats = useMemo(() => {
        const total = outlets.length;
        const active = outlets.filter(item => item.status === 1).length;
        const retail = outlets.filter(item => item.type === 'Retail').length;
        const wholesale = outlets.filter(item => item.type === 'Wholesale').length;
        
        return {
            total,
            active,
            retail,
            wholesale
        };
    }, [outlets]);

    // Simulate API functions
    const fetchOutlets = async () => {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ success: true, data: outlets });
            }, 500);
        });
    };

    const createOutlet = async (outletData) => {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ 
                    success: true, 
                    message: 'Outlet berhasil ditambahkan',
                    data: { ...outletData, id: `OUT${String(outlets.length + 1).padStart(3, '0')}` }
                });
            }, 1000);
        });
    };

    const updateOutlet = async (pubid, outletData) => {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ 
                    success: true, 
                    message: 'Outlet berhasil diperbarui',
                    data: outletData
                });
            }, 1000);
        });
    };

    const deleteOutlet = async (pubid) => {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ 
                    success: true, 
                    message: 'Outlet berhasil dihapus'
                });
            }, 1000);
        });
    };

    return {
        outlets: filteredData,
        loading: false,
        error: null,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        filterType,
        setFilterType,
        stats,
        fetchOutlets,
        createOutlet,
        updateOutlet,
        deleteOutlet
    };
};

export default useOutlets;