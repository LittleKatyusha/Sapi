import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import InventoryScopeGate from './InventoryScopeGate';
import HttpClient from '../services/httpClient';
import { configureInventoryScope, resetInventoryScope, selectInventoryOffice } from '../services/inventoryScope';

jest.mock('../services/httpClient', () => ({ get: jest.fn() }));
let mockPath = '/rph/stok-sapi';
jest.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: mockPath }) }), { virtual: true });
const user = { id: 12, inventory_scope: 'all_rph' };
const offices = [{ id: 7, name: 'RPH A' }];
beforeEach(() => {
  resetInventoryScope();
  mockPath = '/rph/stok-sapi';
  localStorage.setItem('user', JSON.stringify({ pid: 'login-pid', roles_id: 3, id_office: 99 }));
  HttpClient.get.mockReset();
  HttpClient.get.mockImplementation(async path => ({ data: path === '/api/auth/me' ? user : offices }));
});
afterEach(() => resetInventoryScope());

test('fresh me gates children; labeled selector uses eligible offices, preserves flat login shape', async () => {
  render(<InventoryScopeGate><p>Inventory rows</p></InventoryScopeGate>);
  expect(screen.queryByText('Inventory rows')).not.toBeInTheDocument();
  expect(await screen.findByLabelText('RPH Persediaan')).toHaveValue('');
  expect(screen.getByRole('option', { name: 'RPH A' })).toHaveValue('7');
  expect(screen.queryByText('Inventory rows')).not.toBeInTheDocument();
  expect(HttpClient.get).toHaveBeenCalledWith('/api/auth/me', { cache: false });
  expect(JSON.parse(localStorage.getItem('user'))).toEqual({ pid: 'login-pid', roles_id: 3, id_office: 99, inventory_scope: 'all_rph' });
});

test('validated persisted selection mounts inventory', async () => {
  configureInventoryScope(user, offices);
  selectInventoryOffice(7);
  render(<InventoryScopeGate><p>Inventory rows</p></InventoryScopeGate>);
  expect(await screen.findByText('Inventory rows')).toBeInTheDocument();
  expect(screen.getByLabelText('RPH Persediaan')).toHaveValue('7');
});

test('switch confirms unsaved data loss and navigates to list without stale detail IDs', async () => {
  const choices = [...offices, { id: 8, name: 'RPH B' }];
  configureInventoryScope(user, choices);
  selectInventoryOffice(7);
  mockPath = '/rph/stok-sapi/edit/old-office-pid';
  HttpClient.get.mockImplementation(async path => ({ data: path === '/api/auth/me' ? user : choices }));
  const originalLocation = window.location;
  delete window.location;
  window.location = { ...originalLocation, assign: jest.fn() };
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
  try {
    render(<InventoryScopeGate><p>Inventory rows</p></InventoryScopeGate>);
    const selector = await screen.findByLabelText('RPH Persediaan');
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
