import { useState, useEffect, useMemo, useRef } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

// Module-level cache untuk mencegah multiple fetch
let cachedData = null;
let cachedLoading = false;
let cachedError = null;
let fetchInProgress = false;

const useParameterSelect = (isEditMode = false, supplierFilters = {}, tipePembelianOptions = [], selectedTipePembelian = null) => {
    // Stabilize the parameters to prevent unnecessary re-renders
    const stableTipePembelianOptions = useMemo(() => tipePembelianOptions || [], [tipePembelianOptions]);
    const stableSelectedTipePembelian = useMemo(() => selectedTipePembelian, [selectedTipePembelian]);
    const [parameterData, setParameterData] = useState(cachedData || {
        eartag: [],
        supplier: [],
        office: [],
        klasifikasihewan: [],
        klasifikasifeedmil: [],
        klasifikasiovk: [],
        klasifikasikulit: [],
        itemkulit: [],
        itemfeedmil: [],
        farm: [],
        outlet: [],
        jenishewan: []
    });
    const [loading, setLoading] = useState(cachedLoading);
    const [error, setError] = useState(cachedError);
    const hasInitialized = useRef(false);


    const fetchParameterData = async () => {
        // Jika sudah ada data cached, gunakan data tersebut
        if (cachedData) {
            setParameterData(cachedData);
            setLoading(false);
            setError(null);
            return;
        }

        // Jika sedang loading, tunggu sebentar dan cek lagi
        if (fetchInProgress) {
            // Polling untuk menunggu fetch selesai
            const checkInterval = setInterval(() => {
                if (!fetchInProgress) {
                    clearInterval(checkInterval);
                    if (cachedData) {
                        setParameterData(cachedData);
                        setLoading(false);
                        setError(null);
                    } else if (cachedError) {
                        setError(cachedError);
                        setLoading(false);
                    }
                }
            }, 100);
            return;
        }

        // Mulai fetch baru
        fetchInProgress = true;
        setLoading(true);
        setError(null);
        cachedLoading = true;
        cachedError = null;
        
        try {
            console.log('🔄 Fetching parameter data from API...');
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PARAMETER}/data`);
            
            // Handle the response format from ParameterSelectController
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                const data = result.data[0]; // The controller returns data in an array
                const newData = {
                    eartag: data.eartag || [],
                    supplier: data.supplier || [],
                    office: data.office || [],
                    klasifikasihewan: data.klasifikasihewan || [],
                    klasifikasifeedmil: data.klasifikasifeedmil || [],
                    klasifikasiovk: data.klasifikasiovk || [],
                    klasifikasikulit: data.klasifikasikulit || [],
                    itemkulit: data.itemkulit || [],
                    itemfeedmil: data.itemfeedmil || [],
                    farm: data.farm || [],
                    outlet: data.outlet || [],
                    jenishewan: data.jenishewan || []
                };
                
                // Update cache
                cachedData = newData;
                cachedLoading = false;
                cachedError = null;
                
                // Update local state
                setParameterData(newData);
                setLoading(false);
                setError(null);
                console.log('✅ Parameter data cached successfully');
            } else {
                throw new Error('Invalid response format from parameter endpoint');
            }
        } catch (err) {
            console.error('❌ Error fetching parameter data:', err);
            cachedError = err.message;
            cachedLoading = false;
            cachedData = null;
            
            setError(err.message);
            setParameterData({
                eartag: [],
                supplier: [],
                office: [],
                klasifikasihewan: [],
                klasifikasifeedmil: [],
                klasifikasiovk: [],
                klasifikasikulit: [],
                itemkulit: [],
                itemfeedmil: [],
                farm: [],
                outlet: [],
                jenishewan: []
            });
            setLoading(false);
        } finally {
            fetchInProgress = false;
        }
    };

    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            fetchParameterData();
        }
    }, []);

    // Create select options for each parameter type
    const eartagOptions = useMemo(() => {
        return parameterData.eartag.map(item => ({
            value: item.pubid || item.id, // Use pubid first, fallback to id
            label: item.name || item.kode || item.id
        }));
    }, [parameterData.eartag]);

    // Filter supplier options based on frontend filters and tipe pembelian
    const supplierOptions = useMemo(() => {
        let suppliers = parameterData.supplier || [];
        
        // Filter berdasarkan kategori_supplier
        if (supplierFilters.kategoriSupplier !== null && supplierFilters.kategoriSupplier !== undefined) {
            suppliers = suppliers.filter(supplier => 
                supplier.kategori_supplier === supplierFilters.kategoriSupplier
            );
        }
        
        // Filter berdasarkan jenis_supplier
        if (supplierFilters.jenisSupplier) {
            suppliers = suppliers.filter(supplier => 
                supplier.jenis_supplier === supplierFilters.jenisSupplier
            );
        }
        
        // Filter berdasarkan tipe pembelian (PERUSAHAAN/PERORANGAN)
        // Only apply this filter if both selectedTipePembelian and tipePembelianOptions are provided
        if (stableSelectedTipePembelian && stableTipePembelianOptions && stableTipePembelianOptions.length > 0) {
            const selectedTipe = stableTipePembelianOptions.find(tipe => tipe.value === stableSelectedTipePembelian);
            if (selectedTipe) {
                const tipeLabel = selectedTipe.label.toUpperCase();
                let jenisSupplierFilter = null;
                
                if (tipeLabel.includes('PERUSAHAAN')) {
                    jenisSupplierFilter = 1; // PERUSAHAAN
                } else if (tipeLabel.includes('PERORANGAN')) {
                    jenisSupplierFilter = 2; // PERORANGAN
                }
                
                if (jenisSupplierFilter !== null) {
                    suppliers = suppliers.filter(supplier => {
                        // jenis_supplier is integer: 1 = PERUSAHAAN, 2 = PERORANGAN
                        if (!supplier.jenis_supplier || typeof supplier.jenis_supplier !== 'number') {
                            return false; // Hide suppliers without valid jenis_supplier number
                        }
                        
                        // Direct integer comparison
                        return supplier.jenis_supplier === jenisSupplierFilter;
                    });
                    
                }
            }
        }
        
        return suppliers.map(item => ({
            value: item.id,
            label: item.name,
            pid: item.pid || item.id,
            jenis_supplier: item.jenis_supplier,
            kategori_supplier: item.kategori_supplier
        }));
    }, [parameterData.supplier, supplierFilters.kategoriSupplier, supplierFilters.jenisSupplier, stableSelectedTipePembelian, stableTipePembelianOptions]);

    const officeOptions = useMemo(() => {
        const options = parameterData.office.map(item => ({
            value: item.id, // Keep numeric for consumer pages that expect number
            label: item.name
        }));
        
        // Debug logging for office options
        if (parameterData.office.length > 0) {
            console.log('🏢 Office options created:', {
                count: options.length,
                firstThree: options.slice(0, 3),
                rawData: parameterData.office.slice(0, 3)
            });
        }
        
        return options;
    }, [parameterData.office]);

    const klasifikasiHewanOptions = useMemo(() => {
        return parameterData.klasifikasihewan.map(item => ({
            value: item.pubid || item.id, // Use pubid first, fallback to id
            label: item.name
        }));
    }, [parameterData.klasifikasihewan]);

    const klasifikasiFeedmilOptions = useMemo(() => {
        return parameterData.klasifikasifeedmil.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.klasifikasifeedmil]);

    const klasifikasiOVKOptions = useMemo(() => {
        return parameterData.klasifikasiovk.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.klasifikasiovk]);

    const klasifikasiKulitOptions = useMemo(() => {
        return parameterData.klasifikasikulit.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.klasifikasikulit]);

    const itemKulitOptions = useMemo(() => {
        return parameterData.itemkulit.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.itemkulit]);

    const itemFeedmilOptions = useMemo(() => {
        return parameterData.itemfeedmil.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.itemfeedmil]);

    const farmOptions = useMemo(() => {
        return parameterData.farm.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.farm]);

    const outletOptions = useMemo(() => {
        return parameterData.outlet.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.outlet]);

    const jenisHewanOptions = useMemo(() => {
        return parameterData.jenishewan.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.jenishewan]);

    return {
        // Raw data
        parameterData,
        
        // Select options for dropdowns
        eartagOptions,
        supplierOptions,
        officeOptions,
        klasifikasiHewanOptions,
        klasifikasiFeedmilOptions,
        klasifikasiOVKOptions,
        klasifikasiKulitOptions,
        itemKulitOptions,
        itemFeedmilOptions,
        farmOptions,
        outletOptions,
        jenisHewanOptions,
        
        // State
        loading,
        error,
        
        // Actions
        refetch: fetchParameterData
    };
};

export default useParameterSelect;