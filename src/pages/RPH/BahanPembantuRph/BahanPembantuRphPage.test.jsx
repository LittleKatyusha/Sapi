import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ActionMenu } from './BahanPembantuRphPage';

jest.mock('react-router-dom', () => ({ useNavigate: jest.fn() }), { virtual: true });
jest.mock('../../../services/bahanPembantuRphService', () => ({}));
jest.mock('../../../services/biayaRphService', () => ({}));

test.each(['Nota Pembelian Bahan Pembantu PDF', 'Voucher Biaya Bank PDF', 'Voucher Biaya Kas PDF'])('shared desktop/mobile menu: %s', label => {
  const download = jest.fn();
  const close = jest.fn();
  const trigger = document.createElement('button');
  document.body.appendChild(trigger);
  const props = { row: { pid: 'record-pid' }, buttonRef: { current: trigger }, onClose: close, documentAction: { label, download } };
  const { rerender, unmount } = render(<ActionMenu {...props} />);
  const action = screen.getByRole('menuitem', { name: new RegExp(label) });
  expect(document.activeElement).toBe(action);
  fireEvent.click(action);
  expect(download).toHaveBeenCalledWith(props.row);
  expect(close).toHaveBeenCalled();
  rerender(<ActionMenu {...props} documentAction={{ label, download, loading: true }} />);
  const pending = screen.getByRole('menuitem', { name: /Menyiapkan PDF/ });
  expect(pending.disabled).toBe(true);
  fireEvent.click(pending);
  expect(download).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
  expect(document.activeElement).toBe(trigger);
  unmount();
  trigger.remove();
});
