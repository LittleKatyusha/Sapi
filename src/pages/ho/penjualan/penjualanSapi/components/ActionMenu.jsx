import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Download, Loader2 } from 'lucide-react';
import LaporanPembelianService from '../../../../../services/laporanPembelianService';
import { API_ENDPOINTS, API_BASE_URL } from '../../../../../config/api';

const ActionMenu = ({ row, onDetail, onDownloadOrder, onClose, buttonRef, apiEndpoint = API_ENDPOINTS.HO.PENJUALAN }) => {
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

    // Handle download order sheet functionality
    const handleDownloadOrderSheet = async (row) => {
        // Use pid if available, otherwise fallback to pubid
        const reportId = row.pid || row.pubid;
        
        if (!reportId) {
            alert('ID penjualan tidak tersedia');
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
                // Default to regular supplier report for penjualan
                blob = await LaporanPembelianService.downloadReportNotaSupplier(reportId);
            }
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Generate appropriate filename based on sale type
            let filename = 'Laporan_Penjualan';
            if (apiEndpoint && apiEndpoint.includes('feedmil')) {
                filename = 'Laporan_Penjualan_Feedmil';
            } else if (apiEndpoint && apiEndpoint.includes('ovk')) {
                filename = 'Laporan_Penjualan_OVK';
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
            label: 'Proses',
            icon: Eye,
            onClick: () => onDetail(row),
            className: 'text-gray-700',
            description: 'Informasi lengkap',
            bg: 'bg-blue-100',
            hoverBg: 'group-hover:bg-blue-200',
            text: 'text-blue-600',
        },
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
                                    if (action.label === 'Lihat Detail') {
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