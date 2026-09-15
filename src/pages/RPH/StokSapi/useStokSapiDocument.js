import { useRef, useState } from 'react';
import StokSapiService from '../../../services/stokSapiService';

export default function useStokSapiDocument(service = StokSapiService) {
  const lock = useRef(false);
  const [downloading, setDownloading] = useState(null);
  const [downloadError, setDownloadError] = useState('');
  const download = async (type, pid, params, label) => {
    if (lock.current) return;
    lock.current = true;
    setDownloading(`${type}:${pid}`);
    setDownloadError('');
    try {
      const blob = await service.downloadDocument(type, params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      try {
        link.href = url;
        link.download = `${type}_${String(label || 'RPH').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100)}.pdf`;
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
