/**
 * Pengeluaran Service
 * Service layer for Pengeluaran (Expenditure) API
 * Handles communication with PengeluaranController
 */

import HttpClient from './httpClient';

const BASE_URL = '/api/ho/pengeluaran';

/**
 * Get pengeluaran data with DataTables format
 * @param {Object} params - DataTables parameters
 * @returns {Promise<Object>} DataTables response
 */
export const getPengeluaran = async (params = {}) => {
    try {
        const response = await HttpClient.get(`${BASE_URL}/data`, {
            params: params,
            cache: false // Disable caching for real-time data
        });

        return response;
    } catch (error) {
        console.error('Error fetching pengeluaran:', error);
        throw error;
    }
};

/**
 * Get pengeluaran summary statistics
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} Summary data
 */
export const getPengeluaranSummary = async (filters = {}) => {
    try {
        const response = await HttpClient.get(`${BASE_URL}/summary`, {
            params: filters
        });

        return response;
    } catch (error) {
        console.error('Error fetching pengeluaran summary:', error);
        throw error;
    }
};

/**
 * Get single pengeluaran detail
 * @param {string} pid - Encrypted public ID
 * @returns {Promise<Object>} Pengeluaran detail
 */
export const getPengeluaranDetail = async (pid) => {
    try {
        const response = await HttpClient.post(`${BASE_URL}/show`, {
            pid
        });

        return response;
    } catch (error) {
        console.error('Error fetching pengeluaran detail:', error);
        throw error;
    }
};

/**
 * Helper function to convert frontend pagination to DataTables format
 * @param {number} page - Current page (1-based)
 * @param {number} perPage - Items per page
 * @param {string} searchTerm - Search term
 * @param {string} orderColumn - Column to order by
 * @param {string} orderDir - Order direction (asc/desc)
 * @param {Object} filters - Additional filters
 * @returns {Object} DataTables formatted parameters
 */
export const convertToDataTablesParams = (
    page = 1,
    perPage = 10,
    searchTerm = '',
    orderColumn = 'due_date',
    orderDir = 'desc',
    filters = {}
) => {
    // Column mapping for ordering
    const columnMap = {
        'due_date': 5,
        'settlement_date': 6,
        'nota': 10,
        'tgl_masuk': 12,
        'total_tagihan': 8
    };

    const columnIndex = columnMap[orderColumn] || 5;

    return {
        draw: 1,
        start: (page - 1) * perPage,
        length: perPage,
        search: {
            value: searchTerm,
            regex: false
        },
        order: [{
            column: columnIndex,
            dir: orderDir
        }],
        ...filters
    };
};

/**
 * Helper function to get payment status filter by tab
 * @param {string} tab - Active tab name
 * @returns {number|null} Payment status value
 *
 * Payment Status Values:
 * 0 = Belum Lunas (Partially Paid)
 * 1 = Lunas (Fully Paid)
 * 2 = Belum Bayar (Unpaid)
 */
export const getPaymentStatusByTab = (tab) => {
    switch (tab) {
        case 'belum-dibayar':
            return 2; // Belum Bayar (Unpaid)
        case 'lunas':
            return 1; // Lunas (Fully Paid)
        case 'belum-lunas':
            return 0; // Belum Lunas (Partially Paid)
        default:
            return null;
    }
};

/**
 * Filter data for "Belum Lunas" tab based on payment_status_text
 * @param {Array} data - Array of pengeluaran records
 * @returns {Array} Filtered data
 *
 * Filter berdasarkan payment_status_text:
 * - "Belum Dibayar": payment_status_text = "Belum Bayar"
 * - "Belum Lunas": payment_status_text = "Belum Lunas"
 * - "Lunas": payment_status_text = "Lunas"
 */
