import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import WarehouseService from '../../../services/warehouseService';

export default function DistribusiWarehousePage() {
  const [tab, setTab] = useState('feedmil');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = tab === 'feedmil' 
        ? await WarehouseService.getDistribusiFeedmil()
        : await WarehouseService.getDistribusiOvk();
      setData(res?.data ?? res ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = useMemo(() => [
    { name: 'ID', selector: r => r.id ?? '-', sortable: true },
    { name: 'Tanggal', selector: r => r.tanggal ?? '-', sortable: true },
    { name: 'Nota', selector: r => r.nota ?? '-', sortable: true },
  ], []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Distribusi Warehouse</h1>
      <div className="flex gap-4 mb-4">
        <button className={`px-4 py-2 rounded ${tab === 'feedmil' ? 'bg-red-500 text-white' : 'bg-gray-200'}`} onClick={() => setTab('feedmil')}>Feedmil</button>
        <button className={`px-4 py-2 rounded ${tab === 'ovk' ? 'bg-red-500 text-white' : 'bg-gray-200'}`} onClick={() => setTab('ovk')}>OVK</button>
      </div>
      <DataTable columns={columns} data={data} progressPending={loading} pagination highlightOnHover />
    </div>
  );
}
