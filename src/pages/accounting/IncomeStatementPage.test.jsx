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
      { id: 101, kode_akun: '4000', nama_akun: 'Penjualan Sapi', amount: 150000000 },
    ],
    expenses: [
      { id: 201, kode_akun: '5000', nama_akun: 'HPP', amount: 60000000 },
      { id: 202, kode_akun: '6240', nama_akun: 'Beban Listrik', amount: 30000000 },
    ],
    total_revenue: 150000000,
    total_expense: 90000000,
    net_income: 60000000,
    sales: {
      gross: 150000000,
      returns: 0,
      discounts: 0,
      net_sales: 150000000,
      gross_lines: [{ id: 101, kode_akun: '4000', nama_akun: 'Penjualan Sapi', amount: 150000000 }],
      return_lines: [],
      discount_lines: [],
    },
    cogs: {
      components: [{ id: 201, kode_akun: '5000', nama_akun: 'HPP', amount: 60000000 }],
      total: 60000000,
    },
    gross_profit: 90000000,
    operating_expenses: [
      { id: 202, kode_akun: '6240', nama_akun: 'Beban Listrik', amount: 30000000 },
      { id: 203, kode_akun: '6230', nama_akun: 'Beban Parkir, E-Toll & BBM', amount: 0 },
    ],
    total_operating_expenses: 30000000,
    operating_income: 60000000,
    other_incomes: [],
    total_other_income: 0,
    non_operating_expenses: [],
    total_non_operating_expenses: 0,
    income_before_tax: 60000000,
    tax_expenses: [],
    total_tax_expense: 0,
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
      expect(screen.getByText('Total Beban Operasional')).toBeInTheDocument();
    });

    // Baris laba (kotor/operasi/sebelum pajak/bersih) sudah dihilangkan.
    expect(screen.queryByText('LABA KOTOR')).not.toBeInTheDocument();
    expect(screen.queryByText('LABA OPERASI')).not.toBeInTheDocument();
    expect(screen.queryByText('LABA SEBELUM PAJAK')).not.toBeInTheDocument();
    expect(screen.queryByText('LABA (RUGI) BERSIH')).not.toBeInTheDocument();

    // Struktur laporan bertingkat.
    expect(screen.getAllByText('Penjualan Bersih').length).toBeGreaterThan(0);
    expect(screen.getByText('Harga Pokok Penjualan (HPP)')).toBeInTheDocument();
    expect(screen.getByText('Beban Operasional')).toBeInTheDocument();
    expect(screen.getByText('Beban Pajak')).toBeInTheDocument();

    // Baris akun.
    expect(screen.getByText('Penjualan Sapi')).toBeInTheDocument();
    expect(screen.getByText('HPP')).toBeInTheDocument();
    expect(screen.getByText('Beban Listrik')).toBeInTheDocument();

    // Baris baku bernilai 0 tetap ditampilkan (0 ditulis 0) tanpa tombol Detail.
    expect(screen.getByText('Beban Parkir, E-Toll & BBM')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Detail' })).toHaveLength(3);

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
