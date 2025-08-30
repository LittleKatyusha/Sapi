import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Edit, Copy, Trash2, Download, Loader2, FileText } from 'lucide-react';
import LaporanPembelianService from '../../../../services/laporanPembelianService';
import { API_ENDPOINTS, API_BASE_URL } from '../../../../config/api';

const ActionMenu = ({ row, onEdit, onDelete, onDetail, onClose, buttonRef }) => {
    const menuRef = useRef(null);
    const [menuStyle, setMenuStyle] = useState(null);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [fileLoading, setFileLoading] = useState(false);

    useLayoutEffect(() => {
        function updatePosition() {
            if (buttonRef?.current) {
                const btnRect = buttonRef.current.getBoundingClientRect();
                setMenuStyle({
                    position: 'absolute',
                    left: btnRect.left + window.scrollX,
                    top: btnRect.bottom + window.scrollY + 8,
                    zIndex: 9999
                });
            }
        }
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose, buttonRef]);

    // Handle view file functionality
    const handleViewFile = async (row) => {
        if (!row.file) {
            alert('File tidak tersedia untuk pembelian ini');
            return;
        }

        setFileLoading(true);
        try {
            // Get auth token
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            
            if (!token) {
                alert('Sesi login telah berakhir. Silakan login kembali.');
                return;
            }

            // Clean file path
            const cleanPath = row.file.replace(/\\/g, '/');
            const fileUrl = `${API_BASE_URL}${API_ENDPOINTS.HO.PEMBELIAN}/file/${cleanPath}`;
            
            // Create new window
            const newWindow = window.open('about:blank', '_blank');
            
            // Fetch file with authentication
            const response = await fetch(fileUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/pdf,image/*,*/*'
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                
                if (newWindow && !newWindow.closed) {
                    newWindow.location.href = blobUrl;
                } else {
                    // Fallback: download file
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = cleanPath.split('/').pop();
                    link.click();
                    URL.revokeObjectURL(blobUrl);
                }
            } else if (response.status === 401) {
                alert('Sesi login telah berakhir');
                if (newWindow && !newWindow.closed) {
                    newWindow.close();
                }
            } else {
                alert(`File tidak dapat diakses (${response.status})`);
                if (newWindow && !newWindow.closed) {
                    newWindow.close();
                }
            }
            
            // Close menu after successful view
            onClose();
            
        } catch (error) {
            console.error('Error viewing file:', error);
            alert('Gagal membuka file');
        } finally {
            setFileLoading(false);
        }
    };

    // Handle download functionality
    const handleDownload = async (row) => {
        if (!row.nota) {
            alert('Nomor nota tidak tersedia');
            return;
        }

        setDownloadLoading(true);
        try {
            const blob = await LaporanPembelianService.downloadPdfReport('getReportNotaSupplier', {
                nota: row.nota
            });
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `LAPORAN_PEMBELIAN_${row.nota}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            // Close menu after successful download
            onClose();
            
        } catch (error) {
            console.error('Error downloading report:', error);
            alert(error.message || 'Terjadi kesalahan saat mengunduh laporan');
        } finally {
            setDownloadLoading(false);
        }
    };

    // Debug logging untuk melihat data row
    console.log('🔍 Row data for actions:', {
        file: row.file,
        nota: row.nota,
        hasFile: !!row.file
    });

    const actions = [
        {
            label: 'Lihat Detail',
            icon: Eye,
            onClick: () => onDetail(row),
            className: 'text-gray-700',
            description: 'Informasi lengkap',
            bg: 'bg-blue-100',
            hoverBg: 'group-hover:bg-blue-200',
            text: 'text-blue-600',
        },
        {
            label: 'Edit Pembelian',
            icon: Edit,
            onClick: () => onEdit(row),
            className: 'text-gray-700',
            description: 'Ubah informasi',
            bg: 'bg-amber-100',
            hoverBg: 'group-hover:bg-amber-200',
            text: 'text-amber-600',
        },
        ...(row.file ? [{
            label: 'Lihat File',
            icon: fileLoading ? Loader2 : FileText,
            onClick: () => handleViewFile(row),
            className: fileLoading ? 'text-gray-400' : 'text-gray-700',
            description: fileLoading ? 'Membuka...' : 'Buka dokumen',
            bg: 'bg-purple-100',
            hoverBg: 'group-hover:bg-purple-200',
            text: 'text-purple-600',
            disabled: fileLoading,
            isLoading: fileLoading,
        }] : []),
        {
            label: 'Unduh Laporan',
            icon: downloadLoading ? Loader2 : Download,
            onClick: () => handleDownload(row),
            className: downloadLoading ? 'text-gray-400' : 'text-gray-700',
            description: downloadLoading ? 'Mengunduh...' : 'Download PDF',
            bg: 'bg-green-100',
            hoverBg: 'group-hover:bg-green-200',
            text: 'text-green-600',
            disabled: downloadLoading,
            isLoading: downloadLoading,
        },
        {
            divider: true
        },
        {
            label: 'Hapus Pembelian',
            icon: Trash2,
            onClick: () => onDelete(row),
            className: 'text-red-600',
            description: 'Hapus permanen',
            bg: 'bg-red-100',
            hoverBg: 'group-hover:bg-red-200',
            text: 'text-red-600',
        }
    ];

    // Render menu hanya jika posisi sudah didapat
    if (!menuStyle) return null;

    const menuElement = (
        <div
            ref={menuRef}
            style={{
                ...menuStyle,
                visibility: 'visible',
                pointerEvents: 'auto',
                zIndex: 99999
            }}
            className={`w-48 bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-gray-200/50 overflow-hidden transition-all duration-150 animate-in slide-in-from-top-2 fade-in-0`}
            role="menu"
            aria-label="Menu Aksi"
        >
            <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200/50">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Menu Aksi</p>
            </div>
            <div className="p-1">
                {actions.map((action, idx) =>
                    action.divider ? (
                        <div key={idx} className="border-t border-gray-200/50 my-1"></div>
                    ) : (
                        <button
                            key={action.label}
                            onClick={() => { 
                                if (!action.disabled) {
                                    action.onClick(); 
                                    // onClose is handled individually in each action
                                    if (action.label === 'Lihat Detail' || action.label === 'Edit Pembelian' || action.label === 'Hapus Pembelian') {
                                        onClose(); 
                                    }
                                }
                            }}
                            disabled={action.disabled}
                            className={`w-full text-left flex items-center px-3 py-2.5 text-sm hover:bg-gradient-to-r transition-all duration-150 rounded-lg group mt-1 ${action.className} ${action.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                            role="menuitem"
                            tabIndex={0}
                        >
                            <div className={`w-7 h-7 ${action.bg} rounded-lg flex items-center justify-center mr-3 ${action.hoverBg} group-hover:scale-105 transition-all duration-150`}>
                                <action.icon size={14} className={`${action.text} ${action.isLoading ? 'animate-spin' : ''}`} />
                            </div>
                            <div className="flex-1">
                                <span className="font-semibold block text-xs">{action.label}</span>
                                <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
                            </div>
                        </button>
                    )
                )}
            </div>
        </div>
    );

    return createPortal(menuElement, document.body);
};

export default ActionMenu;