import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LedgerPage from './LedgerPage';
import accountingService from '../../services/accountingService';

jest.mock('../../services/accountingService');

describe('LedgerPage', () => {
  const mockSettings = [
    { id: 1, nama_perusahaan: 'PT Ternak Jaya', entitas: 'HO' },
  ];

  const mockAccounts = [
    { id: 11, kode_akun: '1101', nama_akun: 'Kas Utama', is_posting: true },
    { id: 12, kode_akun: '1102', nama_akun: 'Bank', is_posting: true },
  ];

  const mockLedger = {
    opening_balance: 0,
    total_debit: 1000000,
    total_credit: 0,
    ending_balance: 1000000,
    rows: [
      {
        journal_id: 1,
        tanggal: '2026-11-01',
        nomor_jurnal: 'JU-2026-001',
        keterangan: 'Setoran modal',
        debit: 1000000,
        credit: 0,
        saldo_berjalan: 1000000,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    accountingService.getSettings.mockResolvedValue({ data: mockSettings });
    accountingService.getCoa.mockResolvedValue({ data: mockAccounts });
    accountingService.getGeneralLedger.mockResolvedValue({ data: mockLedger });
  });

  it('memakai SearchableSelect (template selectbox) untuk entitas & akun COA', async () => {
    render(<LedgerPage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    expect(screen.getByText('1101 - Kas Utama')).toBeInTheDocument();
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
  });

  it('memuat buku besar dengan setting_id dan coa_id terpilih', async () => {
    render(<LedgerPage />);

    await waitFor(() => {
      expect(screen.getByText('1101 - Kas Utama')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(accountingService.getGeneralLedger).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: 1, coa_id: 11 })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('JU-2026-001')).toBeInTheDocument();
    });
  });

  it('memilih akun lain dari dropdown mengirim coa_id akun tersebut', async () => {
    render(<LedgerPage />);

    await waitFor(() => {
      expect(screen.getByText('1101 - Kas Utama')).toBeInTheDocument();
    });

    // Combobox kedua = Akun COA. Opsi hanya dirender saat dropdown dibuka.
    fireEvent.keyDown(screen.getAllByRole('combobox')[1], { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 });
    fireEvent.click(await screen.findByRole('option', { name: '1102 - Bank' }));

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(accountingService.getGeneralLedger).toHaveBeenCalledWith(
        expect.objectContaining({ coa_id: 12 })
      );
    });
  });
});
