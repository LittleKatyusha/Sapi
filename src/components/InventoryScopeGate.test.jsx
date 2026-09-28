import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Gate, { InventoryOfficeSelector } from './InventoryScopeGate';
import HttpClient from '../services/httpClient';
import StokSapiService from '../services/stokSapiService';
import PersediaanOvkPage from '../pages/RPH/Persediaan/PersediaanOvk/PersediaanOvkPage';
import StokSapiPage from '../pages/RPH/StokSapi/StokSapiPage';
import { configureInventoryScope, resetInventoryScope, selectInventoryOffice } from '../services/inventoryScope';

jest.mock('../services/httpClient', () => ({ get: jest.fn() }));
jest.mock('../pages/RPH/Persediaan/PersediaanOvk/hooks/usePersediaanPakan', () => () => ({ persediaanData: [], serverPagination: { currentPage: 1, perPage: 10, totalRows: 0 } }));
jest.mock('../pages/RPH/Persediaan/PersediaanOvk/hooks/usePersediaanOvk', () => () => ({ persediaanData: [] }));
jest.mock('../pages/RPH/Persediaan/PersediaanOvk/hooks/usePenggunaOvk', () => () => ({ selectedDates: [], availableDates: [], tableColumns: [], tableData: [], penggunaData: [] }));
jest.mock('../pages/RPH/Persediaan/PersediaanOvk/hooks/usePersediaanDocument', () => () => ({}));
jest.mock('../services/stokSapiService', () => ({ getStokSapiOptions: jest.fn(), getStokDetail: jest.fn(), getFilterOptions: jest.fn(), getPotongPaksaData: jest.fn(), getSapiMatiData: jest.fn() }));
jest.mock('react-data-table-component', () => () => <div />);
let mockPath = '/rph/stok-sapi';
jest.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: mockPath }), useNavigate: () => jest.fn() }), { virtual: true });
const user = { id: 12, inventory_scope: 'all_rph' };
const offices = [{ id: 7, name: 'RPH A' }];
const InventoryScopeGate = ({ children }) => <Gate>{mockPath === '/rph/persediaan-ovk' && <InventoryOfficeSelector />}{children}</Gate>;
beforeEach(() => {
  resetInventoryScope();
  mockPath = '/rph/stok-doka';
  localStorage.setItem('user', JSON.stringify({ pid: 'login-pid', roles_id: 3, id_office: 99 }));
  HttpClient.get.mockReset();
  StokSapiService.getStokSapiOptions.mockResolvedValue({ success: true, data: { rows: [] } });
  StokSapiService.getStokDetail.mockReset().mockResolvedValue({ success: true, data: { rows: [] } });
  StokSapiService.getFilterOptions.mockReset().mockResolvedValue({ success: true, data: {} });
  StokSapiService.getPotongPaksaData.mockResolvedValue({ success: true, data: [] });
  StokSapiService.getSapiMatiData.mockResolvedValue({ success: true, data: [] });
  HttpClient.get.mockImplementation(async path => ({ data: path === '/api/auth/me' ? user : offices }));
});
afterEach(() => resetInventoryScope());
test('stock selector lives only in each real tab filter; search and focus preserve office', async () => {
  mockPath = '/rph/stok-sapi';
  configureInventoryScope(user, offices);
  selectInventoryOffice(7);
  const { container } = render(<Gate><StokSapiPage /></Gate>);
  await screen.findByPlaceholderText('Eartag, jenis sapi, pemasok, nota...');
  fireEvent.change(screen.getByLabelText('RPH Persediaan'), { target: { value: '7' } });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Cari', exact: true })).toBeEnabled());
  for (const tab of ['Ringkas', 'Potong Paksa', 'Sapi Mati', 'Detail']) {
    fireEvent.click(screen.getByRole('button', { name: tab, exact: true }));
    const region = screen.getByRole('region', { name: 'Filter Stok Sapi' });
    expect(within(region).getByLabelText('RPH Persediaan')).toHaveValue('7');
    expect(screen.getAllByLabelText('RPH Persediaan')).toHaveLength(1);
    expect(container.firstChild).toContainElement(region);
    expect(screen.getByRole('option', { name: 'Semua RPH' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Memuat...')).not.toBeInTheDocument());
  }
  const search = screen.getByPlaceholderText('Eartag, jenis sapi, pemasok, nota...');
  fireEvent.change(search, { target: { value: 'Sapi A' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cari', exact: true }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Cari', exact: true })).toBeEnabled());
  HttpClient.get.mockClear();
  StokSapiService.getStokDetail.mockClear();
  fireEvent.focus(window);
  fireEvent(document, new Event('visibilitychange'));
  expect(search).toHaveValue('Sapi A');
  expect(screen.getByLabelText('RPH Persediaan')).toHaveValue('7');
  expect(HttpClient.get).not.toHaveBeenCalled();
  expect(StokSapiService.getStokDetail).not.toHaveBeenCalled();
});
test('stock defaults ALL and loads without selection; own office is locked', async () => {
  mockPath = '/rph/stok-sapi';
  const view = render(<Gate><StokSapiPage /></Gate>);
  const region = await screen.findByRole('region', { name: 'Filter Stok Sapi' });
  expect(within(region).getByLabelText('RPH Persediaan')).toHaveValue('all');
  expect(screen.getAllByLabelText('RPH Persediaan')).toHaveLength(1);
  await waitFor(() => expect(StokSapiService.getStokDetail).toHaveBeenCalled());
  expect(StokSapiService.getFilterOptions).toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Beri Pakan Konsentrat' })).toBeDisabled();
  view.unmount();
  HttpClient.get.mockResolvedValue({ data: { id: 12, inventory_scope: 'own', id_office: 7 } });
  render(<Gate><StokSapiPage /></Gate>);
  expect(await screen.findByLabelText('RPH Persediaan')).toHaveAttribute('readonly');
  expect(screen.getAllByLabelText('RPH Persediaan')).toHaveLength(1);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Cari', exact: true })).toBeEnabled());
});
test('stock office switch preserves tab and isolates late responses; ALL blocks row actions', async () => {
  mockPath = '/rph/stok-sapi';
  let finishOld;
  StokSapiService.getStokDetail.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }));
  StokSapiService.getPotongPaksaData.mockResolvedValue({ success: true, data: [{ pid: 'event', sapi: 'Cow B', rph: 'RPH A' }] });
  render(<Gate><StokSapiPage /></Gate>);
  fireEvent.change(await screen.findByLabelText('RPH Persediaan'), { target: { value: '7' } });
  await waitFor(() => expect(StokSapiService.getStokDetail).toHaveBeenCalledTimes(2));
  finishOld({ success: true, data: { rows: [{ pid: 'old', jenis_sapi: 'Stale cow' }] } });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Cari', exact: true })).toBeEnabled());
  expect(screen.queryByText('Stale cow')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Potong Paksa', exact: true }));
  expect(await screen.findByText('Cow B')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Menu Aksi' })).toBeEnabled();
  fireEvent.change(screen.getByLabelText('RPH Persediaan'), { target: { value: 'all' } });
  expect(await screen.findByText('Cow B')).toBeInTheDocument();
  expect(screen.getByText('Riwayat Potong Paksa')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Menu Aksi' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Beri Pakan Konsentrat' })).toBeDisabled();
});
test('OVK toolbar has one selector and preserves active tab and search on focus', async () => {
  mockPath = '/rph/persediaan-ovk';
  render(<Gate><PersediaanOvkPage /></Gate>);
  expect(await screen.findByLabelText('RPH Persediaan')).toHaveValue('all');
  expect(within(screen.getByRole('region', { name: 'Filter Resep Pakan' })).getByLabelText('RPH Persediaan')).toBeInTheDocument();
  expect(screen.getAllByRole('combobox')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Stok OVK' }));
  const search = screen.getByLabelText('Cari OVK');
  expect(screen.getByRole('region', { name: 'Filter Stok OVK' })).toContainElement(search);
  expect(within(screen.getByRole('region', { name: 'Filter Stok OVK' })).getByLabelText('RPH Persediaan')).toHaveValue('all');
  fireEvent.change(search, { target: { value: 'Vitamin' } });
  HttpClient.get.mockClear();
  fireEvent.blur(window);
  fireEvent(document, new Event('visibilitychange'));
  fireEvent.focus(window);
  expect(screen.getByLabelText('Cari OVK')).toBe(search);
  expect(search).toHaveValue('Vitamin');
  expect(HttpClient.get).not.toHaveBeenCalled();
});
test('office stays shared across real tab filter regions, outside the page header', async () => {
  mockPath = '/rph/persediaan-ovk';
  render(<Gate><PersediaanOvkPage /></Gate>);
  fireEvent.change(await screen.findByLabelText('RPH Persediaan'), { target: { value: '7' } });
  for (const tab of ['Stok OVK', 'Kartu Stok OVK', 'Stok Sapi', 'Resep Pakan']) {
    fireEvent.click(screen.getByRole('button', { name: tab }));
    const selector = within(screen.getByRole('region', { name: `Filter ${tab}` })).getByLabelText('RPH Persediaan');
    expect(selector).toHaveValue('7');
    expect(screen.getAllByLabelText('RPH Persediaan')).toHaveLength(1);
    expect(selector.closest('header')).toBeNull();
    expect(screen.getByRole('heading', { level: 1 }).parentElement.parentElement.parentElement.parentElement).not.toContainElement(selector);
    if (tab === 'Stok Sapi') await screen.findByText('Total: 0 sapi');
  }
  fireEvent.change(screen.getByLabelText('RPH Persediaan'), { target: { value: 'all' } });
  expect(within(screen.getByRole('region', { name: 'Filter Resep Pakan' })).getByLabelText('RPH Persediaan')).toHaveValue('all');
});
test('assigned office is locked within the real recipe filter region', async () => {
  mockPath = '/rph/persediaan-ovk';
  HttpClient.get.mockResolvedValue({ data: { id: 12, module_scope: 'rph', id_office: 7 } });
  render(<Gate><PersediaanOvkPage /></Gate>);
  const region = await screen.findByRole('region', { name: 'Filter Resep Pakan' });
  expect(within(region).getByLabelText('RPH Persediaan')).toHaveAttribute('readonly');
  expect(screen.getAllByLabelText('RPH Persediaan')).toHaveLength(1);
});
test('OVK ALL mounts immediately; specific office remounts without duplicate selector', async () => {
  mockPath = '/rph/persediaan-ovk';
  render(<InventoryScopeGate><p>Inventory rows</p></InventoryScopeGate>);
  expect(await screen.findByText('Inventory rows')).toBeInTheDocument();
  expect(screen.getByLabelText('RPH Persediaan')).toHaveValue('all');
  fireEvent.change(screen.getByLabelText('RPH Persediaan'), { target: { value: '7' } });
  expect(screen.getByLabelText('RPH Persediaan')).toHaveValue('7');
  expect(screen.getAllByRole('combobox')).toHaveLength(1);
});
test('ordinary RPH office remains visible and locked', async () => {
  mockPath = '/rph/persediaan-ovk';
  HttpClient.get.mockResolvedValue({ data: { id: 12, module_scope: 'rph', id_office: 7 } });
  render(<InventoryScopeGate><p>Inventory rows</p></InventoryScopeGate>);
  expect(await screen.findByLabelText('RPH Persediaan')).toHaveAttribute('readonly');
  expect(screen.getByLabelText('RPH Persediaan')).toHaveValue('RPH 7');
});

test('real navigation refreshes permissions and removes revoked scope', async () => {
  mockPath = '/rph/persediaan-ovk';
  const view = render(<InventoryScopeGate><p>Inventory rows</p></InventoryScopeGate>);
  expect(await screen.findByLabelText('RPH Persediaan')).toHaveValue('all');
  HttpClient.get.mockResolvedValue({ data: { id: 12, inventory_scope: 'own', id_office: 7 } });
  mockPath = '/rph/stok-sapi';
  view.rerender(<InventoryScopeGate><p>Stock rows</p></InventoryScopeGate>);
  expect(await screen.findByText('Stock rows')).toBeInTheDocument();
  await waitFor(() => expect(JSON.parse(localStorage.getItem('user'))).not.toHaveProperty('inventory_scope'));
  expect(HttpClient.get).toHaveBeenCalledTimes(3);
});

test('focus and visibility preserve office, form and mount without me or inventory GETs', async () => {
  mockPath = '/rph/persediaan-ovk';
  const mounted = jest.fn();
  const unmounted = jest.fn();
  function Form() {
    const [draft, setDraft] = React.useState('');
    React.useEffect(() => {
      mounted();
      HttpClient.get('/api/rph/persediaan/pakan/data');
      return unmounted;
    }, []);
    return <input aria-label="Draft" value={draft} onChange={event => setDraft(event.target.value)} />;
  }
  render(<InventoryScopeGate><Form /></InventoryScopeGate>);
  fireEvent.change(await screen.findByLabelText('RPH Persediaan'), { target: { value: '7' } });
  const input = screen.getByLabelText('Draft');
  fireEvent.change(input, { target: { value: 'Belum disimpan' } });
  HttpClient.get.mockClear();
  mounted.mockClear();
  unmounted.mockClear();
  for (let i = 0; i < 3; i++) {
    fireEvent.blur(window);
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    fireEvent(document, new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    fireEvent(document, new Event('visibilitychange'));
    fireEvent.focus(window);
  }
  expect(screen.getByLabelText('RPH Persediaan')).toHaveValue('7');
  expect(screen.getByLabelText('Draft')).toBe(input);
  expect(input).toHaveValue('Belum disimpan');
  expect(HttpClient.get).not.toHaveBeenCalled();
  expect(mounted).not.toHaveBeenCalled();
  expect(unmounted).not.toHaveBeenCalled();
  delete document.visibilityState;
});

test('explicit page reload rechecks permissions and clears removed assigned office', async () => {
  mockPath = '/rph/persediaan-ovk';
  const view = render(<InventoryScopeGate><p>Inventory rows</p></InventoryScopeGate>);
  fireEvent.change(await screen.findByLabelText('RPH Persediaan'), { target: { value: '7' } });
  view.unmount();
  HttpClient.get.mockResolvedValue({ data: { id: 12, inventory_scope: 'own', id_office: null } });
  render(<InventoryScopeGate><p>Inventory rows</p></InventoryScopeGate>);
  expect(await screen.findByLabelText('RPH Persediaan')).toHaveAttribute('readonly');
  expect(JSON.parse(localStorage.getItem('user')).id_office).toBeNull();
});

test('fresh me gates children; labeled selector uses eligible offices, preserves flat login shape', async () => {
  render(<InventoryScopeGate><p>Inventory rows</p></InventoryScopeGate>);
  expect(screen.queryByText('Inventory rows')).not.toBeInTheDocument();
  expect(await screen.findByLabelText('RPH Persediaan')).toHaveValue('');
  expect(screen.getByRole('option', { name: 'RPH A' })).toHaveValue('7');
  expect(screen.queryByText('Inventory rows')).not.toBeInTheDocument();
  expect(HttpClient.get).toHaveBeenCalledWith('/api/auth/me', { cache: false });
  expect(JSON.parse(localStorage.getItem('user'))).toEqual({ pid: 'login-pid', roles_id: 3, id_office: null, inventory_scope: 'all_rph' });
});

test('validated persisted selection mounts inventory', async () => {
  configureInventoryScope(user, offices);
  selectInventoryOffice(7);
  render(<InventoryScopeGate><p>Inventory rows</p></InventoryScopeGate>);
  expect(await screen.findByText('Inventory rows')).toBeInTheDocument();
  expect(screen.getByLabelText('RPH Persediaan')).toHaveValue('7');
});

test.each(['/rph/stok-sapi/edit/old-office-pid'])('switch confirms unsaved data loss and navigates safely from %s', async path => {
  const choices = [...offices, { id: 8, name: 'RPH B' }];
  configureInventoryScope(user, choices);
  selectInventoryOffice(7);
  mockPath = path;
  HttpClient.get.mockImplementation(async path => ({ data: path === '/api/auth/me' ? user : choices }));
  const originalLocation = window.location;
  delete window.location;
  window.location = { ...originalLocation, assign: jest.fn() };
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
  try {
    render(<Gate>{path === '/rph/stok-sapi' ? <StokSapiPage /> : <p>Inventory rows</p>}</Gate>);
    const selector = await screen.findByLabelText('RPH Persediaan');
    if (path === '/rph/stok-sapi') await waitFor(() => expect(screen.getByRole('button', { name: 'Cari', exact: true })).toBeEnabled());
    fireEvent.change(selector, { target: { value: '8' } });
    expect(window.location.assign).not.toHaveBeenCalled();
    expect(selector).toHaveValue('7');
    confirm.mockReturnValue(true);
    fireEvent.change(selector, { target: { value: '8' } });
    expect(window.location.assign).toHaveBeenCalledWith('/rph/stok-sapi');
    expect(JSON.parse(sessionStorage.getItem('inventoryOffice'))).toEqual({ owner: '12', id: '8' });
  } finally {
    window.location = originalLocation;
    confirm.mockRestore();
  }
});

test('ordinary user has no selector or office fetch, even with stale stored scope', async () => {
  localStorage.setItem('user', JSON.stringify({ inventory_scope: 'all_rph' }));
  HttpClient.get.mockResolvedValue({ data: { id: 12 } });
  render(<InventoryScopeGate><p>Ordinary page</p></InventoryScopeGate>);
  expect(await screen.findByText('Ordinary page')).toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(HttpClient.get).toHaveBeenCalledTimes(1);
  expect(JSON.parse(localStorage.getItem('user'))).not.toHaveProperty('inventory_scope');
});

test('no selector on other RPH menus', async () => {
  mockPath = '/rph/pembelian-sapi';
  render(<InventoryScopeGate><p>Other page</p></InventoryScopeGate>);
  expect(await screen.findByText('Other page')).toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
});

test('empty offices block inventory; failures allow retry', async () => {
  HttpClient.get.mockRejectedValueOnce(new Error('Offline'));
  render(<InventoryScopeGate><p>Inventory rows</p></InventoryScopeGate>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Offline');
  HttpClient.get.mockImplementation(async path => ({ data: path === '/api/auth/me' ? user : [] }));
  fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
  expect(await screen.findByLabelText('RPH Persediaan')).toBeDisabled();
  expect(screen.queryByText('Inventory rows')).not.toBeInTheDocument();
});
