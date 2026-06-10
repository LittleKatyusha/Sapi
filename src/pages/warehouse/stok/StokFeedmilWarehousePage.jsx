import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import WarehouseService from '../../../services/warehouseService';

export default function StokFeedmilWarehousePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await WarehouseService.getStokFeedmil();
      setData(res?.data ?? res ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = useMemo(() => [
    { name: 'ID', selector: r => r.id ?? '-', sortable: true },
    { name: 'Item', selector: r => r.item ?? '-', sortable: true },
    { name: 'Stok', selector: r => r.stok ?? '-', sortable: true },
  ], []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Stok Feedmil Warehouse</h1>
      <DataTable columns={columns} data={data} progressPending={loading} pagination highlightOnHover />
    </div>
  );
}
