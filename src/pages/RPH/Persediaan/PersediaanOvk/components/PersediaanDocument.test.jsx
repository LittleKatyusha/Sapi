import React, { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import service from '../../../../../services/persediaanOvkService';
import usePersediaanDocument from '../hooks/usePersediaanDocument';
import PersediaanPakanActionButton from './PersediaanPakanActionButton';
import DateColumnPicker from './DateColumnPicker';
import PersediaanOvkTable from './PersediaanOvkTable';

jest.mock('../../../../../services/persediaanOvkService', () => ({ __esModule: true, default: { downloadDocument: jest.fn() } }));
jest.mock('../hooks/usePersediaanOvk', () => ({ __esModule: true, default: () => ({
  persediaanData: [1, 2].map(id => ({ id, id_produk: id, id_satuan: 1, harga: 100, nominal: 500, jumlah: 5, nama_produk: 'Sama', satuan: 'botol' })), loading: false, error: null, refresh: jest.fn(),
}) }));
jest.mock('react-data-table-component', () => ({ __esModule: true, default: ({ columns, data }) => <div>{data.map((row, index) => <div key={row.id}>{columns[1].cell(row, index)}</div>)}</div> }));

function Fixture() {
  const [openMenuId, setOpenMenuId] = useState(null);
  const { download, downloading, downloadError } = usePersediaanDocument();
  return <>{['one', 'two'].map(pid => <PersediaanPakanActionButton key={pid} row={{ pid, name: 'Sama' }} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId}
    downloading={downloading} onDownload={row => download('recipe', row.pid, { pid: row.pid }, '../Sama')} />)}
    {downloadError && <p role="alert">{downloadError}</p>}</>;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 30, bottom: 50, width: 20, height: 20 });
});
afterEach(() => jest.restoreAllMocks());

test('same names keep distinct loading IDs, duplicate guard, Escape and errors', async () => {
  let reject;
  service.downloadDocument.mockImplementation(() => new Promise((resolve, fail) => { reject = fail; }));
  render(<Fixture />);
  const buttons = screen.getAllByRole('button', { name: 'Menu Aksi' });
  fireEvent.click(buttons[0]);
  await waitFor(() => expect(screen.getByText('Formula Resep Pakan PDF').closest('button')).toHaveFocus());
  fireEvent.click(screen.getByText('Formula Resep Pakan PDF'));
  expect(buttons[0]).toHaveAttribute('aria-busy', 'true');
  expect(buttons[1]).toHaveAttribute('aria-busy', 'false');
  fireEvent.click(buttons[1]);
  fireEvent.click(screen.getByText('Formula Resep Pakan PDF'));
  expect(service.downloadDocument).toHaveBeenCalledTimes(1);
  expect(service.downloadDocument).toHaveBeenCalledWith('recipe', { pid: 'one' });
  fireEvent.click(buttons[1]);
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(buttons[1]).toHaveFocus();
  await act(async () => reject(new Error('Akses ditolak')));
  expect(screen.getByRole('alert')).toHaveTextContent('Akses ditolak');
  expect(buttons[0]).toHaveAttribute('aria-busy', 'false');
});

test('successful download sanitizes filename and cleans URL', async () => {
  URL.createObjectURL = jest.fn(() => 'blob:fixture');
  URL.revokeObjectURL = jest.fn();
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    expect(this.download).toBe('recipe____Sama.pdf');
  });
  service.downloadDocument.mockResolvedValue(new Blob(['%PDF-1.7']));
  render(<Fixture />);
  fireEvent.click(screen.getAllByRole('button', { name: 'Menu Aksi' })[1]);
  fireEvent.click(screen.getByText('Formula Resep Pakan PDF'));
  await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
  expect(document.querySelector('a[download]')).toBeNull();
  await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture'), { timeout: 2000 });
});

test('date filter keeps exact selected calendar dates', () => {
  const onDateRangeChange = jest.fn();
  render(<DateColumnPicker availableDates={['2026-09-13', '2026-09-14', '2026-09-15']} selectedDates={['2026-09-13', '2026-09-14', '2026-09-15']} onDateRangeChange={onDateRangeChange} />);
  fireEvent.change(screen.getByLabelText('Dari Tanggal'), { target: { value: '2026-09-14' } });
  expect(onDateRangeChange).toHaveBeenCalledWith(['2026-09-14', '2026-09-15']);
});

test('stock rows with duplicate product names use distinct composite loading identities', async () => {
  let reject;
  service.downloadDocument.mockImplementation(() => new Promise((resolve, fail) => { reject = fail; }));
  render(<PersediaanOvkTable />);
  const buttons = screen.getAllByRole('button', { name: 'Menu aksi' });
  fireEvent.click(buttons[0]);
  fireEvent.click(screen.getAllByText('Ringkasan Stok OVK PDF')[0]);
  expect(buttons[0]).toHaveAttribute('aria-busy', 'true');
  expect(buttons[1]).toHaveAttribute('aria-busy', 'false');
  expect(service.downloadDocument).toHaveBeenCalledWith('stock', { id_produk: 1, id_satuan: 1, harga: 100 });
  await act(async () => reject(new Error('Stok tidak ditemukan')));
  expect(screen.getByRole('alert')).toHaveTextContent('Stok tidak ditemukan');
});
