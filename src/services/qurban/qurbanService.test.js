/** @jest-environment node */
import { Blob } from 'buffer';
import HttpClient from '../httpClient';
import QurbanService from './qurbanService';

jest.mock('../httpClient', () => ({ __esModule: true, default: { get: jest.fn() } }));
beforeEach(() => { global.Blob = Blob; jest.clearAllMocks(); });

test.each(['pesanan', 'tanda_terima', 'surat_jalan', 'kwitansi'])('downloads %s using qurban PID', async type => {
  const pdf = new Blob(['%PDF-1.7\nreport']);
  HttpClient.get.mockResolvedValue(pdf);
  expect(await QurbanService.downloadDocument('encrypted-qurban-pid', type)).toBe(pdf);
  expect(HttpClient.get).toHaveBeenCalledWith('/api/rph/qurban/document', {
    params: { pid: 'encrypted-qurban-pid', type }, responseType: 'blob', cache: false,
  });
});

test('rejects invalid inputs before requesting', async () => {
  await expect(QurbanService.downloadDocument('', 'pesanan')).rejects.toThrow('PID');
  await expect(QurbanService.downloadDocument('pid', 'toString')).rejects.toThrow('Jenis dokumen');
  expect(HttpClient.get).not.toHaveBeenCalled();
});

test('rejects fake downloads and preserves API errors', async () => {
  for (const value of [new Blob([]), new Blob(['<html>Login</html>']), {}, new Blob(['not pdf'], { type: 'application/pdf' })]) {
    HttpClient.get.mockResolvedValue(value);
    await expect(QurbanService.downloadDocument('pid', 'pesanan')).rejects.toThrow();
  }
  HttpClient.get.mockResolvedValue(new Blob(['{"message":"Belum ada pembayaran"}'], { type: 'application/json' }));
  await expect(QurbanService.downloadDocument('pid', 'kwitansi')).rejects.toThrow('Belum ada pembayaran');
  HttpClient.get.mockRejectedValue(new Error('Akses ditolak'));
  await expect(QurbanService.downloadDocument('pid', 'pesanan')).rejects.toThrow('Akses ditolak');
});
