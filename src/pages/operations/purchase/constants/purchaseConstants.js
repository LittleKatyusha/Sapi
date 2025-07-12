/**
 * Purchase Management Constants
 * Centralized constants for purchase operations
 */

// Purchase Status Types
export const PURCHASE_STATUSES = {
    ALL: 'Semua',
    ORDERED: 'Dipesan',
    RECEIVED: 'Diterima',
    CANCELLED: 'Dibatalkan'
};

// Action Types for Purchase Operations
export const ACTION_TYPES = {
    VIEW: 'view',
    EDIT: 'edit',
    DELETE: 'delete',
    PRINT: 'print'
};

// Notification Types
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info',
    WARNING: 'warning'
};

// Modal States
export const MODAL_STATES = {
    VIEW: 'view',
    EDIT: 'edit',
    DELETE: 'delete',
    ADD: 'add'
};

// Table Configuration
export const TABLE_CONFIG = {
    DEFAULT_ITEMS_PER_PAGE: 5,
    PAGINATION_OPTIONS: [5, 10, 20],
    MIN_HEIGHT: '60px'
};

// Currency Configuration
export const CURRENCY_CONFIG = {
    LOCALE: 'id-ID',
    CURRENCY: 'IDR',
    MIN_FRACTION_DIGITS: 0
};
