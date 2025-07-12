import React from 'react';
import PropTypes from 'prop-types';

/**
 * Skeleton loader component for table rows while data is loading
 * @param {number} rows - Number of skeleton rows to display
 * @param {number} cols - Number of skeleton columns to display
 */
const TableSkeletonLoader = ({ rows = 5, cols = 6 }) => (
    <tbody>
        {[...Array(rows)].map((_, i) => (
            <tr key={i} className="border-b">
                {[...Array(cols)].map((_, j) => (
                    <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                ))}
            </tr>
        ))}
    </tbody>
);

TableSkeletonLoader.propTypes = {
    rows: PropTypes.number,
    cols: PropTypes.number
};

export default TableSkeletonLoader;
