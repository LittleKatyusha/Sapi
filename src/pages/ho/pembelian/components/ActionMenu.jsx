import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Edit, Copy, Trash2, Download, Loader2, FileText } from 'lucide-react';
import LaporanPembelianService from '../../../../services/laporanPembelianService';
import { API_ENDPOINTS, API_BASE_URL } from '../../../../config/api';

const ActionMenu = ({ row, onEdit, onDelete, onDetail, onClose, buttonRef, apiEndpoint = API_ENDPOINTS.HO.PEMBELIAN }) => {
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

    // Handle view file functionality - Updated for new Minio storage
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

            // Debug: Log the original path
            console.log('ActionMenu - Original file path:', row.file);
            
            let cleanPath;
            
            // Check if it's a full Minio URL or relative path
            if (row.file.startsWith('http://') || row.file.startsWith('https://')) {
                // It's a full Minio URL, extract the relative path
                // Example: http://31.97.110.74:9000/ternasys/ho/ternak/pembelian/2025/9/224/filename.pdf
                // Extract: ho/ternak/pembelian/2025/9/224/filename.pdf
                const url = new URL(row.file);
                const pathParts = url.pathname.split('/');
                // Remove empty parts and 'ternasys' prefix
                const filteredParts = pathParts.filter(part => part && part !== 'ternasys');
                cleanPath = filteredParts.join('/');
                console.log('ActionMenu - Extracted relative path from Minio URL:', cleanPath);
            } else {
                // It's already a relative path
                cleanPath = row.file.replace(/\\/g, '/');
                console.log('ActionMenu - Using relative path as is:', cleanPath);
            }
            
            // Create the API endpoint URL - Use provided endpoint (defaults to regular pembelian)
            const fileUrl = `${API_BASE_URL}${apiEndpoint}/file/${cleanPath}`;
            
            console.log('ActionMenu - Final file URL:', fileUrl);
            
            // Create new window
            const newWindow = window.open('about:blank', '_blank');
            
            // Fetch file with authentication and proper headers for Minio storage
            const response = await fetch(fileUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/pdf,image/*,*/*',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            console.log('ActionMenu - Response status:', response.status);
            console.log('ActionMenu - Response headers:', response.headers);

            if (response.ok) {
                // Check if response is a streamed response from backend
                const contentType = response.headers.get('content-type');
                const contentDisposition = response.headers.get('content-disposition');
                
                console.log('ActionMenu - Content-Type:', contentType);
                console.log('ActionMenu - Content-Disposition:', contentDisposition);
                
                const blob = await response.blob();
                console.log('ActionMenu - Blob received:', blob);
                console.log('ActionMenu - Blob size:', blob.size);
                console.log('ActionMenu - Blob type:', blob.type);
                
                if (blob.size === 0) {
                    throw new Error('File kosong atau tidak valid');
                }
                
                const blobUrl = URL.createObjectURL(blob);
                console.log('ActionMenu - Blob URL created:', blobUrl);
                
                if (newWindow && !newWindow.closed) {
                    newWindow.location.href = blobUrl;
                    // Clean up blob URL after a delay to allow the window to load
                    setTimeout(() => {
                        URL.revokeObjectURL(blobUrl);
                    }, 1000);
                } else {
                    // Fallback: download file
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = cleanPath.split('/').pop() || 'document';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(blobUrl);
                }
            } else if (response.status === 401) {
                alert('Sesi login telah berakhir');
                if (newWindow && !newWindow.closed) {
                    newWindow.close();
                }
            } else if (response.status === 404) {
                alert('File tidak ditemukan di server');
                if (newWindow && !newWindow.closed) {
                    newWindow.close();
                }
            } else if (response.status === 403) {
                alert('Tidak memiliki izin untuk mengakses file ini');
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
            alert('Gagal membuka file. Silakan coba lagi.');
        } finally {
            setFileLoading(false);
        }
    };

    // Handle download functionality
    const handleDownload = async (row) => {
        // Use id if available, otherwise fallback to encryptedPid
        const reportId = row.id || row.encryptedPid;
        
        if (!reportId) {
            alert('ID pembelian tidak tersedia');
            return;
        }

        setDownloadLoading(true);
        try {
            let blob;
            
            // Determine report type based on API endpoint
            if (apiEndpoint && apiEndpoint.includes('feedmil')) {
                blob = await LaporanPembelianService.downloadReportNotaFeedmil(reportId);
            } else if (apiEndpoint && apiEndpoint.includes('ovk')) {
                blob = await LaporanPembelianService.downloadReportNotaOvk(reportId);
            } else {
                // Default to regular supplier report
                blob = await LaporanPembelianService.downloadReportNotaSupplier(reportId);
            }
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Generate appropriate filename based on purchase type
            let filename = 'Laporan_Pembelian';
            if (apiEndpoint && apiEndpoint.includes('feedmil')) {
                filename = 'Laporan_Pembelian_Feedmil';
            } else if (apiEndpoint && apiEndpoint.includes('ovk')) {
                filename = 'Laporan_Pembelian_OVK';
            }
            filename += `_${row.nota || 'Report'}.pdf`;
            
            link.download = filename;
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