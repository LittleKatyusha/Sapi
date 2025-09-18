import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useParameterSelect = (isEditMode = false, supplierFilters = {}) => {
    const [parameterData, setParameterData] = useState({
        supplier: [],
        office: [],
        klasifikasifeedmil: [],
        farm: [],
        itemkulit: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    const fetchParameterData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Use the centralized parameter endpoint
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PARAMETER}/data`);
            
            // Handle the response format from ParameterSelectController
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                const data = result.data[0]; // The controller returns data in an array
                setParameterData({
                    supplier: data.supplier || [],
                    office: data.office || [],
                    klasifikasifeedmil: data.klasifikasifeedmil || [],
                    farm: data.farm || [],
                    itemkulit: data.itemkulit || []
                });
                console.log('✅ Parameter data loaded:', Object.keys(data).map(key => `${key}: ${data[key]?.length || 0} items`).join(', '));
            } else {
                throw new Error('Invalid response format from parameter endpoint');
            }
        } catch (err) {
            setError(err.message);
            // Set empty data on error
            setParameterData({
                supplier: [],
                office: [],
                klasifikasifeedmil: [],
                farm: [],
                itemkulit: []
            });
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch non-supplier data on mount
    const fetchNonSupplierData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Use the centralized parameter endpoint
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PARAMETER}/data`);
            
            // Handle the response format from ParameterSelectController
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                const data = result.data[0]; // The controller returns data in an array
                setParameterData(prev => ({
                    ...prev,
                    office: data.office || [],
                    klasifikasifeedmil: data.klasifikasifeedmil || [],
                    farm: data.farm || [],
                    itemkulit: data.itemkulit || []
                    // supplier: intentionally omitted for lazy loading
                }));
            } else {
                throw new Error('Invalid response format from parameter endpoint');
            }
        } catch (err) {
            setError(err.message);
            // Set empty data on error
            setParameterData(prev => ({
                ...prev,
                office: [],
                klasifikasifeedmil: [],
                farm: [],
                itemkulit: []
            }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParameterData();
    }, []);

    // Filter supplier options based on frontend filters
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
        
        return suppliers.map(item => ({
            value: item.id,
            label: item.name,
            pid: item.pid || item.id,
            jenis_supplier: item.jenis_supplier,
            kategori_supplier: item.kategori_supplier
        }));
    }, [parameterData.supplier, supplierFilters.kategoriSupplier, supplierFilters.jenisSupplier]);

    const officeOptions = useMemo(() => {
        return parameterData.office.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.office]);

    const klasifikasiFeedmilOptions = useMemo(() => {
        return parameterData.klasifikasifeedmil.map(item => ({
            value: item.id, // Use integer ID for backend validation
            label: item.name
        }));
    }, [parameterData.klasifikasifeedmil]);

    const farmOptions = useMemo(() => {
        return parameterData.farm.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.farm]);

    const itemKulitOptions = useMemo(() => {
        return parameterData.itemkulit.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.itemkulit]);

    return {
        // Raw data
        parameterData,
        
        // Select options for dropdowns
        supplierOptions,
        officeOptions,
        klasifikasiFeedmilOptions,
        farmOptions,
        itemKulitOptions,
        
        // State
        loading,
        error,
        
        // Actions
        refetch: fetchParameterData
    };
};

export default useParameterSelect;
