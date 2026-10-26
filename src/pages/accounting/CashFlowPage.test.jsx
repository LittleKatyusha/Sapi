import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CashFlowPage from './CashFlowPage';
import accountingService from '../../services/accountingService';

jest.mock('../../services/accountingService');

describe('CashFlowPage', () => {
  const mockSettings = [
    { id: 1, nama_perusahaan: 'PT Ternak Jaya', entitas: 'HO' },
  ];

  const mockCashFlowData = {
    opening_balance: 10000000,
    operations: {
      inflows: [{ id: 101, kode_akun: '4000', nama_akun: 'Pendapatan', amount: 15000000 }],
      outflows: [{ id: 102, kode_akun: '6200', nama_akun: 'Beban Operasional', amount: 5000000 }],
      total_inflows: 15000000,
      total_outflows: 5000000,
      net: 10000000,
    },
    investing: {
      inflows: [],
      outflows: [],
      total_inflows: 0,
      total_outflows: 0,
      net: 0,
    },
    financing: {
      inflows: [],
      outflows: [],
      total_inflows: 0,
      total_outflows: 0,
      net: 0,
    },
    net_change: 14000000,
    ending_balance: 24000000,
    calculated_ending_balance: 24000000,
    is_balanced: true,
    accounts: [
      { id: 1, kode_akun: '1010', nama_akun: 'Kas', saldo: 14000000 },
      { id: 2, kode_akun: '1020', nama_akun: 'Bank', saldo: 10000000 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    accountingService.getSettings.mockResolvedValue({ data: mockSettings });
    accountingService.getCashFlow.mockResolvedValue({ data: mockCashFlowData });
  });

  it('renders page header and filter controls', async () => {
    render(<CashFlowPage />);

    expect(screen.getByText('Laporan Arus Kas (Cash Flow)')).toBeInTheDocument();
    expect(screen.getByText(/Penerimaan dan pengeluaran kas/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });
  });

  it('fetches and displays cash flow data when Tampilkan is clicked', async () => {
    render(<CashFlowPage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    const tampilkanBtn = screen.getByRole('button', { name: /Tampilkan Laporan/i });
    expect(tampilkanBtn).not.toBeDisabled();
    fireEvent.click(tampilkanBtn);

    await waitFor(() => {
      expect(accountingService.getCashFlow).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: 1 })
      );
    });

    // Wait for report to render, then assert
    await waitFor(() => {
      expect(screen.getByText('Aktivitas Operasi')).toBeInTheDocument();
    });

    expect(screen.getAllByText('SEIMBANG').length).toBeGreaterThan(0);
    // Investasi & Pendanaan sections hidden karena datanya kosong
    expect(screen.queryByText('Aktivitas Investasi')).not.toBeInTheDocument();
    expect(screen.queryByText('Arus Kas Investasi')).not.toBeInTheDocument();
    expect(screen.queryByText('Aktivitas Pendanaan')).not.toBeInTheDocument();
    expect(screen.getByText('Rekonsiliasi Perubahan Kas')).toBeInTheDocument();
    expect(screen.getByText('Rincian Saldo Kas & Bank')).toBeInTheDocument();
  });
});
