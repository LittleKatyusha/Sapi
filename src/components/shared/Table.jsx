import React, { useState, useMemo, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import { FiSearch, FiX } from 'react-icons/fi';

const Table = ({
  columns,
  data,
  title = '',
  onSelectedRowsChange,
  contextActions,
  selectableRows = false,
  searchable = true,
  loading = false,
  className = '',
  minColumnWidth = 100,
  maxRowHeight = 50,
  striped = true,
  highlightOnHover = true,
}) => {
  const [filterText, setFilterText] = useState('');
  
  const filteredData = useMemo(() => {
    if (!filterText) return data;
    
    return data.filter(item => 
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(filterText.toLowerCase())
      )
    );
  }, [data, filterText]);

  const handleClearSearch = useCallback(() => setFilterText(''), []);
  
  const handleRowSelection = useCallback((selected) => {
    onSelectedRowsChange?.(selected);
  }, [onSelectedRowsChange]);

  const customStyles = {
    table: {
      style: {
        minWidth: '100%',
        width: 'auto',
      },
    },
    headRow: {
      style: {
        backgroundColor: '#f9fafb',
        fontWeight: 'bold',
        minHeight: '56px',
      },
    },
    headCells: {
      style: {
        paddingLeft: '1.25rem',
        paddingRight: '1.25rem',
        fontSize: '0.875rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#6b7280',
        minWidth: `${minColumnWidth}px`,
      },
    },
    cells: {
      style: {
        paddingLeft: '1.25rem',
        paddingRight: '1.25rem',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        minWidth: `${minColumnWidth}px`,
        maxHeight: `${maxRowHeight}px`,
      },
    },
    rows: {
      style: {
        minHeight: '56px',
        '&:not(:last-of-type)': {
          borderBottom: '1px solid #e5e7eb',
        },
      },
      stripedStyle: {
        backgroundColor: '#f9fafb',
      },
    },
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {title && (
          <h2 className="text-xl font-semibold text-gray-800">
            {title}
          </h2>
        )}
        
        {searchable && (
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            {filterText && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <FiX className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No data available
          </div>
        ) : (
          filteredData.map((item, index) => (
            <div 
              key={`mobile-row-${index}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              {columns.map((column) => (
                <div 
                  key={`mobile-col-${column.name}`}
                  className="py-2 border-b border-gray-100 last:border-b-0"
                >
                  <div className="text-sm font-medium text-gray-500">
                    {column.name}
                  </div>
                  <div className="mt-1 text-gray-900 truncate">
                    {column.cell ? column.cell(item) : item[column.selector]}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[5, 10, 20, 50]}
          paginationComponentOptions={{
            rowsPerPageText: 'Rows per page:',
            rangeSeparatorText: 'of',
          }}
          highlightOnHover={highlightOnHover}
          striped={striped}
          responsive
          noDataComponent={
            <div className="py-8 text-center text-gray-500">
              No data available
            </div>
          }
          selectableRows={selectableRows}
          onSelectedRowsChange={handleRowSelection}
          contextActions={contextActions}
          progressPending={loading}
          progressComponent={
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
            </div>
          }
          customStyles={customStyles}
        />
      </div>
    </div>
  );
};

export default Table;