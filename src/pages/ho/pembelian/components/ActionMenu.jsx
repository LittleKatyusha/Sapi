import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Edit, Copy, Trash2, Download, Loader2, FileText } from 'lucide-react';
import { API_ENDPOINTS, API_BASE_URL } from '../../../../config/api';
import LaporanPembelianService from '../../../../services/laporanPembelianService';

const ActionMenu = ({ row, onEdit, onDelete, onDetail, onClose, buttonRef, apiEndpoint = API_ENDPOINTS.HO.PEMBELIAN, reportType = 'supplier' }) => {
    const menuRef = useRef(null);
    const [menuStyle, setMenuStyle] = useState(null);
    const [fileLoading, setFileLoading] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);

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

    // Handle view file functionality - Use URL directly from row data
    const handleViewFile = async (row) => {
        if (!row.file) {
            alert('File tidak tersedia untuk pembelian ini');
            return;
        }

        setFileLoading(true);
        try {
            // Debug: Log the original file URL
            console.log('ActionMenu - File URL from row:', row.file);
            
            // The row.file should already contain the complete pre-signed URL
            // Just use it directly without any modification
            const fileUrl = row.file;
            
            console.log('ActionMenu - Using URL directly:', fileUrl);
            
            // Open the pre-signed URL directly in a new window
            const newWindow = window.open(fileUrl, '_blank');
            
            if (!newWindow || newWindow.closed) {
                // Fallback: create a download link
                const link = document.createElement('a');
                link.href = fileUrl;
                link.target = '_blank';
                link.download = ''; // Let browser decide the filename
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
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

    // Handle download report functionality
    const handleDownloadReport = async (row) => {
        if (!row.encryptedPid && !row.pid) {
            alert('ID pembelian tidak tersedia untuk mengunduh laporan');
            return;
        }

        setReportLoading(true);
        try {
            // Use encrypted PID (same as used in LaporanNotaSupplierPage)
            const pembelianId = row.encryptedPid || row.pid;
            
            // Determine which report type to use based on reportType prop
            let reportMethod = 'getReportNotaSupplier';
            let reportPrefix = 'NOTA_SUPPLIER';
            
            if (reportType === 'ovk') {
                reportMethod = 'getReportNotaOvk';
                reportPrefix = 'NOTA_OVK';
            }
            
            console.log('📄 Downloading report for pembelian:', {
                id: pembelianId,
                nota: row.nota,
                reportType: reportType,
                reportMethod: reportMethod
            });

            // Use the service method based on report type
            const blob = await LaporanPembelianService.downloadPdfReport(reportMethod, {
                id: pembelianId  // Backend expects 'id' parameter with encrypted pubid
            });
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Use nota number in filename if available
            const fileName = row.nota
                ? `LAPORAN_${reportPrefix}_${row.nota}.pdf`
                : `LAPORAN_PEMBELIAN_${pembelianId}.pdf`;
            
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log('✅ Report downloaded successfully:', fileName);
            
            // Close menu after successful download
            onClose();
            
        } catch (error) {
            console.error('Error downloading report:', error);
            alert(error.message || 'Gagal mengunduh laporan. Silakan coba lagi.');
        } finally {
            setReportLoading(false);
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
            label: 'Unduh File',
            icon: fileLoading ? Loader2 : Download,
            onClick: () => handleViewFile(row),
            className: fileLoading ? 'text-gray-400' : 'text-gray-700',
            description: fileLoading ? 'Mengunduh...' : 'Unduh dokumen',
            bg: 'bg-purple-100',
            hoverBg: 'group-hover:bg-purple-200',
            text: 'text-purple-600',
            disabled: fileLoading,
            isLoading: fileLoading,
        }] : []),
        {
            label: 'Unduh Laporan',
            icon: reportLoading ? Loader2 : FileText,
            onClick: () => handleDownloadReport(row),
            className: reportLoading ? 'text-gray-400' : 'text-gray-700',
            description: reportLoading ? 'Mengunduh...' : 'Unduh laporan PDF',
            bg: 'bg-green-100',
            hoverBg: 'group-hover:bg-green-200',
            text: 'text-green-600',
            disabled: reportLoading,
            isLoading: reportLoading,
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
            aria-label="Menu Pilih"
        >
            <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200/50">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Menu Pilih</p>
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
                                    // Note: handleDownloadReport and handleViewFile handle onClose() internally
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