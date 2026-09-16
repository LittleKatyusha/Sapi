/** @jest-environment node */
import { Blob } from 'buffer';
import HttpClient from './httpClient';
import service from './stokQurbanDocumentService';
jest.mock('./httpClient', () => ({ __esModule: true, default: { get: jest.fn() } }));
beforeEach(() => { global.Blob = Blob; jest.clearAllMocks(); });
test.each(['card', 'potong-paksa', 'sapi-mati'])('exact %s identifier contract', async type => {
  const blob = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
  HttpClient.get.mockResolvedValue(blob);
  expect(await service.downloadDocument(type, { pid: 'encrypted+/pid' })).toBe(blob);
  expect(HttpClient.get).toHaveBeenCalledWith('/api/rph/qurban/stock-document', {
    params: { type, pid: 'encrypted+/pid' }, responseType: 'blob', cache: false,
  });
});
test('recap allowlists filters, preserves zero, discards pagination', async () => {
  HttpClient.get.mockResolvedValue(new Blob(['%PDF-1.7']));
  await service.downloadDocument('recap', { status: 0, nota_qurban: 'Q-1', start: 10, length: 1 });
  expect(HttpClient.get.mock.calls[0][1].params).toEqual({ type: 'recap', status: 0, nota_qurban: 'Q-1', eartag: null, eartag_supplier: null });
});
test('invalid input, MIME, signature and HTTP errors rejected', async () => {
  await expect(service.downloadDocument('other')).rejects.toThrow('Jenis');
  await expect(service.downloadDocument('card', {})).rejects.toThrow('PID');
  for (const blob of [{}, new Blob([]), new Blob(['fake'], { type: 'application/pdf' }), new Blob(['%PDF-'], { type: 'text/html' })]) {
    HttpClient.get.mockResolvedValue(blob);
    await expect(service.downloadDocument('card', { pid: 'pid' })).rejects.toThrow('PDF');
  }
  HttpClient.get.mockRejectedValue(new Error('Akses ditolak'));
  await expect(service.downloadDocument('card', { pid: 'pid' })).rejects.toThrow('Akses ditolak');
});
