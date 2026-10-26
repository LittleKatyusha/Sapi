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
      inflows: [
        {
          id: 101,
          kode_akun: '4000',
          nama_akun: 'Pendapatan',
          group_label: 'Penerimaan dari Pelanggan & Penjualan',
          amount: 15000000,
          journals: [
            {
              journal_id: 1,
              nomor_jurnal: 'JU-2026-001',
              tanggal: '2026-10-05',
              keterangan: 'Penjualan sapi tunai',
              amount: 15000000,
            },
          ],
        },
      ],
      outflows: [
        {
          id: 102,
          kode_akun: '6200',
          nama_akun: 'Beban Operasional',
          group_label: 'Pembayaran Beban Operasional & Karyawan',
          amount: 5000000,
          journals: [],
        },
      ],
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
    net_change: 10000000,
    ending_balance: 20000000,
    calculated_ending_balance: 20000000,
    variance: 0,
    is_balanced: true,
    is_negative_cash: false,
    accounts: [
      { id: 1, kode_akun: '1010', nama_akun: 'Kas', saldo: 10000000 },
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
    expect(screen.getByText(/Metode Langsung \(Direct Method\) sesuai PSAK 2/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });
  });

  it('fetches and displays all PSAK 2 cash flow sections and status badge', async () => {
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

    // Wait for report to render
    await waitFor(() => {
      expect(screen.getByText('Aktivitas Operasi')).toBeInTheDocument();
    });

    // All 3 activities displayed explicitly per PSAK 2
    expect(screen.getByText('Aktivitas Investasi')).toBeInTheDocument();
    expect(screen.getByText('Aktivitas Pendanaan')).toBeInTheDocument();
    expect(screen.getAllByText('Sesuai Buku Besar').length).toBeGreaterThan(0);
    expect(screen.getByText('Selisih: Rp 0')).toBeInTheDocument();
    expect(screen.getByText('Rekonsiliasi Perubahan Kas')).toBeInTheDocument();
    expect(screen.getByText('Rincian Saldo Kas & Bank')).toBeInTheDocument();
    expect(screen.getByText('Penerimaan dari Pelanggan & Penjualan')).toBeInTheDocument();
  });

  it('opens journal drill-down modal when journal button is clicked', async () => {
    render(<CashFlowPage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan Laporan/i }));

    await waitFor(() => {
      expect(screen.getByText(/Jurnal \(1\)/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Jurnal \(1\)/i));

    await waitFor(() => {
      expect(screen.getByText('JU-2026-001')).toBeInTheDocument();
    });

    expect(screen.getByText('Penjualan sapi tunai')).toBeInTheDocument();
    expect(screen.getByText('Tutup')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Tutup'));

    await waitFor(() => {
      expect(screen.queryByText('JU-2026-001')).not.toBeInTheDocument();
    });
  });

  it('displays warning banner when ending balance is negative', async () => {
    accountingService.getCashFlow.mockResolvedValueOnce({
      data: {
        ...mockCashFlowData,
        ending_balance: -2500000000,
        calculated_ending_balance: -2500000000,
        is_negative_cash: true,
      },
    });

    render(<CashFlowPage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan Laporan/i }));

    await waitFor(() => {
      expect(screen.getByText(/Peringatan: Saldo Kas Akhir Negatif/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Saldo Awal Belum Masuk/i)).toBeInTheDocument();
    expect(screen.getByText(/Sumber Dana Vendor Belum Dicatat/i)).toBeInTheDocument();
  });
});
