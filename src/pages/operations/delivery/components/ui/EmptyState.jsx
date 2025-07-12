import React from 'react';
import PropTypes from 'prop-types';
import { Search, RotateCcw } from 'lucide-react';

/**
 * Empty state component displayed when no data matches the current filters
 * @param {Function} onClearFilters - Callback to clear all filters
 */
const EmptyState = ({ onClearFilters }) => (
    <div className="text-center py-16 px-6">
        <Search size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Tidak Ada Surat Jalan Ditemukan
        </h3>
        <p className="text-sm text-gray-500 mb-6">
            Coba sesuaikan filter Anda atau reset untuk melihat semua data.
        </p>
        <button 
            onClick={onClearFilters} 
            className="flex items-center mx-auto bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-semibold"
        >
            <RotateCcw size={14} className="mr-2" /> 
            Reset Filter
        </button>
    </div>
);

EmptyState.propTypes = {
    onClearFilters: PropTypes.func.isRequired
};

export default EmptyState;
