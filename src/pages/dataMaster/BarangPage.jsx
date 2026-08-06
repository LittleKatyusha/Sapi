import React from 'react';
import { Package } from 'lucide-react';
import MasterDataTablePage from './pembeliHo/components/MasterDataTablePage';
import useBarang from './barang/hooks/useBarang';
import AddEditBarangModal from './barang/modals/AddEditBarangModal';
import DeleteConfirmationModal from './barang/modals/DeleteConfirmationModal';

const BarangPage = () => {
  const hook = useBarang();

  const mappedHook = {
    loading: hook.loading,
    error: hook.error,
    fetch: hook.fetchBarang,
    create: hook.createBarang,
    update: hook.updateBarang,
    remove: hook.deleteBarang,
  };

  const extraColumns = [
    {
      name: <span>Nama Barang</span>,
      grow: 1.6,
      minWidth: '220px',
      cell: (row) => (
        <div className="py-1.5 min-w-0 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-50 text-sky-600 shrink-0">
            <Package className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">{row.name}</div>
          </div>
        </div>
      ),
    },
    {
      name: <span>Deskripsi</span>,
      grow: 1.4,
      minWidth: '200px',
      cell: (row) => (
        <span className="text-xs text-slate-600 line-clamp-2">{row.description || '-'}</span>
      ),
    },
    {
      name: <span>Dibuat</span>,
      width: '130px',
      cell: (row) => <span className="text-xs text-slate-500">{row.created_at || '-'}</span>,
    },
  ];

  return (
    <MasterDataTablePage
      storageKey="barang_state_v1"
      title="Master Barang"
      subtitle="Kelola data barang"
      accent="sky"
      icon={Package}
      hook={mappedHook}
      filterFields={[
        { key: 'name', placeholder: 'Nama barang' },
        { key: 'description', placeholder: 'Deskripsi' },
      ]}
      extraColumns={extraColumns}
      AddEditModal={AddEditBarangModal}
      DeleteModal={DeleteConfirmationModal}
      addLabel="Tambah"
      entityLabel="Barang"
      rowNameKey="name"
    />
  );
};

export default BarangPage;
