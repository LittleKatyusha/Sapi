/**
 * Piutang Cabang Service
 * Service layer for HO Piutang dari RPH/Warehouse operations
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class PiutangCabangService {
  /**
   * Get list piutang cabang dengan pagination dan filter
   */
  static async getData(params = {}) {
    const {
      page = 1,
      perPage = 10,
      search = '',
      startDate = null,
      endDate = null,
      idCabang = null,
      sumber = null,
      paymentStatus = null,
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
    if (idCabang) queryParams.append('id_cabang', idCabang);
    if (sumber) queryParams.append('sumber', sumber);
    if (paymentStatus !== null && paymentStatus !== undefined && paymentStatus !== '')
      queryParams.append('payment_status', paymentStatus);

    try {
      const response = await HttpClient.get(
        `${API_ENDPOINTS.HO.PIUTANG_CABANG.DATA}?${queryParams.toString()}`
      );
      return {
        success: true,
        data: response?.data || [],
        recordsTotal: response?.recordsTotal || 0,
        recordsFiltered: response?.recordsFiltered || 0,
      };
    } catch (error) {
      console.error('PiutangCabangService.getData error:', error);
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
    if (params.idCabang) queryParams.append('id_cabang', params.idCabang);

    try {
      const response = await HttpClient.get(
        `${API_ENDPOINTS.HO.PIUTANG_CABANG.SUMMARY}?${queryParams.toString()}`
      );
      return { success: true, data: response?.data || response || {} };
    } catch (error) {
      console.error('PiutangCabangService.getSummary error:', error);
      return { success: false, data: {} };
    }
  }

  /**
   * Get riwayat pembayaran masuk dari RPH by id_pembayaran (hanya untuk PO Doka)
   */
  static async getRiwayat(idPembayaran) {
    try {
      const response = await HttpClient.get(
        `${API_ENDPOINTS.HO.PIUTANG_CABANG.RIWAYAT}?id_pembayaran=${idPembayaran}`
      );
      return { success: true, data: response?.data || [] };
    } catch (error) {
      console.error('PiutangCabangService.getRiwayat error:', error);
      return { success: false, data: [] };
    }
  }

  /**
   * Get detail satu piutang by pubid
   */
  static async show(pubid, sumber = 'doka') {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.HO.PIUTANG_CABANG.SHOW, { pubid, sumber });
      return { success: true, data: response?.data || response || {} };
    } catch (error) {
      console.error('PiutangCabangService.show error:', error);
      return { success: false, data: {} };
    }
  }
}

export default PiutangCabangService;
