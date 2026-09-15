import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PenjualanSapiUtuhPage from './PenjualanSapiUtuhPage';
import service from '../../../services/penjualanSapiUtuhService';

const mockRows = ['confirmed', 'confirmed', 'draft', 'cancelled', 'returned'].map((status, index) => ({ pid: `pid-${index}`, no_transaksi: `SALE/${index}`, status_transaksi: status }));
const mockFetch = jest.fn(async () => ({ success: true, data: mockRows }));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../../../hooks/usePenjualanSapiUtuh', () => () => ({ fetchData: mockFetch }));
jest.mock('../../../services/penjualanSapiUtuhService', () => ({ printInvoice: jest.fn(), printSuratJalan: jest.fn() }));
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

test('only confirmed rows expose exactly two document actions; Escape restores focus', async () => {
  render(<PenjualanSapiUtuhPage />);
  await open();
  expect(screen.getAllByRole('button', { name: 'Faktur Penjualan (Invoice)' })).toHaveLength(1);
  expect(screen.getAllByRole('button', { name: 'Surat Jalan PDF' })).toHaveLength(1);
  expect(screen.queryByRole('button', { name: /^(Faktur|Invoice)$/ })).toBeNull();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Menu SALE/0' }));
  for (const index of [2, 3, 4]) {
    await open(index);
    expect(screen.queryByRole('button', { name: 'Faktur Penjualan (Invoice)' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Surat Jalan PDF' })).toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
  }
});

test('duplicate requests locked by document and pid; second row remains available', async () => {
  let resolve;
  service.printInvoice.mockReturnValue(new Promise(done => { resolve = done; }));
  render(<PenjualanSapiUtuhPage />);
  await open();
  fireEvent.click(screen.getByRole('button', { name: 'Faktur Penjualan (Invoice)' }));
  const pending = screen.getByRole('button', { name: 'Memproses invoice...' });
  expect(pending.disabled).toBe(true);
  fireEvent.click(pending);
  expect(service.printInvoice).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Surat Jalan PDF' }).disabled).toBe(false);
  await open(1);
  expect(screen.getByRole('button', { name: 'Faktur Penjualan (Invoice)' }).disabled).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Faktur Penjualan (Invoice)' }));
  expect(service.printInvoice).toHaveBeenCalledWith('pid-1');
  await act(async () => resolve({ success: false, message: 'Rekonsiliasi data penjualan' }));
  expect(screen.getByRole('status').textContent).toBe('Rekonsiliasi data penjualan');
  expect(window.URL.createObjectURL).not.toHaveBeenCalled();
});

test.each([
  { success: true, data: new Blob(['%PDF-fixture'], { type: 'text/html' }) },
  { success: true, data: new Blob(['not pdf'], { type: 'application/pdf' }) },
  { success: true, data: {} },
])('rejects invalid binary response %#', async result => {
  service.printInvoice.mockResolvedValue(result);
  render(<PenjualanSapiUtuhPage />);
  await open();
  fireEvent.click(screen.getByRole('button', { name: 'Faktur Penjualan (Invoice)' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/bukan PDF/));
  expect(window.URL.createObjectURL).not.toHaveBeenCalled();
});

test('downloads valid PDF with safe filename and releases URL', async () => {
  service.printSuratJalan.mockResolvedValue({ success: true, data: new Blob(['%PDF-fixture'], { type: 'application/pdf' }) });
  render(<PenjualanSapiUtuhPage />);
  await open();
  fireEvent.click(screen.getByRole('button', { name: 'Surat Jalan PDF' }));
  await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
  expect(click.mock.instances[0].download).toBe('Surat_Jalan_SALE_0.pdf');
  expect(document.querySelector('a[download]')).toBeNull();
  await waitFor(() => expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture'), { timeout: 2000 });
});

test('network rejection restores action and displays error', async () => {
  service.printInvoice.mockRejectedValue(new Error('Jaringan terputus'));
  render(<PenjualanSapiUtuhPage />);
  await open();
  fireEvent.click(screen.getByRole('button', { name: 'Faktur Penjualan (Invoice)' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Jaringan terputus'));
  expect(screen.getByRole('button', { name: 'Faktur Penjualan (Invoice)' }).disabled).toBe(false);
});
