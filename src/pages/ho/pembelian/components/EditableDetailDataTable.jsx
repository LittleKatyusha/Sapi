import React from 'react';
import DataTable from 'react-data-table-component';
import { Trash2 } from 'lucide-react';
import Select from 'react-select';

const customStyles = {
  table: {
    style: {
      width: '100%',
      tableLayout: 'auto',
    },
  },
  tableWrapper: {
    style: {
      width: '100%',
      display: 'table',
    },
  },
  rows: {
    style: {
      minHeight: '48px',
      fontSize: '14px',
      backgroundColor: 'white',
      borderBottom: '1px solid #f3f4f6',
      transition: 'background 0.2s',
      width: '100%',
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
      textAlign: 'center', // Header rata tengah
      padding: '8px 12px',
    },
  },
  cells: {
    style: {
      paddingTop: '8px',
      paddingBottom: '8px',
      paddingLeft: '12px',
      paddingRight: '12px',
    },
  },
};

const inputClass =
  'w-full text-[13px] border border-gray-300 rounded-[8px] px-2 py-[6px] focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-150 bg-white min-h-[32px] h-[32px]';

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
      grow: false,
      sortable: false,
    },
    {
      name: 'Eartag *',
      cell: (row) => (
        <Select
          value={eartagOptions.find((opt) => opt.value === row.eartag) || null}
          onChange={(opt) =>
            onDetailChange(row.id, 'eartag', opt ? opt.value : '')
          }
          options={eartagOptions}
          isDisabled={parameterLoading}
          isClearable
          placeholder="Pilih Eartag"
          classNamePrefix="react-select"
          menuPortalTarget={
            typeof window !== 'undefined' ? document.body : null
          }
          menuPosition="fixed"
          maxMenuHeight={180}
          styles={{
            container: (base) => ({ ...base, width: '100%' }),
            control: (base) => ({
              ...base,
              minHeight: 32,
              fontSize: 13,
              borderRadius: 8,
              width: '100%',
              padding: '4px',
            }),
            menu: (base) => ({ ...base, zIndex: 9999, width: '100%' }),
            option: (base) => ({ ...base, fontSize: 13 }),
          }}
        />
      ),
      center: true,
      grow: 1,
      minWidth: '160px',
      wrap: true,
      sortable: false,
    },
    {
      name: 'Eartag Supplier *',
      cell: (row) => (
        <input
          type="text"
          value={row.eartagSupplier}
          onChange={(e) =>
            onDetailChange(row.id, 'eartagSupplier', e.target.value)
          }
          className={inputClass}
          placeholder="Input supplier"
          required
          style={{
            minHeight: 32,
            height: 32,
            fontSize: 13,
            borderRadius: 8,
          }}
        />
      ),
      center: true,
      grow: 1,
      minWidth: '160px',
      wrap: true,
      sortable: false,
    },
    {
      name: 'Klasifikasi *',
      cell: (row) => (
        <Select
          value={
            klasifikasiHewanOptions.find(
              (opt) => opt.value === row.idKlasifikasiHewan
            ) || null
          }
          onChange={(opt) =>
            onDetailChange(row.id, 'idKlasifikasiHewan', opt ? opt.value : '')
          }
          options={klasifikasiHewanOptions}
          isDisabled={parameterLoading}
          isClearable
          placeholder="Pilih Klasifikasi"
          classNamePrefix="react-select"
          menuPortalTarget={
            typeof window !== 'undefined' ? document.body : null
          }
          menuPosition="fixed"
          maxMenuHeight={180}
          styles={{
            container: (base) => ({ ...base, width: '100%' }),
            control: (base) => ({
              ...base,
              minHeight: 32,
              fontSize: 13,
              borderRadius: 8,
              width: '100%',
              padding: '4px',
            }),
            menu: (base) => ({ ...base, zIndex: 9999, width: '100%' }),
            option: (base) => ({ ...base, fontSize: 13 }),
          }}
        />
      ),
      center: true,
      grow: 1,
      minWidth: '160px',
      wrap: true,
      sortable: false,
    },
    {
      name: 'Berat (kg) *',
      cell: (row) => (
        <input
          type="number"
          value={row.berat}
          onChange={(e) =>
            onDetailChange(row.id, 'berat', e.target.value)
          }
          className={`${inputClass} ${
            row.errors?.berat ? 'border-red-500' : ''
          }`}
          min="1"
          required
          style={{
            minHeight: 32,
            height: 32,
            fontSize: 13,
            borderRadius: 8,
          }}
        />
      ),
      center: true,
      width: '120px',
      grow: false,
      sortable: false,
    },
    {
      name: 'Harga (Rp) *',
      cell: (row) => (
        <input
          type="text"
          value={formatNumber(row.harga)}
          onChange={(e) => {
            const rawValue = parseNumber(e.target.value);
            onDetailChange(row.id, 'harga', rawValue);
          }}
          className={`${inputClass} ${
            row.errors?.harga ? 'border-red-500' : ''
          }`}
          placeholder="5.000.000"
          required
          style={{
            minHeight: 32,
            height: 32,
            fontSize: 13,
            borderRadius: 8,
          }}
        />
      ),
      center: true,
      grow: 1,
      minWidth: '140px',
      sortable: false,
    },
    {
      name: 'Markup (%) *',
      cell: (row) => (
        <input
          type="number"
          value={row.persentase}
          onChange={(e) =>
            onDetailChange(row.id, 'persentase', e.target.value)
          }
          className={inputClass}
          min="0"
          max="100"
          step="0.1"
          required
          style={{
            minHeight: 32,
            height: 32,
            fontSize: 13,
            borderRadius: 8,
          }}
        />
      ),
      center: true,
      width: '120px',
      grow: false,
      sortable: false,
    },
    {
      name: 'HPP (Rp)',
      cell: (row) => (
        <div
          className={`${inputClass} bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 font-medium flex items-center`}
          style={{
            minHeight: 32,
            height: 32,
            borderRadius: 8,
            paddingRight: 8,
            paddingLeft: 8,
            fontSize: 'clamp(11px, 1.2vw, 13px)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
          title={formatNumber(row.hpp)}
        >
          {formatNumber(row.hpp)}
        </div>
      ),
      center: true,
      grow: 1,
      minWidth: '140px',
      sortable: false,
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
            aria-label={`Hapus item ${row.eartag || row.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      center: true,
      ignoreRowClick: true,
      width: '70px',
      grow: false,
      sortable: false,
    },
  ];

  return (
    <div className="w-full min-w-0">
      <div className="rounded-none overflow-hidden border-0 border-t border-gray-200 shadow-none w-full">
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
          responsive={true}
          noDataComponent={
            <div className="p-8 text-center text-gray-400 text-base">
              <span className="block mb-2">📦</span>
              Belum ada detail ternak. Klik <b>Tambah Detail</b> atau gunakan{' '}
              <b>Batch Add</b> untuk menambah data.
            </div>
          }
        />
      </div>
    </div>
  );
};

export default EditableDetailDataTable;