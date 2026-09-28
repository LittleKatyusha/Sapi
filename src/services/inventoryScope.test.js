import HttpClient from './httpClient';
import { allInventoryReads, configureInventoryScope, getInventoryOffice, inventoryEndpoints, inventoryPageRoot, resetInventoryScope, scopeInventoryRequest, selectInventoryOffice, setInventoryPage } from './inventoryScope';

jest.mock('../config/api', () => ({ API_BASE_URL: 'https://api.test', API_ENDPOINTS: {} }));
jest.mock('../config/cors.js', () => ({ CORS_CONFIG: { defaultHeaders: {} }, generateCorsHeaders: () => ({}) }));
jest.mock('../utils/performanceMonitor', () => ({ measureApiCall: (_, callback) => callback() }));

const user = { id: 12, pid: 'random-encryption', inventory_scope: 'all_rph' };
const offices = [{ id: 7, name: 'RPH A' }, { id: 8, name: 'RPH B' }];
test('OVK defaults ALL, separates cache, honors concrete modal office, denies ALL mutations', async () => {
  configureInventoryScope(user, offices);
  selectInventoryOffice(8);
  setInventoryPage('/rph/persediaan-ovk');
  await HttpClient.get('/api/rph/persediaan/pakan/data');
  expect(fetch.mock.calls[0][0]).toContain('id_rph=all');
  selectInventoryOffice(7);
  await HttpClient.get('/api/rph/persediaan/pakan/data');
  expect(fetch.mock.calls[1][0]).toContain('id_rph=7');
  await HttpClient.post('/api/rph/persediaan/pakan/beri-makan', { id_rph: 8 });
  expect(JSON.parse(fetch.mock.calls[2][1].body).id_rph).toBe(8);
  selectInventoryOffice('all');
  expect(() => scopeInventoryRequest('https://api.test/api/rph/persediaan/pakan/store', { method: 'POST' })).toThrow('Pilih RPH');
  expect(() => scopeInventoryRequest('https://api.test/api/rph/kandang/data')).toThrow('Pilih RPH');
  expect(() => scopeInventoryRequest('https://api.test/api/rph/persediaan/pakan/beri-makan', { method: 'POST', body: JSON.stringify({ id_rph: 99 }) })).toThrow('Pilih RPH');
  setInventoryPage('/rph/stok-sapi');
  expect(getInventoryOffice()).toBeNull();
});
test('stock defaults ALL despite old selection; concrete selection follows action navigation', async () => {
  configureInventoryScope(user, offices);
  selectInventoryOffice(8);
  setInventoryPage('/rph/stok-sapi');
  await HttpClient.get('/api/rph/pemeliharaansapi/stoksapi');
  expect(fetch.mock.calls[0][0]).toContain('id_rph=all');
  selectInventoryOffice(7);
  await HttpClient.get('/api/rph/pemeliharaansapi/stoksapi');
  expect(fetch.mock.calls[1][0]).toContain('id_rph=7');
  setInventoryPage('/rph/stok-sapi/edit/cow');
  expect(getInventoryOffice()).toBe('7');
  setInventoryPage('/rph/stok-sapi');
  selectInventoryOffice('all');
  for (const id_rph of ['all', 0, null, 999]) {
    expect(() => scopeInventoryRequest('https://api.test/api/rph/pemeliharaansapi/update', { method: 'POST', body: JSON.stringify({ id_rph }) })).toThrow('Pilih RPH');
  }
  configureInventoryScope({ id: 12, id_office: 7 });
  expect(sessionStorage.getItem('inventoryOffice')).toBeNull();
});
beforeEach(() => {
  resetInventoryScope();
  HttpClient.clearCache();
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ data: [] }), blob: async () => new Blob(['PDF']) }));
});
afterEach(() => resetInventoryScope());

