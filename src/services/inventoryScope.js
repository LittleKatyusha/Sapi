import { API_BASE_URL } from '../config/api';

// RPH subset of FeedmillInventoryAccess::endpoints(); not a general RPH prefix grant.
export const inventoryEndpoints = {
  'persediaan/ovk': ['GET data', 'GET datastok', 'GET datarekap', 'GET ledger-document', 'GET stock-document'],
  'persediaan/pakan': ['GET data', 'GET datastok', 'GET datarekap', 'POST show', 'POST recipe-document', 'POST store', 'POST update', 'POST hapus', 'POST copy-to-date', 'POST beri-makan', 'GET riwayat-pemberian/{pid}', 'GET riwayat-pemberian/{pid}/detail'],
  'persediaan/pemberianovk': ['GET data', 'POST show', 'POST store', 'POST update', 'POST hapus'],
  'persediaan/sapimati': ['GET data', 'POST show', 'POST store', 'POST update', 'POST hapus', 'GET document', 'GET download'],
  'persediaan/potongpaksa': ['GET data', 'POST show', 'POST store', 'POST update', 'POST hapus', 'GET document'],
  'persediaan/potongsapi': ['GET data', 'POST show', 'POST store', 'POST update', 'POST hapus'],
  'persediaan/boning': ['GET data', 'POST show'],
  'persediaan/sapi': ['GET data', 'POST show', 'POST update', 'POST delete'],
  'persediaan/karkas': ['GET data', 'POST show', 'POST update', 'POST delete'],
  'persediaan/kulit': ['GET data', 'POST update', 'POST delete'],
  kandang: ['GET data', 'GET options', 'POST show', 'POST store', 'POST update', 'POST hapus'],
  pemeliharaansapi: ['GET stoksapibyjenis', 'GET stoksapi', 'GET stokfilteroptions', 'GET parent-options', 'GET stok-sapi-options', 'GET recap-document', 'GET stock-document', 'POST card-document', 'POST show', 'POST update', 'POST history', 'POST store-anakan', 'POST bulk-assign-kandang'],
  stokdoka: ['GET data', 'GET klasifikasi-options', 'GET parent-options', 'GET stok-doka-options', 'GET recap-document', 'POST card-document', 'POST show', 'POST update', 'POST history', 'POST store-anakan', 'POST bulk-assign-kandang'],
  qurban: ['GET data-persapi', 'GET stok-sapi-options', 'GET stock-document', 'POST assign-kandang', 'POST restore-sapi', 'POST restore-to-stock'],
  'qurban/potong-paksa': ['GET data', 'GET available-sapi-pengganti', 'POST show', 'POST store', 'POST hapus'],
  'qurban/sapi-mati': ['GET data', 'GET available-sapi-pengganti', 'POST show', 'POST store', 'POST hapus'],
  'pemberian-pakan-konsentrat': ['POST stok-resep', 'POST preview-per-sapi', 'POST store-per-sapi', 'POST preview-bulk-selected', 'POST store-bulk-selected', 'POST history-by-sapi'],
  'pembelian-ovk': ['GET data', 'GET stok', 'GET card', 'POST store', 'POST show', 'POST cancel', 'POST bayar', 'POST payment-history'],
  'pembelian-konsentrat': ['GET data', 'GET stok', 'GET card', 'POST store', 'POST show', 'POST cancel', 'POST bayar', 'POST payment-history'],
};

const allowed = Object.entries(inventoryEndpoints).flatMap(([prefix, actions]) => actions.map(action => {
  const [method, path] = action.split(' ');
  return new RegExp(`^${method} /api/rph/${prefix}/${path.replace('{pid}', '[^/]+')}$`);
}));

const inventoryPages = [
  'persediaan-ovk', 'persediaan-pakan', 'persediaan-boning', 'persediaan-hasil-potong',
  'stok-sapi', 'stok-doka', 'stok-sapi-qurban', 'pemberian-ovk-sapi', 'kandang',
  'pembelian-ovk', 'pembelian-konsentrat',
];

export const inventoryPageRoot = pathname => inventoryPages
  .map(page => `/rph/${page}`)
  .find(root => pathname === root || pathname.startsWith(`${root}/`));

