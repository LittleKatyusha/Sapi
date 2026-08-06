import React from 'react';
import { Tag } from 'lucide-react';

import MasterDataTablePage from './pembeliHo/components/MasterDataTablePage';
import useKlasifikasiOvk from './klasifikasiOvk/hooks/useKlasifikasiOvk';
import AddEditKlasifikasiOvkModal from './klasifikasiOvk/modals/AddEditKlasifikasiOvkModal';
import DeleteConfirmationModal from './klasifikasiOvk/modals/DeleteConfirmationModal';

const KlasifikasiOvkPage = () => {
  const hook = useKlasifikasiOvk();

  const mappedHook = {
    loading: hook.loading,
    error: hook.error,
    fetch: hook.fetchKlasifikasiOvk,
    create: hook.createKlasifikasiOvk,
    update: hook.updateKlasifikasiOvk,
    remove: hook.deleteKlasifikasiOvk,
  };

  const extraColumns = [
    {
      name: <span>Nama Klasifikasi</span>,
      grow: 1.6,
      minWidth: '220px',
      cell: (row) => (
        <div className="py-1.5 min-w-0 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 shrink-0">
            <Tag className="h-3.5 w-3.5" />
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
      storageKey="klasifikasi_ovk_state_v1"
      title="Master Klasifikasi OVK"
      subtitle="Kelola data klasifikasi obat, vitamin & kimia"
      accent="indigo"
      icon={Tag}
      hook={mappedHook}
      filterFields={[
        { key: 'name', placeholder: 'Nama klasifikasi' },
        { key: 'description', placeholder: 'Deskripsi' },
      ]}
      extraColumns={extraColumns}
      AddEditModal={AddEditKlasifikasiOvkModal}
      DeleteModal={DeleteConfirmationModal}
      addLabel="Tambah"
      entityLabel="Klasifikasi OVK"
      rowNameKey="name"
    />
  );
};

export default KlasifikasiOvkPage;
