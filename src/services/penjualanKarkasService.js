import HttpClient from './httpClient';

const BASE = '/api/rph/penjualan/karkas';
const unwrap = (res) => res?.data ?? res;
const mapError = (err, fallback) => err?.data?.message || err?.message || fallback;

// Kept for compatibility with the legacy boning stock screen.
export const BAGIAN_KARKAS = [
  { value: 'paha_belakang_kanan', label: 'Paha Belakang Kanan' },
  { value: 'paha_belakang_kiri', label: 'Paha Belakang Kiri' },
  { value: 'paha_depan_kanan', label: 'Paha Depan Kanan' },
  { value: 'paha_depan_kiri', label: 'Paha Depan Kiri' },
];

const PenjualanKarkasService = {
  async getData(params = {}) { return HttpClient.get(`${BASE}/data`, { params, cache: false }); },
  async show(pid) { return HttpClient.post(`${BASE}/show`, { pid }); },
  async store(payload) { return HttpClient.post(`${BASE}/store`, payload); },
  async update(payload) { return HttpClient.post(`${BASE}/update`, payload); },
  async hapus(pid) { return HttpClient.post(`${BASE}/delete`, { pid }); },
  async optionsPedagang() { return unwrap(await HttpClient.get(`${BASE}/options/pedagang`, { cache: false })); },
  async optionsSapi(search = '') { return unwrap(await HttpClient.get(`${BASE}/options/sapi`, { params: { search }, cache: false })); },
  async optionsBank() { return unwrap(await HttpClient.get(`${BASE}/options/bank`, { cache: false })); },
  async optionsPengirim() { return unwrap(await HttpClient.get(`${BASE}/options/pengirim`, { cache: false })); },
  async optionsKendaraan() { return unwrap(await HttpClient.get(`${BASE}/options/kendaraan`, { cache: false })); },
  async getHarga(id_pedagang) { return HttpClient.post(`${BASE}/getharga`, { id_pedagang, id_item_potong: 27 }); },
  async bayar(payload) {
    try {
      const res = await HttpClient.post(`${BASE}/bayar`, payload);
      return { success: true, data: res.data || null, message: res.message || 'Pembayaran karkas berhasil dicatat' };
    } catch (err) {
      return { success: false, data: null, message: mapError(err, 'Gagal mencatat pembayaran karkas') };
    }
  },
  async getPembayaranHistory(pid) {
    try {
      const res = await HttpClient.post(`${BASE}/pembayaran-history`, { pid });
      return { success: true, data: res.data || null, message: res.message || 'History pembayaran karkas berhasil dimuat' };
    } catch (err) {
      return { success: false, data: null, message: mapError(err, 'Gagal memuat history pembayaran karkas') };
    }
  },
  async getPenerimaanHistory(params = {}) {
    try {
      const query = new URLSearchParams({ draw: params.draw || 1, start: params.start || 0, length: params.length || 1000, search: params.search || '', _ts: Date.now() });
      if (params.tanggal_awal) query.append('start_date', params.tanggal_awal);
      if (params.tanggal_akhir) query.append('end_date', params.tanggal_akhir);
      const res = await HttpClient.get(`${BASE}/penerimaan-history?${query.toString()}`);
      return { success: true, data: res.data || [], recordsTotal: res.recordsTotal || 0, recordsFiltered: res.recordsFiltered || 0 };
    } catch (err) {
      return { success: false, data: [], recordsTotal: 0, recordsFiltered: 0, message: mapError(err, 'Gagal memuat riwayat penerimaan karkas') };
    }
  },
};

export default PenjualanKarkasService;
