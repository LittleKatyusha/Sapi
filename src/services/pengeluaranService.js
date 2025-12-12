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
 * 0 = Belum Bayar/Belum Lunas (Unpaid/Partially Paid)
 * 1 = Lunas (Fully Paid)
 * 2 = Belum Lunas (Partially Paid) - alternative status
 */
export const getPaymentStatusByTab = (tab) => {
    switch (tab) {
        case 'belum-dibayar':
            return 0; // Belum Bayar (Unpaid)
        case 'lunas':
            return 1; // Lunas (Fully Paid)
        case 'belum-lunas':
            return null; // Get all unpaid/partially paid, filter in frontend
        default:
            return null;
    }
};

/**
 * Filter data for "Belum Lunas" tab
 * @param {Array} data - Array of pengeluaran records
 * @returns {Array} Filtered data
 *
 * Kriteria "Belum Lunas":
 * - payment_status = 0 (Belum Lunas/Belum Bayar) atau 2 (Belum Lunas)
 * - payment_status_text mengandung "Belum Lunas"
 * - ATAU: total_terbayar < total_tagihan (belum lunas penuh)
 */
export const filterBelumLunas = (data) => {
    if (!Array.isArray(data)) {
        console.warn('⚠️ [FILTER] Data is not an array:', data);
        return [];
    }
    
    const filtered = data.filter(item => {
        // Parse values - handle null/undefined values
        const totalTagihan = parseFloat(item.total_tagihan) || 0;
        const totalTerbayar = parseFloat(item.total_terbayar) || 0;
        const paymentStatus = parseInt(item.payment_status);
        
        // Kriteria 1: Check payment_status_text
        const hasStatusTextBelumLunas = item.payment_status_text &&
                                       item.payment_status_text.toLowerCase().includes('belum lunas');
        
        // Kriteria 2: Check payment_status value (0 or 2)
        const hasStatusBelumLunas = paymentStatus === 0 || paymentStatus === 2;
        
        // Kriteria 3: Check if not fully paid
        const isNotFullyPaid = totalTerbayar < totalTagihan;
        
        // Item masuk kategori "Belum Lunas" jika:
        // - Memiliki status text "Belum Lunas", ATAU
        // - Memiliki payment_status 0 atau 2, ATAU
        // - Belum lunas penuh (terbayar < tagihan)
        const isBelumLunas = hasStatusTextBelumLunas || hasStatusBelumLunas || isNotFullyPaid;
        
        if (isBelumLunas) {
            console.log('✅ [FILTER BELUM LUNAS] Item memenuhi kriteria:', {
                nota: item.nota || item.nota_sistem,
                payment_status: item.payment_status,
                payment_status_text: item.payment_status_text,
                totalTagihan,
                totalTerbayar,
                sisa: totalTagihan - totalTerbayar,
                reason: hasStatusTextBelumLunas ? 'status_text' : hasStatusBelumLunas ? 'payment_status' : 'not_fully_paid'
            });
        }
        
        return isBelumLunas;
    });
    
    console.log(`📊 [FILTER BELUM LUNAS] Total data sebelum filter: ${data.length}, setelah filter: ${filtered.length}`);
    
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
    calculateSisaTagihan
};