export const filterBelumLunas = (data) => {
    if (!Array.isArray(data)) {
        console.warn('⚠️ [FILTER] Data is not an array:', data);
        return [];
    }
    
    const filtered = data.filter(item => {
        // Filter berdasarkan payment_status_text
        const statusText = (item.payment_status_text || '').toLowerCase().trim();
        
        // Item masuk kategori "Belum Lunas" jika payment_status_text = "Belum Lunas"
        const isBelumLunas = statusText === 'belum lunas';
        
        if (isBelumLunas) {
            console.log('✅ [FILTER BELUM LUNAS] Item memenuhi kriteria:', {
                nota: item.nota || item.nota_sistem,
                payment_status: item.payment_status,
                payment_status_text: item.payment_status_text,
                total_tagihan: item.total_tagihan,
                total_terbayar: item.total_terbayar
            });
        }
        
        return isBelumLunas;
    });
    
    console.log(`📊 [FILTER BELUM LUNAS] Total data sebelum filter: ${data.length}, setelah filter: ${filtered.length}`);
    
    return filtered;
};

/**
 * Filter data for "Belum Dibayar" tab based on payment_status_text
 * @param {Array} data - Array of pengeluaran records
 * @returns {Array} Filtered data
 */
export const filterBelumDibayar = (data) => {
    if (!Array.isArray(data)) {
        console.warn('⚠️ [FILTER] Data is not an array:', data);
        return [];
    }
    
    const filtered = data.filter(item => {
        // Filter berdasarkan payment_status_text
        const statusText = (item.payment_status_text || '').toLowerCase().trim();
        
        // Item masuk kategori "Belum Dibayar" jika payment_status_text = "Belum Bayar"
        const isBelumDibayar = statusText === 'belum bayar';
        
        if (isBelumDibayar) {
            console.log('✅ [FILTER BELUM DIBAYAR] Item memenuhi kriteria:', {
                nota: item.nota || item.nota_sistem,
                payment_status: item.payment_status,
                payment_status_text: item.payment_status_text,
                total_tagihan: item.total_tagihan,
                total_terbayar: item.total_terbayar
            });
        }
        
        return isBelumDibayar;
    });
    
    console.log(`📊 [FILTER BELUM DIBAYAR] Total data sebelum filter: ${data.length}, setelah filter: ${filtered.length}`);
    
    return filtered;
};

/**
 * Filter data for "Lunas" tab based on payment_status_text
 * @param {Array} data - Array of pengeluaran records
 * @returns {Array} Filtered data
 */
export const filterLunas = (data) => {
    if (!Array.isArray(data)) {
        console.warn('⚠️ [FILTER] Data is not an array:', data);
        return [];
    }
    
    const filtered = data.filter(item => {
        // Filter berdasarkan payment_status_text
        const statusText = (item.payment_status_text || '').toLowerCase().trim();
        
        // Item masuk kategori "Lunas" jika payment_status_text = "Lunas"
        const isLunas = statusText === 'lunas';
        
        if (isLunas) {
            console.log('✅ [FILTER LUNAS] Item memenuhi kriteria:', {
                nota: item.nota || item.nota_sistem,
                payment_status: item.payment_status,
                payment_status_text: item.payment_status_text,
                total_tagihan: item.total_tagihan,
                total_terbayar: item.total_terbayar
            });
        }
        
        return isLunas;
    });
    
    console.log(`📊 [FILTER LUNAS] Total data sebelum filter: ${data.length}, setelah filter: ${filtered.length}`);
    
    return filtered;
};

/**
 * Calculate remaining payment
 * @param {number} totalTagihan - Total bill amount
 * @param {number} totalTerbayar - Total paid amount
 * @returns {number} Remaining amount
 */
export const calculateSisaTagihan = (totalTagihan, totalTerbayar) => {
    return Math.max(0, totalTagihan - totalTerbayar);
};

export default {
    getPengeluaran,
    getPengeluaranSummary,
    getPengeluaranDetail,
    convertToDataTablesParams,
    getPaymentStatusByTab,
    filterBelumLunas,
    filterBelumDibayar,
    filterLunas,
    calculateSisaTagihan
};