import React, { useEffect, useState } from 'react';
import { PackageCheck, Info, X } from 'lucide-react';

const Notification = ({ message, type = 'info', onDismiss }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [message, type]);

  useEffect(() => {
    if (!visible) {
      const delay = setTimeout(() => onDismiss?.(), 300); // tunggu animasi selesai
      return () => clearTimeout(delay);
    }
  }, [visible, onDismiss]);

  const isSuccess = type === 'success';
  const baseClasses = `fixed top-5 right-5 z-[100] px-4 py-3 rounded-lg shadow-lg flex items-center justify-between w-80 max-w-full transition-all duration-300`;
  const showClass = visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4';
  const bgClass = isSuccess ? 'bg-green-500' : 'bg-blue-500';

  return (
    <div className={`${baseClasses} ${bgClass} ${showClass}`}>
      <div className="flex items-center">
        {isSuccess ? <PackageCheck size={20} className="mr-3" /> : <Info size={20} className="mr-3" />}
        <span className="text-white text-sm">{message}</span>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="ml-4 text-white hover:text-gray-200"
        aria-label="Tutup notifikasi"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default Notification;
