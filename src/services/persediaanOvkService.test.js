/** @jest-environment node */
import { Blob } from 'buffer';
import httpClient from './httpClient';
import service from './persediaanOvkService';

jest.mock('./httpClient', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
beforeEach(() => { global.Blob = Blob; jest.clearAllMocks(); });

test.each(['recipe', 'stock', 'ledger'])('validates %s PDF response', async type => {
  const pdf = new Blob(['%PDF-1.7 fixture']);
  const params = { pid: 'encrypted+/pid' };
  httpClient.get.mockResolvedValue(pdf);
  httpClient.post.mockResolvedValue(pdf);
  expect(await service.downloadDocument(type, params)).toBe(pdf);
  if (type === 'recipe') expect(httpClient.post).toHaveBeenCalledWith('/api/rph/persediaan/pakan/recipe-document', params, { responseType: 'blob', cache: false });
  else expect(httpClient.get).toHaveBeenCalledWith(`/api/rph/persediaan/ovk/${type}-document`, { params, responseType: 'blob', cache: false });
});

test('rejects invalid types, IDs, fake PDFs and service errors', async () => {
  await expect(service.downloadDocument('wrong', {})).rejects.toThrow('Jenis');
  await expect(service.downloadDocument('recipe', {})).rejects.toThrow('PID');
  for (const value of [{}, new Blob([]), new Blob(['<html>Login</html>']), new Blob(['fake'], { type: 'application/pdf' })]) {
    httpClient.get.mockResolvedValue(value);
    await expect(service.downloadDocument('stock', {})).rejects.toThrow('PDF');
  }
  httpClient.get.mockRejectedValue(new Error('Akses ditolak'));
  await expect(service.downloadDocument('ledger', {})).rejects.toThrow('Akses ditolak');
});

test('explicitly requests all ledger records', async () => {
  httpClient.get.mockResolvedValue({ data: [] });
  await service.getPenggunaData({ startDate: '2026-09-01', endDate: '2026-09-15' });
  expect(httpClient.get.mock.calls[0][0]).toContain('length=-1');
});
