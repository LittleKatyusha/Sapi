import React from 'react';
import { act, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PenawaranPage from './PenawaranPage';
import DetailPenawaranPage from './DetailPenawaranPage';
import service from '../../../services/penawaranPenjualanRphService';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate, useLocation: () => ({}), useParams: () => ({ pid: 'pid-one' }) }), { virtual: true });
jest.mock('../../../components/shared/SearchableSelect', () => () => null);
jest.mock('../../../services/penawaranPenjualanRphService', () => ({ __esModule: true, default: { downloadDocument: jest.fn() } }));
const mockRows = [{ pid: 'pid-one', nomor_spp: '../SPP/SAME', status: 'draft' }, { pid: 'pid-two', nomor_spp: '../SPP/SAME', status: 'diajukan' }];
const mockFetch = jest.fn(async () => ({ success: true, data: mockRows, recordsTotal: 2 }));
const mockApprovers = jest.fn(async () => ({ success: true, data: [] }));
const mockDetail = jest.fn(async () => ({ success: true, data: { ...mockRows[0], detail: [] } }));
jest.mock('../../../hooks/usePenawaranPenjualan', () => () => ({ fetchData: mockFetch, fetchApprovers: mockApprovers, fetchDetail: mockDetail }));

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({ success: true, data: mockRows, recordsTotal: 2 });
  mockApprovers.mockResolvedValue({ success: true, data: [] });
  URL.createObjectURL = jest.fn(() => 'blob:fixture');
  URL.revokeObjectURL = jest.fn();
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

test('same labels, distinct PIDs: row loading, global lock, status actions, portal keyboard and cleanup', async () => {
  let resolve;
  service.downloadDocument.mockImplementation(() => new Promise(done => { resolve = done; }));
  render(<PenawaranPage />);
  const triggers = await screen.findAllByRole('button', { name: 'Aksi ../SPP/SAME' });
  triggers[0].focus();
  fireEvent.click(triggers[0]);
  let menu = screen.getByRole('menu');
  // Portal placement requires checking the DOM parent.
  // eslint-disable-next-line testing-library/no-node-access
  expect(menu.parentElement).toBe(document.body);
  expect(within(menu).getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
  expect(within(menu).getByRole('menuitem', { name: 'Ajukan' })).toBeInTheDocument();
  expect(within(menu).getByRole('menuitem', { name: 'Hapus' })).toBeInTheDocument();
  fireEvent.click(within(menu).getByRole('menuitem', { name: 'Unduh Surat PDF' }));
  expect(service.downloadDocument).toHaveBeenCalledWith('dispensasi', { pid: 'pid-one' });
  expect(screen.getByRole('menuitem', { name: 'Mengunduh PDF...' })).toHaveAttribute('aria-busy', 'true');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(triggers[0]).toHaveFocus();
  triggers[1].focus();
  fireEvent.click(triggers[1]);
  menu = screen.getByRole('menu');
  expect(within(menu).getByRole('menuitem', { name: 'Setujui / Tolak' })).toBeInTheDocument();
  expect(within(menu).queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
  const otherDownload = within(menu).getByRole('menuitem', { name: 'Unduh Surat PDF' });
  expect(otherDownload).toBeDisabled();
  expect(otherDownload).toHaveAttribute('aria-busy', 'false');
  fireEvent.click(otherDownload);
  expect(service.downloadDocument).toHaveBeenCalledTimes(1);
  jest.useFakeTimers();
  await act(async () => resolve(new Blob(['%PDF-'])));
  expect(HTMLAnchorElement.prototype.click.mock.instances[0].download).toBe('Dispensasi____SPP_SAME.pdf');
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  act(() => jest.advanceTimersByTime(1000));
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture');
  jest.useRealTimers();
  service.downloadDocument.mockRejectedValue(new Error('Akses ditolak'));
  fireEvent.click(otherDownload);
  expect(await screen.findByRole('alert')).toHaveTextContent('Akses ditolak');
  expect(service.downloadDocument).toHaveBeenLastCalledWith('dispensasi', { pid: 'pid-two' });
  fireEvent.keyDown(menu, { key: 'End' });
  expect(otherDownload).not.toBeDisabled();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(triggers[1]).toHaveFocus();
});

test.each(['draft', 'diajukan', 'disetujui', 'ditolak'])('detail %s downloads persisted record without printing form', async status => {
  mockDetail.mockResolvedValue({ success: true, data: { ...mockRows[0], status, detail: [] } });
  service.downloadDocument.mockRejectedValue(new Error('Respons server bukan dokumen PDF yang valid'));
  render(<DetailPenawaranPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Unduh Surat PDF' }));
  await waitFor(() => expect(service.downloadDocument).toHaveBeenCalledWith('dispensasi', { pid: 'pid-one' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('bukan dokumen PDF');
});
