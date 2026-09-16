import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import service from '../../../../services/stokDokaService';
import StokDokaPage from './StokDokaPage';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn(), useLocation: () => ({ pathname: '/rph/stok-doka' }) }), { virtual: true });
jest.mock('../../StokSapi/modals/BeriPakanKonsentratModal', () => () => null);
jest.mock('../../StokSapi/modals/BulkAssignKandangModal', () => () => null);
jest.mock('../../StokSapi/modals/HistoryPakanKonsentratModal', () => () => null);
jest.mock('../../StokSapi/modals/SapiMatiModal', () => ({ isOpen, cowData, animalLabel }) => isOpen ? <div data-testid="death-modal">{animalLabel}:{cowData.pid}</div> : null);
jest.mock('../../StokSapi/components/SapiMatiTab', () => (props) => <div data-testid="death-history">{props.animalGroup}:{props.animalLabel}</div>);
jest.mock('../../../../services/stokDokaService', () => ({ __esModule: true, default: { getData: jest.fn(), downloadDocument: jest.fn() } }));
beforeEach(() => {
  jest.clearAllMocks();
  service.getData.mockResolvedValue({ success: true, data: { recordsTotal: 12, recordsFiltered: 12,
    rows: ['one', 'two'].map(pid => ({ pid, eartag: '../Sama', jenis_hewan: 'KAMBING' })) } });
});

test('two identical labels use distinct PIDs, isolated loading, portal, guard and Escape focus', async () => {
  let reject;
  service.downloadDocument.mockImplementation(() => new Promise((resolve, fail) => { reject = fail; }));
  render(<StokDokaPage />);
  const buttons = await screen.findAllByRole('button', { name: 'Menu Aksi' });
  fireEvent.click(buttons[0]);
  await waitFor(() => expect(screen.getByText('Kartu Ternak Doka PDF').closest('button')).toHaveFocus());
  expect(screen.getByRole('menu').parentElement).toBe(document.body);
  expect(screen.getByText('Pemberian OVK')).toBeInTheDocument();
  expect(screen.getByText('Lihat Detail')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Kartu Ternak Doka PDF'));
  expect(buttons[0]).toHaveAttribute('aria-busy', 'true');
  expect(buttons[1]).toHaveAttribute('aria-busy', 'false');
  fireEvent.click(buttons[1]);
  fireEvent.click(screen.getByText('Kartu Ternak Doka PDF'));
  expect(service.downloadDocument).toHaveBeenCalledTimes(1);
  expect(service.downloadDocument).toHaveBeenCalledWith('card', { pid: 'one' });
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
  expect(buttons[1]).toHaveFocus();
  await act(async () => reject(new Error('Akses ditolak')));
  expect(screen.getByRole('alert')).toHaveTextContent('Akses ditolak');
  expect(buttons[0]).toHaveAttribute('aria-busy', 'false');
});

test('second row download sanitizes filename, cleans Blob URL and anchor', async () => {
  URL.createObjectURL = jest.fn(() => 'blob:fixture');
  URL.revokeObjectURL = jest.fn();
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    expect(this.download).toBe('card_Doka____Sama.pdf');
  });
  service.downloadDocument.mockResolvedValue(new Blob(['%PDF-1.7']));
  render(<StokDokaPage />);
  fireEvent.click((await screen.findAllByRole('button', { name: 'Menu Aksi' }))[1]);
  fireEvent.click(screen.getByText('Kartu Ternak Doka PDF'));
  await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
  expect(service.downloadDocument).toHaveBeenCalledWith('card', { pid: 'two' });
  expect(document.querySelector('a[download]')).toBeNull();
  await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture'), { timeout: 2000 });
  click.mockRestore();
});

test('recap sends applied filters, not draft filters or pagination', async () => {
  service.downloadDocument.mockRejectedValue(new Error('Gagal PDF'));
  const { container } = render(<StokDokaPage />);
  await screen.findAllByRole('button', { name: 'Menu Aksi' });
  const dates = container.querySelectorAll('input[type=date]');
  fireEvent.change(dates[0], { target: { value: '2026-09-01' } });
  fireEvent.change(dates[1], { target: { value: '2026-09-15' } });
  fireEvent.change(screen.getByRole('textbox'), { target: { value: ' Kambing ' } });
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  fireEvent.change(dates[0], { target: { value: '2026-09-02' } });
  fireEvent.click(screen.getByText('Rekap Stok Doka PDF'));
  await waitFor(() => expect(service.downloadDocument).toHaveBeenCalledWith('recap', {
    start_date: '2026-09-01', end_date: '2026-09-15', search: 'Kambing',
  }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Gagal PDF');
});

test('DOKA death action opens death module with selected PID', async () => {
  render(<StokDokaPage />);
  fireEvent.click((await screen.findAllByRole('button', { name: 'Menu Aksi' }))[1]);
  fireEvent.click(screen.getByText('DOKA Mati'));
  expect(screen.getByTestId('death-modal')).toHaveTextContent('DOKA:two');
});

test('Riwayat DOKA Mati tab uses the shared history with DOKA filter', async () => {
  render(<StokDokaPage />);
  fireEvent.click(screen.getByRole('tab', { name: 'Riwayat DOKA Mati' }));
  expect(screen.getByTestId('death-history')).toHaveTextContent('doka:DOKA');
  expect(screen.getByRole('tab', { name: 'Riwayat DOKA Mati' })).toHaveAttribute('aria-selected', 'true');
});
