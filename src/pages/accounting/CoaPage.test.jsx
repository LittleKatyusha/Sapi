import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CoaPage from './CoaPage';
import accountingService from '../../services/accountingService';
import downloadPdf from '../../utils/downloadPdf';

jest.mock('../../services/accountingService');
jest.mock('../../utils/downloadPdf', () => jest.fn());

window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
window.URL.revokeObjectURL = jest.fn();
window.open = jest.fn();
HTMLAnchorElement.prototype.click = jest.fn();

describe('CoaPage', () => {
  const mockAccounts = [
    {
      id: 1,
      kode_akun: '1000',
      nama_akun: 'Aset Lancar',
      tipe: 'Aset',
      normal_balance: 'D',
      parent_id: null,
      is_active: true,
      is_posting: false,
    },
    {
      id: 2,
      kode_akun: '1010',
      nama_akun: 'Kas Operasional',
      tipe: 'Aset',
      normal_balance: 'D',
      parent_id: 1,
      is_active: true,
      is_posting: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = jest.fn();
    global.URL.createObjectURL = window.URL.createObjectURL;
    global.URL.revokeObjectURL = window.URL.revokeObjectURL;
    URL.createObjectURL = window.URL.createObjectURL;
    URL.revokeObjectURL = window.URL.revokeObjectURL;
    window.open = jest.fn().mockReturnValue({});
    accountingService.getCoa.mockResolvedValue({ data: mockAccounts });
    accountingService.exportCoa.mockResolvedValue(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));
  });

  it('renders and displays COA accounts', async () => {
    render(<CoaPage />);

    await waitFor(() => {
      expect(screen.getByText('1000')).toBeInTheDocument();
      expect(screen.getByText('Aset Lancar')).toBeInTheDocument();
      expect(screen.getByText('1010')).toBeInTheDocument();
      expect(screen.getByText('Kas Operasional')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Cetak PDF/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unduh PDF/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unduh Excel/i })).toBeInTheDocument();
  });

  it('triggers PDF print when Cetak PDF is clicked', async () => {
    render(<CoaPage />);

    await waitFor(() => {
      expect(screen.getByText('1000')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Cetak PDF/i }));

    await waitFor(() => {
      expect(accountingService.exportCoa).toHaveBeenCalledWith({ stream: 1 }, 'pdf');
      expect(window.open).toHaveBeenCalledWith('blob:mock-url', '_blank');
    });
  });

  it('triggers PDF download when Unduh PDF is clicked', async () => {
    render(<CoaPage />);

    await waitFor(() => {
      expect(screen.getByText('1000')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Unduh PDF/i }));

    await waitFor(() => {
      expect(accountingService.exportCoa).toHaveBeenCalledWith({}, 'pdf');
      expect(downloadPdf).toHaveBeenCalled();
    });
  });

  it('triggers Excel download when Unduh Excel is clicked', async () => {
    render(<CoaPage />);

    await waitFor(() => {
      expect(screen.getByText('1000')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Unduh Excel/i }));

    await waitFor(() => {
      expect(accountingService.exportCoa).toHaveBeenCalledWith({}, 'xlsx');
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    });
  });
});
