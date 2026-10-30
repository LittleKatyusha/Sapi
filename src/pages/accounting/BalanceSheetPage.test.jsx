import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import BalanceSheetPage from './BalanceSheetPage';
import accountingService from '../../services/accountingService';
import downloadPdf from '../../utils/downloadPdf';

jest.mock('../../services/accountingService');
jest.mock('../../utils/downloadPdf', () => jest.fn());

describe('BalanceSheetPage', () => {
  const mockSettings = [
    { id: 1, nama_perusahaan: 'PT Ternak Jaya', entitas: 'HO' },
  ];

  const mockReport = {
    assets: [
      { id: 101, kode_akun: '1101', nama_akun: 'Kas Utama', amount: 50000000 },
    ],
    liabilities: [
      { id: 201, kode_akun: '2101', nama_akun: 'Utang Usaha', amount: 20000000 },
    ],
    equities: [
      { id: 301, kode_akun: '3101', nama_akun: 'Modal Disetor', amount: 30000000 },
    ],
    total_asset: 50000000,
    total_liability: 20000000,
    total_equity: 30000000,
    current_earnings: 0,
    total_liability_equity: 50000000,
    is_balanced: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    accountingService.getSettings.mockResolvedValue({ data: mockSettings });
    accountingService.getBalanceSheet.mockResolvedValue({ data: mockReport });
    accountingService.exportBalanceSheet.mockResolvedValue(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));
  });

  it('renders and displays report data after clicking Tampilkan', async () => {
    render(<BalanceSheetPage />);

    await waitFor(() => {
      expect(screen.getByText(/PT Ternak Jaya/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(screen.getAllByText('50.000.000').length).toBeGreaterThan(0);
      expect(screen.getByText('Kas Utama')).toBeInTheDocument();
      expect(screen.getByText('Utang Usaha')).toBeInTheDocument();
      expect(screen.getByText('SEIMBANG')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Cetak PDF/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unduh PDF/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unduh Excel/i })).toBeInTheDocument();
  });

  it('triggers PDF download when Unduh PDF is clicked', async () => {
    render(<BalanceSheetPage />);

    await waitFor(() => {
      expect(screen.getByText(/PT Ternak Jaya/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Unduh PDF/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Unduh PDF/i }));

    await waitFor(() => {
      expect(accountingService.exportBalanceSheet).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: 1 }),
        'pdf'
      );
      expect(downloadPdf).toHaveBeenCalled();
    });
  });

  it('triggers Excel download when Unduh Excel is clicked', async () => {
    render(<BalanceSheetPage />);

    await waitFor(() => {
      expect(screen.getByText(/PT Ternak Jaya/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Unduh Excel/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Unduh Excel/i }));

    await waitFor(() => {
      expect(accountingService.exportBalanceSheet).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: 1 }),
        'xlsx'
      );
    });
  });
});