const STORAGE_KEY = 'inventoryOffice';
let scope = null;
export const allInventoryReads = [
  'persediaan/pakan/data',
  'persediaan/ovk/data',
  'persediaan/ovk/datastok',
  'pemeliharaansapi/stok-sapi-options',
  'pemeliharaansapi/stoksapi',
  'pemeliharaansapi/stoksapibyjenis',
  'pemeliharaansapi/stokfilteroptions',
  'persediaan/potongpaksa/data',
  'persediaan/sapimati/data',
  'pembelian-ovk/data',
  'pembelian-ovk/stok',
  'pembelian-ovk/card',
  'pembelian-konsentrat/data',
  'pembelian-konsentrat/stok',
  'pembelian-konsentrat/card',
];
export const getInventoryAccess = () => scope;
export function setInventoryPage(pathname) {
  if (scope) scope.pageAll = pathname === '/rph/persediaan-ovk' || pathname === '/rph/stok-sapi' || pathname === '/rph/pembelian-ovk' || pathname === '/rph/pembelian-konsentrat';
}

export function resetInventoryScope() {
  scope = null;
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be disabled. */ }
}

export function configureInventoryScope(user, offices = []) {
  if (user.inventory_scope !== 'all_rph') {
    resetInventoryScope();
    return null;
  }
  // Laravel's encrypted pid changes on each serialization; me exposes the stable numeric id.
  const owner = String(user.id || '');
  if (!owner || !Array.isArray(offices) || offices.some(office =>
    !Number.isSafeInteger(Number(office.id)) || Number(office.id) <= 0 || typeof office.name !== 'string')) {
    throw new Error('Data RPH tidak valid.');
  }
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { /* Ignore invalid persisted data. */ }
  const pageId = scope?.owner === owner && offices.some(office => String(office.id) === scope.pageId) ? scope.pageId : 'all';
  scope = { owner, offices, id: null, pageAll: false, pageId };
  if (saved?.owner === owner && offices.some(office => String(office.id) === saved.id)) scope.id = saved.id;
  return scope.id;
}

export function selectInventoryOffice(id) {
  if (scope?.pageAll) {
    if (id !== 'all' && !scope.offices.some(office => String(office.id) === String(id))) throw new Error('Pilih RPH yang tersedia.');
    scope.pageId = String(id);
    // Keep concrete action pages aligned with the visible selection, never a previous office.
    scope.id = id === 'all' ? null : String(id);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ owner: scope.owner, id: scope.id }));
    } catch {
      scope.id = null;
      throw new Error('Pilihan RPH tidak dapat disimpan. Aktifkan penyimpanan sesi browser.');
    }
    return;
  }
  if (!scope?.offices.some(office => String(office.id) === String(id))) throw new Error('Pilih RPH yang tersedia.');
  scope.id = String(id);
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ owner: scope.owner, id: scope.id }));
  } catch {
    scope.id = null;
    throw new Error('Pilihan RPH tidak dapat disimpan. Aktifkan penyimpanan sesi browser.');
  }
}

export const getInventoryOffice = () => scope?.pageAll ? (scope.pageId === 'all' ? null : scope.pageId) : scope?.id || null;

export function scopeInventoryRequest(url, options = {}) {
  if (!scope) return { url, options };
  const parsed = new URL(url, window.location.origin);
  const base = new URL(API_BASE_URL, window.location.origin);
  const method = (options.method || 'GET').toUpperCase();
  if (parsed.origin !== base.origin || !allowed.some(pattern => pattern.test(`${method} ${parsed.pathname}`))) {
    return { url, options };
  }
  let body = options.body;
  const explicit = body instanceof FormData ? body.get('id_rph') : body ? JSON.parse(body).id_rph : parsed.searchParams.get('id_rph');
  let id = scope.id;
  if (scope.pageAll) {
    id = explicit ?? scope.pageId;
    if (id === 'all') {
      if (method !== 'GET' || !allInventoryReads.some(path => parsed.pathname === `/api/rph/${path}`)) throw new Error('Pilih RPH sebelum melakukan tindakan.');
    } else if (!scope.offices.some(office => String(office.id) === String(id))) throw new Error('Pilih RPH yang tersedia.');
  }
  if (!id) throw new Error('Pilih RPH sebelum mengakses persediaan.');
  parsed.searchParams.set('id_rph', id);
  if (body instanceof FormData) {
    const copy = new FormData();
    body.forEach((value, key) => copy.append(key, value));
    copy.set('id_rph', id);
    body = copy;
  } else if (body) {
    body = JSON.stringify({ ...JSON.parse(body), id_rph: Number(id) });
  }
  return { url: parsed.href, options: body === undefined ? options : { ...options, body } };
}
