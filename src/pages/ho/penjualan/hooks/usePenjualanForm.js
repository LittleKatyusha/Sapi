import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
    const hasFetchedRef = useRef(false);

    const [formData, setFormData] = useState({
        jenisPenjualan: null,
        pembeli: null,
        namaSupir: '',
        platNomor: '',
        tipePembayaran: null,
        namaPenerima: '',
        keterangan: ''
    });

    const [detailProduk, setDetailProduk] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [isProdukModalOpen, setIsProdukModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);

    // Jenis penjualan options (must match the ones in AddEditPenjualanPage)
    const jenisPenjualanOptions = useMemo(() => [
        { value: 1, label: 'Feedmil', id_jenis: 1 },
        { value: 2, label: 'OVK', id_jenis: 2 },
    ], []);

    // Fetch existing penjualan data in edit mode
    useEffect(() => {
        if (isEditMode && id && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            const fetchPenjualanDetail = async () => {
                setLoading(true);
                try {
                    const response = await HttpClient.post('/api/ho/penjualan/show', { pid: id });

                    // The API returns { status, data: [...], message }
                    // Extract the first record from data array
                    const rawData = response?.data || response;
                    const dataArray = Array.isArray(rawData) ? rawData : (rawData?.data || []);
                    const record = Array.isArray(dataArray) ? dataArray[0] : dataArray;

                    if (!record) {
                        setNotification({ type: 'error', message: 'Data penjualan tidak ditemukan' });
                        return;
                    }

                    // Map id_jenis_penjualan_ho to the select option
                    const idJenis = record.id_jenis_penjualan_ho;
                    const matchedJenis = jenisPenjualanOptions.find(opt => opt.value === idJenis) || null;

                    // Map pembeli using id_pembeli — fetch pembeli list and match
                    let pembeliValue = null;
                    if (record.id_pembeli) {
                        try {
                            const pembeliResponse = await HttpClient.get('/api/master/pembeliho/data');
                            const pembeliList = extractApiData(pembeliResponse);
                            const matchedPembeli = pembeliList.find(p => (p.id || p.ID) === record.id_pembeli);
                            if (matchedPembeli) {
                                pembeliValue = {
                                    value: matchedPembeli.id || matchedPembeli.ID,
                                    label: matchedPembeli.nama || matchedPembeli.NAME || matchedPembeli.name || matchedPembeli.label,
                                    ...matchedPembeli
                                };
                            } else {
                                pembeliValue = {
                                    value: record.id_pembeli,
                                    label: record.nama_pembeli || `Pembeli #${record.id_pembeli}`
                                };
                            }
                        } catch (pembeliError) {
                            console.error('Error fetching pembeli for edit:', pembeliError);
                            pembeliValue = {
                                value: record.id_pembeli,
                                label: record.nama_pembeli || `Pembeli #${record.id_pembeli}`
                            };
                        }
                    }

                    // Map tipe_pembayaran — fetch from parameter API and match by value
                    let tipePembayaranValue = null;
                    if (record.tipe_pembayaran != null) {
                        try {
                            const tipeResponse = await HttpClient.post('/api/system/parameter/dataByGroup', { group: 'tipe_pembayaran' });
                            const tipeList = extractApiData(tipeResponse);
                            const matchedTipe = tipeList.find(t => t.value == record.tipe_pembayaran);
                            if (matchedTipe) {
                                tipePembayaranValue = {
                                    value: matchedTipe.value,
                                    label: matchedTipe.name,
                                    pubid: matchedTipe.pubid,
                                    ...matchedTipe
                                };
                            } else {
                                tipePembayaranValue = {
                                    value: record.tipe_pembayaran,
                                    label: `Tipe #${record.tipe_pembayaran}`
                                };
                            }
                        } catch (tipeError) {
                            console.error('Error fetching tipe pembayaran for edit:', tipeError);
                            tipePembayaranValue = {
                                value: record.tipe_pembayaran,
                                label: `Tipe #${record.tipe_pembayaran}`
                            };
                        }
                    }

                    setFormData({
                        jenisPenjualan: matchedJenis,
                        pembeli: pembeliValue,
                        namaSupir: record.nama_supir || '',
                        platNomor: record.plat_nomor || '',
                        tipePembayaran: tipePembayaranValue,
                        namaPenerima: record.nama_penerima || '',
                        keterangan: record.keterangan || ''
                    });

                    // Map detail items — need to fetch product data to get prices
                    const details = record.detail || record.items || record.detail_produk || [];
                    if (Array.isArray(details) && details.length > 0 && matchedJenis) {
                        try {
                            // Fetch product list for this jenis penjualan to enrich detail items
                            const produkResponse = await HttpClient.post(
                                '/api/ho/penjualan/getProdukByJenisPenjualan',
                                { id_jenis: matchedJenis.id_jenis }
                            );
                            const produkList = extractApiData(produkResponse);

                            // Build a map of id_produk -> produk data
                            const produkMap = {};
                            produkList.forEach(p => {
                                produkMap[p.id] = p;
                            });

                            // Map each detail to the format expected by ProdukDetailTable
                            const mappedDetails = details.map(item => {
                                const produkData = produkMap[item.id_produk];
                                return {
                                    produk: produkData ? {
                                        id: produkData.id,
                                        value: produkData.id,
                                        label: produkData.NAME,
                                        hargaBeli: produkData.harga_beli,
                                        hargaJual: produkData.harga_jual,
                                        persentase: produkData.persentase,
                                        produk: produkData.produk
                                    } : {
                                        id: item.id_produk,
                                        value: item.id_produk,
                                        label: `Produk #${item.id_produk}`,
                                        hargaBeli: 0,
                                        hargaJual: 0,
                                        persentase: 0,
                                        produk: '-'
                                    },
                                    qty: item.jumlah != null ? String(item.jumlah) : ''
                                };
                            });

                            setDetailProduk(mappedDetails);
                        } catch (produkError) {
                            console.error('Error fetching produk for edit:', produkError);
                            // Fallback: set details without enrichment
                            const fallbackDetails = details.map(item => ({
                                produk: {
                                    id: item.id_produk,
                                    value: item.id_produk,
                                    label: `Produk #${item.id_produk}`,
                                    hargaBeli: 0,
                                    hargaJual: 0,
                                    persentase: 0,
                                    produk: '-'
                                },
                                qty: item.jumlah != null ? String(item.jumlah) : ''
                            }));
                            setDetailProduk(fallbackDetails);
                        }
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
    }, [isEditMode, id, jenisPenjualanOptions]);

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
        // Clear all detail produk when jenis penjualan changes
        if (field === 'jenisPenjualan') {
            setDetailProduk([]);
        }
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
                nama_penerima: formData.namaPenerima,
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