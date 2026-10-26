import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import IncomeStatementPage from './IncomeStatementPage';
import accountingService from '../../services/accountingService';
import downloadPdf from '../../utils/downloadPdf';

jest.mock('../../services/accountingService');
jest.mock('../../utils/downloadPdf', () => jest.fn());

describe('IncomeStatementPage', () => {
  const mockSettings = [
    { id: 1, nama_perusahaan: 'PT Ternak Jaya', entitas: 'HO' },
  ];

  const mockReport = {
    revenues: [
      { id: 101, kode_akun: '4001', nama_akun: 'Penjualan Sapi', amount: 150000000 },
    ],
    expenses: [
      { id: 201, kode_akun: '5001', nama_akun: 'Beban Pakan', amount: 90000000 },
    ],
    total_revenue: 150000000,
    total_expense: 90000000,
    net_income: 60000000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    accountingService.getSettings.mockResolvedValue({ data: mockSettings });
    accountingService.getIncomeStatement.mockResolvedValue({ data: mockReport });
    accountingService.exportIncomeStatement.mockResolvedValue(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));
  });

  it('renders and displays report data after clicking Tampilkan', async () => {
    render(<IncomeStatementPage />);

    await waitFor(() => {
      expect(screen.getByText(/PT Ternak Jaya/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(screen.getAllByText('150.000.000').length).toBeGreaterThan(0);
      expect(screen.getAllByText('90.000.000').length).toBeGreaterThan(0);
      expect(screen.getByText('60.000.000')).toBeInTheDocument();
      expect(screen.getByText('Penjualan Sapi')).toBeInTheDocument();
      expect(screen.getByText('Beban Pakan')).toBeInTheDocument();
    });

    // Check Cetak PDF, Unduh PDF, and Unduh Excel buttons exist
    expect(screen.getByRole('button', { name: /Cetak PDF/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unduh PDF/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unduh Excel/i })).toBeInTheDocument();
  });

  it('triggers PDF download when Unduh PDF is clicked', async () => {
    render(<IncomeStatementPage />);

    await waitFor(() => {
      expect(screen.getByText(/PT Ternak Jaya/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Unduh PDF/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Unduh PDF/i }));

    await waitFor(() => {
      expect(accountingService.exportIncomeStatement).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: 1 }),
        'pdf'
      );
      expect(downloadPdf).toHaveBeenCalled();
    });
  });

  it('triggers Excel download when Unduh Excel is clicked', async () => {
    render(<IncomeStatementPage />);

    await waitFor(() => {
      expect(screen.getByText(/PT Ternak Jaya/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Unduh Excel/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Unduh Excel/i }));

    await waitFor(() => {
      expect(accountingService.exportIncomeStatement).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: 1 }),
        'xlsx'
      );
    });
  });
});
