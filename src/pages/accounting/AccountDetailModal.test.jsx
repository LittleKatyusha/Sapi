import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AccountDetailModal from './AccountDetailModal';
import accountingService from '../../services/accountingService';

jest.mock('../../services/accountingService');

describe('AccountDetailModal', () => {
  const mockAccount = {
    id: 16,
    kode_akun: '6200',
    nama_akun: 'Beban Operasional',
    tipe: 'Beban',
  };

  const mockDetailData = {
    account: mockAccount,
    tanggal_from: '2026-10-01',
    tanggal_to: '2026-10-31',
    total_amount: 520000,
    total_transactions: 1,
    groups: [
      {
        kategori: 'Pajak & Retribusi',
        total: 520000,
        count: 1,
        items: [
          {
            id: 101,
            nomor_jurnal: 'PURCHAE3/HO/202610/00007',
            tanggal: '2026-10-01',
            nama_item: 'Pajak',
            keterangan: 'Pembelian beban biaya HO PI3202610150007',
            kategori: 'Pajak & Retribusi',
            debit: 520000,
            credit: 0,
            amount: 520000,
          },
        ],
      },
    ],
    items: [
      {
        id: 101,
        nomor_jurnal: 'PURCHAE3/HO/202610/00007',
        tanggal: '2026-10-01',
        nama_item: 'Pajak',
        keterangan: 'Pembelian beban biaya HO PI3202610150007',
        kategori: 'Pajak & Retribusi',
        debit: 520000,
        credit: 0,
        amount: 520000,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    accountingService.getIncomeStatementDetail.mockResolvedValue({ data: mockDetailData });
  });

  it('renders Nama Item column and displays item name', async () => {
    render(
      <AccountDetailModal
        isOpen={true}
        onClose={jest.fn()}
        account={mockAccount}
        settingId="1"
        settingName="Holding HO"
        tanggalFrom="2026-10-01"
        tanggalTo="2026-10-31"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Beban Operasional')).toBeInTheDocument();
      expect(screen.getByText('PURCHAE3/HO/202610/00007')).toBeInTheDocument();
      expect(screen.getByText('Pajak')).toBeInTheDocument();
      expect(screen.getByText('Nama Item')).toBeInTheDocument();
      expect(screen.getByText('Pembelian beban biaya HO PI3202610150007')).toBeInTheDocument();
    });
  });

  it('renders Nama Item in flat view (Semua Transaksi)', async () => {
    render(
      <AccountDetailModal
        isOpen={true}
        onClose={jest.fn()}
        account={mockAccount}
        settingId="1"
        settingName="Holding HO"
        tanggalFrom="2026-10-01"
        tanggalTo="2026-10-31"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('PURCHAE3/HO/202610/00007')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Semua Transaksi/i }));

    await waitFor(() => {
      expect(screen.getByText('Pajak')).toBeInTheDocument();
      expect(screen.getByText('Nama Item')).toBeInTheDocument();
    });
  });
});
