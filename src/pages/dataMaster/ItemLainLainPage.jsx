import React from 'react';
import { Package } from 'lucide-react';

import MasterDataTablePage from './pembeliHo/components/MasterDataTablePage';
import useItemLainLain from './itemLainLain/hooks/useItemLainLain';
import AddEditItemLainLainModal from './itemLainLain/modals/AddEditItemLainLainModal';
import DeleteConfirmationModal from './itemLainLain/modals/DeleteConfirmationModal';

const ItemLainLainPage = () => {
  const hook = useItemLainLain();

  const mappedHook = {
    loading: hook.loading,
    error: hook.error,
    fetch: hook.fetchItemLainLain,
    create: hook.createItemLainLain,
    update: hook.updateItemLainLain,
    remove: hook.deleteItemLainLain,
  };

  const extraColumns = [
    {
      name: <span>Nama Item</span>,
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
      name: <span>Klasifikasi</span>,
      width: '160px',
      cell: (row) => (
        <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
          {row.klasifikasi || '-'}
        </span>
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
      storageKey="item_lain_lain_state_v1"
      title="Master Item Lain-Lain"
      subtitle="Kelola data item lain-lain"
      accent="sky"
      icon={Package}
      hook={mappedHook}
      filterFields={[
        { key: 'name', placeholder: 'Nama item' },
        { key: 'description', placeholder: 'Deskripsi' },
        { key: 'klasifikasi', placeholder: 'Klasifikasi' },
      ]}
      extraColumns={extraColumns}
      AddEditModal={AddEditItemLainLainModal}
      DeleteModal={DeleteConfirmationModal}
      addLabel="Tambah"
      entityLabel="Item Lain-Lain"
      rowNameKey="name"
    />
  );
};

export default ItemLainLainPage;
