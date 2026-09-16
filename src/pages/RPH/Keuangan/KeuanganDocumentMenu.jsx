import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { downloadKeuanganDocument } from '../../../services/keuanganDocumentService';

export function useKeuanganDocument(arah) {
  const lock = useRef(false);
  const [downloading, setDownloading] = useState(null);
  const [downloadError, setDownloadError] = useState('');
  const download = async (type, row) => {
    if (lock.current) return;
    const pid = type === 'payment' ? row.payment_detail_pid : row.pid;
    lock.current = true;
    setDownloading(`${type}:${pid}`);
    setDownloadError('');
    try {
      const blob = await downloadKeuanganDocument(arah, row.document_jenis, type, pid);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      try {
        link.href = url;
        link.download = `${arah}_${type}_${String(row.no_transaksi || row.no_po || row.nota_sistem || 'transaksi').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80)}.pdf`;
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

export default function KeuanganDocumentMenu({ row, arah, history = false, documents, onDetail, onBayar }) {
  const [position, setPosition] = useState(null);
  const button = useRef(null);
  const menu = useRef(null);
  const type = history ? 'payment' : 'tagihan';
  const pid = history ? row.payment_detail_pid : row.pid;
  const busy = documents.downloading === `${type}:${pid}`;
  const close = () => { setPosition(null); button.current?.focus(); };
  useEffect(() => {
    if (!position) return;
    menu.current?.querySelector('button:not(:disabled)')?.focus();
    const outside = e => { if (!menu.current?.contains(e.target) && !button.current?.contains(e.target)) setPosition(null); };
    const keyboard = e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') close();
    };
    const reposition = () => setPosition(null);
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', keyboard);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', keyboard);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [position]);
  const label = history
    ? (arah === 'penerimaan' ? 'Bukti Penerimaan Pembayaran PDF' : 'Bukti Pembayaran Pengeluaran PDF')
    : (arah === 'penerimaan' ? 'Rincian Tagihan Penjualan PDF' : 'Rincian Tagihan Pengeluaran PDF');
  const style = 'w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none disabled:opacity-50';
  return <>
    <button ref={button} type="button" aria-label="Menu dokumen dan aksi" aria-expanded={!!position} aria-busy={busy}
      className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-emerald-600" onClick={() => {
        if (position) return close();
        const rect = button.current.getBoundingClientRect();
        setPosition({ left: Math.max(8, Math.min(rect.right - 288, window.innerWidth - 296)), top: Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - 164)) });
      }}><MoreVertical className="w-5 h-5" />{busy && <span className="sr-only">Mengunduh PDF</span>}</button>
    {position && createPortal(<div ref={menu} aria-label="Aksi dokumen" className="fixed bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50" style={{ ...position, width: 'min(288px, calc(100vw - 16px))' }}>
      {!history && onDetail && <button type="button" className={style} onClick={() => { close(); onDetail(row); }}>Detail</button>}
      {!history && onBayar && (row.sisa_pembayaran || 0) > 0 && <button type="button" className={style} onClick={() => { close(); onBayar(row); }}>Bayar</button>}
      <button type="button" className={style} disabled={!pid || !!documents.downloading} onClick={() => { close(); documents.download(type, row); }}>{busy ? 'Mengunduh PDF...' : label}</button>
    </div>, document.body)}
  </>;
}
