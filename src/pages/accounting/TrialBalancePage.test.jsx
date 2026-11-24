import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TrialBalancePage from './TrialBalancePage';
import accountingService from '../../services/accountingService';

jest.mock('../../services/accountingService');

describe('TrialBalancePage', () => {
  const mockSettings = [
    { id: 1, nama_perusahaan: 'PT Ternak Jaya', entitas: 'HO' },
    { id: 2, nama_perusahaan: 'RPH Depok', entitas: 'RPH' },
  ];

  const mockReport = {
    accounts: [
      { id: 101, kode_akun: '1101', nama_akun: 'Kas Utama', debit: 50000000, credit: 0 },
      { id: 201, kode_akun: '3101', nama_akun: 'Modal Disetor', debit: 0, credit: 50000000 },
    ],
    total_debit: 50000000,
    total_credit: 50000000,
    is_balanced: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    accountingService.getSettings.mockResolvedValue({ data: mockSettings });
    accountingService.getTrialBalance.mockResolvedValue({ data: mockReport });
  });

  it('menampilkan entitas terpilih memakai SearchableSelect (template selectbox)', async () => {
    render(<TrialBalancePage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('memuat neraca saldo dengan setting_id entitas terpilih', async () => {
    render(<TrialBalancePage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(accountingService.getTrialBalance).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: 1 })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Kas Utama')).toBeInTheDocument();
    });

    expect(screen.getByText('Modal Disetor')).toBeInTheDocument();
    expect(screen.getByText('SEIMBANG')).toBeInTheDocument();
  });

  it('mengirim setting_id "all" saat entitas konsolidasi dipilih', async () => {
    render(<TrialBalancePage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 });
    fireEvent.click(await screen.findByRole('option', { name: /Semua Entitas \(Konsolidasi\)/ }));

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(accountingService.getTrialBalance).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: 'all' })
      );
    });
  });
});
