import React, { useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RowActionButton as Karkas } from './Karkas/PenjualanKarkasPage';
import { RowActionButton as Kulit } from './Kulit/PenjualanKulitPage';
import useKarkasDocument from './Karkas/hooks/useKarkasDocument';
import useKulitDocument from './Kulit/useKulitDocument';
import karkas from '../../../services/penjualanKarkasService';
import kulit from '../../../services/penjualanKulitService';

jest.mock('react-router-dom', () => ({}), { virtual: true });
jest.mock('./Karkas/modals/DetailKarkasModal', () => () => null);
jest.mock('../../../services/penjualanKarkasService', () => ({ __esModule: true, default: { downloadDocument: jest.fn() } }));
jest.mock('../../../services/penjualanKulitService', () => ({ __esModule: true, default: { downloadDocument: jest.fn() } }));

function Fixture({ Component, useDocs, status }) {
  const [open, setOpen] = useState(null);
  const docs = useDocs();
  return <>{['one', 'two'].map(pid => <Component key={pid} row={{ pid, nama_pedagang: 'Same', no_kwitansi: '../SAME', status, status_transaksi: status }} isOpen={open === pid} onToggle={setOpen} onClose={() => setOpen(null)} {...docs} />)}{docs.downloadError && <p role="alert">{docs.downloadError}</p>}</>;
}

test.each([[Karkas, useKarkasDocument, karkas, 'FINAL', 'Karkas'], [Kulit, useKulitDocument, kulit, 'TERPOSTING', 'Kulit']])('%s PDF PID loading, lock, keyboard, cleanup, errors', async (Component, useDocs, service, status, name) => {
  URL.createObjectURL = jest.fn(() => 'blob:fixture');
  URL.revokeObjectURL = jest.fn();
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  let resolve;
  service.downloadDocument.mockImplementation(() => new Promise(done => { resolve = done; }));
  render(<Fixture {...{ Component, useDocs, status }} />);
  const triggers = screen.getAllByRole('button', { name: 'Menu aksi Same' });
  fireEvent.click(triggers[0]);
  let menu = screen.getByRole('menu');
  expect(within(menu).getByRole('menuitem', { name: 'Nota Penjualan PDF' })).toHaveFocus();
  for (const label of ['Detail', 'Edit', 'Hapus', 'Bayar']) expect(within(menu).getByRole('menuitem', { name: label })).toBeInTheDocument();
  fireEvent.keyDown(menu, { key: 'ArrowDown' });
  expect(within(menu).getByRole('menuitem', { name: 'Surat Jalan PDF' })).toHaveFocus();
  fireEvent.click(within(menu).getByRole('menuitem', { name: 'Nota Penjualan PDF' }));
  expect(service.downloadDocument).toHaveBeenCalledWith('nota', { pid: 'one' });
  expect(screen.getByRole('menuitem', { name: 'Mengunduh...' })).toHaveAttribute('aria-busy', 'true');
  fireEvent.keyDown(menu, { key: 'Escape' });
  expect(triggers[0]).toHaveFocus();
  fireEvent.click(triggers[1]);
  menu = screen.getByRole('menu');
  const second = within(menu).getByRole('menuitem', { name: 'Nota Penjualan PDF' });
  expect(second).toBeDisabled();
  expect(second).toHaveAttribute('aria-busy', 'false');
  fireEvent.click(second);
  expect(service.downloadDocument).toHaveBeenCalledTimes(1);
  jest.useFakeTimers();
  await act(async () => resolve(new Blob(['%PDF-'])));
  expect(click.mock.instances[0].download).toBe(`Nota_${name}____SAME.pdf`);
  act(() => jest.advanceTimersByTime(1000));
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture');
  jest.useRealTimers();
  service.downloadDocument.mockRejectedValue(new Error('Rekonsiliasi penjualan'));
  fireEvent.click(within(menu).getByRole('menuitem', { name: 'Surat Jalan PDF' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Rekonsiliasi');
  expect(service.downloadDocument).toHaveBeenLastCalledWith('surat-jalan', { pid: 'two' });
  click.mockRestore();
});

test.each([[Karkas, 'FINAL', true], [Karkas, 'BATAL', false], [Karkas, 'DRAFT', false], [Kulit, 'DRAFT', false], [Kulit, 'TERPOSTING', true], [Kulit, 'BATAL', false]])('document eligibility %#', (Component, status, eligible) => {
  render(<Component row={{ pid: 'pid', status, status_transaksi: status, payment_status: 1 }} isOpen onClose={() => {}} />);
  const nota = screen.getByRole('menuitem', { name: 'Nota Penjualan PDF' });
  expect(nota.disabled).toBe(!eligible);
  expect(screen.getByRole('menuitem', { name: 'Surat Jalan PDF' }).disabled).toBe(!eligible);
  expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeDisabled();
  expect(screen.getByRole('menuitem', { name: 'Hapus' })).toBeDisabled();
});
