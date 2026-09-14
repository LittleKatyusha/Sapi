import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Page from './PembelianKonsentratPage';
import service from '../../../services/pembelianKonsentratService';

const mockError = jest.fn();
const mockSuccess = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../../../hooks/useDocumentTitle', () => () => {});
jest.mock('../../../components/shared/Notification', () => ({ useNotification: () => ({ showError: mockError, showSuccess: mockSuccess }) }));
jest.mock('../../../services/pembelianKonsentratService', () => ({ __esModule: true, default: {
  getData: jest.fn(), getStok: jest.fn(), getCardData: jest.fn(), downloadDocument: jest.fn(),
} }));
jest.mock('react-data-table-component', () => ({ columns, data }) => <div>{data.map(row => <div key={row.pid}>{columns.map((column, i) => <div key={i}>{column.cell?.(row)}</div>)}</div>)}</div>);

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem('user', JSON.stringify({ id_office: 17 }));
  service.getData.mockResolvedValue({ success: true, data: { data: [{ pid: 'purchase-pid', nomor_faktur: '../KON/TEST', is_cancel: 0, status_pembayaran: 'belum_dibayar' }] } });
  service.getStok.mockResolvedValue({ success: true, data: { data: [{ pid: 'stock-pid', resep_kode: 'RSP/TEST' }] } });
  service.getCardData.mockResolvedValue({ success: true, data: {} });
  URL.createObjectURL = jest.fn(() => 'blob:fixture');
  URL.revokeObjectURL = jest.fn();
});

test('purchase action preserves existing actions, guards duplicates, sanitizes and cleans downloads', async () => {
  let finish;
  service.downloadDocument.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    expect(this.download).toBe('Rincian_Pembelian_Konsentrat____KON_TEST.pdf');
  });
  render(<Page />);
  fireEvent.click(await screen.findByRole('button', { name: 'Aksi pembelian ../KON/TEST' }));
  expect(screen.getByRole('button', { name: 'Detail' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Bayar' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Batalkan' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Rincian Pembelian Konsentrat PDF' }));
  fireEvent.click(screen.getByRole('button', { name: 'Mengunduh PDF...' }));
  expect(service.downloadDocument).toHaveBeenCalledTimes(1);
  expect(service.downloadDocument).toHaveBeenCalledWith('purchase-pid', 'purchase');
  await act(async () => finish(new Blob(['%PDF-'])));
  expect(click).toHaveBeenCalledTimes(1);
  expect(document.querySelector('a[download]')).toBeNull();
  await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture'), { timeout: 2000 });
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('group', { name: 'Aksi pembelian konsentrat' })).toBeNull();
  click.mockRestore();
});

test('stock loading belongs only to the clicked PID, guards duplicates and resets after success or failure', async () => {
  service.getStok.mockResolvedValue({ success: true, data: { data: [
    { pid: 'stock-first', resep_kode: 'RSP/SAME' },
    { pid: 'stock-second', resep_kode: 'RSP/SAME' },
  ] } });
  let finish;
  let fail;
  service.downloadDocument
    .mockReturnValueOnce(new Promise(resolve => { finish = resolve; }))
    .mockReturnValueOnce(new Promise((resolve, reject) => { fail = reject; }));
  const pdf = new Blob(['%PDF-']);
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    expect(this.href).toBe('blob:fixture');
    expect(this.download).toBe('Rincian_Batch_Stok_Konsentrat_RSP_SAME.pdf');
  });
  try {
    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Stok Konsentrat' }));
    const [first, second] = await screen.findAllByRole('button', { name: 'Unduh rincian batch stok RSP/SAME PDF' });
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
    await act(async () => finish(pdf));
    expect(URL.createObjectURL).toHaveBeenCalledWith(pdf);
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[download]')).toBeNull();
    for (const button of [first, second]) {
      expect(button.disabled).toBe(false);
      expect(button.getAttribute('aria-busy')).toBe('false');
      expect(button.textContent).toBe('Rincian Batch Stok PDF');
    }
    fireEvent.click(second);
    expect(service.downloadDocument).toHaveBeenCalledTimes(2);
    expect(service.downloadDocument).toHaveBeenLastCalledWith('stock-second', 'stock');
    expect(second.getAttribute('aria-busy')).toBe('true');
    expect(first.getAttribute('aria-busy')).toBe('false');
    expect(first.disabled).toBe(false);
    expect(first.textContent).toBe('Rincian Batch Stok PDF');
    await act(async () => fail(new Error('Akses ditolak')));
    expect(mockError).toHaveBeenCalledWith('Akses ditolak');
    expect(second.disabled).toBe(false);
    expect(second.getAttribute('aria-busy')).toBe('false');
    expect(second.textContent).toBe('Rincian Batch Stok PDF');
    expect(screen.getByRole('status').textContent).toBe('');
    expect(click).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture'), { timeout: 2000 });
  } finally {
    click.mockRestore();
  }
});

test('stock action uses stock PID and reports server failure', async () => {
  service.downloadDocument.mockRejectedValue(new Error('Akses ditolak'));
  render(<Page />);
  fireEvent.click(screen.getByRole('button', { name: 'Stok Konsentrat' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Unduh rincian batch stok RSP/TEST PDF' }));
  await waitFor(() => expect(mockError).toHaveBeenCalledWith('Akses ditolak'));
  expect(service.downloadDocument).toHaveBeenCalledWith('stock-pid', 'stock');
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});
