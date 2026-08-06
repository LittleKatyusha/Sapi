import React, { useEffect } from 'react';
import { Scissors } from 'lucide-react';

import MasterDataTablePage from './pembeliHo/components/MasterDataTablePage';
import useItemPotong from './itemPotong/hooks/useItemPotong';
import AddEditItemPotongModal from './itemPotong/modals/AddEditItemPotongModal';
import DeleteConfirmationModal from './itemPotong/modals/DeleteConfirmationModal';

const ItemPotongPage = () => {
  const hook = useItemPotong();

  useEffect(() => {
    hook.fetchJenisPotongOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mappedHook = {
    loading: hook.loading,
    error: hook.error,
    fetch: hook.fetchItemPotong,
    create: hook.createItemPotong,
    update: hook.updateItemPotong,
    remove: hook.deleteItemPotong,
  };

  const extraColumns = [
    {
      name: <span>Nama Item Potong</span>,
      grow: 1.6,
      minWidth: '220px',
      cell: (row) => (
        <div className="py-1.5 min-w-0 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-600 shrink-0">
            <Scissors className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">{row.name}</div>
          </div>
        </div>
      ),
    },
    {
      name: <span>Jenis Potong</span>,
      width: '160px',
      cell: (row) => (
        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
          {row.jenis_potong || '-'}
        </span>
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
      storageKey="item_potong_state_v1"
      title="Master Item Potong"
      subtitle="Kelola data item potong"
      accent="amber"
      icon={Scissors}
      hook={mappedHook}
      filterFields={[
        { key: 'name', placeholder: 'Nama item' },
        { key: 'jenis_potong', placeholder: 'Jenis potong' },
      ]}
      extraColumns={extraColumns}
      AddEditModal={AddEditItemPotongModal}
      DeleteModal={DeleteConfirmationModal}
      addLabel="Tambah"
      entityLabel="Item Potong"
      rowNameKey="name"
      addEditModalExtraProps={{
        jenisPotongOptions: hook.jenisPotongOptions,
        jenisPotongLoading: hook.jenisPotongLoading,
      }}
    />
  );
};

export default ItemPotongPage;
