
import React from 'react';
import DataTable from 'react-data-table-component';
import { Trash2 } from 'lucide-react';

const customStyles = {
  rows: {
    style: {
      minHeight: '48px',
      fontSize: '14px',
      backgroundColor: 'white',
      borderBottom: '1px solid #f3f4f6',
      transition: 'background 0.2s',
    },
    stripedStyle: {
      backgroundColor: '#f9fafb',
    },
    highlightOnHoverStyle: {
      backgroundColor: '#f3f4f6',
      cursor: 'pointer',
    },
  },
  headCells: {
    style: {
      background: 'linear-gradient(to right, #ede9fe, #f3e8ff)',
      color: '#7c3aed',
      fontWeight: 700,
      fontSize: '13px',
      borderBottom: '2px solid #a5b4fc',
      position: 'sticky',
      top: 0,
      zIndex: 2,
    },
  },
  cells: {
    style: {
      paddingTop: '8px',
      paddingBottom: '8px',
      paddingLeft: '8px',
      paddingRight: '8px',
    },
  },
};

const inputClass =
  'w-full text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-150 bg-white';
const selectClass =
  'w-full text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-150 bg-white';

const EditableDetailDataTable = ({
  data,
  eartagOptions,
  klasifikasiHewanOptions,
  parameterLoading,
  onDetailChange,
  onRemoveDetail,
  formatNumber,
  parseNumber,
}) => {
  const columns = [
    {
      name: 'No',
      selector: (row, i) => i + 1,
      width: '60px',
      center: true,
    },
    {
      name: 'Eartag *',
      cell: (row) => (
        <select
          value={row.eartag}
          onChange={e => onDetailChange(row.id, 'eartag', e.target.value)}
          disabled={parameterLoading}
          className={selectClass}
        >
          <option value="">Pilih Eartag</option>
          {eartagOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ),
      grow: 1.2,
    },
    {
      name: 'Eartag Supplier *',
      cell: (row) => (
        <input
          type="text"
          value={row.eartagSupplier}
          onChange={e => onDetailChange(row.id, 'eartagSupplier', e.target.value)}
          className={inputClass}
          placeholder="Input supplier"
          required
        />
      ),
      grow: 1.2,
    },
    {
      name: 'Klasifikasi *',
      cell: (row) => (
        <select
          value={row.idKlasifikasiHewan}
          onChange={e => onDetailChange(row.id, 'idKlasifikasiHewan', e.target.value)}
          disabled={parameterLoading}
          className={selectClass}
        >
          <option value="">Pilih Klasifikasi</option>
          {klasifikasiHewanOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ),
      grow: 1.2,
    },
    {
      name: 'Berat (kg) *',
      cell: (row) => (
        <input
          type="number"
          value={row.berat}
          onChange={e => onDetailChange(row.id, 'berat', e.target.value)}
          className={inputClass}
          min="1"
          required
        />
      ),
      width: '120px',
    },
    {
      name: 'Harga (Rp) *',
      cell: (row) => (
        <input
          type="text"
          value={formatNumber(row.harga)}
          onChange={e => onDetailChange(row.id, 'harga', parseNumber(e.target.value))}
          className={inputClass}
          placeholder="5.000.000"
          required
        />
      ),
      width: '140px',
    },
    {
      name: 'Markup (%) *',
      cell: (row) => (
        <input
          type="number"
          value={row.persentase}
          onChange={e => onDetailChange(row.id, 'persentase', e.target.value)}
          className={inputClass}
          min="0"
          max="100"
          step="0.1"
          required
        />
      ),
      width: '120px',
    },
    {
      name: 'HPP (Rp)',
      cell: (row) => (
        <input
          type="text"
          value={formatNumber(row.hpp)}
          readOnly
          className={inputClass + ' bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 font-medium'}
          title={`HPP dihitung otomatis: Harga + ${row.persentase || 0}% markup`}
        />
      ),
      width: '140px',
    },
    {
      name: 'Aksi',
      cell: (row) => (
        <div className="flex justify-center items-center h-full group">
          <button
            onClick={() => onRemoveDetail(row.id)}
            className="opacity-60 group-hover:opacity-100 text-red-500 hover:text-white hover:bg-red-500 p-1 rounded transition-all duration-150"
            title="Hapus item"
            style={{ transition: 'all 0.2s' }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      width: '70px',
      center: true,
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <DataTable
        columns={columns}
        data={data}
        dense
        highlightOnHover
        striped
        noHeader
        pagination={false}
        fixedHeader
        fixedHeaderScrollHeight="400px"
        className="w-full"
        customStyles={customStyles}
        noDataComponent={
          <div className="p-8 text-center text-gray-400 text-base">
            <span className="block mb-2">📦</span>
            Belum ada detail ternak. Klik <b>Tambah Detail</b> atau gunakan <b>Batch Add</b> untuk menambah data.
          </div>
        }
      />
    </div>
  );
};

export default EditableDetailDataTable;
