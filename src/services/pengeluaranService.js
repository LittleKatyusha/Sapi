/**
 * Pengeluaran Service
 * Service layer for Pengeluaran (Expenditure) API
 * Handles communication with PengeluaranController
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

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
 * Get pengeluaran card statistics
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Card data
 */
export const getPengeluaranCards = async (params = {}) => {
    try {
        const response = await HttpClient.get(`${BASE_URL}/card`, {
            params: params
        });

        return response;
    } catch (error) {
        console.error('Error fetching pengeluaran cards:', error);
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
    orderColumn = 'created_at',
    orderDir = 'desc',
    filters = {}
) => {
    // Column mapping for ordering
    const columnMap = {
        'due_date': 5,
        'settlement_date': 6,
        'nota': 10,
        'tgl_masuk': 12,
        'total_tagihan': 8,
        'id_pembayaran': 1,
        'created_at': 1
    };

    const columnIndex = columnMap[orderColumn] || 1;

    return {
        draw: 1,
        start: (page - 1) * perPage,
        length: perPage,
        'search[value]': searchTerm,
        'search[regex]': false,
        'order[0][column]': columnIndex,
        'order[0][dir]': orderDir,
        ...filters
    };
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

/**
 * Download report pengeluaran pengajuan
 * @param {number|string} idPembayaranPembelian
 * @param {string} petugas
 */
export const downloadReportPengajuan = async (idPembayaranPembelian, petugas) => {
    try {
        const response = await HttpClient.get(API_ENDPOINTS.REPORT.PENGELUARAN.SUBMIT, {
            params: {
                id_pembayaran_pembelian: idPembayaranPembelian,
                petugas: petugas
            },
            responseType: 'blob'
        });
        return response;
    } catch (error) {
        console.error('Error downloading report pengajuan:', error);
        throw error;
    }
};

/**
 * Download report pengeluaran pembelian
 * @param {number|string} idPembayaranPembelian
 * @param {string} petugas
 */
export const downloadReportPembelian = async (idPembayaranPembelian, petugas) => {
    try {
        const response = await HttpClient.get(API_ENDPOINTS.REPORT.PENGELUARAN.BUY, {
            params: {
                id_pembayaran_pembelian: idPembayaranPembelian,
                petugas: petugas
            },
            responseType: 'blob'
        });
        return response;
    } catch (error) {
        console.error('Error downloading report pembelian:', error);
        throw error;
    }
};

/**
 * Download report bukti setor kas ke bank
 * @param {string} tglDari - Start date (YYYY-MM-DD)
 * @param {string} sampaiTgl - End date (YYYY-MM-DD)
 * @param {string} petugas - Petugas name
 */
export const downloadReportBuktiSetor = async (tglDari, sampaiTgl, petugas) => {
    try {
        const response = await HttpClient.get(API_ENDPOINTS.REPORT.PENGELUARAN.CASH, {
            params: {
                start_date: tglDari,
                end_date: sampaiTgl,
                petugas: petugas
            },
            responseType: 'blob'
        });
        return response;
    } catch (error) {
        console.error('Error downloading report bukti setor:', error);
        throw error;
    }
};

const pengeluaranService = {
    getPengeluaran,
    getPengeluaranSummary,
    getPengeluaranCards,
    getPengeluaranDetail,
    convertToDataTablesParams,
    calculateSisaTagihan,
    downloadReportPengajuan,
    downloadReportPembelian,
    downloadReportBuktiSetor
};

export default pengeluaranService;