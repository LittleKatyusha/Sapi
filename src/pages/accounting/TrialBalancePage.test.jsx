import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TrialBalancePage from './TrialBalancePage';
import accountingService from '../../services/accountingService';

jest.mock('../../services/accountingService');

const mockNavigate = jest.fn();
// react-router-dom v7 hanya ESM sehingga tidak bisa di-resolve Jest (CRA5).
jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

describe('TrialBalancePage', () => {
  const mockSettings = [
    { id: 1, nama_perusahaan: 'PT Ternak Jaya', entitas: 'HO' },
    { id: 2, nama_perusahaan: 'RPH Depok', entitas: 'RPH' },
  ];

  const mockReport = {
    accounts: [
      { id: 101, kode_akun: '1101', nama_akun: 'Kas Utama', tipe: 'Aset', debit: 50000000, credit: 0 },
      { id: 201, kode_akun: '3101', nama_akun: 'Modal Disetor', tipe: 'Ekuitas', debit: 0, credit: 50000000 },
    ],
    total_debit: 50000000,
    total_credit: 50000000,
    selisih: 0,
    is_balanced: true,
  };

  // Kertas kerja: Kas (2jt awal + 50jt transaksi − 1jt penyesuaian) = 51jt,
  // Modal 52jt, Beban Operasional 1jt (jurnal penyesuaian) → NSD 52jt seimbang.
  const worksheetAccount = (overrides) => ({
    saldo_awal_debit: 0,
    saldo_awal_credit: 0,
    mutasi_debit: 0,
    mutasi_credit: 0,
    saldo_sebelum_penyesuaian_debit: 0,
    saldo_sebelum_penyesuaian_credit: 0,
    penyesuaian_debit: 0,
    penyesuaian_credit: 0,
    nsd_debit: 0,
    nsd_credit: 0,
    laba_rugi_debit: 0,
    laba_rugi_credit: 0,
    neraca_debit: 0,
    neraca_credit: 0,
    penutup_debit: 0,
    penutup_credit: 0,
    saldo_akhir_debit: 0,
    saldo_akhir_credit: 0,
    ...overrides,
  });

  const mockWorksheetReport = {
    mode: 'worksheet',
    tanggal_from: '2026-11-01',
    tanggal_to: '2026-11-30',
    adjustment_journal_types: ['ADJUSTMENT', 'DEPRECIATION'],
    closing_journal_types: ['CLOSING'],
    closing_included: false,
    has_closing: false,
    laba_bersih: -1000000,
    accounts: [
      worksheetAccount({
        id: 101,
        kode_akun: '1101',
        nama_akun: 'Kas Utama',
        tipe: 'Aset',
        normal_balance: 'D',
        saldo_awal_debit: 2000000,
        mutasi_debit: 50000000,
        saldo_sebelum_penyesuaian_debit: 52000000,
        penyesuaian_credit: 1000000,
        nsd_debit: 51000000,
        neraca_debit: 51000000,
        saldo_akhir_debit: 51000000,
      }),
      worksheetAccount({
        id: 201,
        kode_akun: '3101',
        nama_akun: 'Modal Disetor',
        tipe: 'Modal',
        normal_balance: 'C',
        saldo_awal_credit: 2000000,
        mutasi_credit: 50000000,
        saldo_sebelum_penyesuaian_credit: 52000000,
        nsd_credit: 52000000,
        neraca_credit: 52000000,
        saldo_akhir_credit: 52000000,
      }),
      worksheetAccount({
        id: 301,
        kode_akun: '6220',
        nama_akun: 'Beban Operasional',
        tipe: 'Beban',
        normal_balance: 'D',
        penyesuaian_debit: 1000000,
        nsd_debit: 1000000,
        laba_rugi_debit: 1000000,
        saldo_akhir_debit: 1000000,
      }),
    ],
    totals: {
      saldo_awal_debit: 2000000,
      saldo_awal_credit: 2000000,
      mutasi_debit: 50000000,
      mutasi_credit: 50000000,
      saldo_sebelum_penyesuaian_debit: 52000000,
      saldo_sebelum_penyesuaian_credit: 52000000,
      penyesuaian_debit: 1000000,
      penyesuaian_credit: 1000000,
      nsd_debit: 52000000,
      nsd_credit: 52000000,
      laba_rugi_debit: 1000000,
      laba_rugi_credit: 0,
      neraca_debit: 51000000,
      neraca_credit: 52000000,
      penutup_debit: 0,
      penutup_credit: 0,
      saldo_akhir_debit: 52000000,
      saldo_akhir_credit: 52000000,
    },
    selisih: {
      saldo_awal: 0,
      mutasi: 0,
      sebelum_penyesuaian: 0,
      penyesuaian: 0,
      nsd: 0,
      laba_rugi: 0,
      penutup: 0,
      saldo_akhir: 0,
    },
    is_balanced: true,
  };

  const mockAdjustmentJournals = {
    account: { id: 101, kode_akun: '1101', nama_akun: 'Kas Utama', tipe: 'Aset' },
    adjustment_journal_types: ['ADJUSTMENT', 'DEPRECIATION'],
    journal_count: 1,
    total_debit: 0,
    total_credit: 1000000,
    journals: [
      {
        id: 9,
        nomor_jurnal: 'JU-ADJ-001',
        tanggal: '2026-11-30',
        tipe_jurnal: 'ADJUSTMENT',
        keterangan: 'Penyesuaian perlengkapan',
        status: 'posted',
        debit: 0,
        credit: 1000000,
        lines: [
          {
            id: 91,
            coa_id: 101,
            kode_akun: '1101',
            nama_akun: 'Kas Utama',
            debit: 0,
            credit: 1000000,
            keterangan: 'Penyesuaian',
          },
        ],
      },
    ],
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
    accountingService.getTrialBalanceAdjustments.mockResolvedValue({ data: mockAdjustmentJournals });
    accountingService.exportTrialBalance.mockResolvedValue(
      new Blob(['PK'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    );
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

  it('menampilkan kertas kerja sebelum/sesudah penyesuaian saat opsi dicentang', async () => {
    accountingService.getTrialBalance.mockResolvedValue({ data: mockWorksheetReport });

    render(<TrialBalancePage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /Kertas Kerja/i }));
    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(accountingService.getTrialBalance).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: 1, worksheet: true })
      );
    });

    await waitFor(() => {
      expect(screen.getAllByText(/Jurnal Penyesuaian/).length).toBeGreaterThan(0);
    });

    // Kolom kertas kerja lengkap: Neraca Saldo (sebelum penyesuaian), NSD,
    // Laba Rugi, dan Neraca.
    expect(screen.getByText('sebelum penyesuaian')).toBeInTheDocument();
    expect(screen.getByText('setelah penyesuaian')).toBeInTheDocument();
    expect(screen.getAllByText(/^Laba Rugi$/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Neraca$/).length).toBeGreaterThan(0);
    expect(screen.getByText('Kas Utama')).toBeInTheDocument();
    expect(screen.getAllByText('51.000.000').length).toBeGreaterThan(0);

    // Rincian saldo awal & mutasi hanya muncul saat opsi diaktifkan.
    expect(screen.queryByText(/^Saldo Awal$/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /Rincian saldo awal/i }));
    expect(screen.getAllByText(/Saldo Awal/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Mutasi Transaksi/).length).toBeGreaterThan(0);

    // Akun yang tersentuh penyesuaian ditandai (badge JP) dan dikelompokkan per tipe.
    expect(screen.getAllByText('JP').length).toBeGreaterThan(0);
    expect(screen.getByText('Subtotal Aset')).toBeInTheDocument();
    expect(screen.getByText('Subtotal Beban')).toBeInTheDocument();

    // Kontrol keseimbangan per tahap tersedia di footer kertas kerja.
    expect(screen.getByText(/Kontrol keseimbangan/)).toBeInTheDocument();
    expect(screen.getAllByText(/Jurnal penyesuaian: seimbang/).length).toBeGreaterThan(0);
  });

  it('membuka detail akun dari kertas kerja memakai saldo akhir (bisa diaudit)', async () => {
    accountingService.getTrialBalance.mockResolvedValue({ data: mockWorksheetReport });

    render(<TrialBalancePage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /Kertas Kerja/i }));
    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(screen.getByText('Kas Utama')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Detail' })[0]);

    await waitFor(() => {
      expect(accountingService.getTrialBalanceDetail).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: 1, coa_id: 101 })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Transaksi Pembentuk Saldo')).toBeInTheDocument();
    });
  });

  it('menyembunyikan akun tanpa saldo dan bisa ditampilkan kembali', async () => {
    accountingService.getTrialBalance.mockResolvedValue({
      data: {
        accounts: [
          ...mockReport.accounts,
          { id: 999, kode_akun: '9999', nama_akun: 'Akun Kosong', tipe: 'Aset', debit: 0, credit: 0 },
        ],
        total_debit: 50000000,
        total_credit: 50000000,
        selisih: 0,
        is_balanced: true,
      },
    });

    render(<TrialBalancePage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(screen.getByText('Kas Utama')).toBeInTheDocument();
    });

    expect(screen.queryByText('Akun Kosong')).not.toBeInTheDocument();
    expect(screen.getByText(/1 akun tanpa saldo disembunyikan/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: /Sembunyikan akun tanpa saldo/i }));

    await waitFor(() => {
      expect(screen.getByText('Akun Kosong')).toBeInTheDocument();
    });
  });

  it('membuka daftar jurnal penyesuaian dari header dan bisa lanjut ke Jurnal Umum', async () => {
    render(<TrialBalancePage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Jurnal Penyesuaian/i }));

    await waitFor(() => {
      expect(accountingService.getTrialBalanceAdjustments).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: 1 })
      );
    });

    expect(await screen.findByText('JU-ADJ-001')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Buka di Jurnal Umum/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/akuntansi/jurnal?tipe_jurnal=ADJUSTMENT');
  });

  it('membuka jurnal penyesuaian akun saat sel Penyesuaian diklik', async () => {
    accountingService.getTrialBalance.mockResolvedValue({ data: mockWorksheetReport });

    render(<TrialBalancePage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /Kertas Kerja/i }));
    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(screen.getByText('Kas Utama')).toBeInTheDocument();
    });

    // Sel penyesuaian kredit Kas (1jt) bisa diklik untuk audit jurnalnya.
    fireEvent.click(screen.getByRole('button', { name: /kredit akun 1101/i }));

    await waitFor(() => {
      expect(accountingService.getTrialBalanceAdjustments).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: 1, coa_id: 101 })
      );
    });

    expect(await screen.findByText('JU-ADJ-001')).toBeInTheDocument();
    expect(screen.getByText(/Neto Kolom Penyesuaian/)).toBeInTheDocument();
  });

  it('mengirim include_closing saat jurnal penutup disertakan', async () => {
    accountingService.getTrialBalance.mockResolvedValue({ data: mockWorksheetReport });

    render(<TrialBalancePage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /Kertas Kerja/i }));
    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(screen.getByText('Kas Utama')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /Sertakan jurnal penutup/i }));

    await waitFor(() => {
      expect(accountingService.getTrialBalance).toHaveBeenLastCalledWith(
        expect.objectContaining({ worksheet: true, include_closing: 1 })
      );
    });
  });

  it('mengekspor kertas kerja ke Excel', async () => {
    window.URL.createObjectURL = jest.fn(() => 'blob:mock');
    window.URL.revokeObjectURL = jest.fn();
    accountingService.getTrialBalance.mockResolvedValue({ data: mockWorksheetReport });

    render(<TrialBalancePage />);

    await waitFor(() => {
      expect(screen.getByText('PT Ternak Jaya (HO)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /Kertas Kerja/i }));
    fireEvent.click(screen.getByRole('button', { name: /Tampilkan/i }));

    await waitFor(() => {
      expect(screen.getByText('Kas Utama')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Unduh Excel/i }));

    await waitFor(() => {
      expect(accountingService.exportTrialBalance).toHaveBeenCalledWith(
        expect.objectContaining({ setting_id: 1, worksheet: true }),
        'xlsx'
      );
    });
  });
});
