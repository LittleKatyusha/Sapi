import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import JournalPage from './JournalPage';
import accountingService from '../../services/accountingService';

jest.mock('../../services/accountingService');

describe('JournalPage', () => {
  const mockSettings = [
    { id: 1, nama_perusahaan: 'PT Ternak Jaya', entitas: 'HO' },
  ];

  const mockPeriods = [
    { id: 5, nama_periode: 'November 2026' },
  ];

  const mockJournals = [
    {
      id: 1,
      nomor_jurnal: 'JU-2026-001',
      tanggal: '2026-11-01',
      tipe_jurnal: 'MEMORIAL',
      keterangan: 'Setoran modal',
      total_debit: 1000000,
      total_credit: 1000000,
      status: 'draft',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    accountingService.getSettings.mockResolvedValue({ data: mockSettings });
    accountingService.getCoa.mockResolvedValue({ data: [] });
    accountingService.getPeriods.mockResolvedValue({ data: mockPeriods });
    accountingService.getJournals.mockResolvedValue({ data: mockJournals });
  });

  it('memakai SearchableSelect (template selectbox) untuk entitas dan semua filter', async () => {
    render(<JournalPage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    // entitas + status + tipe jurnal + periode
    expect(screen.getAllByRole('combobox')).toHaveLength(4);
    expect(screen.getAllByText('Semua')).toHaveLength(3);
  });

  it('memuat jurnal untuk entitas terpilih', async () => {
    render(<JournalPage />);

    await waitFor(() => {
      expect(accountingService.getJournals).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: '1' })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('JU-2026-001')).toBeInTheDocument();
    });
  });

  it('mengirim filter status saat status dipilih dari selectbox', async () => {
    render(<JournalPage />);

    await waitFor(() => {
      expect(screen.getByText('JU-2026-001')).toBeInTheDocument();
    });

    // Combobox kedua = filter Status.
    fireEvent.keyDown(screen.getAllByRole('combobox')[1], { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 });
    fireEvent.click(await screen.findByRole('option', { name: 'posted' }));

    await waitFor(() => {
      expect(accountingService.getJournals).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'posted' })
      );
    });
  });

  it('mengirim filter periode dari selectbox periode', async () => {
    render(<JournalPage />);

    await waitFor(() => {
      expect(screen.getByText('JU-2026-001')).toBeInTheDocument();
    });

    // Combobox keempat = filter Periode.
    fireEvent.keyDown(screen.getAllByRole('combobox')[3], { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 });
    fireEvent.click(await screen.findByRole('option', { name: 'November 2026' }));

    await waitFor(() => {
      expect(accountingService.getJournals).toHaveBeenCalledWith(
        expect.objectContaining({ period_id: '5' })
      );
    });
  });
});
