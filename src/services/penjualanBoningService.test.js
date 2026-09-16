/** @jest-environment node */
import { Blob } from 'buffer';
import HttpClient from './httpClient';
import service from './penjualanBoningService';
jest.mock('./httpClient', () => ({ __esModule: true, default: { post: jest.fn() } }));
beforeEach(() => { global.Blob = Blob; jest.clearAllMocks(); });
test.each(['nota', 'surat-jalan'])('%s sends encrypted PID unchanged', async type => {
  const blob = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
  HttpClient.post.mockResolvedValue(blob);
  expect(await service.downloadDocument(type, { pid: 'encrypted+/pid' })).toBe(blob);
  expect(HttpClient.post).toHaveBeenCalledWith('/api/rph/penjualan/boning/document', { pid: 'encrypted+/pid', type }, { responseType: 'blob' });
});
test('invalid input, MIME, signature, empty and HTTP errors rejected', async () => {
  await expect(service.downloadDocument('receipt', { pid: 'pid' })).rejects.toThrow('jenis');
  await expect(service.downloadDocument('nota', {})).rejects.toThrow('PID');
  for (const blob of [{}, new Blob([]), new Blob(['fake'], { type: 'application/pdf' }), new Blob(['%PDF-'], { type: 'text/html' })]) {
    HttpClient.post.mockResolvedValue(blob);
    await expect(service.downloadDocument('nota', { pid: 'pid' })).rejects.toThrow('PDF');
  }
  HttpClient.post.mockRejectedValue(new Error('Rekonsiliasi penjualan'));
  await expect(service.downloadDocument('nota', { pid: 'pid' })).rejects.toThrow('Rekonsiliasi');
});
