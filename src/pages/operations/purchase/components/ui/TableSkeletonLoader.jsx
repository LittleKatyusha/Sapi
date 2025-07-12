import React from 'react';
import PropTypes from 'prop-types';

/**
 * TableSkeletonLoader - Loading skeleton for table
 * @param {number} rows - Number of skeleton rows
 * @param {number} cols - Number of skeleton columns
 * @returns {JSX.Element} Skeleton loader component
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
