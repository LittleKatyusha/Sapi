import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PenjualanDokaUtuhPage from './PenjualanDokaUtuhPage';
import service from '../../../services/penjualanDokaUtuhService';

const mockRows = ['confirmed', 'confirmed', 'draft', 'cancelled', 'returned'].map((status, index) => ({ pid: `pid-${index}`, no_transaksi: `SALE/${index}`, status_transaksi: status }));
const mockFetch = jest.fn(async () => ({ success: true, data: mockRows }));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../../../hooks/usePenjualanDokaUtuh', () => () => ({ fetchData: mockFetch }));
jest.mock('../../../services/penjualanDokaUtuhService', () => ({ printInvoice: jest.fn(), printSuratJalan: jest.fn() }));
jest.mock('../../../components/shared/SearchableSelect', () => () => null);
jest.mock('../../../components/shared/modals/DeleteConfirmationModal', () => () => null);
jest.mock('../../../components/shared/Notification', () => ({ isVisible, message }) => isVisible ? <div role="status">{message}</div> : null);
jest.mock('react-data-table-component', () => ({ data, columns }) => <div>{data.map(row => <div key={row.pid}>{columns[1].cell(row)}</div>)}</div>);

let click;
beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({ success: true, data: mockRows });
  window.URL.createObjectURL = jest.fn(() => 'blob:fixture');
  window.URL.revokeObjectURL = jest.fn();
  click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  Blob.prototype.text = function () {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(this);
    });
  };
});
afterEach(() => click.mockRestore());
async function open(index = 0) {
  fireEvent.click(await screen.findByRole('button', { name: `Menu SALE/${index}` }));
}

test('confirmed menus have two documents; other states none; Escape restores focus', async () => {
  render(<PenjualanDokaUtuhPage />);
  for (const index of [0, 1, 2, 3, 4]) {
    await open(index);
    expect(screen.queryAllByRole('button', { name: 'Faktur Penjualan (Invoice)' })).toHaveLength(index < 2 ? 1 : 0);
    expect(screen.queryAllByRole('button', { name: 'Surat Jalan PDF' })).toHaveLength(index < 2 ? 1 : 0);
    expect(screen.queryByRole('button', { name: /^(Faktur|Invoice)$/ })).toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: `Menu SALE/${index}` }));
  }
});

test('locks only matching type and PID, preserves identical labels on second row, shows errors', async () => {
  const pending = [];
  service.printInvoice.mockImplementation(() => new Promise(resolve => pending.push(resolve)));
  render(<PenjualanDokaUtuhPage />);
  await open();
  fireEvent.click(screen.getByRole('button', { name: 'Faktur Penjualan (Invoice)' }));
  const button = screen.getByRole('button', { name: 'Memproses invoice...' });
  expect(button.disabled).toBe(true);
  fireEvent.click(button);
  expect(service.printInvoice).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Surat Jalan PDF' }).disabled).toBe(false);
  await open(1);
  fireEvent.click(screen.getByRole('button', { name: 'Faktur Penjualan (Invoice)' }));
  expect(service.printInvoice.mock.calls).toEqual([['pid-0'], ['pid-1']]);
  await act(async () => pending.forEach(resolve => resolve({ success: false, message: 'Rekonsiliasi data penjualan' })));
  expect(screen.getByRole('status').textContent).toBe('Rekonsiliasi data penjualan');
  expect(window.URL.createObjectURL).not.toHaveBeenCalled();
});

test.each([
  new Blob(['%PDF-fixture'], { type: 'text/html' }),
  new Blob(['invalid'], { type: 'application/pdf' }),
  {},
])('rejects invalid PDF response %#', async data => {
  service.printInvoice.mockResolvedValue({ success: true, data });
  render(<PenjualanDokaUtuhPage />);
  await open();
  fireEvent.click(screen.getByRole('button', { name: 'Faktur Penjualan (Invoice)' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/bukan PDF/));
  expect(window.URL.createObjectURL).not.toHaveBeenCalled();
});

test.each(['invoice', 'surat-jalan'])('downloads %s with safe filename and URL cleanup', async type => {
  service[type === 'invoice' ? 'printInvoice' : 'printSuratJalan'].mockResolvedValue({ success: true, data: new Blob(['%PDF-fixture'], { type: 'application/pdf' }) });
  render(<PenjualanDokaUtuhPage />);
  await open();
  fireEvent.click(screen.getByRole('button', { name: type === 'invoice' ? 'Faktur Penjualan (Invoice)' : 'Surat Jalan PDF' }));
  await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
  expect(click.mock.instances[0].download).toBe(`${type === 'invoice' ? 'Invoice' : 'Surat_Jalan'}_SALE_0.pdf`);
  expect(document.querySelector('a[download]')).toBeNull();
  await waitFor(() => expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture'), { timeout: 2000 });
});

test('network rejection restores document action', async () => {
  service.printInvoice.mockRejectedValue(new Error('Jaringan terputus'));
  render(<PenjualanDokaUtuhPage />);
  await open();
  fireEvent.click(screen.getByRole('button', { name: 'Faktur Penjualan (Invoice)' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Jaringan terputus'));
  expect(screen.getByRole('button', { name: 'Faktur Penjualan (Invoice)' }).disabled).toBe(false);
});
