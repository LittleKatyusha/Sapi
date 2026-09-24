import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportRphPage from './ReportRphPage';
import ReportRphService from '../../../services/reportRphService';

jest.mock('../../../services/reportRphService', () => ({ getLaporanDof: jest.fn() }));

test('assigned report opens its own endpoint without unrelated report actions', async () => {
  ReportRphService.getLaporanDof.mockResolvedValue({ data: [{ total_hari: 3 }] });
  render(<ReportRphPage report={{ key: 'laporan-dof', title: 'Laporan DOF', endpoint: 'getLaporanDof' }} />);
  expect(screen.queryByText('Daftar Laporan RPH')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Run' }));
  await waitFor(() => expect(ReportRphService.getLaporanDof).toHaveBeenCalledWith({}));
  expect(await screen.findByText(/total_hari/)).toBeInTheDocument();
});
