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
    { name: 'ID', selector: r => r.id ?? '-', sortable: true, width: '80px' },
    { name: 'Tipe Pembelian', selector: r => r.purchase_type ?? '-', sortable: true },
    { name: 'Jatuh Tempo', selector: r => r.due_date ? new Date(r.due_date).toLocaleDateString('id-ID') : '-', sortable: true },
    { name: 'Tagihan', selector: r => r.total_tagihan ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(r.total_tagihan) : '-', sortable: true },
    { name: 'Terbayar', selector: r => r.total_terbayar ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(r.total_terbayar) : '-', sortable: true },
    { name: 'Status', selector: r => r.payment_status === 1 ? 'Lunas' : 'Belum Lunas', sortable: true },
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
