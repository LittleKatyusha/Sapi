import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FixedAssetPage from './FixedAssetPage';
import accountingService from '../../services/accountingService';

jest.mock('../../services/accountingService');

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
    expect(screen.getByText(/Total: 2 aset/)).toBeInTheDocument();
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
});
