import React from 'react';
import { PackageCheck, Truck, ShieldCheck, ShieldQuestion } from 'lucide-react';

const DeliveryStatusBadge = ({ status }) => {
    const config = React.useMemo(() => {
        switch (status) {
            case 'Selesai': return { C: 'bg-green-100 text-green-800', I: <PackageCheck size={12} /> };
            case 'Dalam Pengantaran': return { C: 'bg-blue-100 text-blue-800', I: <Truck size={12} /> };
            case 'Disetujui': return { C: 'bg-cyan-100 text-cyan-800', I: <ShieldCheck size={12} /> };
            case 'Menunggu Persetujuan': return { C: 'bg-yellow-100 text-yellow-800', I: <ShieldQuestion size={12} /> };
            default: return { C: 'bg-gray-100 text-gray-800', I: null };
        }
    }, [status]);

    return (
        <span className={`flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded-full ${config.C}`}>
            {config.I && <span className="mr-1.5">{config.I}</span>}
            {status}
        </span>
    );
};

export default DeliveryStatusBadge;
