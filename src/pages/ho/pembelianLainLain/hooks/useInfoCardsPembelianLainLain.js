import { useState, useEffect, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

/**
 * Custom hook untuk fetch info cards data dari backend
 * Data source: ParameterSelectController - getData()
 * 
 * Returns data untuk 4 kategori pembelian:
 * 1. Pembelian Aset
 * 2. Pembelian Beban & Biaya - KAS
 * 3. Pembelian Beban & Biaya - BANK
 * 4. Pembelian Bahan Pembantu
 * 
 * Setiap kategori memiliki data: Hari Ini & Bulan Ini (jumlah + nominal)
 */
const useInfoCardsPembelianLainLain = () => {
    const [infoCardsData, setInfoCardsData] = useState({
        aset: {
            hariIni: { jumlah: 0, nominal: 0 },
            bulanIni: { jumlah: 0, nominal: 0 }
        },
        bebanKas: {
            hariIni: { jumlah: 0, nominal: 0 },
            bulanIni: { jumlah: 0, nominal: 0 }
        },
        bebanBank: {
            hariIni: { jumlah: 0, nominal: 0 },
            bulanIni: { jumlah: 0, nominal: 0 }
        },
        bahanPembantu: {
            hariIni: { jumlah: 0, nominal: 0 },
            bulanIni: { jumlah: 0, nominal: 0 }
        }
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Fetch data dari API endpoint /api/master/parameter/data
     * Backend mengembalikan format: { data: [{ ...all_parameters }] }
     */
    const fetchInfoCardsData = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('📊 Fetching info cards data from backend...');
            
            // Call API endpoint
            const response = await HttpClient.get(`${API_ENDPOINTS.MASTER.PARAMETER}/data`);
            
            // Validate response format
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                const data = response.data[0]; // Backend returns data in array format
                
                console.log('✅ Info cards data received:', {
                    aset: data.pembelianasethariini,
                    bebanKas: data.pembelianbebanbiayakashariini,
                    bebanBank: data.pembelianbebanbiayabankhariini,
                    bahanPembantu: data.pembelianbahanpembantuhariini
                });
                
                // Extract dan format data untuk info cards
                const formattedData = {
                    aset: {
                        hariIni: {
                            jumlah: parseInt(data.pembelianasethariini?.jumlah || 0),
                            nominal: parseFloat(data.pembelianasethariini?.nominal || 0)
                        },
                        bulanIni: {
                            jumlah: parseInt(data.pembelianasetbulanini?.jumlah || 0),
                            nominal: parseFloat(data.pembelianasetbulanini?.nominal || 0)
                        }
                    },
                    bebanKas: {
                        hariIni: {
                            jumlah: parseInt(data.pembelianbebanbiayakashariini?.jumlah || 0),
                            nominal: parseFloat(data.pembelianbebanbiayakashariini?.nominal || 0)
                        },
                        bulanIni: {
                            jumlah: parseInt(data.pembelianbebanbiayakasbulanini?.jumlah || 0),
                            nominal: parseFloat(data.pembelianbebanbiayakasbulanini?.nominal || 0)
                        }
                    },
                    bebanBank: {
                        hariIni: {
                            jumlah: parseInt(data.pembelianbebanbiayabankhariini?.jumlah || 0),
                            nominal: parseFloat(data.pembelianbebanbiayabankhariini?.nominal || 0)
                        },
                        bulanIni: {
                            jumlah: parseInt(data.pembelianbebanbiayabankbulanini?.jumlah || 0),
                            nominal: parseFloat(data.pembelianbebanbiayabankbulanini?.nominal || 0)
                        }
                    },
                    bahanPembantu: {
                        hariIni: {
                            jumlah: parseInt(data.pembelianbahanpembantuhariini?.jumlah || 0),
                            nominal: parseFloat(data.pembelianbahanpembantuhariini?.nominal || 0)
                        },
                        bulanIni: {
                            jumlah: parseInt(data.pembelianbahanpembantubulanini?.jumlah || 0),
                            nominal: parseFloat(data.pembelianbahanpembantubulanini?.nominal || 0)
                        }
                    }
                };
                
                setInfoCardsData(formattedData);
                console.log('✅ Info cards data formatted successfully');
                
            } else {
                throw new Error('Invalid response format from parameter endpoint');
            }
            
        } catch (err) {
            console.error('❌ Error fetching info cards data:', err);
            setError(err.message || 'Gagal mengambil data info cards');
            
            // Set default empty data on error
            setInfoCardsData({
                aset: {
                    hariIni: { jumlah: 0, nominal: 0 },
                    bulanIni: { jumlah: 0, nominal: 0 }
                },
                bebanKas: {
                    hariIni: { jumlah: 0, nominal: 0 },
                    bulanIni: { jumlah: 0, nominal: 0 }
                },
                bebanBank: {
                    hariIni: { jumlah: 0, nominal: 0 },
                    bulanIni: { jumlah: 0, nominal: 0 }
                },
                bahanPembantu: {
                    hariIni: { jumlah: 0, nominal: 0 },
                    bulanIni: { jumlah: 0, nominal: 0 }
                }
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch data on component mount
    useEffect(() => {
        fetchInfoCardsData();
    }, [fetchInfoCardsData]);

    return {
        infoCardsData,
        loading,
        error,
        refetch: fetchInfoCardsData
    };
};

export default useInfoCardsPembelianLainLain;