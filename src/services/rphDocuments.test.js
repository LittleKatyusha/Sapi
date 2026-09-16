/** @jest-environment node */
import { Blob } from 'buffer';
import HttpClient from './httpClient';
import Bahan from './bahanPembantuRphService';
import Biaya from './biayaRphService';

jest.mock('./httpClient', () => ({ __esModule: true, default: { get: jest.fn() } }));
beforeEach(() => { global.Blob = Blob; jest.clearAllMocks(); });

test.each([[Bahan, undefined, 'bahanpembantu'], [Biaya, 1, 'biaya'], [Biaya, 2, 'biaya']])('downloads scoped PDF %#', async (service, jenis, path) => {
  const blob = new Blob(['%PDF-1.7 fixture']);
  HttpClient.get.mockResolvedValue(blob);
  expect(await service.downloadDocument('encrypted+/pid', jenis)).toBe(blob);
  expect(HttpClient.get).toHaveBeenCalledWith(`/api/rph/${path}/document`, {
    params: { pid: 'encrypted+/pid', ...(jenis && { jenis_pembelian: jenis }) }, responseType: 'blob', cache: false
  });
});

test.each([Bahan, Biaya])('rejects invalid inputs, fake PDFs, API failures %#', async service => {
  await expect(service.downloadDocument('', 1)).rejects.toThrow('PID');
  expect(HttpClient.get).not.toHaveBeenCalled();
  for (const value of [{}, new Blob([]), new Blob(['<html>Login</html>']), new Blob(['{}'], { type: 'application/json' }), new Blob(['fake'], { type: 'application/pdf' })]) {
    HttpClient.get.mockResolvedValue(value);
    await expect(service.downloadDocument('pid', 1)).rejects.toThrow('PDF');
  }
  HttpClient.get.mockRejectedValue(new Error('Akses ditolak'));
  await expect(service.downloadDocument('pid', 1)).rejects.toThrow('Akses ditolak');
});

test('rejects unsupported biaya type', async () => {
  await expect(Biaya.downloadDocument('pid', 3)).rejects.toThrow('Jenis');
  expect(HttpClient.get).not.toHaveBeenCalled();
});
