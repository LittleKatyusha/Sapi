import { useState, useMemo } from 'react';

const useEartags = () => {
    // Mock data - dalam implementasi nyata, ini akan menggunakan API
    const [eartags] = useState([
        {
            id: "EAR001",
            jenisHewan: "Sapi",
            status: "Aktif",
            tanggalPemasangan: "",
            deskripsi: "Eartag khusus untuk sapi perah berkualitas tinggi"
        },
        {
            id: "EAR002",
            jenisHewan: "Kambing",
            status: "Aktif",
            tanggalPemasangan: "2024-01-15",
            deskripsi: "Eartag untuk kambing etawa"
        },
        {
            id: "EAR003",
            jenisHewan: "Domba",
            status: "Nonaktif",
            tanggalPemasangan: "2024-02-10",
            deskripsi: "Perlu penggantian komponen sensor"
        },
        {
            id: "EAR004",
            jenisHewan: "Sapi",
            status: "Aktif",
            tanggalPemasangan: "",
            deskripsi: "Eartag cadangan untuk sapi baru"
        },
        {
            id: "EAR005",
            jenisHewan: "Kerbau",
            status: "Aktif",
            tanggalPemasangan: "2024-03-01",
            deskripsi: "Eartag untuk kerbau kerja"
        }
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterJenis, setFilterJenis] = useState('all');

    // Filter dan search data
    const filteredData = useMemo(() => {
        return eartags.filter(item => {
            const matchesSearch = 
                item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.jenisHewan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.deskripsi && item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = filterStatus === 'all' || 
                (filterStatus === 'active' && item.status === 'Aktif') ||
                (filterStatus === 'inactive' && item.status === 'Nonaktif');
            const matchesJenis = filterJenis === 'all' || item.jenisHewan === filterJenis;
            return matchesSearch && matchesStatus && matchesJenis;
        });
    }, [eartags, searchTerm, filterStatus, filterJenis]);

    // Statistics
    const stats = useMemo(() => {
        const total = eartags.length;
        const active = eartags.filter(item => item.status === 'Aktif').length;
        const inactive = eartags.filter(item => item.status === 'Nonaktif').length;
        const inUse = eartags.filter(item => item.tanggalPemasangan).length;
        return {
            total,
            active,
            inactive,
            inUse
        };
    }, [eartags]);

    return {
        eartags: filteredData,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        filterJenis,
        setFilterJenis,
        stats
    };
};

export default useEartags;