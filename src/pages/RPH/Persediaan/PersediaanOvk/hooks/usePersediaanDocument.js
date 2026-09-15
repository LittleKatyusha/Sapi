import { useRef, useState } from 'react';
import PersediaanOvkService from '../../../../../services/persediaanOvkService';

export default function usePersediaanDocument() {
  const lock = useRef(new Set());
  const [downloading, setDownloading] = useState(null);
  const [downloadError, setDownloadError] = useState('');
  const download = async (type, pid, params, label) => {
    const key = `${type}:${pid}`;
    if (lock.current.size) return;
    lock.current.add(key);
    setDownloading(key);
    setDownloadError('');
    try {
      const blob = await PersediaanOvkService.downloadDocument(type, params);
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
      lock.current.delete(key);
      setDownloading(null);
    }
  };
  return { download, downloading, downloadError };
}
