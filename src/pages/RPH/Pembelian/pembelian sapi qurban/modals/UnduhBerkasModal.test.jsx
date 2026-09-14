import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UnduhBerkasModal from './UnduhBerkasModal';
import QurbanService from '../../../../../services/qurban/qurbanService';

jest.mock('../../../../../services/qurban/qurbanService', () => ({ __esModule: true, default: { downloadDocument: jest.fn() } }));
beforeEach(() => {
  jest.clearAllMocks();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});

test('unpaid receipt disabled; partial payment eligible; raw pubid never used', () => {
  const props = { isOpen: true, onClose: jest.fn(), item: { pid: 'qurban', total_terbayar: 0 } };
  const { rerender } = render(<UnduhBerkasModal {...props} />);
  expect(screen.getByRole('button', { name: /4. Kwitansi/ }).disabled).toBe(true);
  rerender(<UnduhBerkasModal {...props} item={{ pid: 'qurban', total_terbayar: '100' }} />);
  expect(screen.getByRole('button', { name: /4. Kwitansi/ }).disabled).toBe(false);
  rerender(<UnduhBerkasModal {...props} item={{ pubid: 'raw-uuid', total_terbayar: 100 }} />);
  expect(screen.getByRole('button', { name: /1. Pesanan/ }).disabled).toBe(true);
});

test('blocks duplicate requests and dismissal, surfaces errors, permits retry', async () => {
  let reject;
  QurbanService.downloadDocument.mockImplementation(() => new Promise((resolve, fail) => { reject = fail; }));
  const onClose = jest.fn();
  render(<UnduhBerkasModal isOpen onClose={onClose} item={{ pid: 'qurban', payment_pid: 'payment', total_terbayar: 100 }} />);
  const button = screen.getByRole('button', { name: /1. Pesanan/ });
  fireEvent.click(button);
  fireEvent.click(button);
  fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));
  expect(QurbanService.downloadDocument).toHaveBeenCalledTimes(1);
  expect(QurbanService.downloadDocument).toHaveBeenCalledWith('qurban', 'pesanan');
  expect(onClose).not.toHaveBeenCalled();
  reject(new Error('Akses ditolak'));
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Akses ditolak'));
  expect(button.disabled).toBe(false);
});
