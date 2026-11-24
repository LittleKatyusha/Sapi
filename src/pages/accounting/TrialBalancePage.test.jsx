import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TrialBalancePage from './TrialBalancePage';
import accountingService from '../../services/accountingService';

jest.mock('../../services/accountingService');

describe('TrialBalancePage', () => {
  const mockSettings = [
    { id: 1, nama_perusahaan: 'PT Ternak Jaya', entitas: 'HO' },
    { id: 2, nama_perusahaan: 'RPH Depok', entitas: 'RPH' },
  ];

  const mockReport = {
    accounts: [
      { id: 101, kode_akun: '1101', nama_akun: 'Kas Utama', debit: 50000000, credit: 0 },
      { id: 201, kode_akun: '3101', nama_akun: 'Modal Disetor', debit: 0, credit: 50000000 },
    ],
    total_debit: 50000000,
    total_credit: 50000000,
    is_balanced: true,
  };

  const mockLedgerDetail = {
    account: { id: 101, kode_akun: '1101', nama_akun: 'Kas Utama', tipe: 'Aset', normal_balance: 'D' },
    opening_balance: 2000000,
    total_debit: 50000000,
    total_credit: 0,
    ending_balance: 52000000,
    rows: [
      {
        journal_id: 1,
        nomor_jurnal: 'JU-2026-001',
        tanggal: '2026-11-02',
        tipe_jurnal: 'MEMORIAL',
        keterangan: 'Penerimaan kas operasional',
        debit: 30000000,
        credit: 0,
        saldo_berjalan: 32000000,
        pihak: 'MARYATI',
        pihak_tipe: 'pedagang',
        kategori: 'Karkas Sapi',
      },
      {
        journal_id: 2,
        nomor_jurnal: 'JU-2026-002',
        tanggal: '2026-11-03',
        tipe_jurnal: 'MEMORIAL',
        keterangan: 'Penerimaan kas kedua',
        debit: 20000000,
        credit: 0,
        saldo_berjalan: 52000000,
        pihak: 'AHMAD',
        pihak_tipe: 'pedagang',
        kategori: 'Karkas Sapi',
      },
    ],
    classification: {
      type: 'counterparty',
      label: 'Rincian Piutang per Pihak',
      normal_balance: 'D',
      total_net: 50000000,
      groups: [
        {
          label: 'MARYATI',
          counterparty_type: 'pedagang',
          counterparty_id: 36,
          total_debit: 30000000,
          total_credit: 0,
          net: 30000000,
          count: 1,
          last_activity: '2026-11-02',
          outstanding: 30000000,
        },
        {
          label: 'AHMAD',
          counterparty_type: 'pedagang',
          counterparty_id: 37,
          total_debit: 20000000,
          total_credit: 0,
          net: 20000000,
          count: 1,
          last_activity: '2026-11-03',
          outstanding: 20000000,
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    accountingService.getSettings.mockResolvedValue({ data: mockSettings });
    accountingService.getTrialBalance.mockResolvedValue({ data: mockReport });
    accountingService.getTrialBalanceDetail.mockResolvedValue({ data: mockLedgerDetail });
  });

  it('menampilkan entitas terpilih memakai SearchableSelect (template selectbox)', async () => {
    render(<TrialBalancePage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('memuat neraca saldo dengan setting_id entitas terpilih', async () => {
    render(<TrialBalancePage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(accountingService.getTrialBalance).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: 1 })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Kas Utama')).toBeInTheDocument();
    });

    expect(screen.getByText('Modal Disetor')).toBeInTheDocument();
    expect(screen.getByText('SEIMBANG')).toBeInTheDocument();
  });

  it('mengirim setting_id "all" saat entitas konsolidasi dipilih', async () => {
    render(<TrialBalancePage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 });
    fireEvent.click(await screen.findByRole('option', { name: /Semua Entitas \(Konsolidasi\)/ }));

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(accountingService.getTrialBalance).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: 'all' })
      );
    });
  });

  it('membuka popup detail akun berisi transaksi pembentuk saldo', async () => {
    render(<TrialBalancePage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(screen.getByText('Kas Utama')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Detail' })[0]);

    await waitFor(() => {
      expect(screen.getByText('Transaksi Pembentuk Saldo')).toBeInTheDocument();
    });

    expect(accountingService.getTrialBalanceDetail).toHaveBeenCalledWith(
      expect.objectContaining({ setting_id: 1, coa_id: 101 })
    );
    expect(screen.getByText('JU-2026-001')).toBeInTheDocument();
    // Angka popup harus tie-out dengan baris neraca saldo (mutasi neto periode).
    expect(screen.getByText('Mutasi Debit (Periode)')).toBeInTheDocument();
    expect(screen.getByText('Saldo Neto (Neraca Saldo)')).toBeInTheDocument();
    expect(screen.getAllByText(/Rp 50\.000\.000/).length).toBeGreaterThan(0);
    // Klasifikasi per pihak (contoh: piutang per pedagang).
    expect(screen.getByText('Rincian Piutang per Pihak')).toBeInTheDocument();
    expect(screen.getAllByText('MARYATI').length).toBeGreaterThan(0);
    expect(screen.getAllByText('AHMAD').length).toBeGreaterThan(0);
  });

  it('memfilter transaksi saat baris klasifikasi pihak diklik', async () => {
    render(<TrialBalancePage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(screen.getByText('Kas Utama')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Detail' })[0]);

    await waitFor(() => {
      expect(screen.getByText('Rincian Piutang per Pihak')).toBeInTheDocument();
    });

    // Klik baris klasifikasi "MARYATI" (baris pertama tabel klasifikasi).
    fireEvent.click(screen.getAllByText('MARYATI')[0]);

    await waitFor(() => {
      expect(screen.queryByText('JU-2026-002')).not.toBeInTheDocument();
    });

    expect(screen.getByText('JU-2026-001')).toBeInTheDocument();

    // Hapus filter kelompok -> semua transaksi tampil kembali.
    fireEvent.click(screen.getByTitle('Hapus filter kelompok'));

    await waitFor(() => {
      expect(screen.getByText('JU-2026-002')).toBeInTheDocument();
    });
  });

  it('menutup popup detail saat tombol Tutup diklik', async () => {
    render(<TrialBalancePage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(screen.getByText('Kas Utama')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Detail' })[0]);

    await waitFor(() => {
      expect(screen.getByText('Transaksi Pembentuk Saldo')).toBeInTheDocument();
    });

    // Tombol "Tutup" ada dua: ikon X di header (aria-label) dan tombol di footer.
    const closeButtons = screen.getAllByRole('button', { name: 'Tutup' });
    fireEvent.click(closeButtons[closeButtons.length - 1]);

    await waitFor(() => {
      expect(screen.queryByText('Transaksi Pembentuk Saldo')).not.toBeInTheDocument();
    });
  });
});
