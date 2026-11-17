import { render, screen, fireEvent } from '@testing-library/react';
import CreateAssetModal from './CreateAssetModal';

jest.mock('../../services/accountingService');

describe('CreateAssetModal', () => {
  const mockAccounts = [
    { id: 1, kode_akun: '1520', nama_akun: 'Kendaraan', tipe: 'Aset', is_posting: true },
    { id: 2, kode_akun: '1620', nama_akun: 'Akum. Penyusutan Kendaraan', tipe: 'Aset', is_posting: true },
    { id: 3, kode_akun: '6700', nama_akun: 'Beban Penyusutan Aset', tipe: 'Beban', is_posting: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <CreateAssetModal
        isOpen={false}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        selectedSettingId="1"
        accounts={mockAccounts}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with searchable select fields when open', () => {
    render(
      <CreateAssetModal
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        selectedSettingId="1"
        settingName="Ternasys HO"
        accounts={mockAccounts}
      />
    );

    expect(screen.getByText('Tambah Aset Baru')).toBeInTheDocument();
    expect(screen.getByText('Entitas: Ternasys HO')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contoh: AST-001 / HILUX-01')).toBeInTheDocument();
    expect(screen.getByText('Simpan Aset')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <CreateAssetModal
        isOpen={true}
        onClose={onClose}
        onSuccess={jest.fn()}
        selectedSettingId="1"
        accounts={mockAccounts}
      />
    );

    const closeBtn = screen.getByLabelText('Tutup');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
