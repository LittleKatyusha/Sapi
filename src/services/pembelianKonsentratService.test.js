/** @jest-environment node */
import { Blob } from 'buffer';
import httpClient from './httpClient';
import service from './pembelianKonsentratService';

jest.mock('./httpClient', () => ({ __esModule: true, default: { get: jest.fn() } }));
beforeEach(() => { global.Blob = Blob; jest.clearAllMocks(); });

test.each(['purchase', 'stock'])('downloads %s using the record PID, not payment ID', async type => {
  const pdf = new Blob(['%PDF-1.7 fixture']);
  httpClient.get.mockResolvedValue(pdf);
  expect(await service.downloadDocument('encrypted+/pid', type)).toBe(pdf);
  expect(httpClient.get).toHaveBeenCalledWith('/api/rph/pembelian-konsentrat/document', {
    params: { pid: 'encrypted+/pid', type }, responseType: 'blob', cache: false,
  });
});

test('rejects invalid input, fake PDFs and API failures', async () => {
  for (const pid of ['', null, [], ' ']) await expect(service.downloadDocument(pid)).rejects.toThrow('PID');
  await expect(service.downloadDocument('pid', 'receipt')).rejects.toThrow('Jenis');
  expect(httpClient.get).not.toHaveBeenCalled();
  for (const value of [{}, new Blob([]), new Blob(['<html>Login</html>']), new Blob(['fake'], { type: 'application/pdf' })]) {
    httpClient.get.mockResolvedValue(value);
    await expect(service.downloadDocument('pid')).rejects.toThrow('PDF');
  }
  httpClient.get.mockRejectedValue(new Error('Akses ditolak'));
  await expect(service.downloadDocument('pid')).rejects.toThrow('Akses ditolak');
});
