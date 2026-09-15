import HttpClient from './httpClient';

const StokQurbanDocumentService = {
  async downloadDocument(type, params = {}) {
    if (!['card', 'recap', 'potong-paksa', 'sapi-mati'].includes(type)) throw new Error('Jenis dokumen tidak valid');
    if (type !== 'recap' && (typeof params.pid !== 'string' || !params.pid.trim())) throw new Error('PID tidak ditemukan');
    const filters = type === 'recap' ? {
      eartag: params.eartag || null, eartag_supplier: params.eartag_supplier || null,
      nota_qurban: params.nota_qurban || null, status: params.status === '' ? null : params.status,
    } : { pid: params.pid };
    const blob = await HttpClient.get('/api/rph/qurban/stock-document', {
      params: { type, ...filters }, responseType: 'blob', cache: false,
    });
    if (!(blob instanceof Blob) || !blob.size || (blob.type && !['application/pdf', 'application/octet-stream'].includes(blob.type.toLowerCase()))
      || await blob.slice(0, 5).text() !== '%PDF-') throw new Error('Respons server bukan dokumen PDF yang valid');
    return blob;
  },
};
export default StokQurbanDocumentService;
