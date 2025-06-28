import React from 'react';

const StatusBadge = ({ status }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full inline-block";
    let specificClasses = "";
    switch (status.toLowerCase()) {
        case 'selesai':
        case 'diterima':
        case 'tersedia':
            specificClasses = 'bg-green-100 text-green-800';
            break;
        case 'tertunda':
            specificClasses = 'bg-yellow-100 text-yellow-800';
            break;
        case 'dipesan':
            specificClasses = 'bg-blue-100 text-blue-800';
            break;
        case 'beku':
            specificClasses = 'bg-sky-100 text-sky-800';
            break;
        case 'karantina':
            specificClasses = 'bg-purple-100 text-purple-800';
            break;
        case 'dibatalkan':
        case 'kadaluarsa':
            specificClasses = 'bg-red-100 text-red-800';
            break;
        case 'terjual':
            specificClasses = 'bg-gray-500 text-white';
            break;
        default:
            specificClasses = 'bg-gray-100 text-gray-800';
    }
    return <span className={`${baseClasses} ${specificClasses}`}>{status}</span>;
};

export default StatusBadge;
