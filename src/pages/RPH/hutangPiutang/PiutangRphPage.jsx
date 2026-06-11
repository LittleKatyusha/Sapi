import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import HutangPiutangRphService from '../../../services/hutangPiutangRphService';

export default function PiutangRphPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await HutangPiutangRphService.getPiutang();
      setData(res?.data ?? res ?? []);
    } catch (e) {
      setError(e.message || 'Error fetching piutang');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = useMemo(() => [
    { name: 'ID', selector: r => r.id ?? '-', sortable: true, width: '80px' },
    { name: 'Pedagang', selector: r => r.nama ?? r.nama_alias ?? '-', sortable: true },
    { name: 'Alias', selector: r => r.nama_alias ?? '-', sortable: true },
    { name: 'Saldo Piutang', selector: r => r.saldo ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(r.saldo) : '-', sortable: true },
    { name: 'Deposit', selector: r => r.deposit_pedagang ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(r.deposit_pedagang) : '-', sortable: true },
  ], []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Piutang Pedagang (RPH)</h1>
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
