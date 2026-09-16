/** @jest-environment node */
import { Blob } from 'buffer';
import HttpClient from './httpClient';
import PoRphService from './poRphService';

jest.mock('./httpClient', () => ({ __esModule: true, default: { get: jest.fn() } }));

beforeEach(() => {
  global.Blob = Blob;
  jest.clearAllMocks();
});

test.each(['delivery', 'handover', 'receipt'])('downloads %s with encrypted PO PID and RPH permission endpoint', async (type) => {
  const pdf = new Blob(['%PDF-1.7\nreport'], { type: 'application/pdf' });
  HttpClient.get.mockResolvedValue(pdf);
  expect(await PoRphService.downloadRowPdf('encrypted-po-pid', type)).toBe(pdf);
  expect(HttpClient.get).toHaveBeenCalledWith(`/api/rph/po/document/${type}`, {
    params: { id: 'encrypted-po-pid' }, cache: false, responseType: 'blob'
  });
});

test('rejects missing PID and unknown document before requesting', async () => {
  await expect(PoRphService.downloadRowPdf('', 'delivery')).rejects.toThrow('PID');
  await expect(PoRphService.downloadRowPdf('pid', 'toString')).rejects.toThrow('Jenis dokumen');
  expect(HttpClient.get).not.toHaveBeenCalled();
});

test('preserves JSON errors, rejects HTML, empty and non-Blob responses', async () => {
  HttpClient.get.mockResolvedValue(new Blob(['{"message":"Pembayaran belum lunas"}'], { type: 'application/json' }));
  await expect(PoRphService.downloadRowPdf('pid', 'receipt')).rejects.toThrow('Pembayaran belum lunas');
  for (const response of [new Blob(['<html>Login</html>']), new Blob([]), { message: 'error' }]) {
    HttpClient.get.mockResolvedValue(response);
    await expect(PoRphService.downloadRowPdf('pid', 'delivery')).rejects.toThrow();
  }
});

test('propagates HTTP failures', async () => {
  HttpClient.get.mockRejectedValue(new Error('Akses ditolak'));
  await expect(PoRphService.downloadRowPdf('pid', 'delivery')).rejects.toThrow('Akses ditolak');
});
