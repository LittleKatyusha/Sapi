import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Page from './PembelianOvkPage';
import service from '../../../services/pembelianOvkService';

const mockError = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../../../hooks/useDocumentTitle', () => () => {});
jest.mock('../../../components/shared/Notification', () => ({ useNotification: () => ({ showError: mockError, showSuccess: jest.fn() }) }));
jest.mock('../../../services/pembelianOvkService', () => ({ __esModule: true, default: {
  getData: jest.fn(), getStok: jest.fn(), getCardData: jest.fn(), downloadDocument: jest.fn(),
} }));
jest.mock('react-data-table-component', () => ({ columns, data }) => <div>{data.map(row => <div key={row.pid}>{columns.map((column, i) => <div key={i}>{column.cell?.(row)}</div>)}</div>)}</div>);

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem('user', JSON.stringify({ id_office: 17 }));
  service.getData.mockResolvedValue({ success: true, data: { data: [
    { pid: 'purchase-first', payment_pid: 'payment-only', nomor_faktur: '../OVK/TEST', is_cancel: 0, status_pembayaran: 'belum_lunas' },
    { pid: 'purchase-second', nomor_faktur: 'OVK/2', is_cancel: 1 },
  ] } });
  service.getStok.mockResolvedValue({ success: true, data: { data: [
    { pid: 'stock-first', nama_item: 'Vitamin/SAME' }, { pid: 'stock-second', nama_item: 'Vitamin/SAME' },
  ] } });
  service.getCardData.mockResolvedValue({ success: true, data: {} });
  URL.createObjectURL = jest.fn(() => 'blob:fixture');
  URL.revokeObjectURL = jest.fn();
});

test('purchase menu retains actions, restores Escape focus, uses purchase PID even when cancelled', async () => {
  service.downloadDocument.mockResolvedValue(new Blob(['%PDF-']));
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    expect(this.download).toBe('Rincian_Pembelian_OVK____OVK_TEST.pdf');
  });
  render(<Page />);
  const trigger = await screen.findByRole('button', { name: 'Aksi pembelian ../OVK/TEST' });
  fireEvent.click(trigger);
  for (const name of ['Detail', 'Bayar', 'Riwayat Bayar', 'Batalkan']) expect(screen.getByRole('button', { name })).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Detail' }));
  fireEvent.click(screen.getByRole('button', { name: 'Rincian Pembelian OVK PDF' }));
  await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
  expect(service.downloadDocument).toHaveBeenCalledWith('purchase-first', 'purchase');
  expect(document.querySelector('a[download]')).toBeNull();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(document.activeElement).toBe(trigger);
  expect(screen.queryByRole('group')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Aksi pembelian OVK/2' }));
  expect(screen.getByRole('button', { name: 'Rincian Pembelian OVK PDF' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Bayar' })).toBeNull();
  await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture'), { timeout: 2000 });
  click.mockRestore();
});

test('same-product batches have PID-specific busy state, duplicate lock, success and error reset', async () => {
  let finish, fail;
  service.downloadDocument.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }))
    .mockReturnValueOnce(new Promise((resolve, reject) => { fail = reject; }));
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  render(<Page />);
  fireEvent.click(screen.getByRole('button', { name: 'Stok OVK' }));
  const [first, second] = await screen.findAllByRole('button', { name: 'Unduh rincian batch stok Vitamin/SAME PDF' });
  const normalClass = second.className;
  fireEvent.click(first);
  expect(first.disabled).toBe(true);
  expect(first.getAttribute('aria-busy')).toBe('true');
  expect(first.textContent).toBe('Mengunduh PDF...');
  expect(second.disabled).toBe(false);
  expect(second.getAttribute('aria-busy')).toBe('false');
  expect(second.textContent).toBe('Rincian Batch Stok PDF');
  expect(second.className).toBe(normalClass);
  fireEvent.click(first);
  fireEvent.click(second);
  expect(service.downloadDocument).toHaveBeenCalledTimes(1);
  expect(service.downloadDocument).toHaveBeenLastCalledWith('stock-first', 'stock');
  await act(async () => finish(new Blob(['%PDF-'])));
  expect(first.disabled).toBe(false);
  expect(first.getAttribute('aria-busy')).toBe('false');
  fireEvent.click(second);
  expect(service.downloadDocument).toHaveBeenLastCalledWith('stock-second', 'stock');
  expect(second.getAttribute('aria-busy')).toBe('true');
  expect(first.getAttribute('aria-busy')).toBe('false');
  await act(async () => fail(new Error('Akses ditolak')));
  expect(mockError).toHaveBeenCalledWith('Akses ditolak');
  expect(second.disabled).toBe(false);
  expect(second.getAttribute('aria-busy')).toBe('false');
  expect(screen.getByRole('status').textContent).toBe('');
  expect(click).toHaveBeenCalledTimes(1);
  expect(document.querySelector('a[download]')).toBeNull();
  await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture'), { timeout: 2000 });
  click.mockRestore();
});
