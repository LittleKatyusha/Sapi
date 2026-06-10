import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Search } from 'lucide-react';
import HutangPiutangRphService from '../../../services/hutangPiutangRphService';

export default function HutangRphPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await HutangPiutangRphService.getHutang();
      setData(res?.data ?? res ?? []);
    } catch (e) {
      setError(e.message || 'Error fetching hutang');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = useMemo(() => [
    { name: 'ID', selector: r => r.id ?? '-', sortable: true },
    { name: 'Vendor / HO', selector: r => r.vendor ?? '-', sortable: true },
    { name: 'Amount', selector: r => r.amount ?? '-', sortable: true },
  ], []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Hutang RPH ke HO</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <DataTable
        columns={columns}
        data={data}
        progressPending={loading}
        pagination
        highlightOnHover
      />
    </div>
  );
}
