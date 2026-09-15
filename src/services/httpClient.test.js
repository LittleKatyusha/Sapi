/** @jest-environment node */
import { Blob } from 'buffer';
import HttpClient from './httpClient';
import service from './persediaanOvkService';

jest.mock('../config/api.js', () => ({ API_BASE_URL: 'https://api.test', API_ENDPOINTS: {} }));
jest.mock('../config/cors.js', () => ({ CORS_CONFIG: { defaultHeaders: {} }, generateCorsHeaders: () => ({}) }));
jest.mock('../utils/performanceMonitor', () => ({ measureApiCall: (_, callback) => callback() }));

const originalFetch = global.fetch;
const originalFormData = global.FormData;
const originalBlob = global.Blob;
const pdf = new Blob(['%PDF-1.7 fixture']);
beforeEach(() => {
  global.window = { location: { origin: 'https://app.test' } };
  global.localStorage = { getItem: () => null };
  global.FormData = class FormData {};
  global.Blob = Blob;
  HttpClient.clearCache();
  global.fetch = jest.fn(async (_, options) => {
    if ('cache' in options && !['default', 'no-store', 'reload', 'no-cache', 'force-cache', 'only-if-cached'].includes(options.cache)) {
      throw new TypeError('Invalid RequestCache');
    }
    return { ok: true, json: jest.fn(async () => ({ success: true })), blob: jest.fn(async () => pdf) };
  });
});
afterAll(() => {
  global.fetch = originalFetch;
  global.FormData = originalFormData;
  global.Blob = originalBlob;
  delete global.window;
  delete global.localStorage;
});

const methods = {
  get: options => HttpClient.get('/test', options),
  post: options => HttpClient.post('/test', { pid: 'id' }, options),
  put: options => HttpClient.put('/test', { pid: 'id' }, options),
  patch: options => HttpClient.patch('/test', { pid: 'id' }, options),
  delete: options => HttpClient.delete('/test', options),
  head: options => HttpClient.head('/test', options),
  request: options => HttpClient.request('POST', '/test', { pid: 'id' }, options),
};

test.each(Object.keys(methods))('%s normalizes boolean cache and preserves native modes/defaults', async method => {
  for (const cache of [false, true, undefined, 'default', 'no-store', 'reload', 'no-cache', 'force-cache', 'only-if-cached']) {
    HttpClient.clearCache();
    const options = cache === undefined ? {} : { cache };
    await methods[method](options);
    const init = fetch.mock.calls[fetch.mock.calls.length - 1][1];
    if (cache === true || cache === undefined) expect(init).not.toHaveProperty('cache');
    else expect(init.cache).toBe(cache === false ? 'no-store' : cache);
    expect(options).toEqual(cache === undefined ? {} : { cache });
  }
});

test.each([undefined, true])('GET cache %s retains internal caching; false bypasses reads and writes', async cache => {
  const cached = await HttpClient.get('/test', { cache });
  await HttpClient.get('/test', { cache: false });
  await HttpClient.get('/test', { cache: false });
  expect(await HttpClient.get('/test', { cache })).toBe(cached);
  expect(fetch).toHaveBeenCalledTimes(3);
  HttpClient.clearCache();
  await HttpClient.get('/test', { cache: false });
  expect(HttpClient.getCacheStats().size).toBe(0);
});

test.each(['recipe', 'stock', 'ledger'])('%s download uses real transport and returns PDF', async type => {
  expect(await service.downloadDocument(type, { pid: 'encrypted+/pid' })).toBe(pdf);
  const post = type === 'recipe';
  expect(fetch).toHaveBeenCalledWith(
    `https://api.test/api/rph/persediaan/${post ? 'pakan' : 'ovk'}/${type}-document${post ? '' : '?pid=encrypted%2B%2Fpid'}`,
    {
      method: post ? 'POST' : 'GET',
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', Origin: 'https://app.test' },
      credentials: 'include',
      cache: 'no-store',
      ...(post ? { body: JSON.stringify({ pid: 'encrypted+/pid' }) } : {}),
    }
  );
  const response = await fetch.mock.results[0].value;
  expect(response.json).not.toHaveBeenCalled();
});
