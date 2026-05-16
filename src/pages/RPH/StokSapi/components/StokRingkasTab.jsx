import React, { useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { stokRingkasData, formatCurrency, formatNumber } from '../constants/dummyData';
import customTableStyles from '../constants/tableStyles';

const StokRingkasTab = () => {
  // Calculate totals for summary row
  const totals = useMemo(() => {
    return stokRingkasData.reduce(
      (acc, row) => ({
        jumlahEkor: acc.jumlahEkor + row.jumlahEkor,
        berat: acc.berat + row.berat,
        harga: acc.harga + row.harga,
      }),
      { jumlahEkor: 0, berat: 0, harga: 0 }
    );
  }, []);

  const columns = [
    {
      name: 'No',
      selector: (row, index) => index + 1,
      width: '60px',
      center: true,
      style: {
        fontWeight: '600',
        color: '#6b7280',
      },
    },
    {
      name: 'Jenis Sapi',
      selector: (row) => row.jenisSapi,
      sortable: true,
      style: {
        fontWeight: '600',
        color: '#1f2937',
      },
    },
    {
      name: 'Jumlah Ekor',
      selector: (row) => row.jumlahEkor,
      sortable: true,
      center: true,
      cell: (row) => (
        <span className="font-semibold text-emerald-700">
          {formatNumber(row.jumlahEkor)} ekor
        </span>
      ),
    },
    {
      name: 'Berat (kg)',
      selector: (row) => row.berat,
      sortable: true,
      center: true,
      cell: (row) => (
        <span className="font-medium text-gray-700">
          {formatNumber(row.berat)} kg
        </span>
      ),
    },
    {
      name: 'Harga',
      selector: (row) => row.harga,
      sortable: true,
      right: true,
      cell: (row) => (
        <span className="font-semibold text-teal-700">
          {formatCurrency(row.harga)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* DataTable */}
      <DataTable
        columns={columns}
        data={stokRingkasData}
        customStyles={customTableStyles}
        highlightOnHover
        pointerOnHover={false}
        noDataComponent={
          <div className="py-8 text-center text-gray-400">
            Tidak ada data stok sapi
          </div>
        }
      />

      {/* Summary Row */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs text-gray-500 font-medium">Total Ekor</p>
            <p className="text-lg font-bold text-emerald-700">
              {formatNumber(totals.jumlahEkor)} ekor
            </p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs text-gray-500 font-medium">Total Berat</p>
            <p className="text-lg font-bold text-emerald-700">
              {formatNumber(totals.berat)} kg
            </p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs text-gray-500 font-medium">Total Nilai</p>
            <p className="text-lg font-bold text-teal-700">
              {formatCurrency(totals.harga)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StokRingkasTab;
