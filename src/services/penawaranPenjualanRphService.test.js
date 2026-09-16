/** @jest-environment node */
import { Blob } from 'buffer';
import HttpClient from './httpClient';
import service from './penawaranPenjualanRphService';
jest.mock('./httpClient', () => ({ __esModule: true, default: { post: jest.fn() } }));
beforeEach(() => { global.Blob = Blob; jest.clearAllMocks(); });
test('encrypted PID sent unchanged; PDF validated', async () => {
  const blob = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
  HttpClient.post.mockResolvedValue(blob);
  expect(await service.downloadDocument('dispensasi', { pid: 'encrypted+/pid' })).toBe(blob);
  expect(HttpClient.post).toHaveBeenCalledWith('/api/rph/penawaran/document', { pid: 'encrypted+/pid' }, { responseType: 'blob' });
});
test('invalid input, MIME, signature, empty and HTTP errors rejected', async () => {
  await expect(service.downloadDocument('invoice', { pid: 'pid' })).rejects.toThrow('jenis');
  await expect(service.downloadDocument('dispensasi', {})).rejects.toThrow('PID');
  for (const blob of [{}, new Blob([]), new Blob(['fake'], { type: 'application/pdf' }), new Blob(['%PDF-'], { type: 'text/html' })]) {
    HttpClient.post.mockResolvedValue(blob);
    await expect(service.downloadDocument('dispensasi', { pid: 'pid' })).rejects.toThrow('PDF');
  }
  HttpClient.post.mockRejectedValue(new Error('Akses ditolak'));
  await expect(service.downloadDocument('dispensasi', { pid: 'pid' })).rejects.toThrow('Akses ditolak');
});
