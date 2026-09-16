import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActionMenu from './Perpindahan/components/ActionMenu';
import RekeningPedagangModal from './pedagang/modals/RekeningPedagangModal';
import downloadPdf from '../../utils/downloadPdf';

test('transfer menu binds the exact row, type loading, keyboard and honest labels', () => {
  const row = { pubid: 'uuid-a', nama: 'Same' };
  const trigger = document.createElement('button'); document.body.appendChild(trigger);
  const close = jest.fn(); const costs = jest.fn();
  render(<ActionMenu row={row} buttonRef={{ current: trigger }} onClose={close} onKwitansi={costs}
    onEdit={jest.fn()} onDelete={jest.fn()} onSuratJalan={jest.fn()} onSsth={jest.fn()}
    documentLoading={['surat_jalan:uuid-a', 'kwitansi:uuid-b']} />);
  expect(screen.getByRole('menuitem', { name: /Surat Jalan/ })).toBeDisabled();
  const button = screen.getByRole('menuitem', { name: /Rincian Biaya Pengiriman/ });
  expect(button).toBeEnabled(); fireEvent.click(button); expect(costs).toHaveBeenCalledWith(row);
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' }); expect(trigger).toHaveFocus();
  trigger.remove();
});

test('statement validates period, uses exact pid, guards duplicate clicks and resets errors', async () => {
  let reject;
  const cetak = jest.fn(() => new Promise((resolve, fail) => { reject = fail; }));
  const props = { isOpen: true, onClose: jest.fn(), pedagangData: { pid: 'encrypted-a', nama_alias: 'Same' }, onCetak: cetak };
  const { rerender } = render(<RekeningPedagangModal {...props} />);
  expect(screen.getByText(/Periode berdasarkan tanggal posting/)).toBeInTheDocument();
  const year = screen.getByLabelText('Tahun');
  fireEvent.change(year, { target: { value: '2101' } });
  expect(screen.getByRole('button', { name: 'Cetak Rekening' })).toBeDisabled();
  fireEvent.change(year, { target: { value: '2024' } });
  fireEvent.change(screen.getByLabelText('Bulan'), { target: { value: '2' } });
  const submit = screen.getByRole('button', { name: 'Cetak Rekening' });
  fireEvent.click(submit); fireEvent.click(submit);
  expect(cetak).toHaveBeenCalledTimes(1);
  expect(cetak).toHaveBeenCalledWith({ pid: 'encrypted-a', bulan: 2, tahun: 2024, nama_alias: 'Same' });
  await act(async () => reject(new Error('private backend error')));
  expect(screen.getByRole('alert')).toHaveTextContent('Gagal mengunduh rekening');
  expect(screen.queryByText('private backend error')).not.toBeInTheDocument();
  rerender(<RekeningPedagangModal {...props} pedagangData={{ pid: 'encrypted-b', nama_alias: 'Same' }} />);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' }); expect(props.onClose).toHaveBeenCalled();
});

test('PDF rejects wrong MIME or signature, sanitizes name, releases URL', async () => {
  const pdf = new Blob(['%PDF-test'], { type: 'application/pdf' });
  pdf.slice = () => ({ text: async () => '%PDF-' });
  URL.createObjectURL = jest.fn(() => 'blob:test'); URL.revokeObjectURL = jest.fn();
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    expect(this.download).toBe('Rekening___unsafe.pdf');
  });
  await expect(downloadPdf(new Blob(['oops'], { type: 'text/html' }), 'bad.pdf')).rejects.toThrow('bukan PDF');
  const fake = new Blob(['oops'], { type: 'application/pdf' }); fake.slice = () => ({ text: async () => 'oops' });
  await expect(downloadPdf(fake, 'bad.pdf')).rejects.toThrow('bukan PDF');
  jest.useFakeTimers();
  await downloadPdf(pdf, 'Rekening_<>unsafe.pdf');
  expect(click).toHaveBeenCalledTimes(1);
  jest.runAllTimers(); expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  jest.useRealTimers(); click.mockRestore();
});