test('ALL is confined to list allowlist; explicit modal reads and FormData retain their office', () => {
  configureInventoryScope(user, offices);
  setInventoryPage('/rph/persediaan-ovk');
  for (const [prefix, actions] of Object.entries(inventoryEndpoints)) {
    for (const action of actions) {
      const [method, path] = action.split(' ');
      const route = `${prefix}/${path.replace('{pid}', 'test')}`;
      const request = () => scopeInventoryRequest(`https://api.test/api/rph/${route}`, { method });
      if (method === 'GET' && allInventoryReads.includes(route)) {
        expect(new URL(request().url).searchParams.get('id_rph')).toBe('all');
      } else expect(request).toThrow('Pilih RPH');
    }
  }
  selectInventoryOffice(7);
  for (const route of ['persediaan/pakan/data', 'pemeliharaansapi/stok-sapi-options']) {
    expect(new URL(scopeInventoryRequest(`https://api.test/api/rph/${route}?id_rph=8`).url).searchParams.get('id_rph')).toBe('8');
  }
  const body = new FormData();
  body.append('id_rph', '8');
  expect(scopeInventoryRequest('https://api.test/api/rph/persediaan/pakan/beri-makan', { method: 'POST', body }).options.body.get('id_rph')).toBe('8');
});

test('restores only eligible office for stable me identity, not randomized pid', () => {
  configureInventoryScope(user, offices);
  selectInventoryOffice(7);
  expect(configureInventoryScope({ ...user, pid: 'new-encryption' }, offices)).toBe('7');
  expect(configureInventoryScope(user, [offices[1]])).toBeNull();
  expect(configureInventoryScope({ ...user, id: 13 }, offices)).toBeNull();
  expect(() => selectInventoryOffice(99)).toThrow();
  configureInventoryScope({ id: 12 });
  expect(getInventoryOffice()).toBeNull();
  expect(sessionStorage.getItem('inventoryOffice')).toBeNull();
});

test('invalid persisted data, empty list, missing identity fail safely', () => {
  sessionStorage.setItem('inventoryOffice', '{');
  expect(configureInventoryScope(user, offices)).toBeNull();
  expect(configureInventoryScope(user, [])).toBeNull();
  expect(() => configureInventoryScope({ inventory_scope: 'all_rph' }, offices)).toThrow();
});

test.each(Object.entries(inventoryEndpoints).flatMap(([prefix, actions]) => actions.map(action => [prefix, action])))('%s %s injects only exact method/path', (prefix, action) => {
  configureInventoryScope(user, offices);
  selectInventoryOffice(7);
  const [method, path] = action.split(' ');
  const url = `https://api.test/api/rph/${prefix}/${path.replace('{pid}', 'encrypted%2Fpid')}`;
  expect(new URL(scopeInventoryRequest(url, { method }).url).searchParams.get('id_rph')).toBe('7');
  expect(scopeInventoryRequest(`${url}/extra`, { method }).url).toBe(`${url}/extra`);
});

test.each([
  ['GET', '/api/rph/pembelian/data'], ['POST', '/api/rph/pemberian-pakan-konsentrat/store'],
  ['GET', '/api/rph/pemberian-pakan-konsentrat/data'], ['GET', '/api/ho/feedmil/pembelian/data'],
  ['GET', '/api/master/office/data'], ['GET', '/api/auth/me'], ['DELETE', '/api/rph/kandang/hapus'],
])('does not scope unrelated %s %s', (method, path) => {
  configureInventoryScope(user, offices);
  const url = `https://api.test${path}`;
  expect(scopeInventoryRequest(url, { method })).toEqual({ url, options: { method } });
});

test('ordinary users and foreign origins remain unchanged; missing selection blocks inventory', () => {
  const url = 'https://api.test/api/rph/kandang/data';
  expect(scopeInventoryRequest(url).url).toBe(url);
  configureInventoryScope(user, offices);
  expect(() => scopeInventoryRequest(url)).toThrow('Pilih RPH');
  expect(scopeInventoryRequest(url.replace('api.test', 'other.test')).url).toContain('other.test');
});

