import { render, screen, waitFor } from '@testing-library/react';
import BalanceAccountDetailModal from './BalanceAccountDetailModal';
import accountingService from '../../services/accountingService';

jest.mock('../../services/accountingService');

describe('BalanceAccountDetailModal', () => {
  const mockAccount = {
    id: 3,
    kode_akun: '1110',
    nama_akun: 'Persediaan Hewan',
    tipe: 'Aset',
    normal_balance: 'D',
  };

  const mockDetailData = {
    account: mockAccount,
    as_of: '2026-10-31',
    ending_balance: 11857257500,
    total_debit: 33957471500,
    total_credit: 22100214000,
    total_transactions: 1,
    groups: [
      {
        kategori: 'Sapi Hidup',
        total_debit: 33957471500,
        total_credit: 22100214000,
        count: 1,
        items: [
          {
            id: 201,
            nomor_jurnal: 'PURCH/HO/202610/0001',
            tanggal: '2026-10-05',
            nama_item: 'Sapi (HEIFERS)',
            qty: 16,
            satuan: 'ekor',
            keterangan: 'Pembelian sapi bakalan Australia',
            kategori: 'Sapi Hidup',
            debit: 500000000,
            credit: 0,
            saldo_berjalan: 500000000,
          },
        ],
      },
    ],
    items: [
      {
        id: 201,
        nomor_jurnal: 'PURCH/HO/202610/0001',
        tanggal: '2026-10-05',
        nama_item: 'Sapi (HEIFERS)',
        qty: 16,
        satuan: 'ekor',
        keterangan: 'Pembelian sapi bakalan Australia',
        kategori: 'Sapi Hidup',
        debit: 500000000,
        credit: 0,
        saldo_berjalan: 500000000,
      },
    ],
    counterparties: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    accountingService.getBalanceSheetDetail.mockResolvedValue({
      data: mockDetailData,
    });
  });

  it('renders modal with account details and transaction rows', async () => {
    render(
      <BalanceAccountDetailModal
        isOpen={true}
        onClose={jest.fn()}
        account={mockAccount}
        settingId="1"
        settingName="Holding HO"
        tanggal="2026-10-31"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Persediaan Hewan')).toBeInTheDocument();
      expect(screen.getByText('PURCH/HO/202610/0001')).toBeInTheDocument();
      expect(screen.getByText('Sapi (HEIFERS)')).toBeInTheDocument();
      expect(screen.getByText('16 ekor')).toBeInTheDocument();
      expect(screen.getByText('Pembelian sapi bakalan Australia')).toBeInTheDocument();
    });
  });
});
