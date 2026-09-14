import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ModernPembelianSapiTable from './ModernPembelianSapiTable';

const renderMenu = (row, downloadingRow = null) => {
  render(<ModernPembelianSapiTable
    data={[{ id: 'row', pid: 'encrypted-po', no_po: 'PO-1', ...row }]}
    serverPagination={{ currentPage: 1, perPage: 10, totalRecords: 1 }}
    onDetail={jest.fn()} onEdit={jest.fn()} onDelete={jest.fn()}
    onDownloadSuratJalan={jest.fn()} onDownloadLembarPesanan={jest.fn()}
    onDownloadKwitansi={jest.fn()} downloadingRow={downloadingRow}
  />);
  fireEvent.click(screen.getByRole('button', { name: 'Menu Aksi' }));
};

test.each([2, '2', 'Disetujui', ' approved '])('approved status %s exposes documents and paid receipt', (status) => {
  renderMenu({ status, payment_status: '1' });
  for (const name of ['Surat Jalan', 'Lembar Pesanan', 'Kwitansi']) {
    expect(screen.getByRole('menuitem', { name })).toBeTruthy();
  }
});

test.each([1, 3, 'Menunggu Persetujuan', 'Ditolak', null])('status %s hides documents', (status) => {
  renderMenu({ status });
  expect(screen.queryByRole('menuitem', { name: 'Surat Jalan' })).toBeNull();
  expect(screen.queryByRole('menuitem', { name: 'Kwitansi' })).toBeNull();
});

test('unpaid PO hides receipt; download lock disables documents; Escape restores focus', () => {
  renderMenu({ status: 2, payment_status: 0 }, { pid: 'encrypted-po', reportType: 'delivery' });
  expect(screen.queryByRole('menuitem', { name: 'Kwitansi' })).toBeNull();
  expect(screen.getByRole('menuitem', { name: 'Surat Jalan' }).disabled).toBe(true);
  expect(screen.getByRole('menuitem', { name: 'Lembar Pesanan' }).disabled).toBe(true);
  expect(screen.getByRole('status').textContent).toContain('Mengunduh');
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
  expect(screen.queryByRole('menu')).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Menu Aksi' }));
});

test('missing encrypted PID hides downloads', () => {
  renderMenu({ status: 2, pid: null });
  expect(screen.queryByRole('menuitem', { name: 'Surat Jalan' })).toBeNull();
});
