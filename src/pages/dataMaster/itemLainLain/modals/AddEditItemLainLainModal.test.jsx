import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddEditItemLainLainModal from './AddEditItemLainLainModal';

jest.mock('../../klasifikasiLainLain/hooks/useKlasifikasiLainLain', () => () => ({
  klasifikasiLainLain: [{ id: 1, name: 'BIAYA OPERASIONAL', description: 'Operasional' }],
  loading: false,
  fetchKlasifikasiLainLain: jest.fn(),
}));

const mockFetchCoaOptions = jest.fn().mockResolvedValue([
  { value: 10, label: '5101 - Beban Operasional (Beban)', kode_akun: '5101', nama_akun: 'Beban Operasional', tipe: 'Beban' },
]);

jest.mock('../hooks/useItemLainLain', () => () => ({
  fetchCoaOptions: mockFetchCoaOptions,
}));

describe('AddEditItemLainLainModal', () => {
  it('renders coa selection field and saves with coa_id', async () => {
    const onSave = jest.fn().mockResolvedValue();
    const onClose = jest.fn();

    render(<AddEditItemLainLainModal onClose={onClose} onSave={onSave} />);

    await waitFor(() => {
      expect(screen.getByText(/Akun COA \(Chart of Accounts\)/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText(/Masukkan nama item/i), { target: { value: 'KERTAS A4' } });
    fireEvent.change(screen.getByPlaceholderText(/Masukkan deskripsi item/i), { target: { value: 'Kebutuhan cetak' } });

    fireEvent.click(screen.getByRole('button', { name: /Simpan/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'KERTAS A4',
          description: 'Kebutuhan cetak',
          id_klasifikasi_lain_lain: 1,
          coa_id: null,
        })
      );
    });
  });

  it('prefills coa_id when item is passed for editing', () => {
    const item = {
      id: 5,
      name: 'Pena Bolpoin',
      description: 'Alat tulis',
      id_klasifikasi_lain_lain: 1,
      coa_id: 10,
      coa_kode: '5101',
      coa_nama: 'Beban Operasional',
    };

    render(<AddEditItemLainLainModal item={item} onClose={jest.fn()} onSave={jest.fn()} />);

    expect(screen.getByDisplayValue('Pena Bolpoin')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Alat tulis')).toBeInTheDocument();
    expect(screen.getByText('Edit Item Lain-Lain')).toBeInTheDocument();
  });
});
