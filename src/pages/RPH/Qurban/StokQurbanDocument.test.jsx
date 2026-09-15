import React, { useRef, useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StokSapiQurbanPage, { ActionMenuCell } from './StokSapiQurbanPage';
import HttpClient from '../../../services/httpClient';
import useStokSapiDocument from '../StokSapi/useStokSapiDocument';
import service from '../../../services/stokQurbanDocumentService';
jest.mock('../../../services/stokQurbanDocumentService', () => ({ __esModule: true, default: { downloadDocument: jest.fn() } }));
jest.mock('../../../services/httpClient', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../StokSapi/modals/BulkAssignKandangModal', () => () => null);
jest.mock('../StokSapi/modals/BeriPakanKonsentratModal', () => () => null);
jest.mock('../StokSapi/modals/HistoryPakanKonsentratModal', () => () => null);
jest.mock('./modals/BeriOvkQurbanModal', () => () => null);
function Fixture({ type = 'card' }) {
  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuButtonRefs = useRef({});
  const { download, downloading, downloadError } = useStokSapiDocument(service);
  return <>{['one', 'two'].map(pid => <ActionMenuCell key={pid} row={{ pid, eartag: '../Sama', status: 0 }} documentType={type}
    {...{ menuOpen, setMenuOpen, menuPos, setMenuPos, menuButtonRefs, download, downloading }} />)}
    {downloadError && <div role="alert">{downloadError}</div>}</>;
}
beforeEach(() => jest.clearAllMocks());
test('identical labels distinct IDs, isolated loading, duplicate guard, portal, Escape focus and errors', async () => {
  let reject;
  service.downloadDocument.mockImplementation(() => new Promise((resolve, fail) => { reject = fail; }));
  render(<Fixture />);
  const buttons = screen.getAllByRole('button', { name: 'Menu Aksi' });
  fireEvent.click(buttons[0]);
  expect(screen.getByRole('menu').parentElement).toBe(document.body);
  expect(screen.getByRole('menuitem')).toHaveFocus();
  fireEvent.click(screen.getByRole('menuitem'));
  expect(buttons[0]).toHaveAttribute('aria-busy', 'true');
  expect(buttons[1]).toHaveAttribute('aria-busy', 'false');
  fireEvent.click(buttons[1]);
  fireEvent.click(screen.getByRole('menuitem'));
  expect(service.downloadDocument).toHaveBeenCalledTimes(1);
  expect(service.downloadDocument).toHaveBeenCalledWith('card', { pid: 'one' });
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
  expect(buttons[1]).toHaveFocus();
  await act(async () => reject(new Error('Akses ditolak')));
  expect(screen.getByRole('alert')).toHaveTextContent('Akses ditolak');
  fireEvent.click(buttons[1]);
  fireEvent.click(screen.getByRole('menuitem'));
  expect(service.downloadDocument).toHaveBeenLastCalledWith('card', { pid: 'two' });
  await act(async () => reject(new Error('Gagal')));
});
test.each(['potong-paksa', 'sapi-mati'])('%s uses event PID, safe filename and URL cleanup', async type => {
  URL.createObjectURL = jest.fn(() => 'blob:fixture');
  URL.revokeObjectURL = jest.fn();
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { expect(this.download).toBe(`${type}____Sama.pdf`); });
  service.downloadDocument.mockResolvedValue(new Blob(['%PDF-1.7']));
  render(<Fixture type={type} />);
  fireEvent.click(screen.getAllByRole('button', { name: 'Menu Aksi' })[1]);
  fireEvent.click(screen.getByRole('menuitem'));
  await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
  expect(service.downloadDocument).toHaveBeenCalledWith(type, { pid: 'two' });
  expect(document.querySelector('a[download]')).toBeNull();
  await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture'), { timeout: 2000 });
  click.mockRestore();
});
test('page recap uses applied filters only, absent on event tabs', async () => {
  HttpClient.get.mockResolvedValue({ data: [], recordsFiltered: 0 });
  service.downloadDocument.mockRejectedValue(new Error('Gagal PDF'));
  render(<StokSapiQurbanPage />);
  const inputs = screen.getAllByRole('textbox');
  fireEvent.change(inputs[0], { target: { value: 'Sama' } });
  fireEvent.keyDown(inputs[0], { key: 'Enter' });
  fireEvent.change(inputs[0], { target: { value: 'Draft' } });
  fireEvent.click(screen.getByText('Rekap Stok PDF'));
  await waitFor(() => expect(service.downloadDocument).toHaveBeenCalledWith('recap', {
    eartag: 'Sama', eartag_supplier: '', nota_qurban: '', status: '',
  }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Gagal PDF');
  fireEvent.click(screen.getByRole('button', { name: /Potong Paksa/ }));
  expect(screen.queryByText('Rekap Stok PDF')).not.toBeInTheDocument();
  await waitFor(() => expect(HttpClient.get).toHaveBeenCalledWith('/api/rph/qurban/potong-paksa/data', expect.any(Object)));
});
