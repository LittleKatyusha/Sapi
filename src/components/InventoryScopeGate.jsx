import React, { createContext, useContext, useEffect, useState } from 'react';
import { Building2, LockKeyhole } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import HttpClient from '../services/httpClient';
import { configureInventoryScope, getInventoryOffice, inventoryPageRoot, selectInventoryOffice, setInventoryPage } from '../services/inventoryScope';

const InventoryOfficeContext = createContext(null);
export function InventoryOfficeSelector() {
  return useContext(InventoryOfficeContext);
}
export function useInventoryOffice() {
  useContext(InventoryOfficeContext);
  return getInventoryOffice();
}

export default function InventoryScopeGate({ children }) {
  const { pathname } = useLocation();
  const root = inventoryPageRoot(pathname);
  const allPage = pathname === '/rph/persediaan-ovk' || pathname === '/rph/stok-sapi' || pathname === '/rph/pembelian-ovk' || pathname === '/rph/pembelian-konsentrat';
  const stockPage = pathname === '/rph/stok-sapi' || pathname === '/rph/pembelian-ovk' || pathname === '/rph/pembelian-konsentrat';
  setInventoryPage(pathname);
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
        setInventoryPage(pathname);
        // Login stores a flat user object. Preserve its fields; me is authoritative for scope only.
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        delete stored.inventory_scope;
        delete stored.module_scope;
        if (user.module_scope) stored.module_scope = user.module_scope;
        stored.id_office = user.id_office ?? null;
        if (restricted) stored.inventory_scope = user.inventory_scope;
        localStorage.setItem('user', JSON.stringify(stored));
        setState({ restricted, offices, id, user });
      } catch (failure) {
        if (active) setError(failure.message || 'Gagal memuat pilihan RPH.');
      }
    };
    load();
    // Check access on navigation/retry, not focus: resetting the gate discards open forms.
    return () => { active = false; };
  }, [attempt, pathname]);

  if (error) return <div role="alert" className="text-red-700">
    <p>{error}</p>
    <button type="button" className="mt-2 underline focus-visible:ring-2 focus-visible:ring-emerald-700" onClick={() => setAttempt(value => value + 1)}>Coba lagi</button>
  </div>;
  if (!state) return <p role="status">Memuat akses persediaan...</p>;
  if (!root) return children;

  const changeOffice = event => {
    const id = event.target.value;
    if (allPage) {
      try {
        selectInventoryOffice(id);
        setState(previous => ({ ...previous, pageId: id }));
      } catch (failure) { setError(failure.message); }
      return;
    }
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

  const selector = <div className="w-full min-w-0 sm:w-64 sm:shrink-0">
    <label htmlFor="inventory-office" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
      <Building2 aria-hidden="true" className="h-3.5 w-3.5" /> RPH Persediaan
    </label>
    {state.restricted ? <>
      <select id="inventory-office" value={allPage ? (getInventoryOffice() || 'all') : state.id || ''} onChange={changeOffice}
        disabled={!state.offices.length} aria-describedby={!state.offices.length || !allPage ? 'inventory-office-help' : undefined}
        className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 disabled:bg-slate-100">
        {allPage ? <option value="all">Semua RPH</option> : <option value="" disabled>Pilih RPH</option>}
        {state.offices.map(office => <option key={office.id} value={office.id}>{office.name}</option>)}
      </select>
      {(!state.offices.length || !allPage) && <p id="inventory-office-help" className="mt-1 text-xs text-slate-600">
        {!state.offices.length ? 'Tidak ada RPH tersedia. Hubungi administrator.' : 'Ganti RPH akan memuat ulang halaman.'}
      </p>}
    </> : <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
      <LockKeyhole aria-hidden="true" className="h-4 w-4 shrink-0" />
      <input id="inventory-office" readOnly value={state.user.nama_office || state.user.office_name || `RPH ${state.user.id_office || '-'}`} aria-describedby="inventory-office-help" className="w-full min-w-0 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-emerald-700" />
      <span id="inventory-office-help" className="sr-only">RPH sesuai penugasan, tidak dapat diubah.</span>
    </div>}
  </div>;

  return <InventoryOfficeContext.Provider value={selector}>
    {!allPage && !stockPage && state.restricted && <div className="mb-4">{selector}</div>}
    {allPage && !stockPage ? <React.Fragment key={getInventoryOffice() || 'all'}>{children}</React.Fragment> : stockPage || !state.restricted || state.id ? children : <p role="status">Pilih RPH untuk memuat persediaan.</p>}
  </InventoryOfficeContext.Provider>;
}
