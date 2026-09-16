import { useRef, useState } from 'react';
import PenawaranPenjualanRphService from '../../../services/penawaranPenjualanRphService';

export default function usePenawaranDocument() {
  const lock = useRef(false);
  const [downloading, setDownloading] = useState(null);
  const [downloadError, setDownloadError] = useState('');
  const download = async (row) => {
    if (lock.current) return;
    lock.current = true;
    setDownloading(`dispensasi:${row.pid}`);
    setDownloadError('');
    try {
      const blob = await PenawaranPenjualanRphService.downloadDocument('dispensasi', { pid: row.pid });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      try {
        link.href = url;
        link.download = `Dispensasi_${String(row.nomor_spp || 'SPP').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100)}.pdf`;
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
