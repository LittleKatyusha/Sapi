/** @jest-environment node */
import { Blob } from 'buffer';
import HttpClient from './httpClient';
import Karkas from './penjualanKarkasService';
import Kulit from './penjualanKulitService';
jest.mock('./httpClient', () => ({ __esModule: true, default: { post: jest.fn() } }));
beforeEach(() => { global.Blob = Blob; jest.clearAllMocks(); });

test.each([[Karkas, 'karkas'], [Kulit, 'kulit']])('validates PDF bytes, MIME, PID, API errors %#', async (service, module) => {
  for (const type of ['nota', 'surat-jalan']) {
    const blob = new Blob(['%PDF-1.7 fixture'], { type: 'application/pdf' });
    HttpClient.post.mockResolvedValue(blob);
    expect(await service.downloadDocument(type, { pid: 'encrypted+/pid' })).toBe(blob);
    expect(HttpClient.post).toHaveBeenLastCalledWith(`/api/rph/penjualan/${module}/document`, { pid: 'encrypted+/pid', type }, { responseType: 'blob' });
  }
  await expect(service.downloadDocument('receipt', { pid: 'pid' })).rejects.toThrow('PID');
  await expect(service.downloadDocument('nota', { pid: '' })).rejects.toThrow('PID');
  for (const value of [{}, new Blob([]), new Blob(['<html>Login</html>']), new Blob(['%PDF-'], { type: 'application/json' }), new Blob(['fake'], { type: 'application/pdf' })]) {
    HttpClient.post.mockResolvedValue(value);
    await expect(service.downloadDocument('nota', { pid: 'pid' })).rejects.toThrow('PDF');
  }
  HttpClient.post.mockRejectedValue(new Error('Akses ditolak'));
  await expect(service.downloadDocument('nota', { pid: 'pid' })).rejects.toThrow('Akses ditolak');
});
