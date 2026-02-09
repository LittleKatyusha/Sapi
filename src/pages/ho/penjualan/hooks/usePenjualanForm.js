import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HttpClient from '../../../../services/httpClient';
import { extractApiData } from '../utils/apiHelpers';
import { PENJUALAN_ROUTES } from '../constants/routes';

/**
 * Custom hook that manages the penjualan form state and submission logic
 * @returns {object} Form state and handlers
 */
const usePenjualanForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        jenisPenjualan: null,
        pembeli: null,
        namaSupir: '',
        platNomor: '',
        tipePembayaran: null,
        keterangan: ''
    });

    const [detailProduk, setDetailProduk] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [isProdukModalOpen, setIsProdukModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);

    // Fetch existing penjualan data in edit mode
    useEffect(() => {
        if (isEditMode && id) {
            const fetchPenjualanDetail = async () => {
                setLoading(true);
                try {
                    const response = await HttpClient.get(`/api/ho/penjualan/detail/${id}`);
                    const data = response?.data?.data || response?.data || response;
                    if (data) {
                        setFormData({
                            jenisPenjualan: data.jenisPenjualan || data.jenis_penjualan || null,
                            pembeli: data.pembeli || null,
                            namaSupir: data.nama_supir || data.namaSupir || '',
                            platNomor: data.plat_nomor || data.platNomor || '',
                            tipePembayaran: data.tipePembayaran || data.tipe_pembayaran || null,
                            keterangan: data.keterangan || ''
                        });
                        const items = data.items || data.detail_produk || data.detailProduk || [];
                        setDetailProduk(Array.isArray(items) ? items : []);
                    }
                } catch (error) {
                    console.error('Error fetching penjualan detail:', error);
                    setNotification({ type: 'error', message: 'Gagal memuat data penjualan' });
                } finally {
                    setLoading(false);
                }
            };
            fetchPenjualanDetail();
        }
    }, [isEditMode, id]);

    // Notification auto-dismiss logic
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const priceInfo = useMemo(() => {
        let totalBeli = 0;
        let totalJual = 0;

        detailProduk.forEach(item => {
            const qty = parseFloat(item.qty) || 0;
            const hargaBeli = item.produk?.hargaBeli || 0;
            const hargaJual = item.produk?.hargaJual || 0;
            totalBeli += hargaBeli * qty;
            totalJual += hargaJual * qty;
        });

        const labaRugi = totalJual - totalBeli;
        return { hargaBeli: totalBeli, hargaJual: totalJual, labaRugi, isProfit: labaRugi >= 0 };
    }, [detailProduk]);

    const handleSelectChange = useCallback((field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            if (field === 'jenisPenjualan') newData.produk = null;
            return newData;
        });
    }, []);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleProdukSelect = useCallback((produk) => {
        if (editingIndex !== null) {
            // Update existing item
            setDetailProduk(prev => prev.map((item, i) =>
                i === editingIndex ? { ...item, produk } : item
            ));
            setEditingIndex(null);
        } else {
            // Duplicate check — if product already exists, show notification error
            const isDuplicate = detailProduk.some(
                item => (item.produk?.id || item.produk?.value) === (produk.id || produk.value)
            );
            if (isDuplicate) {
                setNotification({ type: 'error', message: 'Produk sudah ada dalam daftar' });
                return;
            }
            // Add new item
            setDetailProduk(prev => [...prev, { produk, qty: '' }]);
        }
    }, [editingIndex, detailProduk]);

    const handleQtyChange = useCallback((index, value) => {
        // Immutable state update
        setDetailProduk(prev => prev.map((item, i) =>
            i === index ? { ...item, qty: value } : item
        ));
    }, []);

    const handleRemoveDetail = useCallback((index) => {
        setDetailProduk(prev => prev.filter((_, i) => i !== index));
    }, []);

    const openProdukModal = useCallback((index = null) => {
        if (!formData.jenisPenjualan) {
            setNotification({ type: 'error', message: 'Pilih jenis penjualan terlebih dahulu' });
            return;
        }
        setEditingIndex(index);
        setIsProdukModalOpen(true);
    }, [formData.jenisPenjualan]);

    const closeProdukModal = useCallback(() => {
        setIsProdukModalOpen(false);
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!formData.jenisPenjualan) { setNotification({ type: 'error', message: 'Pilih jenis penjualan' }); return; }
        if (!formData.pembeli) { setNotification({ type: 'error', message: 'Pilih pembeli' }); return; }
        if (!formData.namaSupir.trim()) { setNotification({ type: 'error', message: 'Masukkan nama supir' }); return; }
        if (!formData.platNomor.trim()) { setNotification({ type: 'error', message: 'Masukkan plat nomor' }); return; }
        if (!formData.tipePembayaran) { setNotification({ type: 'error', message: 'Pilih tipe pembayaran' }); return; }
        if (detailProduk.length === 0) { setNotification({ type: 'error', message: 'Tambahkan minimal satu produk' }); return; }

        // Validate each detail item
        for (let i = 0; i < detailProduk.length; i++) {
            if (!detailProduk[i].qty || parseFloat(detailProduk[i].qty) <= 0) {
                setNotification({ type: 'error', message: `Masukkan jumlah yang valid untuk produk ${i + 1}` });
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                id_jenis_penjualan: formData.jenisPenjualan?.id_jenis || formData.jenisPenjualan?.value,
                id_pembeli: formData.pembeli?.value,
                nama_supir: formData.namaSupir,
                plat_nomor: formData.platNomor,
                tipe_pembayaran: formData.tipePembayaran?.value,
                keterangan: formData.keterangan,
                items: detailProduk.map(item => ({
                    id_produk: parseInt(item.produk?.id || item.produk?.value, 10),
                    jumlah: parseFloat(item.qty) || 0,
                    harga_beli: item.produk?.hargaBeli || item.produk?.harga_beli || 0,
                    harga_jual: item.produk?.hargaJual || item.produk?.harga_jual || 0,
                    persentase: item.produk?.persentase || 0,
                    subtotal: (item.produk?.hargaJual || item.produk?.harga_jual || 0) * (parseFloat(item.qty) || 0)
                }))
            };

            if (isEditMode) {
                await HttpClient.post(`/api/ho/penjualan/update/${id}`, payload);
                setNotification({ type: 'success', message: 'Penjualan berhasil diperbarui!' });
            } else {
                await HttpClient.post('/api/ho/penjualan/store', payload);
                setNotification({ type: 'success', message: 'File penjualan berhasil dibuat!' });
            }

            setTimeout(() => navigate(PENJUALAN_ROUTES.LIST), 1500);
        } catch (error) {
            setNotification({ type: 'error', message: error.message || 'Terjadi kesalahan saat menyimpan data' });
        } finally {
            setLoading(false);
        }
    }, [formData, detailProduk, isEditMode, id, navigate]);

    const handleBack = useCallback(() => {
        navigate(PENJUALAN_ROUTES.LIST);
    }, [navigate]);

    return {
        // State
        formData,
        detailProduk,
        loading,
        notification,
        isProdukModalOpen,
        editingIndex,
        isEditMode,
        priceInfo,
        id,

        // Handlers
        handleSelectChange,
        handleInputChange,
        handleProdukSelect,
        handleQtyChange,
        handleRemoveDetail,
        handleSubmit,
        handleBack,
        openProdukModal,
        closeProdukModal,
        setNotification,
    };
};

export default usePenjualanForm;