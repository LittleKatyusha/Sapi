/**
 * Delivery Order Constants
 * Contains all constant values used throughout the delivery order module
 */

export const DELIVERY_TYPES = {
    ALL: 'Semua',
    SALE: 'Penjualan', 
    PURCHASE: 'Pembelian',
    TRANSFER: 'Antar Kandang'
};

export const DELIVERY_STATUSES = {
    ALL: 'Semua',
    PENDING: 'Menunggu Persetujuan',
    APPROVED: 'Disetujui', 
    IN_TRANSIT: 'Dalam Pengantaran',
    COMPLETED: 'Selesai'
};

export const ACTION_TYPES = {
    VIEW: 'view',
    EDIT: 'edit',
    DELETE: 'delete',
    PRINT: 'print'
};

export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    INFO: 'info',
    ERROR: 'error'
};
