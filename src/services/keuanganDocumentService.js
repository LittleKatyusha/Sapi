import HttpClient from './httpClient';

const types = {
  penerimaan: ['sapi_qurban_utuh', 'boning', 'karkas', 'kulit'],
  pengeluaran: ['sapi', 'qurban', 'rph_feedmil', 'lain_lain', 'bahan_pembantu_rph', 'kulit', 'rph_ovk_ho', 'rph_hewan'],
};

export async function downloadKeuanganDocument(arah, jenis, type, pid) {
  if (!types[arah]?.includes(jenis) || !['tagihan', 'payment'].includes(type) || typeof pid !== 'string' || !pid.trim()) {
    throw new Error('PID atau jenis dokumen tidak valid');
  }
  const blob = await HttpClient.post(`/api/rph/keuangan/${type}-document`, {
    arah, jenis, [type === 'payment' ? 'payment_detail_pid' : 'pid']: pid,
  }, { responseType: 'blob' });
  if (!(blob instanceof Blob) || !blob.size || (blob.type && !['application/pdf', 'application/octet-stream'].includes(blob.type.toLowerCase()))
    || await blob.slice(0, 5).text() !== '%PDF-') throw new Error('Respons server bukan dokumen PDF yang valid');
  return blob;
}
