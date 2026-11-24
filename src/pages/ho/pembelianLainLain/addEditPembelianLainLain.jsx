import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Edit2, Building2, Calendar, Hash, Package, X, AlertCircle, Weight, DollarSign, Upload } from 'lucide-react';
import usePembelianLainLain from './hooks/usePembelianLainLain';
import useParameterSelect from '../pembelian/hooks/useParameterSelect';
import useFarmAPI from './hooks/useFarmAPI';
import useJenisPembelianLainLain from './hooks/useJenisPembelianLainLain';
import useItemLainLainSelect from './hooks/useItemLainLainSelect';
import useBanksAPI from '../pembelianFeedmil/hooks/useBanksAPI';
import useTipePembayaran from '../../../hooks/useTipePembayaran';
import useKlasifikasiLainLain from '../../dataMaster/klasifikasiLainLain/hooks/useKlasifikasiLainLain';
import SearchableSelect from '../../../components/shared/SearchableSelect';
import HttpClient from '../../../services/httpClient';
import { API_ENDPOINTS } from '../../../config/api';
import AddEditDetailModal from './modals/AddEditDetailModal';

const SKEMA_PEMBELIAN_ASET_OPTIONS = [
    { value: 'biasa', label: 'Pembelian Biasa / Tempo Supplier (< 1 Tahun - Hutang Vendor 2110)' },
    { value: 'leasing_pendek', label: 'Kredit Leasing / Pembiayaan (< 1 Tahun - Hutang Bank Jangka Pendek 2130)' },
    { value: 'leasing', label: 'Kredit Leasing / Pembiayaan (> 1 Tahun - Hutang Leasing 2520)' },
];

/**
 * Kategori aset tetap disimpan sebagai klasifikasi lain-lain dengan nama
 * berawalan "Aset Tetap - ..." (lihat migration 2026_11_24_000019).
 * Kolom `description` menandai kelompok susut / tidak susut.
 */
const ASET_TETAP_NAME_PREFIX = 'aset tetap';

const isAsetTetapKlasifikasi = (item) => {
    const name = String(item?.name || '').trim().toLowerCase();
    return name.startsWith(ASET_TETAP_NAME_PREFIX);
};

const isAsetTidakDisusutkan = (item) => {
    const description = String(item?.description || '').toUpperCase();
    return description.includes('TIDAK DISUSUTKAN');
};

const createEmptyAsetItem = () => ({
    id: 'aset-item-1',
    item_name: '',
    item_name_id: null,
    id_klasifikasi_lainlain: null,
    berat: 1,
    harga: 0,
    persentase: 0,
    hpp: 0,
    total_harga: 0,
    catatan: '',
    peruntukan: '',
});


const AddEditPembelianLainLainPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isFeedmillContext = location.pathname.startsWith('/feedmil/');
    const basePath = isFeedmillContext ? '/feedmil/pembelian-lain-lain' : '/ho/pembelian-lain-lain';
    const isEdit = Boolean(id);
    
    // Flag to prevent multiple API calls in edit mode
    const editDataLoaded = useRef(false);
    
    const {
        createPembelian,
        updatePembelian
    } = usePembelianLainLain();

    // Parameter Select integration - centralized data from ParameterSelectController
    const {
        supplierOptions,
        officeOptions,
        loading: parameterLoading,
        error: parameterError
    } = useParameterSelect(isEdit, { kategoriSupplier: 5 }, [], null, ['supplier', 'office']);

    const feedmillOffice = useMemo(() => officeOptions.find(option => {
        const label = String(option.label || '').toLowerCase().replace(/[^a-z]/g, '');
        return label === 'feedmil' || label === 'feedmill';
    }), [officeOptions]);

    // Farm data integration - uses PARAMETER_SELECT endpoint for farm-only data
    const {
        farmOptions,
        loading: farmLoading,
        error: farmError
    } = useFarmAPI();

    const feedmillFarm = useMemo(() => farmOptions.find(option => {
        const label = String(option.label || '').toLowerCase().replace(/[^a-z]/g, '');
        return label === 'feedmil' || label === 'feedmill';
    }), [farmOptions]);

    // Item Lain-Lain data integration - now supports filtering by classification
    const [selectedKlasifikasiForItems, setSelectedKlasifikasiForItems] = useState(null);
    const {
        itemLainLainOptions,
        loading: itemLainLainLoading,
        fetchItemLainLain
    } = useItemLainLainSelect(selectedKlasifikasiForItems);

    // Jenis Pembelian Lain-Lain API integration
    const {
        jenisPembelianOptions
    } = useJenisPembelianLainLain();

    // Bank API integration for Syarat Pembelian
    const {
        bankOptions,
        loading: bankLoading,
        error: bankError
    } = useBanksAPI();

    // Tipe Pembayaran API integration
    const {
        tipePembayaranOptions,
        loading: tipePembayaranLoading,
        error: tipePembayaranError
    } = useTipePembayaran();

    // Klasifikasi Lain Lain API integration
    const {
        klasifikasiLainLain,
        loading: klasifikasiLoading,
        error: klasifikasiError,
        fetchKlasifikasiLainLain
    } = useKlasifikasiLainLain();

    // Transform klasifikasi lain lain data to options format
    const klasifikasiLainLainOptions = useMemo(() => {
        const options = (klasifikasiLainLain || []).map(item => ({
            // Use numeric id as value for backend
            value: item.id || item.pid || item.pubid,
            label: item.name || item.nama || '',
            // Keep numeric ID explicitly
            numericId: item.id,
            // Keep encrypted pid for other operations if needed
            pid: item.pid || item.pubid
        }));
        
        return options;
    }, [klasifikasiLainLain]);

    // Pilihan Kategori Aset Tetap (A. Disusutkan / B. Tidak Disusutkan)
    const kategoriAsetOptions = useMemo(() => {
        return (klasifikasiLainLain || [])
            .filter(isAsetTetapKlasifikasi)
            .sort((a, b) => {
                const groupA = isAsetTidakDisusutkan(a) ? 1 : 0;
                const groupB = isAsetTidakDisusutkan(b) ? 1 : 0;
                if (groupA !== groupB) {
                    return groupA - groupB;
                }
                return String(a.name || '').localeCompare(String(b.name || ''));
            })
            .map(item => {
                const susut = !isAsetTidakDisusutkan(item);
                const shortName = String(item.name || '').replace(/^aset tetap\s*-\s*/i, '');
                return {
                    value: item.id,
                    label: `${shortName} (${susut ? 'disusutkan' : 'tidak disusutkan'})`,
                    name: item.name,
                    susut,
                };
            });
    }, [klasifikasiLainLain]);

    // Fetch klasifikasi lain lain data on component mount
    useEffect(() => {
        // length besar agar seluruh klasifikasi (termasuk kategori Aset Tetap) ikut termuat
        fetchKlasifikasiLainLain({ length: 500 });
    }, [fetchKlasifikasiLainLain]);

    // Header form state
    const [headerData, setHeaderData] = useState({
        nota: '',
        idOffice: '', // Office now selectable
        tipePembelian: '2', // Auto-set to "ASET" (value: "2")
        kategoriAset: '', // Kategori Aset Tetap (disusutkan / tidak disusutkan)
        idSupplier: '',
        tgl_masuk: '',
        jumlah: '', // Jumlah Total (mapped to total quantity, not berat_total)
        biaya_lain: '',
        biaya_total: '', // Added: Total biaya keseluruhan
        farm: '', // Farm
        syarat_pembelian: '', // Syarat Pembelian
        nota_ho: '', // Nomor Nota HO
        file: '',
        fileName: '',
        tipe_pembayaran: '', // Added: Tipe pembayaran
        due_date: '', // Added: Jatuh tempo payment
        isLeasing: false, // Skema: false = Hutang Vendor (2110), true = Leasing (2130 < 1 tahun / 2520 > 1 tahun)
        namaLeasing: '', // Nama leasing jika isLeasing true
        jangkaWaktu: '', // 'pendek' (< 1 tahun) atau 'panjang' (> 1 tahun)
        note: '' // Added: Required note field
    });

    useEffect(() => {
        if (isFeedmillContext && feedmillOffice && feedmillFarm) {
            setHeaderData(prev => ({
                ...prev,
                idOffice: feedmillOffice.value,
                farm: feedmillFarm.value
            }));
        }
    }, [feedmillFarm, feedmillOffice, isFeedmillContext]);

    const selectedKategoriAset = useMemo(
        () => kategoriAsetOptions.find(option => String(option.value) === String(headerData.kategoriAset)) || null,
        [kategoriAsetOptions, headerData.kategoriAset]
    );

    // Detail items state
    const [detailItems, setDetailItems] = useState([]);

    // Pembelian aset: 1 transaksi = 1 item, jadi detail selalu tepat satu baris.
    useEffect(() => {
        setDetailItems(prev => (prev.length === 0 ? [createEmptyAsetItem()] : prev));
    }, []);

    // Edit mode: ambil kategori aset dari klasifikasi detail yang sudah tersimpan.
    useEffect(() => {
        if (!isEdit || headerData.kategoriAset) return;
        const existingKlasifikasi = detailItems.find(item => item.id_klasifikasi_lainlain);
        if (!existingKlasifikasi) return;

        const isKnownKategori = kategoriAsetOptions.some(
            option => String(option.value) === String(existingKlasifikasi.id_klasifikasi_lainlain)
        );
        if (isKnownKategori) {
            setHeaderData(prev => ({ ...prev, kategoriAset: existingKlasifikasi.id_klasifikasi_lainlain }));
        }
    }, [isEdit, detailItems, headerData.kategoriAset, kategoriAsetOptions]);

    const [notification, setNotification] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // File upload state
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isFileModalOpen, setIsFileModalOpen] = useState(false);
    const [existingFileName, setExistingFileName] = useState(null); // Track existing file name

    // Modal state for adding/editing detail items
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [editingDetailItem, setEditingDetailItem] = useState(null);
    const [isDetailModalSubmitting, setIsDetailModalSubmitting] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [savingDetailId, setSavingDetailId] = useState(null); // Track which detail is being saved


    // Helper functions for number formatting
    const formatNumber = (value) => {
        if (value === null || value === undefined || value === '') return '';
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return '';
        return numValue.toLocaleString('id-ID');
    };

    const parseNumber = (value) => {
        if (!value) return 0;
        // Remove dots and commas, then convert to number
        const cleanValue = value.toString().replace(/[.,]/g, '');
        return parseFloat(cleanValue) || 0;
    };


    // Parse persentase value when needed (for calculations) - like Feedmil
    const getParsedPersentase = (value) => {
        if (!value) return 0;
        const cleanValue = value.toString().replace(',', '.');
        return parseFloat(cleanValue) || 0;
    };

    // Convert backend decimal persentase to display format with comma - like Feedmil
    const formatPersentaseFromBackend = (value) => {
        // If value is already a decimal string (like "12,5"), return as is
        if (typeof value === 'string' && value.includes(',')) {
            return value;
        }
        
        // If value is decimal from backend (like 12.5), convert to comma format
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            return '';
        }
        
        // Convert decimal to comma format (12.5 -> "12,5")
        const result = numValue.toString().replace('.', ',');
        
        return result;
    };

    // Helper function to safely get numeric values (including 0) but exclude null/undefined/empty string
    const safeGetNumber = (value, fallback = 0) => {
        if (value === null || value === undefined || value === '') {
            return fallback;
        }
        const numValue = parseFloat(value);
        return isNaN(numValue) ? fallback : numValue;
    };

    // Helper function to safely get string values
    const safeGetString = (value, fallback = '') => {
        if (value === null || value === undefined) {
            return fallback;
        }
        return value.toString();
    };

    // Load data untuk edit mode - using /show endpoint for both header and detail data
    useEffect(() => {
        if (isEdit && id && supplierOptions.length > 0 && officeOptions.length > 0 && farmOptions.length > 0 && jenisPembelianOptions.length > 0 && itemLainLainOptions.length > 0 && klasifikasiLainLainOptions.length > 0 && !editDataLoaded.current) { // Wait for all options to load first
            const loadEditData = async () => {
                try {
                    // Set flag to prevent multiple calls
                    editDataLoaded.current = true;
                    
                    // Get both header and detail data from /show endpoint only
                    const showResponse = await HttpClient.post(`${API_ENDPOINTS.HO.LAINLAIN.PEMBELIAN}/show`, {
                        pid: id
                    });
                    
                    if (!showResponse.data || showResponse.data.length === 0) {
                        throw new Error('Data tidak ditemukan untuk pubid yang dipilih');
                    }
                    
                    const headerData = showResponse.data[0];
                    const showResponseData = showResponse.data;
                    
                    const detailResult = {
                        success: true,
                        data: showResponseData,
                        message: 'Detail data from /show endpoint'
                    };
                    
                    if (headerData) {
                        
                        // Use supplier name directly as text
                        let supplierId = headerData.nama_supplier || headerData.id_supplier || '';

                        // Find office ID - handle both direct ID and name matching (like Feedmil pattern)
                        let officeId = headerData.id_office || '';
                        
                        // If we have id_office directly, use it (keep as integer to match form field format)
                        if (officeId) {
                            officeId = parseInt(officeId);
                        } else if (headerData.nama_office) {
                            // Fallback: Try to find office by name if id_office is not available
                            let foundOffice = officeOptions.find(o => o.label === headerData.nama_office);
                            // If no exact match, try partial match (case insensitive)
                            if (!foundOffice) {
                                foundOffice = officeOptions.find(o => 
                                    o.label.toLowerCase().includes(headerData.nama_office.toLowerCase()) ||
                                    headerData.nama_office.toLowerCase().includes(o.label.toLowerCase())
                                );
                            }
                            if (foundOffice) {
                                officeId = parseInt(foundOffice.value);
                            }
                        }
                        

                        // Find tipe pembelian ID - backend sends tipe_pembelian as integer (1 or 2) - like Feedmil pattern
                        let tipePembelianId = '';
                        
                        if (headerData.tipe_pembelian !== undefined && headerData.tipe_pembelian !== null) {
                            // Backend sends tipe_pembelian as integer, convert to string for matching
                            const tipePembelianValue = String(headerData.tipe_pembelian);
                            const foundTipePembelian = jenisPembelianOptions.find(t => t.value === tipePembelianValue);
                            
                            if (foundTipePembelian) {
                                tipePembelianId = foundTipePembelian.value;
                            }
                        } else if (headerData.jenis_pembelian) {
                            // Fallback: try to match by jenis_pembelian name (for backward compatibility)
                            let foundTipePembelian = jenisPembelianOptions.find(t => t.label === headerData.jenis_pembelian);
                            if (!foundTipePembelian) {
                                foundTipePembelian = jenisPembelianOptions.find(t => 
                                    t.label.toLowerCase().includes(headerData.jenis_pembelian.toLowerCase()) ||
                                    headerData.jenis_pembelian.toLowerCase().includes(t.label.toLowerCase())
                                );
                            }
                            if (foundTipePembelian) {
                                tipePembelianId = foundTipePembelian.value;
                            }
                        }
                        

                        setHeaderData({
                            nota: safeGetString(headerData.nota),
                            nota_ho: safeGetString(headerData.nota_ho),
                            farm: headerData.id_farm ? String(headerData.id_farm) : (headerData.farm ? String(headerData.farm) : null),
                            syarat_pembelian: safeGetString(headerData.syarat_pembelian) || safeGetString(headerData.id_syarat_pembelian),
                            idOffice: officeId || (headerData.id_office ? parseInt(headerData.id_office) : null),
                            tipePembelian: tipePembelianId || (headerData.tipe_pembelian ? parseInt(headerData.tipe_pembelian) : null),
                            idSupplier: supplierId || safeGetString(headerData.nama_supplier),
                            tgl_masuk: safeGetString(headerData.tgl_masuk),
                            jumlah: safeGetNumber(headerData.jumlah),
                            biaya_lain: safeGetNumber(headerData.biaya_lain),
                            biaya_total: safeGetNumber(headerData.biaya_total) ?? safeGetNumber(headerData.total_belanja),
                            biaya_truk: safeGetNumber(headerData.biaya_truk) ?? 0,
                            file: safeGetString(headerData.file), // Keep as string for display purposes
                            fileName: headerData.file ? headerData.file.split('/').pop() : '',
                            tipe_pembayaran: headerData.tipe_pembayaran ? parseInt(headerData.tipe_pembayaran) : '',
                            due_date: safeGetString(headerData.due_date),
                            isLeasing: (() => {
                                const n = (safeGetString(headerData.note) || safeGetString(headerData.catatan)).toLowerCase();
                                return /\[leasing/i.test(n) || /\[jangka:/i.test(n) || /kredit leasing|via leasing/i.test(n);
                            })(),
                            namaLeasing: (() => {
                                const n = safeGetString(headerData.note) || safeGetString(headerData.catatan);
                                const match = /\[LEASING(?::\s*([^\]]+))?\]/i.exec(n);
                                return match ? (match[1] || '').trim() : '';
                            })(),
                            jangkaWaktu: (() => {
                                const n = safeGetString(headerData.note) || safeGetString(headerData.catatan) || '';
                                const match = /\[JANGKA:\s*(PENDEK|PANJANG)\]/i.exec(n);
                                if (match) return match[1].toLowerCase();
                                const isLeasingNote = /\[leasing/i.test(n) || /kredit leasing|via leasing/i.test(n);
                                return isLeasingNote ? 'panjang' : '';
                            })(),
                            note: safeGetString(headerData.note) || safeGetString(headerData.catatan)
                        });

                        // Set existing file name if available
                        const existingFile = headerData.file ? headerData.file.split('/').pop() : '';
                        if (existingFile) {
                            setExistingFileName(existingFile);
                        }
                        
                    }

                    if (detailResult.success && detailResult.data.length > 0) {
                        // Load detail items from detail API response
                        const processedDetailItems = detailResult.data.map((item, index) => {
                            // Find the item ID from itemLainLainOptions if we have the item name
                            const itemName = item.item_name || `Item Lain-Lain ${index + 1}`;
                            const foundItem = itemLainLainOptions.find(option => option.label === itemName);
                            
                            return {
                                id: item.id || index + 1,
                                // Include backend identifiers for update operations (like Feedmil)
                                idPembelian: item.id_pembelian, // This is crucial for update operations
                                id_pembelian: item.id_pembelian, // Keep both for compatibility
                                encryptedPid: item.pid, // Encrypted PID for existing items
                                pubid: item.pubid || '', // Raw pubid for API calls
                                pubidDetail: item.pubid_detail, // Alternative pubid field
                                id_office: item.id_office || 'head-office',
                                item_name: itemName, // Display name for UI
                                item_name_id: foundItem ? foundItem.value : null, // ID for SearchableSelect - use null instead of empty string
                                id_klasifikasi_lainlain: item.id_klasifikasi_lainlain || null,
                                nama_klasifikasi_lainlain: item.nama_klasifikasi_lainlain || null, // Keep klasifikasi name from backend
                                berat: item.berat !== null && item.berat !== undefined ? parseFloat(item.berat) : 0,
                                harga: item.harga !== null && item.harga !== undefined ? parseFloat(item.harga) : 0,
                                persentase: formatPersentaseFromBackend(item.persentase), // Format with comma for display
                                hpp: item.hpp !== null && item.hpp !== undefined ? parseFloat(item.hpp) : 0,
                                total_harga: item.total_harga !== null && item.total_harga !== undefined ? parseFloat(item.total_harga) : 0,
                                peruntukan: item.peruntukan || '',
                                // Store both catatan and keterangan for compatibility
                                catatan: item.keterangan || item.catatan || '',
                                keterangan: item.keterangan || item.catatan || ''
                            };
                        });
                        
                        setDetailItems(processedDetailItems);
                    }
                } catch (error) {
                    setNotification({
                        type: 'error',
                        message: 'Gagal memuat data untuk edit'
                    });
                }
            };
            
            loadEditData();
        }
    }, [isEdit, id, supplierOptions, officeOptions, farmOptions, jenisPembelianOptions, itemLainLainOptions, klasifikasiLainLainOptions]);

    // Reset edit data loaded flag when id changes
    useEffect(() => {
        editDataLoaded.current = false;
    }, [id]);


    // Handle header form changes
    const handleHeaderChange = (field, value) => {
        // Skema aset menentukan akun hutang: biasa (2110), leasing < 1 tahun (2130), leasing > 1 tahun (2520).
        if (field === 'skemaAset') {
            setHeaderData(prev => ({
                ...prev,
                isLeasing: value !== 'biasa',
                jangkaWaktu: value === 'leasing_pendek' ? 'pendek' : (value === 'leasing' ? 'panjang' : ''),
                namaLeasing: value === 'biasa' ? '' : prev.namaLeasing
            }));
            return;
        }

        // Special handling for tipe_pembayaran
        if (field === 'tipe_pembayaran') {
            // If payment type is "KAS" (value 1), automatically set syarat_pembelian to "KAS" (value 1) and lock it
            if (value === 1 || value === '1') {
                setHeaderData(prev => ({
                    ...prev,
                    [field]: value,
                    syarat_pembelian: '1' // Auto-set to KAS
                }));
            } else if (value === 2 || value === '2') {
                // If payment type is "BANK" (value 2), clear syarat_pembelian if it was KAS
                setHeaderData(prev => ({
                    ...prev,
                    [field]: value,
                    syarat_pembelian: prev.syarat_pembelian === '1' ? '' : prev.syarat_pembelian
                }));
            } else {
                setHeaderData(prev => ({
                    ...prev,
                    [field]: value
                }));
            }
        } else {
            setHeaderData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    // Filter bank options based on payment type
    const filteredBankOptions = useMemo(() => {
        if (headerData.tipe_pembayaran === 2 || headerData.tipe_pembayaran === '2') {
            // If payment type is BANK, exclude KAS (value 1) from options
            return bankOptions.filter(option => option.value !== 1 && option.value !== '1');
        }
        return bankOptions;
    }, [bankOptions, headerData.tipe_pembayaran]);

    // Handle perubahan item aset (1 transaksi = 1 item, nama item teks bebas)
    const handleSingleItemChange = (field, value) => {
        setDetailItems(prev => {
            const base = prev[0] || createEmptyAsetItem();
            const next = { ...base, [field]: value };

            if (field === 'item_name') {
                // Nama item diisi manual, tidak lagi terikat master Item Lain-Lain
                next.item_name_id = null;
            }

            if (field === 'harga' || field === 'berat' || field === 'persentase') {
                const harga = parseFloat(field === 'harga' ? value : next.harga) || 0;
                const qty = parseFloat(field === 'berat' ? value : next.berat) || 0;
                const persentase = field === 'persentase'
                    ? (getParsedPersentase(value) || 0)
                    : (getParsedPersentase(next.persentase) || 0);
                const hpp = harga + (harga * persentase / 100);
                next.hpp = hpp;
                next.total_harga = hpp * qty;
            }

            return [next];
        });
    };

    const handleKategoriAsetChange = (value) => {
        const kategoriId = value === null || value === undefined || value === '' ? '' : parseInt(value);
        setHeaderData(prev => ({ ...prev, kategoriAset: kategoriId || '' }));
        setDetailItems(prev => {
            const base = prev[0] || createEmptyAsetItem();
            return [{ ...base, id_klasifikasi_lainlain: kategoriId || null }];
        });
    };

    // Close detail modal
    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        setEditingDetailItem(null);
    };

    // Handle modal save
    const handleDetailModalSave = async (itemData) => {
        setIsDetailModalSubmitting(true);
        
        try {
            // Ensure proper data formatting for the item
            const formattedItemData = {
                ...itemData,
                // Ensure id_office is properly set as integer
                id_office: parseInt(headerData.idOffice) || 1,
                // Keep item_name_id as is (modal already sends numeric or null)
                item_name_id: itemData.item_name_id,
                // Ensure numeric fields are properly formatted
                berat: parseFloat(itemData.berat) || 0,
                harga: parseFloat(itemData.harga) || 0,
                persentase: getParsedPersentase(itemData.persentase) || 0,
                hpp: parseFloat(itemData.hpp) || 0,
                total_harga: parseFloat(itemData.total_harga) || 0,
                // Keep id_klasifikasi_lainlain as is (modal already sends numeric or null)
                id_klasifikasi_lainlain: itemData.id_klasifikasi_lainlain,
                // Store both catatan and keterangan for compatibility
                catatan: itemData.catatan || itemData.keterangan || '',
                keterangan: itemData.keterangan || itemData.catatan || '',
                peruntukan: itemData.peruntukan || '',
                // Ensure nama_klasifikasi_lainlain is set for display
                nama_klasifikasi_lainlain: (() => {
                    if (itemData.id_klasifikasi_lainlain) {
                        const klasifikasi = klasifikasiLainLainOptions.find(k =>
                            // Compare as numbers since both should be numeric now
                            parseInt(k.value) === parseInt(itemData.id_klasifikasi_lainlain)
                        );
                        return klasifikasi ? klasifikasi.label : null;
                    }
                    return null;
                })()
            };
            
            if (editingDetailItem) {
                // Edit existing item
                if (isEdit) {
                    // In edit mode, call API to save the detail item
                    // saveDetailItem will handle everything including modal close and notifications
                    await saveDetailItem(editingDetailItem.id, formattedItemData);
                    // Return early - saveDetailItem handles everything
                    return;
                } else {
                    // In add mode, update local state
                    setDetailItems(prev => prev.map(item =>
                        item.id === editingDetailItem.id
                            ? { ...item, ...formattedItemData }
                            : item
                    ));
                    // Close modal and show notification for add mode edit
                    closeDetailModal();
                    setNotification({
                        type: 'success',
                        message: 'Detail item berhasil diperbarui'
                    });
                }
            } else {
                // Add new item (in both add and edit modes when adding new detail)
                const newItem = {
                    id: Date.now(),
                    pubid: '',
                    id_pembelian: '',
                    idPembelian: '',
                    encryptedPid: '',
                    pubidDetail: '',
                    ...formattedItemData
                };
                setDetailItems(prev => [...prev, newItem]);
                // Close modal and show notification for new item
                closeDetailModal();
                setNotification({
                    type: 'success',
                    message: 'Detail item berhasil ditambahkan'
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Gagal menyimpan detail item'
            });
        } finally {
            setIsDetailModalSubmitting(false);
        }
    };


    // Save individual detail item
    const saveDetailItem = async (itemId, itemData = null) => {
        const item = itemData ? { ...detailItems.find(detail => detail.id === itemId), ...itemData } : detailItems.find(detail => detail.id === itemId);
        if (!item) return;

        // Set loading state for specific item
        setSavingDetailId(itemId);

        // Validate item data
        if (!item.item_name || !item.item_name.trim()) {
            setNotification({
                type: 'error',
                message: 'Nama item harus diisi'
            });
            setSavingDetailId(null);
            return;
        }

        // id_klasifikasi_lainlain is optional, don't validate as required

        // Make detail fields optional - only validate if provided
        if (item.berat !== null && item.berat !== undefined && item.berat !== '') {
            const berat = parseFloat(item.berat);
            if (isNaN(berat) || berat < 0) {
                setNotification({
                    type: 'error',
                    message: 'Berat tidak boleh negatif'
                });
                setSavingDetailId(null);
                return;
            }
        }

        if (item.harga !== null && item.harga !== undefined && item.harga !== '') {
            const harga = parseFloat(item.harga);
            if (isNaN(harga) || harga < 0) {
                setNotification({
                    type: 'error',
                    message: 'Harga tidak boleh negatif'
                });
                setSavingDetailId(null);
                return;
            }
        }

        try {
            setNotification({
                type: 'info',
                message: 'Menyimpan detail item...'
            });

            // Check if this is an existing item from database or a new frontend-only item
            const hasDetailIdentifier = !!(item.encryptedPid || item.pid || item.pubid || item.pubidDetail);
            
            // An item is existing if it has a detail identifier (encrypted pid, pid, pubid, or pubidDetail)
            // This is the primary indicator that the item came from the database
            const isExistingItem = hasDetailIdentifier;

            // Prepare detail data for save with proper field mapping
            const detailData = {
                idPembelian: item.idPembelian || null,
                idOffice: parseInt(headerData.idOffice) || 1,
                item_name: String(item.item_name || '').trim(),
                // Get id_item - ensure we use numeric ID
                id_item: (() => {
                    // First check if item_name_id is already numeric
                    if (item.item_name_id) {
                        const parsed = parseInt(item.item_name_id);
                        if (!isNaN(parsed)) {
                            return parsed;
                        }
                    }
                    
                    // If not numeric, find the item option to get numeric ID
                    if (item.item_name_id && itemLainLainOptions.length > 0) {
                        const foundItem = itemLainLainOptions.find(option =>
                            option.value === item.item_name_id ||
                            option.pid === item.item_name_id
                        );
                        if (foundItem) {
                            // Try to get numeric ID from option
                            const numericId = foundItem.numericId || foundItem.value;
                            const parsed = parseInt(numericId);
                            if (!isNaN(parsed)) {
                                return parsed;
                            }
                        }
                    }
                    
                    // Last resort: try to find by item name
                    if (item.item_name && itemLainLainOptions.length > 0) {
                        const foundItem = itemLainLainOptions.find(option =>
                            option.label === item.item_name
                        );
                        if (foundItem) {
                            const numericId = foundItem.numericId || foundItem.value;
                            const parsed = parseInt(numericId);
                            if (!isNaN(parsed)) {
                                return parsed;
                            }
                        }
                    }
                    
                    return null;
                })(),
                // Get id_klasifikasi_lainlain - ensure we use numeric ID
                id_klasifikasi_lainlain: (() => {
                    if (item.id_klasifikasi_lainlain) {
                        // First check if it's already numeric
                        const parsed = parseInt(item.id_klasifikasi_lainlain);
                        if (!isNaN(parsed)) {
                            return parsed;
                        }
                        
                        // If not numeric, find the klasifikasi option
                        const foundKlasifikasi = klasifikasiLainLainOptions.find(k =>
                            k.value === item.id_klasifikasi_lainlain ||
                            k.pid === item.id_klasifikasi_lainlain
                        );
                        
                        if (foundKlasifikasi) {
                            const numericId = foundKlasifikasi.numericId || foundKlasifikasi.value;
                            const parsed = parseInt(numericId);
                            if (!isNaN(parsed)) {
                                return parsed;
                            }
                        }
                    }
                    
                    return null;
                })(),
                nama_klasifikasi_lainlain: (() => {
                    if (item.id_klasifikasi_lainlain) {
                        const klasifikasi = klasifikasiLainLainOptions.find(k =>
                            String(k.value) === String(item.id_klasifikasi_lainlain)
                        );
                        return klasifikasi ? klasifikasi.label : null;
                    }
                    return null;
                })(),
                harga: parseFloat(item.harga) || 0,
                berat: parseFloat(item.berat) || 0,
                persentase: getParsedPersentase(item.persentase) || 0,
                hpp: parseFloat(item.hpp) || 0,
                total_harga: parseFloat(item.total_harga) || 0,
                peruntukan: String(item.peruntukan || '').trim(),
                keterangan: String(item.catatan || item.keterangan || '').trim()
            };

            // Validate that we have a valid pembelian ID for existing items only
            if (isExistingItem && !detailData.idPembelian) {
                setNotification({
                    type: 'error',
                    message: 'ID Pembelian tidak ditemukan untuk detail existing. Data mungkin tidak lengkap.'
                });
                setSavingDetailId(null);
                return;
            }


            // Call API to update individual item using the correct endpoint
            let result;
            if (isExistingItem) {
                // This is an existing database item - use updateDetail with encrypted PID
                const detailPid = item.encryptedPid || item.pid || item.pubid || item.pubidDetail;
                
                // Prepare request data for existing item update
                const requestData = {
                    pid: detailPid, // Backend expects encrypted PID for existing items
                    id_pembelian: detailData.idPembelian, // Always required by backend validator
                    item_name: detailData.item_name,
                    id_item: detailData.id_item, // Use the already parsed id_item
                    id_klasifikasi_lainlain: detailData.id_klasifikasi_lainlain,
                    nama_klasifikasi_lainlain: detailData.nama_klasifikasi_lainlain,
                    harga: detailData.harga,
                    persentase: detailData.persentase,
                    berat: detailData.berat,
                    hpp: detailData.hpp,
                    total_harga: detailData.total_harga,
                    peruntukan: item.peruntukan || '',
                    keterangan: item.catatan || ''
                };
                
                result = await HttpClient.post(`${API_ENDPOINTS.HO.LAINLAIN.PEMBELIAN}/update`, requestData);
            } else {
                // This is a new item created in frontend - use updateDetail with null pid to create new detail
                // Get id_pembelian from existing detail items
                let idPembelianValue = null;
                
                // Try to get id_pembelian from existing detail items
                const existingDetailWithId = detailItems.find(item => item.idPembelian);
                if (existingDetailWithId) {
                    idPembelianValue = existingDetailWithId.idPembelian;
                } else {
                    setNotification({
                        type: 'error',
                        message: 'Tidak dapat menambah detail baru: ID pembelian tidak ditemukan. Pastikan header pembelian sudah disimpan dan detail lain sudah ada.'
                    });
                    setSavingDetailId(null);
                    return;
                }
                
                detailData.idPembelian = idPembelianValue; // Use the resolved id_pembelian
                
                // Prepare request data for new item creation
                const requestData = {
                    pid: null, // null pid will trigger create in backend
                    id_pembelian: detailData.idPembelian, // Always required by backend validator
                    id_office: detailData.idOffice, // Required for new items
                    item_name: detailData.item_name,
                    id_item: detailData.id_item, // Use the already parsed id_item
                    id_klasifikasi_lainlain: detailData.id_klasifikasi_lainlain,
                    nama_klasifikasi_lainlain: detailData.nama_klasifikasi_lainlain,
                    harga: detailData.harga,
                    persentase: detailData.persentase,
                    berat: detailData.berat,
                    hpp: detailData.hpp,
                    total_harga: detailData.total_harga,
                    peruntukan: item.peruntukan || '',
                    keterangan: item.catatan || ''
                };
                
                result = await HttpClient.post(`${API_ENDPOINTS.HO.LAINLAIN.PEMBELIAN}/update`, requestData);
            }


            // Check response success with multiple possible formats
            const isSuccess = (result.data && result.data.success) || 
                             (result.data && result.data.status === 'ok') || 
                             (result.data && result.data.status === 'success') ||
                             (result && result.status === 'ok') ||
                             (result && result.status === 'success');

            if (isSuccess) {
                // Close the modal first if it's open
                if (isDetailModalOpen) {
                    closeDetailModal();
                }
                
                setNotification({
                    type: 'success',
                    message: 'Detail item berhasil disimpan!'
                });
                
                // Update the saved item with new encrypted PID if it was a new item
                if (!isExistingItem && (result.data?.pid || result.data?.data?.pid)) {
                    const newPid = result.data?.pid || result.data?.data?.pid;
                    setDetailItems(prevItems =>
                        prevItems.map(prevItem =>
                            prevItem.id === item.id
                                ? { ...prevItem, encryptedPid: newPid, pubid: newPid }
                                : prevItem
                        )
                    );
                }
                
                // Auto refresh after successful save
                setTimeout(() => {
                    window.location.reload();
                }, 1500); // Delay 1.5 detik untuk memberi waktu user melihat notification
            } else {
                setNotification({
                    type: 'error',
                    message: result.data?.message || result.message || 'Gagal menyimpan detail item'
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: 'Terjadi kesalahan saat menyimpan item'
            });
        } finally {
            setSavingDetailId(null);
        }
    };


    // Handle file upload - sesuai dengan validasi backend (max 15MB, jpg,jpeg,png,pdf)
    const handleFileUpload = (file) => {
        if (file) {
            // Validate file size (max 15MB sesuai backend)
            const maxSize = 15 * 1024 * 1024; // 15MB
            if (file.size > maxSize) {
                setNotification({
                    type: 'error',
                    message: 'Ukuran file terlalu besar. Maksimal 15MB.'
                });
                return;
            }

            // Validate file type - sesuai dengan backend (jpg,jpeg,png,pdf)
            const allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/jpg', 
                'image/png'
            ];

            if (!allowedTypes.includes(file.type)) {
                setNotification({
                    type: 'error',
                    message: 'Tipe file tidak didukung. Gunakan PDF atau gambar (JPG, JPEG, PNG).'
                });
                return;
            }

            setSelectedFile(file);
            setFilePreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
            handleHeaderChange('file', file);  // Store the actual File object
            handleHeaderChange('fileName', file.name);
        }
    };

    // Handle drag and drop
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    // Remove file
    const removeFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        setExistingFileName(null); // Clear existing file name
        handleHeaderChange('file', null);  // Reset to null instead of empty string
        handleHeaderChange('fileName', '');
    };

    // Open file upload modal
    const openFileModal = () => {
        setIsFileModalOpen(true);
    };

    // Close file upload modal
    const closeFileModal = () => {
        setIsFileModalOpen(false);
    };

    // Calculate totals
    const totals = useMemo(() => {
        const totalJumlah = detailItems.length; // Count of items
        const totalBerat = detailItems.reduce((sum, item) => {
            const berat = parseFloat(item.berat);
            return sum + (isNaN(berat) ? 0 : berat);
        }, 0);
        const totalHPP = detailItems.reduce((sum, item) => {
            const hpp = parseFloat(item.hpp);
            return sum + (isNaN(hpp) ? 0 : hpp);
        }, 0);
        const totalHargaItems = detailItems.reduce((sum, item) => {
            const totalHarga = parseFloat(item.total_harga);
            return sum + (isNaN(totalHarga) ? 0 : totalHarga);
        }, 0);
        
        return { totalJumlah, totalBerat, totalHPP, totalHargaItems };
    }, [detailItems]);

    // Biaya Total (read-only) = total harga detail item + biaya lain-lain + biaya truk.
    // Nilai ini sama dengan "Total Biaya" (Beli + Lain + Truk) di halaman list.
    const biayaTotalOtomatis = useMemo(() => {
        const dasarDetail = totals.totalHargaItems > 0
            ? totals.totalHargaItems
            : (parseFloat(headerData.biaya_total) || 0);
        const lain = parseFloat(headerData.biaya_lain) || 0;
        const truk = parseFloat(headerData.biaya_truk) || 0;
        return dasarDetail + lain + truk;
    }, [totals.totalHargaItems, headerData.biaya_total, headerData.biaya_lain, headerData.biaya_truk]);

    // Form validation
    const validateForm = () => {
        const errors = [];

        if (isFeedmillContext && !feedmillOffice) {
            errors.push('Office Feedmill tidak ditemukan');
        } else if (!headerData.idOffice) {
            errors.push('Office harus dipilih');
        }

        if (isFeedmillContext && !feedmillFarm) {
            errors.push('Farm Feedmill tidak ditemukan');
        }

        if (!headerData.nota.trim()) {
            errors.push('Nomor Nota Supplier harus diisi');
        }
        
        // Add max length validation for nota (50 chars)
        if (headerData.nota && headerData.nota.length > 50) {
            errors.push('Nomor Nota Supplier maksimal 50 karakter');
        }

        if (!headerData.tipePembelian) {
            errors.push('Tipe Pembelian harus dipilih');
        }

        // Supplier validation removed as per request - backend will handle it

        if (!headerData.farm) {
            errors.push('Farm harus dipilih');
        }

        if (!headerData.syarat_pembelian) {
            errors.push('Syarat Pembelian harus dipilih');
        }


        if (!headerData.tgl_masuk) {
            errors.push('Tanggal masuk harus diisi');
        }

        // Add biaya_lain validation - make it required as per backend
        const biayaLain = parseFloat(headerData.biaya_lain);
        if (headerData.biaya_lain === null || headerData.biaya_lain === undefined || headerData.biaya_lain === '' || isNaN(biayaLain)) {
            errors.push('Biaya Lain-lain harus diisi (minimal 0)');
        }

        if (!headerData.tipe_pembayaran) {
            errors.push('Tipe pembayaran harus diisi');
        }

        // Conditional validation for due date based on payment type
        // If payment type is cash (assumed to be 1), due date is optional
        // If payment type is credit (assumed to be 2), due date is required
        if (headerData.tipe_pembayaran && parseInt(headerData.tipe_pembayaran) === 2) { // Credit payment
            if (!headerData.due_date) {
                errors.push('Jatuh tempo harus diisi untuk pembayaran kredit');
            }
        }

        if (!headerData.note.trim()) {
            errors.push('Catatan pembelian harus diisi');
        }

        const kategoriAsetValid = kategoriAsetOptions.some(
            option => String(option.value) === String(headerData.kategoriAset)
        );
        if (!kategoriAsetValid) {
            errors.push('Kategori Aset Tetap harus dipilih');
        }

        const asetItem = detailItems[0] || {};
        if (!String(asetItem.item_name || '').trim()) {
            errors.push('Nama Item harus diisi');
        }

        const asetQty = parseFloat(asetItem.berat);
        if (isNaN(asetQty) || asetQty <= 0) {
            errors.push('Jumlah / Qty harus lebih dari 0');
        }

        const asetHarga = parseFloat(asetItem.harga);
        if (isNaN(asetHarga) || asetHarga <= 0) {
            errors.push('Harga Satuan harus lebih dari 0');
        }

        if (errors.length > 0) {
            setNotification({
                type: 'error',
                message: errors[0] // Show first error
            });
            return false;
        }

        return true;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setNotification({
            type: 'info',
            message: isEdit ? 'Memperbarui data pembelian...' : 'Menyimpan data pembelian...'
        });

        try {
            // Map frontend fields to backend expected format
            const submissionData = {
                // Header data mapping to backend format
                id_office: parseInt(isFeedmillContext ? feedmillOffice.value : headerData.idOffice),
                nota: headerData.nota,
                nama_supplier: headerData.idSupplier, // Now using text directly
                tgl_masuk: headerData.tgl_masuk,
                jumlah: parseFloat(headerData.jumlah) || totals.totalJumlah || null,
                nama_produk: String(detailItems[0]?.item_name || '').trim() || null,
                biaya_lain: headerData.biaya_lain !== null && headerData.biaya_lain !== undefined && headerData.biaya_lain !== '' ? parseFloat(headerData.biaya_lain) : 0,
                id_farm: isFeedmillContext ? parseInt(feedmillFarm.value) : (headerData.farm ? parseInt(headerData.farm) : null),
                id_syarat_pembelian: headerData.syarat_pembelian ? parseInt(headerData.syarat_pembelian) : null,
                nota_ho: headerData.nota_ho || '',
                biaya_total: totals.totalHargaItems > 0 ? totals.totalHargaItems : (parseFloat(headerData.biaya_total) || null),
                tipe_pembelian: parseInt(headerData.tipePembelian),
                tipe_pembayaran: parseInt(headerData.tipe_pembayaran),
                due_date: headerData.due_date,
                note: (() => {
                    const rawNote = (headerData.note || '')
                        .replace(/\[LEASING[^\]]*\]/gi, '')
                        .replace(/\[JANGKA[^\]]*\]/gi, '')
                        .trim();
                    if (headerData.isLeasing) {
                        const leasingTag = headerData.namaLeasing?.trim() ? `[LEASING: ${headerData.namaLeasing.trim().toUpperCase()}]` : '[LEASING]';
                        const jangkaTag = headerData.jangkaWaktu === 'pendek' ? '[JANGKA:PENDEK]' : '[JANGKA:PANJANG]';
                        return `${leasingTag} ${jangkaTag} ${rawNote}`.trim();
                    }
                    return rawNote;
                })(),
                // Ensure file is properly passed - prioritize selectedFile over headerData.file
                // Only pass file if it's a File object (new upload) or if we have existing file name but no new file
                file: selectedFile || (headerData.file && headerData.file instanceof File ? headerData.file : null),
                // Pass existing file name for backend to know if file should be kept
                existingFileName: existingFileName,

                // Detail items mapping with proper formatting - ensure all fields are correctly formatted
                details: (() => {
                    const item = detailItems[0] || createEmptyAsetItem();
                    const kategori = kategoriAsetOptions.find(option => String(option.value) === String(headerData.kategoriAset)) || null;
                    const harga = parseFloat(item.harga) || 0;
                    const berat = parseFloat(item.berat) || 0;
                    const persentase = getParsedPersentase(item.persentase) || 0;
                    const hpp = item.hpp ? parseFloat(item.hpp) : (harga + (harga * persentase / 100));
                    const totalHarga = item.total_harga ? parseFloat(item.total_harga) : (hpp * berat);
                    const namaItem = String(item.item_name || '').trim();

                    // 1 transaksi = 1 item, nama item berupa teks bebas
                    return [{
                        id_office: parseInt(headerData.idOffice) || 1,
                        nama_produk: namaItem,
                        item_name: namaItem,
                        id_item: null,
                        id_klasifikasi_lainlain: headerData.kategoriAset ? parseInt(headerData.kategoriAset) : null,
                        nama_klasifikasi_lainlain: kategori ? kategori.name : null,
                        id_klasifikasi_ovk: headerData.kategoriAset ? parseInt(headerData.kategoriAset) : null,
                        nama_klasifikasi_ovk: kategori ? kategori.name : null,
                        berat: berat,
                        harga: harga,
                        persentase: persentase,
                        hpp: Math.round(hpp * 100) / 100,
                        total_harga: Math.round(totalHarga * 100) / 100,
                        peruntukan: String(item.peruntukan || '').trim(),
                        keterangan: String(item.catatan || item.keterangan || '').trim(),
                    }];
                })(),

                // Additional data for compatibility
                totalJumlah: totals.totalJumlah,
                totalBerat: totals.totalBerat,
                totalHPP: totals.totalHPP,
                totalHargaItems: totals.totalHargaItems,
                jenis_pembelian: 'Lain-Lain',
                supplier: headerData.idSupplier,
                jenis_supplier: '',
                berat_total: totals.totalBerat // Map to berat_total for backend compatibility
            };

            let result;
            if (isEdit) {
                result = await updatePembelian({
                    ...submissionData,
                    pid: id  // Use pid instead of id for update
                });
            } else {
                result = await createPembelian(submissionData);
            }

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || (isEdit ? 'Data berhasil diperbarui!' : 'Data berhasil disimpan!')
                });
                
                setTimeout(() => {
                    // Set sessionStorage flag as backup
                    sessionStorage.setItem('lainlain-should-refresh', 'true');
                    // Dispatch custom event
                    window.dispatchEvent(new CustomEvent('lainlain-data-updated'));
                    navigate(basePath, { state: { fromEdit: true } });
                }, 1500);
            } else {
                setNotification({
                    type: 'error',
                    message: result.message || 'Terjadi kesalahan saat menyimpan data'
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: 'Terjadi kesalahan tidak terduga'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle back navigation
    const handleBack = () => {
        // Set sessionStorage flag as backup
        sessionStorage.setItem('lainlain-should-refresh', 'true');
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('lainlain-data-updated'));
        navigate(basePath, { state: { fromEdit: true } });
    };

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Detail section now starts empty - users must manually add items

    return (
        <>
            <style>{`
                .table-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
                .table-scroll::-webkit-scrollbar-track { background: transparent; }
                .table-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
                .table-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                .table-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
                @keyframes progress { from { width: 100%; } to { width: 0%; } }
            `}</style>

            <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
                {/* === Sticky Header === */}
                <header className="shrink-0 border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={handleBack}
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                                    <Package className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-base font-bold tracking-tight text-slate-900 truncate">
                                        {isEdit ? 'Edit Pembelian Lain-Lain' : 'Tambah Pembelian Lain-Lain'}
                                    </h1>
                                    <p className="text-xs text-slate-500 truncate hidden sm:block">
                                        {isEdit ? 'Perbarui data pembelian Lain-Lain' : 'Tambahkan data pembelian Lain-Lain baru'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={handleBack}
                                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="h-4 w-4" />
                                {isSubmitting ? 'Menyimpan...' : isEdit ? 'Perbarui' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </header>

                {/* === Main Content === */}
                <div className="flex-1 min-h-0 overflow-auto p-4 sm:px-6">
                    <div className="flex flex-col gap-4">
                        {/* Header Form */}
                        <section className="rounded-xl border border-slate-200 bg-white">
                            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                    <Hash className="h-3.5 w-3.5 text-indigo-600" />
                                    Data Header Pembelian
                                </h3>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                        {/* Nomor Nota Supplier */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                Nomor Nota Supplier *
                            </label>
                            <input
                                type="text"
                                value={headerData.nota}
                                onChange={(e) => handleHeaderChange('nota', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Masukkan nomor nota supplier"
                            />
                        </div>


                        {/* Office */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4" />
                                Office *
                            </label>
                            <SearchableSelect
                                value={headerData.idOffice}
                                onChange={(value) => setHeaderData(prev => ({ ...prev, idOffice: value }))}
                                options={officeOptions}
                                placeholder={parameterLoading ? 'Loading offices...' : parameterError ? 'Error loading offices' : 'Pilih Office'}
                                isLoading={parameterLoading}
                                isDisabled={isFeedmillContext || parameterLoading || Boolean(parameterError)}
                                required
                                className="w-full"
                            />
                            {isFeedmillContext && (
                                <p className="text-xs text-gray-600 mt-1">Office terkunci ke Feedmill.</p>
                            )}
                            {parameterError && (
                                <p className="text-xs text-red-500 mt-1">
                                    ⚠️ Error loading offices: {parameterError}
                                </p>
                            )}
                        </div>

                        {/* Tipe Pembelian - Locked to ASSET */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Package className="w-4 h-4" />
                                Tipe Pembelian *
                            </label>
                            <input
                                type="text"
                                value="ASSET"
                                readOnly
                                disabled
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-600 mt-1">
                                🔒 Tipe pembelian terkunci ke "ASSET" dan tidak dapat diubah
                            </p>
                        </div>

                        {/* Supplier */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4" />
                                Supplier / Dealer Penjual *
                            </label>
                            <input
                                type="text"
                                value={headerData.idSupplier}
                                onChange={(e) => handleHeaderChange('idSupplier', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Contoh: AUTO2000, UNITED TRACTORS, TOKO BESI"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Nama toko/dealer tempat fisik barang atau aset dibeli
                            </p>
                        </div>

                        {/* Skema Pembelian Aset */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4 text-emerald-600" />
                                Skema Pembelian Aset *
                            </label>
                            <SearchableSelect
                                options={SKEMA_PEMBELIAN_ASET_OPTIONS}
                                value={!headerData.isLeasing ? 'biasa' : (headerData.jangkaWaktu === 'pendek' ? 'leasing_pendek' : 'leasing')}
                                onChange={(value) => handleHeaderChange('skemaAset', value)}
                                placeholder="Pilih skema pembelian aset..."
                                isClearable={false}
                                required={true}
                                className="w-full"
                                accentColor="blue"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {!headerData.isLeasing
                                    ? '📌 Hutang masuk ke COA 2110 (Kewajiban Lancar / Hutang Vendor)'
                                    : headerData.jangkaWaktu === 'pendek'
                                        ? '📌 Hutang masuk ke COA 2130 (Kewajiban Jangka Pendek / Hutang Bank Jangka Pendek)'
                                        : '📌 Hutang masuk ke COA 2520 (Kewajiban Jangka Panjang / Hutang Leasing)'}
                            </p>
                        </div>

                        {/* Nama Lembaga Leasing */}
                        {headerData.isLeasing && (
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-indigo-700 mb-2">
                                    <Building2 className="w-4 h-4 text-indigo-600" />
                                    Nama Lembaga Leasing / Pembiayaan *
                                </label>
                                <input
                                    type="text"
                                    value={headerData.namaLeasing || ''}
                                    onChange={(e) => handleHeaderChange('namaLeasing', e.target.value)}
                                    className="w-full px-4 py-3 border border-indigo-300 bg-indigo-50/40 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    placeholder="Contoh: ADIRA FINANCE, CLIPAN, MUF, BCA FINANCE"
                                />
                                <p className="text-xs text-indigo-600 mt-1">
                                    💡 Masukkan nama leasing penerbit akad kredit/pembiayaan
                                </p>
                            </div>
                        )}

                        {/* Tanggal Masuk */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4" />
                                Tanggal Masuk *
                            </label>
                            <input
                                type="date"
                                value={headerData.tgl_masuk}
                                onChange={(e) => handleHeaderChange('tgl_masuk', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            />
                        </div>


                        {/* Biaya Lain */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Biaya Lain - Lain (RP)
                            </label>
                            <input
                                type="text"
                                value={formatNumber(headerData.biaya_lain)}
                                onChange={(e) => handleHeaderChange('biaya_lain', parseNumber(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder=""
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Biaya tambahan lainnya (opsional)
                            </p>
                        </div>

                        {/* Jumlah Total */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Weight className="w-4 h-4" />
                                Jumlah Total
                            </label>
                            <input
                                type="text"
                                value={formatNumber(headerData.jumlah)}
                                onChange={(e) => handleHeaderChange('jumlah', parseNumber(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Masukkan jumlah total"
                            />
                            <p className="text-xs text-blue-600 mt-1">
                                💡 Jumlah total semua item Lain-Lain dalam pembelian ini
                            </p>
                        </div>

                        {/* Biaya Total */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Biaya Total (Rp)
                            </label>
                            <input
                                type="text"
                                readOnly
                                value={formatNumber(biayaTotalOtomatis)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-700 cursor-not-allowed focus:outline-none"
                                placeholder=""
                                aria-readonly="true"
                            />
                            <p className="text-xs text-blue-600 mt-1">
                                💡 Otomatis: total detail item + biaya lain-lain{Number(headerData.biaya_truk) > 0 ? ' + biaya truk' : ''}
                            </p>
                        </div>

                        {/* Farm */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                Farm *
                            </label>
                            <SearchableSelect
                                options={farmOptions}
                                value={headerData.farm}
                                onChange={(value) => handleHeaderChange('farm', value)}
                                placeholder={farmLoading ? 'Loading farms...' : farmError ? 'Error loading farms' : 'Pilih farm'}
                                isLoading={farmLoading}
                                isDisabled={isFeedmillContext || farmLoading || Boolean(farmError)}
                                required={true}
                                className="w-full"
                            />
                            {isFeedmillContext && (
                                <p className="text-xs text-gray-600 mt-1">Farm terkunci ke Feedmill.</p>
                            )}
                            {farmError && (
                                <p className="text-xs text-red-500 mt-1">
                                    ⚠️ Error loading farms: {farmError}
                                </p>
                            )}
                        </div>


                        {/* Tipe Pembayaran */}
                        <div className="col-span-full md:col-span-1">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Tipe Pembayaran *
                            </label>
                            <SearchableSelect
                                options={tipePembayaranOptions}
                                value={headerData.tipe_pembayaran}
                                onChange={(value) => handleHeaderChange('tipe_pembayaran', value)}
                                placeholder={tipePembayaranLoading ? 'Loading tipe pembayaran...' : tipePembayaranError ? 'Error loading tipe pembayaran' : 'Pilih tipe pembayaran'}
                                isLoading={tipePembayaranLoading}
                                isDisabled={tipePembayaranLoading || tipePembayaranError}
                                required={true}
                                className="w-full"
                            />
                            {tipePembayaranError && (
                                <p className="text-xs text-red-50 mt-1">
                                    ⚠️ Error loading tipe pembayaran: {tipePembayaranError}
                                </p>
                            )}
                        </div>

                        {/* Syarat Pembelian */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                Syarat Pembelian *
                            </label>
                            <SearchableSelect
                                options={filteredBankOptions}
                                value={headerData.syarat_pembelian}
                                onChange={(value) => handleHeaderChange('syarat_pembelian', value)}
                                placeholder={bankLoading ? 'Loading banks...' : bankError ? 'Error loading banks' : 'Pilih syarat pembelian'}
                                isLoading={bankLoading}
                                isDisabled={bankLoading || bankError || headerData.tipe_pembayaran === 1 || headerData.tipe_pembayaran === '1'}
                                required={true}
                                className="w-full"
                            />
                            {bankError && (
                                <p className="text-xs text-red-500 mt-1">
                                    ⚠️ Error loading banks: {bankError}
                                </p>
                            )}
                            {(headerData.tipe_pembayaran === 1 || headerData.tipe_pembayaran === '1') && (
                                <p className="text-xs text-blue-600 mt-1">🔒 Syarat pembelian otomatis diset ke "KAS" karena tipe pembayaran KAS</p>
                            )}
                            {(headerData.tipe_pembayaran === 2 || headerData.tipe_pembayaran === '2') && (
                                <p className="text-xs text-blue-600 mt-1">💡 Opsi "KAS" tidak tersedia untuk tipe pembayaran BANK</p>
                            )}
                        </div>

                        <div className="col-span-full md:col-span-1">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4" />
                                Jatuh Tempo {headerData.tipe_pembayaran && parseInt(headerData.tipe_pembayaran) === 2 ? ' *' : ''}
                            </label>
                            <input
                                type="date"
                                value={headerData.due_date}
                                onChange={(e) => handleHeaderChange('due_date', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                required={headerData.tipe_pembayaran && parseInt(headerData.tipe_pembayaran) === 2}
                            />
                            {headerData.tipe_pembayaran && parseInt(headerData.tipe_pembayaran) === 2 && (
                                <p className="text-xs text-red-60 mt-1">
                                    * Wajib diisi untuk pembayaran kredit
                                </p>
                            )}
                            {headerData.tipe_pembayaran && parseInt(headerData.tipe_pembayaran) === 1 && (
                                <p className="text-xs text-gray-60 mt-1">
                                    Opsional untuk pembayaran cash
                                </p>
                            )}
                        </div>

                        {/* Note - Catatan */}
                        <div className="col-span-full md:col-span-2 xl:col-span-2 xl:row-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Catatan *
                            </label>
                            <textarea
                                value={headerData.note}
                                onChange={(e) => handleHeaderChange('note', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 outline-none resize-none"
                                rows="4"
                                placeholder="Masukkan catatan..."
                            />
                        </div>

                        {/* File Upload */}
                        <div className="col-span-full md:col-span-2 xl:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                File Dokumen (Opsional)
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={openFileModal}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                                >
                                    <Upload className="h-4 w-4" />
                                    Upload
                                </button>
                                {(selectedFile || existingFileName) && (
                                    <>
                                        <span className="flex-1 min-w-0 truncate text-xs text-slate-600">
                                            {selectedFile ? selectedFile.name : existingFileName}
                                        </span>
                                        <button
                                            onClick={removeFile}
                                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                            title="Hapus file"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                            </div>
                    </section>

                {/* Item Aset (1 transaksi = 1 item) */}
                <section className="rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                            <Package className="h-3.5 w-3.5 text-emerald-600" />
                            Item Aset (1 Transaksi = 1 Item)
                        </h3>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${selectedKategoriAset && selectedKategoriAset.susut === false
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {selectedKategoriAset
                                ? (selectedKategoriAset.susut ? 'Aset Disusutkan' : 'Aset Tidak Disusutkan')
                                : 'Kategori belum dipilih'}
                        </span>
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Package className="w-4 h-4" />
                                Nama Item *
                            </label>
                            <input
                                type="text"
                                value={detailItems[0]?.item_name || ''}
                                onChange={(e) => handleSingleItemChange('item_name', e.target.value)}
                                maxLength={200}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Contoh: TOYOTA HILUX, Bangunan Kandang 2, AC Kantor"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Nama item berupa teks bebas, tidak perlu memilih master item.
                            </p>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4 text-emerald-600" />
                                Kategori Aset Tetap *
                            </label>
                            <SearchableSelect
                                options={kategoriAsetOptions}
                                value={headerData.kategoriAset}
                                onChange={handleKategoriAsetChange}
                                placeholder={kategoriAsetOptions.length === 0 ? 'Memuat kategori aset...' : 'Pilih kategori aset tetap...'}
                                isClearable={false}
                                required={true}
                                className="w-full"
                                accentColor="blue"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Aset Tetap Disusutkan: Bangunan, Kendaraan, Mesin, Inventaris Prasarana.
                            </p>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Weight className="w-4 h-4" />
                                Jumlah / Qty *
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={detailItems[0]?.berat ?? ''}
                                onChange={(e) => handleSingleItemChange('berat', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="1"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4 text-emerald-600" />
                                Harga Satuan (RP) *
                            </label>
                            <input
                                type="text"
                                value={formatNumber(detailItems[0]?.harga || 0)}
                                onChange={(e) => handleSingleItemChange('harga', parseNumber(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-right tabular-nums"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                Total Nilai Aset
                            </label>
                            <input
                                type="text"
                                value={`Rp ${formatNumber(detailItems[0]?.total_harga || 0)}`}
                                readOnly
                                disabled
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-slate-100 text-slate-700 cursor-not-allowed text-right tabular-nums"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Edit2 className="w-4 h-4" />
                                Keterangan
                            </label>
                            <textarea
                                rows={2}
                                value={detailItems[0]?.catatan || ''}
                                onChange={(e) => handleSingleItemChange('catatan', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Keterangan tambahan (opsional)"
                            />
                        </div>
                    </div>
                </section>


                    </div>
                </div>
            </div>

            {/* File Upload Modal */}
            {isFileModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <div 
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            onClick={closeFileModal}
                        ></div>

                        {/* Modal panel */}
                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                            {/* Modal header */}
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                            <Upload className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">
                                                Upload File Dokumen Lain-Lain (Opsional)
                                            </h3>
                                            <p className="text-green-100 text-sm">
                                                Pilih file dokumen terkait pembelian Lain-Lain (tidak wajib)
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeFileModal}
                                        className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal body */}
                            <div className="px-6 py-6">
                                {/* File Upload Area */}
                                <div
                                    className={`relative overflow-hidden rounded-xl transition-all duration-500 ease-out ${
                                        isDragOver 
                                            ? 'ring-4 ring-green-400 ring-opacity-50 scale-105 shadow-2xl' 
                                            : 'hover:scale-102 hover:shadow-xl'
                                    }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    {/* Background with gradient and animated pattern */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${
                                        isDragOver 
                                            ? 'from-green-400 via-green-500 to-emerald-600' 
                                            : 'from-gray-50 via-green-50 to-emerald-100'
                                    } transition-all duration-500`}>
                                        {/* Animated background pattern */}
                                        <div className="absolute inset-0 opacity-10">
                                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(34,197,94,0.3),transparent_50%)]"></div>
                                            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.3),transparent_50%)]"></div>
                                        </div>
                                    </div>
                                    
                                    {/* Animated border with glow effect */}
                                    <div className={`absolute inset-0 rounded-xl border-2 ${
                                        isDragOver 
                                            ? 'border-green-400 border-dashed shadow-[0_0_20px_rgba(34,197,94,0.5)]' 
                                            : 'border-gray-200 border-dashed'
                                    } transition-all duration-500`}></div>
                                    
                                    {/* Content */}
                                    <div className="relative p-8 text-center">
                                        <input
                                            type="file"
                                            accept=".pdf, .jpg, .jpeg, .png"
                                            onChange={(e) => handleFileUpload(e.target.files[0])}
                                            className="hidden"
                                            id="file-upload-modal"
                                        />
                                        <label 
                                            htmlFor="file-upload-modal"
                                            className="cursor-pointer flex flex-col items-center gap-4 group"
                                        >
                                            {/* Animated icon container with floating effect */}
                                            <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ease-out ${
                                                isDragOver 
                                                    ? 'bg-white shadow-2xl scale-110 animate-bounce' 
                                                    : 'bg-white/80 backdrop-blur-sm shadow-lg group-hover:shadow-xl group-hover:scale-105 group-hover:-translate-y-1'
                                            }`}>
                                                {/* Icon with gradient background and pulse effect */}
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                    isDragOver 
                                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse' 
                                                        : 'bg-gradient-to-br from-green-400 to-emerald-500'
                                                } transition-all duration-500`}>
                                                    <Upload className={`w-6 h-6 transition-all duration-500 ${
                                                        isDragOver ? 'text-white scale-110 rotate-12' : 'text-white'
                                                    }`} />
                                                </div>
                                                
                                                {/* Floating particles effect with enhanced animation */}
                                                {isDragOver && (
                                                    <>
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                                                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                                                        <div className="absolute top-1/2 -right-2 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                        <div className="absolute top-1/2 -left-2 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                                    </>
                                                )}
                                            </div>
                                            
                                            {/* Text content with enhanced typography */}
                                            <div className="space-y-2">
                                                <h3 className={`text-xl font-bold transition-all duration-500 ${
                                                    isDragOver ? 'text-white drop-shadow-lg' : 'text-gray-800'
                                                }`}>
                                                    {isDragOver ? '🎉 Drop file di sini!' : '📁 Upload File Dokumen Lain-Lain'}
                                                </h3>
                                                <p className={`text-sm transition-all duration-500 ${
                                                    isDragOver ? 'text-green-100 drop-shadow-md' : 'text-gray-600'
                                                }`}>
                                                    {isDragOver ? 'Lepaskan file untuk upload' : 'Klik area ini atau drag & drop file'}
                                                </p>
                                            </div>
                                            
                                            {/* File type badges with enhanced styling - sesuai backend */}
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {['PDF', 'JPG', 'JPEG', 'PNG'].map((type, index) => (
                                                    <span key={type} className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                                                        isDragOver 
                                                            ? 'bg-white/20 text-white border border-white/30 shadow-lg' 
                                                            : 'bg-white/60 text-gray-700 border border-gray-200 hover:bg-white/80 hover:scale-105'
                                                    }`}>
                                                        {type}
                                                    </span>
                                                ))}
                                            </div>
                                            
                                            {/* Size limit with enhanced styling */}
                                            <div className={`px-4 py-2 rounded-full transition-all duration-500 ${
                                                isDragOver 
                                                    ? 'bg-white/20 text-white shadow-lg' 
                                                    : 'bg-white/80 text-gray-600 hover:bg-white hover:shadow-md'
                                            }`}>
                                                <span className="text-xs font-medium">Maksimal 15MB</span>
                                            </div>
                                        </label>
                                        
                                        {/* Primary upload button with enhanced effects */}
                                        <div className="mt-6">
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('file-upload-modal').click()}
                                                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-500 transform ${
                                                    isDragOver 
                                                        ? 'bg-white text-green-600 shadow-2xl scale-105 animate-pulse' 
                                                        : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-105 hover:from-green-600 hover:to-emerald-700 active:scale-95'
                                                }`}
                                            >
                                                {isDragOver ? '🎯 Upload Sekarang!' : '🚀 Pilih File'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* File Info Display in Modal */}
                                {(selectedFile || existingFileName) && (
                                    <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-shrink-0">
                                                {filePreview ? (
                                                    <div className="relative">
                                                        <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-xl border-2 border-green-200 shadow-md" />
                                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center border-2 border-green-200 shadow-md">
                                                        <Upload className="w-8 h-8 text-white" />
                                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-lg font-bold text-green-800 truncate">
                                                    {selectedFile ? selectedFile.name : existingFileName}
                                                </h4>
                                                <div className="flex items-center gap-4 mt-1">
                                                    {selectedFile ? (
                                                        <>
                                                            <span className="text-sm text-green-600">
                                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                            </span>
                                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                                {selectedFile.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                            📁 File Existing
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={removeFile}
                                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Hapus file"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal footer */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={closeFileModal}
                                        className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        {(selectedFile || existingFileName) ? 'Selesai' : 'Batal'}
                                    </button>
                                    {(selectedFile || existingFileName) && (
                                        <button
                                            onClick={closeFileModal}
                                            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                                        >
                                            ✅ Simpan File
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Notification */}
            {notification && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
                    <div className={`max-w-md w-full bg-white shadow-2xl rounded-xl pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${
                        notification.type === 'success' ? 'border-green-500 bg-gradient-to-r from-green-50 to-white' :
                        notification.type === 'info' ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-white' :
                        'border-red-500 bg-gradient-to-r from-red-50 to-white'
                    }`}>
                        <div className="p-5">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    {notification.type === 'success' ? (
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center ring-2 ring-green-200">
                                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    ) : notification.type === 'info' ? (
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center ring-2 ring-blue-200">
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center ring-2 ring-red-200">
                                            <AlertCircle className="w-5 h-5 text-red-600" />
                                        </div>
                                    )}
                                </div>
                                <div className="ml-4 flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className={`text-sm font-semibold ${
                                            notification.type === 'success' ? 'text-green-800' :
                                            notification.type === 'info' ? 'text-blue-800' :
                                            'text-red-800'
                                        }`}>
                                            {notification.type === 'success' ? 'Berhasil!' :
                                             notification.type === 'info' ? 'Memproses...' : 'Error!'}
                                        </p>
                                        <button
                                            onClick={() => setNotification(null)}
                                            className={`ml-4 flex-shrink-0 rounded-full p-1.5 hover:bg-opacity-20 transition-colors ${
                                                notification.type === 'success' ? 'text-green-600 hover:bg-green-200' :
                                                notification.type === 'info' ? 'text-blue-600 hover:bg-blue-200' :
                                                'text-red-600 hover:bg-red-200'
                                            }`}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <p className={`mt-1 text-sm ${
                                        notification.type === 'success' ? 'text-green-700' :
                                        notification.type === 'info' ? 'text-blue-700' :
                                        'text-red-700'
                                    }`}>
                                        {notification.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Progress bar for auto-hide */}
                        <div className={`h-1 w-full ${
                            notification.type === 'success' ? 'bg-green-200' :
                            notification.type === 'info' ? 'bg-blue-200' :
                            'bg-red-200'
                        }`}>
                            <div className={`h-full animate-pulse ${
                                notification.type === 'success' ? 'bg-green-500' :
                                notification.type === 'info' ? 'bg-blue-500' :
                                'bg-red-500'
                            }`} style={{
                                animation: 'progress 5s linear forwards'
                            }}></div>
                        </div>
                    </div>
                    
                    <style>{`
                        @keyframes progress {
                            from { width: 100%; }
                            to { width: 0%; }
                        }
                    `}</style>
                </div>
            )}

            {/* Detail Modal */}
            <AddEditDetailModal
                isOpen={isDetailModalOpen}
                onClose={closeDetailModal}
                onSave={handleDetailModalSave}
                editingItem={editingDetailItem}
                itemLainLainOptions={itemLainLainOptions}
                klasifikasiLainLainOptions={klasifikasiLainLainOptions}
                formatNumber={formatNumber}
                parseNumber={parseNumber}
                getParsedPersentase={getParsedPersentase}
                klasifikasiLoading={klasifikasiLoading}
                klasifikasiError={klasifikasiError}
                isSubmitting={isDetailModalSubmitting}
                onKlasifikasiChange={(klasifikasiId) => {
                    // Update the selected classification state first
                    setSelectedKlasifikasiForItems(klasifikasiId);
                    // Then fetch items based on selected classification
                    fetchItemLainLain(klasifikasiId);
                }}
                itemLainLainLoading={itemLainLainLoading}
            />
        </>
    );
};

export default AddEditPembelianLainLainPage;