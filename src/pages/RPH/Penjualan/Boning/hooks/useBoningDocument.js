import { useRef, useState } from 'react';
import PenjualanBoningService from '../../../../../services/penjualanBoningService';

export default function useBoningDocument() {
  const lock = useRef(false);
  const [downloading, setDownloading] = useState(null);
  const [downloadError, setDownloadError] = useState('');
  const download = async (type, row) => {
    if (lock.current) return;
    lock.current = true;
    setDownloading(`${type}:${row.pid}`);
    setDownloadError('');
    try {
      const blob = await PenjualanBoningService.downloadDocument(type, { pid: row.pid });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      try {
        link.href = url;
        link.download = `${type === 'nota' ? 'Nota_Boning' : 'Surat_Jalan_Boning'}_${String(row.no_kwitansi || 'transaksi').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100)}.pdf`;
        document.body.appendChild(link);
        link.click();
      } finally {
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (error) {
      setDownloadError(error?.data?.message || error?.message || 'Gagal mengunduh PDF');
    } finally {
      lock.current = false;
      setDownloading(null);
    }
  };
  return { download, downloading, downloadError };
}
