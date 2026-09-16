/** @jest-environment node */
import { Blob } from 'buffer';
import HttpClient from './httpClient';
import service from './stokSapiService';

jest.mock('./httpClient', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
beforeEach(() => { global.Blob = Blob; jest.clearAllMocks(); });

test.each(['card', 'recap', 'potongpaksa', 'sapimati'])('downloads %s with exact identity and Blob options', async type => {
  const blob = new Blob(['%PDF-1.7 fixture'], { type: 'application/pdf' });
  HttpClient.get.mockResolvedValue(blob);
  HttpClient.post.mockResolvedValue(blob);
  const params = type === 'recap' ? { start_date: '2026-09-10', end_date: '2026-09-15' } : { pid: 'encrypted+/pid' };
  expect(await service.downloadDocument(type, params)).toBe(blob);
  const url = ['card', 'recap'].includes(type) ? `/api/rph/pemeliharaansapi/${type}-document` : `/api/rph/persediaan/${type}/document`;
  if (type === 'card') expect(HttpClient.post).toHaveBeenCalledWith(url, params, { cache: false, responseType: 'blob' });
  else expect(HttpClient.get).toHaveBeenCalledWith(url, { params, cache: false, responseType: 'blob' });
});

test('rejects invalid types, IDs, signatures, MIME and server errors', async () => {
  await expect(service.downloadDocument('constructor', {})).rejects.toThrow('Jenis');
  await expect(service.downloadDocument('card', {})).rejects.toThrow('PID');
  expect(HttpClient.post).not.toHaveBeenCalled();
  for (const blob of [{}, new Blob([]), new Blob(['<html>login</html>']), new Blob(['fake'], { type: 'application/pdf' }), new Blob(['%PDF-fake'], { type: 'application/json' })]) {
    HttpClient.post.mockResolvedValue(blob);
    await expect(service.downloadDocument('card', { pid: 'one' })).rejects.toThrow('PDF');
  }
  HttpClient.post.mockRejectedValue(new Error('Akses ditolak'));
  await expect(service.downloadDocument('card', { pid: 'one' })).rejects.toThrow('Akses ditolak');
});
