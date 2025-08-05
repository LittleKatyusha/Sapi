import { useState, useEffect, useMemo } from 'react';
import { HttpClient } from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useParameterSelect = () => {
    const [parameterData, setParameterData] = useState({
        eartag: [],
        supplier: [],
        office: [],
        klasifikasihewan: [],
        outlet: [],
        jenishewan: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchParameterData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('Fetching centralized parameter data...');
            
            // Use the new centralized parameter endpoint
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PARAMETER}/data`);
            
            console.log('✅ Parameter data response:', result);
            
            // Handle the response format from ParameterSelectController
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                const data = result.data[0]; // The controller returns data in an array
                setParameterData({
                    eartag: data.eartag || [],
                    supplier: data.supplier || [],
                    office: data.office || [],
                    klasifikasihewan: data.klasifikasihewan || [],
                    outlet: data.outlet || [],
                    jenishewan: data.jenishewan || []
                });
                console.log('✅ Parameter data loaded successfully:', data);
            } else {
                throw new Error('Invalid response format from parameter endpoint');
            }
        } catch (err) {
            console.error('Error fetching parameter data:', err);
            setError(err.message);
            // Set empty data on error
            setParameterData({
                eartag: [],
                supplier: [],
                office: [],
                klasifikasihewan: [],
                outlet: [],
                jenishewan: []
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParameterData();
    }, []);

    // Create select options for each parameter type
    const eartagOptions = useMemo(() => {
        return parameterData.eartag.map(item => ({
            value: item.id,
            label: item.name || item.kode || item.id
        }));
    }, [parameterData.eartag]);

    const supplierOptions = useMemo(() => {
        return parameterData.supplier.map(item => ({
            value: item.id,
            label: item.name,
            pid: item.pid || item.id // Keep PID for compatibility with existing logic
        }));
    }, [parameterData.supplier]);

    const officeOptions = useMemo(() => {
        return parameterData.office.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.office]);

    const klasifikasiHewanOptions = useMemo(() => {
        return parameterData.klasifikasihewan.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.klasifikasihewan]);

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