import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Tag } from 'lucide-react';

import useTarifDof from './tarifDof/hooks/useTarifDof';
import AddTarifDofModal from './tarifDof/modals/AddTarifDofModal';
import Notification from './tarifDof/components/Notification';
import customTableStyles from './tarifDof/constants/tableStyles';

const TarifDofPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ isVisible: false, type: 'info', message: '' });
  const [tableState, setTableState] = useState({ page: 1, perPage: 10 });
  const debounceRef = useRef(null);

  const { data, loading, error, fetchData, createItem, totalRecords } = useTarifDof();

  const loadData = useCallback((page = tableState.page, perPage = tableState.perPage, search = searchTerm) => {
    fetchData({ draw: page, start: (page - 1) * perPage, length: perPage, search });
  }, [fetchData, tableState, searchTerm]);

  useEffect(() => { loadData(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadData(1, tableState.perPage, searchTerm), 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const showNotif = useCallback((type, message) => setNotification({ isVisible: true, type, message }), []);

  const handleSave = useCallback(async (payload) => {
    try {
      await createItem(payload);
      showNotif('success', 'Tarif DOF berhasil ditambahkan');
      setShowModal(false);
      loadData(1);
    } catch (err) {
      showNotif('error', err.message || 'Gagal menyimpan data');
    }
  }, [createItem, showNotif, loadData]);

  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  const columns = useMemo(() => [
    {
      name: 'Nama',
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => <span className="font-medium text-gray-800 text-sm">{row.name}</span>,
    },
    {
      name: 'Office ID',
      selector: (row) => row.id_office,
      width: '110px',
      cell: (row) => <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{row.id_office}</span>,
    },
    {
      name: 'Klasifikasi Hewan ID',
      selector: (row) => row.id_klasifikasi_hewan,
      width: '160px',
      cell: (row) => <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">{row.id_klasifikasi_hewan}</span>,
    },
    {
      name: 'Harga',
      selector: (row) => row.harga,
      sortable: true,
      cell: (row) => <span className="font-semibold text-gray-700 text-sm">{formatRupiah(row.harga)}</span>,
    },
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Tag className="h-7 w-7 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Tarif DOF</h1>
                <p className="text-gray-500 text-sm">Kelola data master tarif DOF per office dan klasifikasi hewan</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 shadow-lg"
            >
              <PlusCircle className="w-5 h-5" />
              Tambah Tarif DOF
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-5 rounded-2xl shadow-lg">
            <p className="text-sm opacity-80">Total Tarif DOF</p>
            <p className="text-3xl font-bold mt-1">{totalRecords}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow border border-gray-100">
            <p className="text-sm text-gray-500">Tampil Sekarang</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{data.length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari tarif DOF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {error && (
            <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <DataTable
            columns={columns}
            data={data}
            progressPending={loading}
            pagination
            paginationServer
            paginationTotalRows={totalRecords}
            onChangePage={(page) => { setTableState((s) => ({ ...s, page })); loadData(page, tableState.perPage); }}
            onChangeRowsPerPage={(perPage, page) => { setTableState({ page, perPage }); loadData(page, perPage); }}
            paginationPerPage={tableState.perPage}
            paginationRowsPerPageOptions={[10, 15, 25, 50]}
            highlightOnHover
            responsive
            noDataComponent={
              <div className="py-12 text-center text-gray-400">
                <Tag className="mx-auto h-12 w-12 mb-3 opacity-40" />
                <p>Tidak ada data tarif DOF</p>
              </div>
            }
            customStyles={customTableStyles}
          />
        </div>
      </div>

      {showModal && (
        <AddTarifDofModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification((n) => ({ ...n, isVisible: false }))}
      />
    </div>
  );
};

export default TarifDofPage;
