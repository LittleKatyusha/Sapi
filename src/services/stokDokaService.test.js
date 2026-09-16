/** @jest-environment node */
import { Blob } from 'buffer';
import HttpClient from './httpClient';
import service from './stokDokaService';

jest.mock('./httpClient', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
beforeEach(() => { global.Blob = Blob; jest.clearAllMocks(); });

test('card POST preserves encrypted PID; recap GET excludes pagination and browser rows', async () => {
  const blob = new Blob(['%PDF-1.7 fixture']);
  HttpClient.post.mockResolvedValue(blob);
  HttpClient.get.mockResolvedValue(blob);
  expect(await service.downloadDocument('card', { pid: 'encrypted+/pid' })).toBe(blob);
  expect(HttpClient.post).toHaveBeenCalledWith('/api/rph/stokdoka/card-document', { pid: 'encrypted+/pid' }, { responseType: 'blob', cache: false });
  expect(await service.downloadDocument('recap', { start_date: '2026-09-01', end_date: '2026-09-15', search: ' Kambing ', start: 10, length: 1, rows: [] })).toBe(blob);
  expect(HttpClient.get).toHaveBeenCalledWith('/api/rph/stokdoka/recap-document', {
    responseType: 'blob', cache: false, params: { start_date: '2026-09-01', end_date: '2026-09-15', search: ' Kambing ' },
  });
});

test('rejects invalid input, fake PDF, HTTP errors', async () => {
  await expect(service.downloadDocument('other')).rejects.toThrow('Jenis');
  await expect(service.downloadDocument('card', { pid: '' })).rejects.toThrow('PID');
  expect(HttpClient.post).not.toHaveBeenCalled();
  for (const value of [{}, new Blob([]), new Blob(['<html>Login</html>']), new Blob(['fake'], { type: 'application/pdf' }), new Blob(['%PDF-fake'], { type: 'application/json' })]) {
    HttpClient.post.mockResolvedValue(value);
    await expect(service.downloadDocument('card', { pid: 'pid' })).rejects.toThrow('PDF');
  }
  HttpClient.post.mockRejectedValue(new Error('Akses ditolak'));
  await expect(service.downloadDocument('card', { pid: 'pid' })).rejects.toThrow('Akses ditolak');
  HttpClient.get.mockRejectedValue(new Error('Gagal rekap'));
  await expect(service.downloadDocument('recap')).rejects.toThrow('Gagal rekap');
});
