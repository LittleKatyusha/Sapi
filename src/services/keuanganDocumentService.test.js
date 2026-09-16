/** @jest-environment node */
import { Blob } from 'buffer';
import HttpClient from './httpClient';
import { downloadKeuanganDocument } from './keuanganDocumentService';
jest.mock('./httpClient', () => ({ __esModule: true, default: { post: jest.fn() } }));
beforeEach(() => { global.Blob = Blob; jest.clearAllMocks(); });
test.each([
  ...['sapi_qurban_utuh', 'boning', 'karkas', 'kulit'].map(jenis => ['penerimaan', jenis]),
  ...['sapi', 'qurban', 'rph_feedmil', 'lain_lain', 'bahan_pembantu_rph', 'kulit', 'rph_ovk_ho', 'rph_hewan'].map(jenis => ['pengeluaran', jenis]),
])('scoped PDFs %s %s', async (arah, jenis) => {
  const blob = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
  HttpClient.post.mockResolvedValue(blob);
  for (const type of ['tagihan', 'payment']) {
    expect(await downloadKeuanganDocument(arah, jenis, type, 'encrypted+pid')).toBe(blob);
    expect(HttpClient.post).toHaveBeenLastCalledWith(`/api/rph/keuangan/${type}-document`, { arah, jenis, [type === 'payment' ? 'payment_detail_pid' : 'pid']: 'encrypted+pid' }, { responseType: 'blob' });
  }
});
test('rejects invalid identity, non-PDF responses and preserves API errors', async () => {
  for (const args of [['penerimaan', 'doka', 'payment', 'pid'], ['pengeluaran', 'boning', 'tagihan', 'pid'], ['pengeluaran', 'sapi', 'payment', '']]) await expect(downloadKeuanganDocument(...args)).rejects.toThrow('PID');
  expect(HttpClient.post).not.toHaveBeenCalled();
  for (const blob of [{}, new Blob([]), new Blob(['%PDF-'], { type: 'text/html' }), new Blob(['<html>Login</html>']), new Blob(['fake'], { type: 'application/pdf' })]) {
    HttpClient.post.mockResolvedValue(blob);
    await expect(downloadKeuanganDocument('pengeluaran', 'sapi', 'payment', 'pid')).rejects.toThrow('PDF');
  }
  HttpClient.post.mockRejectedValue(new Error('Permission denied'));
  await expect(downloadKeuanganDocument('penerimaan', 'boning', 'tagihan', 'pid')).rejects.toThrow('Permission denied');
});
