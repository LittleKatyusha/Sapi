import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import HttpClient from '../services/httpClient';
import { configureInventoryScope, inventoryPageRoot, selectInventoryOffice } from '../services/inventoryScope';

export default function InventoryScopeGate({ children }) {
  const { pathname } = useLocation();
  const root = inventoryPageRoot(pathname);
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const accountChanged = event => {
      if (event.key !== 'user' && event.key !== null) return;
      try {
        if (event.key === null || JSON.parse(event.oldValue)?.pid !== JSON.parse(event.newValue)?.pid) window.location.reload();
      } catch { window.location.reload(); }
    };
    window.addEventListener('storage', accountChanged);
    return () => window.removeEventListener('storage', accountChanged);
  }, []);

  useEffect(() => {
    let active = true;
    setState(null);
    setError('');
    const load = async () => {
      try {
        const { data: user } = await HttpClient.get('/api/auth/me', { cache: false });
        if (!user || typeof user !== 'object' || Array.isArray(user)) throw new Error('Data pengguna tidak valid.');
        const restricted = user.inventory_scope === 'all_rph';
        const offices = restricted ? (await HttpClient.get('/api/auth/inventory-offices', { cache: false })).data : [];
        if (!active) return;
        const id = configureInventoryScope(user, offices);
        // Login stores a flat user object. Preserve its fields; me is authoritative for scope only.
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        delete stored.inventory_scope;
        if (restricted) stored.inventory_scope = user.inventory_scope;
        localStorage.setItem('user', JSON.stringify(stored));
        setState({ restricted, offices, id });
      } catch (failure) {
        if (active) setError(failure.message || 'Gagal memuat pilihan RPH.');
      }
    };
    load();
    return () => { active = false; };
  }, [attempt]);

  if (error) return <div role="alert" className="text-red-700">
    <p>{error}</p>
    <button type="button" className="mt-2 underline focus-visible:ring-2 focus-visible:ring-emerald-700" onClick={() => setAttempt(value => value + 1)}>Coba lagi</button>
  </div>;
  if (!state) return <p role="status">Memuat akses persediaan...</p>;
  if (!state.restricted || !root) return children;

  const changeOffice = event => {
    const id = event.target.value;
    if (id === state.id || !id) return;
    if (state.id && !window.confirm('Ganti RPH? Halaman akan dimuat ulang. Perubahan yang belum disimpan akan hilang.')) return;
    try {
      selectInventoryOffice(id);
      // ponytail: full navigation clears caches, requests, forms and detail IDs; use keyed context if SPA switching is needed.
      window.location.assign(root);
    } catch (failure) {
      setError(failure.message);
    }
  };

  return <>
    <div className="mb-4 max-w-sm">
      <label htmlFor="inventory-office" className="block text-sm font-medium text-gray-900 mb-1">RPH Persediaan</label>
      <select id="inventory-office" value={state.id || ''} onChange={changeOffice}
        disabled={!state.offices.length} aria-describedby="inventory-office-help"
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-700">
        <option value="" disabled>Pilih RPH</option>
        {state.offices.map(office => <option key={office.id} value={office.id}>{office.name}</option>)}
      </select>
      <p id="inventory-office-help" className="mt-1 text-sm text-gray-600">
        {state.offices.length ? 'Data dan tindakan berlaku untuk RPH terpilih. Mengganti RPH memuat ulang halaman.' : 'Tidak ada RPH yang tersedia. Hubungi administrator.'}
      </p>
    </div>
    {state.id ? children : <p role="status">Pilih RPH untuk memuat persediaan.</p>}
  </>;
}
