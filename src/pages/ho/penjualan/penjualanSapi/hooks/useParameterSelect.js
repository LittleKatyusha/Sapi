import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import HttpClient from '../../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../../config/api';

// Module-level cache keyed by requested groups to prevent duplicate fetches
const cache = new Map();
const fetchInProgress = new Map();

const getCacheKey = (groups) => {
    if (!groups || groups.length === 0) return 'all';
    return [...groups].sort().join(',');
};

const useParameterSelect = (isEditMode = false, supplierFilters = {}, tipePembelianOptions = [], selectedTipePembelian = null, groups = null) => {
    // Stabilize the parameters to prevent unnecessary re-renders
    const stableTipePembelianOptions = useMemo(() => tipePembelianOptions || [], [tipePembelianOptions]);
    const stableSelectedTipePembelian = useMemo(() => selectedTipePembelian, [selectedTipePembelian]);
    const stableGroups = useMemo(() => {
        if (!groups || !Array.isArray(groups) || groups.length === 0) return null;
        return [...groups].sort();
    }, [groups]);
    const cacheKey = getCacheKey(stableGroups);
    const cached = cache.get(cacheKey);

    const [parameterData, setParameterData] = useState(cached?.data || {
        eartag: [],
        supplier: [],
        office: [],
        klasifikasihewan: [],
        klasifikasifeedmil: [],
        klasifikasiovk: [],
        klasifikasikulit: [],
        itemkulit: [],
        itemfeedmil: [],
        itemovk: [],
        farm: [],
        farmlainlain: [],
        outlet: [],
        jenishewan: []
    });
    const [loading, setLoading] = useState(cached ? false : true);
    const [error, setError] = useState(cached?.error || null);
    const hasInitialized = useRef(false);

    const fetchParameterData = useCallback(async () => {
        const currentCache = cache.get(cacheKey);
        if (currentCache?.data) {
            setParameterData(currentCache.data);
            setLoading(false);
            setError(null);
            return;
        }

        if (fetchInProgress.get(cacheKey)) {
            const checkInterval = setInterval(() => {
                if (!fetchInProgress.get(cacheKey)) {
                    clearInterval(checkInterval);
                    const resolved = cache.get(cacheKey);
                    if (resolved?.data) {
                        setParameterData(resolved.data);
                        setLoading(false);
                        setError(null);
                    } else if (resolved?.error) {
                        setError(resolved.error);
                        setLoading(false);
                    }
                }
            }, 100);
            return;
        }

        fetchInProgress.set(cacheKey, true);
        setLoading(true);
        setError(null);
        cache.set(cacheKey, { data: null, error: null, loading: true });

        try {
            console.log('🔄 Fetching parameter data from API...', stableGroups ? { groups: stableGroups } : 'all groups');
            const params = stableGroups ? { groups: stableGroups.join(',') } : {};
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PARAMETER}/data`, { params });

            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                const data = result.data[0];
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
                    itemovk: data.itemovk || [],
                    farm: data.farm || [],
                    farmlainlain: data.farmlainlain || [],
                    outlet: data.outlet || [],
                    jenishewan: data.jenishewan || []
                };

                cache.set(cacheKey, { data: newData, error: null, loading: false });
                setParameterData(newData);
                setLoading(false);
                setError(null);
                console.log('✅ Parameter data cached successfully for key:', cacheKey);
            } else {
                throw new Error('Invalid response format from parameter endpoint');
            }
        } catch (err) {
            console.error('❌ Error fetching parameter data:', err);
            cache.set(cacheKey, { data: null, error: err.message, loading: false });
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
                farmlainlain: [],
                outlet: [],
                jenishewan: []
            });
            setLoading(false);
        } finally {
            fetchInProgress.set(cacheKey, false);
        }
    }, [cacheKey, stableGroups]);

    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            fetchParameterData();
        }
    }, [cacheKey, fetchParameterData]);

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

    const itemOvkOptions = useMemo(() => {
        return parameterData.itemovk.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.itemovk]);

    const farmOptions = useMemo(() => {
        return parameterData.farm.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.farm]);

    const farmLainLainOptions = useMemo(() => {
        return parameterData.farmlainlain.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.farmlainlain]);

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
        itemOvkOptions,
        farmOptions,
        farmLainLainOptions,
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