/**
 * RPH Pembelian Service
 * Service layer for RPH pembelian pakan & OVK
 */

import HttpClient from './httpClient';

class RphPembelianService {
  static API_DATA = '/api/rph/pembelian/data';

  static async getPembelianData(idJenisPembelianRph) {
    try {
      const response = await HttpClient.get(this.API_DATA, {
        params: {
          id_jenis_pembelian_rph: idJenisPembelianRph
        }
      });

      const rawData = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      return {
        success: true,
        data: rawData.map(this.transformData),
        message: response?.message || 'Data pembelian berhasil dimuat'
      };
    } catch (error) {
      console.error('Error fetching RPH pembelian data:', error);
      return {
        success: false,
        data: [],
        message: error?.message || 'Gagal memuat data pembelian'
      };
    }
  }

  static transformData(item = {}) {
    return {
      id: item.pid || item.nomor_pemesanan || item.id,
      pid: item.pid,
      nomor: item.nomor_pemesanan || '- ',
      tanggal: item.tgl_pemesanan || item.created_at || null,
      supplier: item.pemasok || '- ',
      jenisItem: item.nama_produk || '- ',
      jumlah: Number(item.total_jumlah) || 0,
      satuan: item.satuan || item.satuan_produk || '-',
      total: Number(item.harga_total) || 0,
      status: item.keterangan || item.status || 'Menunggu',
      _original: item
    };
  }
}

export default RphPembelianService;
