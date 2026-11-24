import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import BalanceSheetPage from './BalanceSheetPage';
import accountingService from '../../services/accountingService';
import downloadPdf from '../../utils/downloadPdf';

jest.mock('../../services/accountingService');
jest.mock('../../utils/downloadPdf', () => jest.fn());

global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();
window.open = jest.fn();
HTMLAnchorElement.prototype.click = jest.fn();

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

  const mockDetail = {
    account: { id: 101, kode_akun: '1210', nama_akun: 'Piutang RPH (HO)', tipe: 'Aset', normal_balance: 'D' },
    as_of: '2026-09-30',
    ending_balance: 228020000,
    total_debit: 239020000,
    total_credit: 11000000,
    total_transactions: 2,
    counterparty_type: 'ar',
    counterparties: [
      {
        counterparty_type: 'rph',
        counterparty_id: 3,
        counterparty_name: 'RPH DEPOK',
        outstanding: 228020000,
        last_activity: '2026-09-05',
      },
    ],
    counterparty_total: 228020000,
    items: [
      {
        id: 1,
        tanggal: '2026-09-02',
        nomor_jurnal: 'SALES/HO/202609/00001',
        pihak: 'RPH DEPOK',
        keterangan: 'Piutang penjualan sapi',
        debit: 184722000,
        credit: 0,
        saldo_berjalan: 184722000,
      },
      {
        id: 2,
        tanggal: '2026-09-05',
        nomor_jurnal: 'SALESPAY/HO/202609/00003',
        pihak: 'RPH DEPOK',
        keterangan: 'Pelunasan piutang',
        debit: 0,
        credit: 11000000,
        saldo_berjalan: 228020000,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    accountingService.getSettings.mockResolvedValue({ data: mockSettings });
    accountingService.getBalanceSheet.mockResolvedValue({ data: mockReport });
    accountingService.getBalanceSheetDetail.mockResolvedValue({ data: mockDetail });
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

    accountingService.exportBalanceSheet.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /Unduh Excel/i }));

    await waitFor(() => {
      expect(accountingService.exportBalanceSheet).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: 1 }),
        'xlsx'
      );
    });
  });

  it('membuka popup detail akun berisi rincian per pihak dan transaksi', async () => {
    render(<BalanceSheetPage />);

    await waitFor(() => {
      expect(screen.getByText(/PT Ternak Jaya/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(screen.getByText('Kas Utama')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Detail' })[0]);

    await waitFor(() => {
      expect(screen.getByText('Rincian Piutang per Pihak')).toBeInTheDocument();
    });

    expect(accountingService.getBalanceSheetDetail).toHaveBeenCalledWith(
      expect.objectContaining({ setting_id: 1, coa_id: 101 })
    );
    expect(screen.getByText('Total Per Pihak')).toBeInTheDocument();
    expect(screen.getByText('SALES/HO/202609/00001')).toBeInTheDocument();
    // Nama pihak muncul di rincian per pihak dan di daftar transaksi.
    expect(screen.getAllByText('RPH DEPOK').length).toBeGreaterThan(0);
  });

  it('passes "all" for setting_id when all entities is selected', async () => {
    const multiSettings = [
      { id: 1, nama_perusahaan: 'PT Ternak Jaya', entitas: 'HO' },
      { id: 2, nama_perusahaan: 'RPH Depok', entitas: 'RPH' },
    ];
    accountingService.getSettings.mockResolvedValue({ data: multiSettings });

    render(<BalanceSheetPage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    // Entitas Akunting memakai SearchableSelect (template selectbox aplikasi):
    // opsi hanya dirender saat dropdown dibuka.
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 });
    fireEvent.click(await screen.findByRole('option', { name: /Semua Entitas \(Konsolidasi\)/ }));

    await waitFor(() => {
      expect(screen.getByText(/Semua Entitas \(Konsolidasi\)/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Unduh PDF/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Unduh PDF/i }));

    await waitFor(() => {
      expect(accountingService.exportBalanceSheet).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: 'all' }),
        'pdf'
      );
    });
  });
});
