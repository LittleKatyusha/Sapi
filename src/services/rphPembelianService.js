/**
 * RPH Pembelian Service
 * Service layer for RPH pembelian pakan & OVK
 */

import HttpClient from './httpClient';

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizePriceOptions = (item = {}) => {
  const rawOptions =
    item.priceOptions ||
    item.price_options ||
    item.harga_opsi ||
    item.harga_list ||
    item.harga ||
    item.prices;

  if (Array.isArray(rawOptions)) {
    return rawOptions
      .map(toNumber)
      .filter((value) => value !== null);
  }

  const singlePrice =
    toNumber(item.price) ??
    toNumber(item.harga) ??
    toNumber(item.harga_beli) ??
    toNumber(item.harga_satuan) ??
    toNumber(item.harga_produk);

  return singlePrice !== null ? [singlePrice] : [];
};

class RphPembelianService {
  static API_DATA = '/api/rph/pembelian/data';
  static API_PRODUK = '/api/rph/pembelian/getproduk';

  static async getProdukOptions(jenisProduk) {
    try {
      const response = await HttpClient.get(this.API_PRODUK, {
        params: {
          jenis: jenisProduk
        }
      });

      const rawData = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      return {
        success: true,
        data: rawData.map(this.transformProduk),
        message: response?.message || 'Produk berhasil dimuat'
      };
    } catch (error) {
      console.error('Error fetching RPH produk:', error);
      return {
        success: false,
        data: [],
        message: error?.message || 'Gagal memuat produk'
      };
    }
  }

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

  static transformProduk(item = {}) {
    const id = item.id || item.pid || item.id_produk || item.kode_barang || item.code;
    const name =
      item.nama_produk ||
      item.nama_barang ||
      item.nama ||
      item.name ||
      item.NAME ||
      '-';
    const product = item.produk || item.product || '';
    const unit = item.satuan || item.satuan_produk || item.unit || '';
    const qtyValue =
      toNumber(item.qty) ??
      toNumber(item.jumlah) ??
      toNumber(item.stok) ??
      toNumber(item.stock) ??
      toNumber(item.qty_stock);

    const stockText = qtyValue !== null && unit
      ? `${qtyValue} ${unit}`
      : qtyValue !== null
        ? String(qtyValue)
        : item.stock || item.stok || item.persediaan || '';

    const priceOptions = normalizePriceOptions(item);

    return {
      id: String(id ?? name),
      name,
      product,
      stock: stockText || '-',
      unit: unit || '-',
      code: item.kode_barang || item.kode_produk || item.code || item.kode || '',
      supplier: item.pemasok || item.supplier || item.nama_supplier || '',
      priceOptions,
      price: priceOptions[0] ?? 0,
      _original: item
    };
  }
}

export default RphPembelianService;
