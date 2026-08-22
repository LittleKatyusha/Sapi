import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, X } from 'lucide-react';
import HttpClient from '../../../services/httpClient';
import { API_ENDPOINTS } from '../../../config/api';

const flattenMenus = (items, parentId = null) => items.flatMap((item) => [
  { ...item, parentId },
  ...flattenMenus(item.children || [], item.id)
]);

const collectDescendantIds = (menu) => [
  menu.id,
  ...collectDescendantIds(menu.children || []).flat()
];

const BulkMenuAccessModal = ({ isOpen, onClose, menuTree, roles, onSaved }) => {
  const [roleId, setRoleId] = useState('');
  const [menuIds, setMenuIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const menus = useMemo(() => flattenMenus(menuTree), [menuTree]);
  const menuById = useMemo(() => new Map(menus.map((menu) => [menu.id, menu])), [menus]);

  useEffect(() => {
    if (!roleId) {
      setMenuIds([]);
      return;
    }

    HttpClient.get(`${API_ENDPOINTS.SYSTEM.MENU}/access-matrix`).then((result) => {
      const roleAccess = result.data?.find((role) => Number(role.role_id) === Number(roleId));
      setMenuIds((roleAccess?.menus || [])
        .filter((menu) => menu.has_access && menuById.has(menu.menu_id))
        .map((menu) => menu.menu_id));
    }).catch(() => setMenuIds([]));
  }, [roleId, menuById]);

  if (!isOpen) return null;

  const toggleMenu = (menu) => setMenuIds((previous) => {
    const ids = collectDescendantIds(menu);
    const selected = ids.every((id) => previous.includes(id));

    return selected
      ? previous.filter((id) => !ids.includes(id))
      : [...new Set([...previous, ...ids])];
  });

  const save = async () => {
    if (!roleId) return;

    setSaving(true);
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.MENU}/bulk-sync-access`, {
        role_id: Number(roleId),
        menu_ids: menuIds
      });

      if (result.status !== 'ok') throw new Error(result.message || 'Gagal bulk assign akses menu.');
      onSaved?.(menuIds.length);
      onClose();
    } catch (error) {
      window.alert(error.message || 'Gagal bulk assign akses menu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bulk Assign Akses Menu</h2>
            <p className="mt-1 text-sm text-gray-500">Isi ID role. Akses aktif otomatis dicentang; lepas centang untuk unassign.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Tutup">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-6">
          <label className="block text-sm font-medium text-gray-700">
            Role target ID
            <input
              type="number"
              min="1"
              list="bulk-menu-role-options"
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
              placeholder="Isi ID role, contoh: 2"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <datalist id="bulk-menu-role-options">
              {roles.map((role) => <option key={role.id} value={role.id}>{role.child_role || role.nama}</option>)}
            </datalist>
            <span className="mt-1 block text-xs text-gray-500">Isi manual atau pilih saran ID role yang tersedia.</span>
          </label>

          <div className="rounded-lg border border-gray-200">
            <div className="border-b border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">Menu terpilih: {menuIds.length}</div>
            <div className="max-h-80 overflow-y-auto p-2">
              {menus.map((menu) => (
                <label key={menu.id} className="flex cursor-pointer items-center gap-3 rounded px-3 py-2 hover:bg-gray-50" style={{ paddingLeft: `${12 + (menu.depth || 0) * 24}px` }}>
                  <input type="checkbox" checked={menuIds.includes(menu.id)} onChange={() => toggleMenu(menu)} />
                  <span className="text-sm text-gray-800">{menu.nama}</span>
                  {menu.url && menu.url !== '#' && <span className="ml-auto text-xs text-gray-400">{menu.url}</span>}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 p-4">
          <button onClick={onClose} disabled={saving} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Batal</button>
          <button onClick={save} disabled={saving || !roleId} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50">
            <CheckSquare className="h-4 w-4" />{saving ? 'Menyimpan...' : 'Simpan Akses'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkMenuAccessModal;