test('transport scopes cache keys, JSON writes, FormData, generic requests and blob documents', async () => {
  configureInventoryScope(user, offices);
  selectInventoryOffice(7);
  await HttpClient.get('/api/rph/kandang/data', { params: { id_rph: 99 } });
  await HttpClient.get('/api/rph/kandang/data', { params: { id_rph: 99 } });
  expect(fetch).toHaveBeenCalledTimes(1);
  selectInventoryOffice(8);
  await HttpClient.get('/api/rph/kandang/data', { params: { id_rph: 99 } });
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls[1][0]).toContain('id_rph=8');
  await HttpClient.post('/api/rph/persediaan/pakan/update?id_rph=99', { pid: 'abc', id_rph: 99 });
  expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual({ pid: 'abc', id_rph: 8 });
  const form = new FormData();
  form.append('id_rph', '99');
  form.append('pid', 'abc');
  await HttpClient.post('/api/rph/persediaan/pakan/store', form);
  expect(fetch.mock.calls[3][1].body.get('id_rph')).toBe('8');
  expect(form.get('id_rph')).toBe('99');
  await HttpClient.request('POST', '/api/rph/pemeliharaansapi/show', { pid: 'abc' });
  expect(JSON.parse(fetch.mock.calls[4][1].body).id_rph).toBe(8);
  expect(await HttpClient.post('/api/rph/persediaan/pakan/recipe-document', { pid: 'abc' }, { responseType: 'blob' })).toBeInstanceOf(Blob);
  expect(await HttpClient.get('/api/rph/persediaan/ovk/stock-document', { responseType: 'blob', cache: false })).toBeInstanceOf(Blob);
});

test('selector page roots exclude other RPH menus and return safe list from details', () => {
  expect(inventoryPageRoot('/rph/stok-sapi/edit/abc')).toBe('/rph/stok-sapi');
  expect(inventoryPageRoot('/rph/stok-sapi-qurban')).toBe('/rph/stok-sapi-qurban');
  for (const path of ['/rph/pembelian-sapi', '/rph/pemberian-pakan-konsentrat', '/rph/keuangan/penerimaan', '/rph/stok-sapi-other', '/ho/feedmil']) expect(inventoryPageRoot(path)).toBeUndefined();
});

test('account cache reset isolates pending requests and prevents stale cache refill', async () => {
  let completeOld;
  fetch.mockImplementationOnce(() => new Promise(resolve => { completeOld = resolve; }));
  const old = HttpClient.get('/api/auth/me');
  const rejectedOld = expect(old).rejects.toThrow('Authentication context changed.');
  await Promise.resolve();
  HttpClient.clearCache();
  fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: 13 } }) });
  expect(await HttpClient.get('/api/auth/me')).toEqual({ data: { id: 13 } });
  completeOld({ ok: true, json: async () => ({ data: { id: 12 } }) });
  await rejectedOld;
  expect(await HttpClient.get('/api/auth/me')).toEqual({ data: { id: 13 } });
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('GET scope stays consistent with its cache key across the headers await', async () => {
  configureInventoryScope(user, offices);
  selectInventoryOffice(7);
  const pending = HttpClient.get('/api/rph/kandang/data');
  selectInventoryOffice(8);
  await pending;
  expect(fetch.mock.calls[0][0]).toContain('id_rph=7');
  await HttpClient.get('/api/rph/kandang/data');
  expect(fetch.mock.calls[1][0]).toContain('id_rph=8');
});

test('JSON and blob requests never share cached or pending responses', async () => {
  await HttpClient.get('/api/auth/me');
  expect(await HttpClient.get('/api/auth/me', { responseType: 'blob' })).toBeInstanceOf(Blob);
  expect(fetch).toHaveBeenCalledTimes(2);
});
