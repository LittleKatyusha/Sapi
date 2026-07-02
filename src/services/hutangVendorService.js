/**
 * Hutang Vendor Service
 * Service layer for HO Hutang ke Vendor operations
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class HutangVendorService {
  /**
   * Get list hutang vendor dengan pagination dan filter
   */
  static async getData(params = {}) {
    const {
      page = 1,
      perPage = 10,
      search = '',
      startDate = null,
      endDate = null,
      purchaseType = null,
      paymentStatus = null,
      idSupplier = null,
    } = params;

    const start = (page - 1) * perPage;

    const queryParams = new URLSearchParams({
      draw: Date.now(),
      start,
      length: perPage,
      'search[value]': search || '',
    });

    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (purchaseType) queryParams.append('purchase_type', purchaseType);
    if (paymentStatus !== null && paymentStatus !== undefined && paymentStatus !== '')
      queryParams.append('payment_status', paymentStatus);
    if (idSupplier) queryParams.append('id_supplier', idSupplier);

    try {
      const response = await HttpClient.get(
        `${API_ENDPOINTS.HO.HUTANG_VENDOR.DATA}?${queryParams.toString()}`
      );
      return {
        success: true,
        data: response?.data || [],
        recordsTotal: response?.recordsTotal || 0,
        recordsFiltered: response?.recordsFiltered || 0,
      };
    } catch (error) {
      console.error('HutangVendorService.getData error:', error);
      return { success: false, data: [], recordsTotal: 0, recordsFiltered: 0, message: error?.message };
    }
  }

  /**
   * Get summary card data
   */
  static async getSummary(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('start_date', params.startDate);
    if (params.endDate) queryParams.append('end_date', params.endDate);
    if (params.purchaseType) queryParams.append('purchase_type', params.purchaseType);
    if (params.paymentStatus !== null && params.paymentStatus !== undefined && params.paymentStatus !== '')
      queryParams.append('payment_status', params.paymentStatus);
    if (params.idSupplier) queryParams.append('id_supplier', params.idSupplier);

    try {
      const response = await HttpClient.get(
        `${API_ENDPOINTS.HO.HUTANG_VENDOR.SUMMARY}?${queryParams.toString()}`
      );
      return { success: true, data: response?.data || response || {} };
    } catch (error) {
      console.error('HutangVendorService.getSummary error:', error);
      return { success: false, data: {} };
    }
  }

  /**
   * Get riwayat cicilan by id_pembayaran
   */
  static async getRiwayat(idPembayaran) {
    try {
      const response = await HttpClient.get(
        `${API_ENDPOINTS.HO.HUTANG_VENDOR.RIWAYAT}?id_pembayaran=${idPembayaran}`
      );
      return { success: true, data: response?.data || [] };
    } catch (error) {
      console.error('HutangVendorService.getRiwayat error:', error);
      return { success: false, data: [] };
    }
  }

  /**
   * Get detail satu tagihan hutang by pubid
   */
  static async show(pubid) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.HO.HUTANG_VENDOR.SHOW, { pubid });
      return { success: true, data: response?.data || response || {} };
    } catch (error) {
      console.error('HutangVendorService.show error:', error);
      return { success: false, data: {} };
    }
  }

  /**
   * Get list supplier/vendor untuk dropdown filter
   */
  static async getSuppliers() {
    try {
      const queryParams = new URLSearchParams({
        start: '0',
        length: '1000',
        draw: '1',
        'search[value]': '',
        'order[0][column]': '0',
        'order[0][dir]': 'asc',
      });
      const response = await HttpClient.get(
        `${API_ENDPOINTS.MASTER.SUPPLIER}/data?${queryParams.toString()}`
      );
      const list = Array.isArray(response?.data) ? response.data : [];
      return {
        success: true,
        data: list.map((item) => ({
          id: item.id,
          name: item.name || '-',
          jenis_supplier: item.jenis_supplier || '',
        })),
      };
    } catch (error) {
      console.error('HutangVendorService.getSuppliers error:', error);
      return { success: false, data: [] };
    }
  }
}

export default HutangVendorService;
