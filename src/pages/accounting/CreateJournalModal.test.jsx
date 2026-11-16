import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateJournalModal from './CreateJournalModal';
import accountingService from '../../services/accountingService';

jest.mock('../../services/accountingService');

describe('CreateJournalModal', () => {
  const mockAccounts = [
    { id: 1, kode_akun: '1010', nama_akun: 'Kas', tipe: 'Aset', is_posting: true },
    { id: 2, kode_akun: '1020', nama_akun: 'Bank Mandiri', tipe: 'Aset', is_posting: true },
    { id: 3, kode_akun: '3000', nama_akun: 'Modal Saham', tipe: 'Modal', is_posting: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <CreateJournalModal
        isOpen={false}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        selectedSettingId="1"
        accounts={mockAccounts}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when open with proper account options', () => {
    render(
      <CreateJournalModal
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        selectedSettingId="1"
        settingName="PT Ternasys (HO)"
        accounts={mockAccounts}
      />
    );

    expect(screen.getByText('Buat Jurnal Draft')).toBeInTheDocument();
    expect(screen.getByText('Entitas: PT Ternasys (HO)')).toBeInTheDocument();
    expect(screen.getByText('BELUM SEIMBANG')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <CreateJournalModal
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
