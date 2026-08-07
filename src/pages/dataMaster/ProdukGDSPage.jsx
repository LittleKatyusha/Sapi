import React from 'react';
import { Warehouse } from 'lucide-react';

import MasterDataTablePage from './pembeliHo/components/MasterDataTablePage';
import useProdukGDS from './produkGDS/hooks/useProdukGDS';
import AddEditBarangModal from './barang/modals/AddEditBarangModal';
import DeleteConfirmationModal from './barang/modals/DeleteConfirmationModal';

const ProdukGDSPage = () => {
  const hook = useProdukGDS();

  const mappedHook = {
    loading: hook.loading,
    error: hook.error,
    fetch: hook.fetchProdukGDS,
    create: hook.createProdukGDS,
    update: hook.updateProdukGDS,
    remove: hook.deleteProdukGDS,
  };

  const extraColumns = [
    {
      name: <span>Nama Produk GDS</span>,
      grow: 1.6,
      minWidth: '220px',
      cell: (row) => (
        <div className="py-1.5 min-w-0 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-600 shrink-0">
            <Warehouse className="h-3.5 w-3.5" />
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
      storageKey="produk_gds_state_v1"
      title="Master Produk GDS"
      subtitle="Kelola data produk GDS"
      accent="amber"
      icon={Warehouse}
      hook={mappedHook}
      filterFields={[
        { key: 'name', placeholder: 'Nama produk' },
        { key: 'description', placeholder: 'Deskripsi' },
      ]}
      extraColumns={extraColumns}
      AddEditModal={AddEditBarangModal}
      DeleteModal={DeleteConfirmationModal}
      addLabel="Tambah"
      entityLabel="Produk GDS"
      rowNameKey="name"
    />
  );
};

export default ProdukGDSPage;
