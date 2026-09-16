import React, { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import service from '../../../../services/stokSapiService';
import ActionButton from './ActionButton';
import useStokSapiDocument from '../useStokSapiDocument';
import PotongPaksaTab from './PotongPaksaTab';
import SapiMatiTab from './SapiMatiTab';
import StokRingkasTab from './StokRingkasTab';

jest.mock('../../../../services/stokSapiService', () => ({ __esModule: true, default: {
  downloadDocument: jest.fn(), getPotongPaksaData: jest.fn(), getSapiMatiData: jest.fn(), getStokByJenis: jest.fn(), downloadBuktiSapiMati: jest.fn(),
} }));
jest.mock('../modals/PotongPaksaModal', () => () => null);
jest.mock('../modals/SapiMatiModal', () => () => null);

function Fixture() {
  const [openMenuId, setOpenMenuId] = useState(null);
  const { download, downloading, downloadError } = useStokSapiDocument();
  return <>{['one', 'two'].map(pid => <ActionButton key={pid} row={{ id: pid, pid, eartag: 'Sama' }}
    openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} downloadLabel="Kartu Ternak PDF"
    downloading={downloading === `card:${pid}`} onDownload={() => download('card', pid, { pid }, '../Sama')} />)}
    {downloadError && <p role="alert">{downloadError}</p>}</>;
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 30, right: 50, top: 20, bottom: 50 });
});
afterEach(() => jest.restoreAllMocks());

test('same labels retain row identity, isolated loading, guard, Escape focus and failure', async () => {
  let reject;
  service.downloadDocument.mockImplementation(() => new Promise((resolve, fail) => { reject = fail; }));
  render(<Fixture />);
  const buttons = screen.getAllByRole('button', { name: 'Menu Aksi' });
  fireEvent.click(buttons[0]);
  await waitFor(() => expect(screen.getByRole('menuitem')).toHaveFocus());
  expect(screen.getByRole('menu').parentElement).toBe(document.body);
  fireEvent.click(screen.getByText('Kartu Ternak PDF'));
  expect(buttons[0]).toHaveAttribute('aria-busy', 'true');
  expect(buttons[1]).toHaveAttribute('aria-busy', 'false');
  fireEvent.click(buttons[1]);
  fireEvent.click(screen.getByText('Kartu Ternak PDF'));
  expect(service.downloadDocument).toHaveBeenCalledTimes(1);
  expect(service.downloadDocument).toHaveBeenCalledWith('card', { pid: 'one' });
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(buttons[1]).toHaveFocus();
  await act(async () => reject(new Error('Akses ditolak')));
  expect(screen.getByRole('alert')).toHaveTextContent('Akses ditolak');
  expect(buttons[0]).toHaveAttribute('aria-busy', 'false');
});

test('download sanitizes filename and removes anchor and URL', async () => {
  URL.createObjectURL = jest.fn(() => 'blob:fixture');
  URL.revokeObjectURL = jest.fn();
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { expect(this.download).toBe('card____Sama.pdf'); });
  service.downloadDocument.mockResolvedValue(new Blob(['%PDF-1.7']));
  render(<Fixture />);
  fireEvent.click(screen.getAllByRole('button', { name: 'Menu Aksi' })[1]);
  fireEvent.click(screen.getByText('Kartu Ternak PDF'));
  await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
  expect(service.downloadDocument).toHaveBeenCalledWith('card', { pid: 'two' });
  expect(document.querySelector('a[download]')).toBeNull();
  await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture'), { timeout: 2000 });
});

test.each([[PotongPaksaTab, 'getPotongPaksaData', 'potongpaksa', 'Laporan Potong Paksa PDF'], [SapiMatiTab, 'getSapiMatiData', 'sapimati', 'Laporan Sapi Mati PDF']])('event tab uses event PID, preserves operations %#', async (Tab, method, type, label) => {
  service[method].mockResolvedValue({ success: true, data: ['one', 'two'].map(pid => ({ pid, pubid: pid, sapi: 'Sama', file: 'original.pdf', can_delete: true })) });
  service.downloadDocument.mockRejectedValue(new Error('Gagal PDF'));
  render(<Tab />);
  const buttons = await screen.findAllByRole('button', { name: 'Menu Aksi' });
  fireEvent.click(buttons[1]);
  expect(screen.getByText('Edit')).toBeInTheDocument();
  expect(screen.getByText('Hapus')).toBeInTheDocument();
  fireEvent.click(screen.getByText(label));
  await waitFor(() => expect(service.downloadDocument).toHaveBeenCalledWith(type, { pid: 'two' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Gagal PDF');
  if (type === 'sapimati') expect(screen.getAllByRole('button', { name: 'Unduh bukti kematian Sama' })).toHaveLength(2);
});

test('sapi death history sends the sapi animal filter', async () => {
  service.getSapiMatiData.mockResolvedValue({ success: true, data: [] });
  render(<SapiMatiTab animalGroup="sapi" />);
  await waitFor(() => expect(service.getSapiMatiData).toHaveBeenCalledWith(expect.objectContaining({ animal_group: 'sapi' })));
});

test('Ringkas sends applied filters, never browser rows or pagination', async () => {
  service.getStokByJenis.mockResolvedValue({ success: true, data: { dates: [], rows: [{ action: 'class-one', jenis_sapi: 'Sama' }] } });
  service.downloadDocument.mockRejectedValue(new Error('Gagal PDF'));
  const { container } = render(<StokRingkasTab />);
  const dates = container.querySelectorAll('input[type=date]');
  fireEvent.change(dates[0], { target: { value: '2026-09-10' } });
  fireEvent.change(dates[1], { target: { value: '2026-09-15' } });
  fireEvent.click(screen.getByText('Cari'));
  const button = await screen.findByText('Rekap Stok PDF (Semua Klasifikasi)');
  fireEvent.change(dates[0], { target: { value: '2026-09-11' } });
  fireEvent.click(button);
  await waitFor(() => expect(service.downloadDocument).toHaveBeenCalledWith('recap', { start_date: '2026-09-10', end_date: '2026-09-15' }));
});
