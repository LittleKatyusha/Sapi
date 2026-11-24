import { render, screen, fireEvent } from '@testing-library/react';
import FixedAssetPage from './FixedAssetPage';
import accountingService from '../../services/accountingService';

jest.mock('../../services/accountingService');
// react-router-dom v7 hanya ESM sehingga tidak bisa di-resolve Jest (CRA5).
jest.mock(
  'react-router-dom',
  () => ({
    Link: ({ to, children, ...rest }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  }),
  { virtual: true }
);

describe('FixedAssetPage', () => {
  const mockSettings = [
    { id: 1, nama_perusahaan: 'Ternasys HO', entitas: 'HO' },
  ];

  const mockAssets = [
    {
      id: 1,
      kode_aset: 'AST-001',
      nama_aset: 'Toyota Hilux',
      kategori: 'kendaraan',
      tipe_valuasi: 'depresiasi',
      harga_perolehan: '120000000',
      akumulasi_depresiasi: '10000000',
      nilai_buku: 110000000,
      umur_bulan: 48,
      status: 'active',
      ref_table: null,
    },
    {
      id: 2,
      kode_aset: 'AST-002',
      nama_aset: 'Emas Batangan',
      kategori: 'logam_mulia',
      tipe_valuasi: 'apresiasi',
      harga_perolehan: '50000000',
      nilai_pasar_terkini: '60000000',
      nilai_buku: 60000000,
      akumulasi_depresiasi: '0',
      status: 'active',
      ref_table: null,
    },
    {
      id: 3,
      kode_aset: 'AST-003',
      nama_aset: 'Mesin Chopper Pakan',
      kategori: 'mesin',
      tipe_valuasi: 'depresiasi',
      harga_perolehan: '200000000',
      akumulasi_depresiasi: '0',
      nilai_buku: 200000000,
      umur_bulan: null, // Auto from purchase, not yet configured
      status: 'active',
      ref_table: 'tr_pembelian_ho_lainlain',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    accountingService.getSettings.mockResolvedValue({ data: mockSettings });
    accountingService.getCoa.mockResolvedValue({ data: [] });
    accountingService.getAssets.mockResolvedValue({ data: mockAssets });
  });

  it('renders fixed assets list and summary', async () => {
    render(<FixedAssetPage />);

    expect(await screen.findByText('Manajemen Aset (Aset Tetap & Investasi)')).toBeInTheDocument();
    expect(await screen.findByText('Toyota Hilux')).toBeInTheDocument();
    expect(await screen.findByText('Emas Batangan')).toBeInTheDocument();
    expect(await screen.findByText('Mesin Chopper Pakan')).toBeInTheDocument();
    expect(screen.getByText(/Total: 3 aset/)).toBeInTheDocument();
    expect(screen.getByText(/Belum Diatur/)).toBeInTheDocument();
  });

  it('opens edit modal on atur umur button click for unconfigured assets', async () => {
    render(<FixedAssetPage />);

    const aturBtn = await screen.findByText('Atur Umur');
    fireEvent.click(aturBtn);

    expect(screen.getByText('Atur Parameter & Umur Aset')).toBeInTheDocument();
    expect(screen.getByText(/Masa manfaat aset belum diatur/)).toBeInTheDocument();
  });

  it('opens revaluation modal on button click for appreciation assets', async () => {
    render(<FixedAssetPage />);

    const revalBtn = await screen.findByText('Update Harga Pasar');
    fireEvent.click(revalBtn);

    expect(screen.getByText('Update Nilai Pasar (Revaluasi)')).toBeInTheDocument();
  });

  it('opens disposal modal on lepas button click', async () => {
    render(<FixedAssetPage />);

    const disposeButtons = await screen.findAllByTitle('Lepas / jual aset');
    fireEvent.click(disposeButtons[0]);

    expect(screen.getByText('Lepas / Jual Aset')).toBeInTheDocument();
  });

  it('does not offer manual asset creation (assets come from pembelian lain-lain)', async () => {
    render(<FixedAssetPage />);

    expect(await screen.findByText('Input dari Pembelian Lain-Lain')).toBeInTheDocument();
    expect(screen.queryByText('Tambah Aset Baru')).not.toBeInTheDocument();
    expect(
      screen.getByText(/Aset baru otomatis dibuat dari menu Pembelian Lain-Lain/i)
    ).toBeInTheDocument();
  });
});
