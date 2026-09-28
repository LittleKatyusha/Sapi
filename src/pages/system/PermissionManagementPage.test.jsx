import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PermissionManagementPage from './PermissionManagementPage';
import permissionService from '../../services/permissionService';
import roleService from '../../services/roleService';

jest.mock('../../services/permissionService', () => ({ getDefinitions: jest.fn(), getByRole: jest.fn(), bulkCreate: jest.fn(), delete: jest.fn() }));
jest.mock('../../services/roleService', () => ({ getAll: jest.fn() }));

test('capability discoverable without DB definition; arbitrary role grants and revokes through existing UI', async () => {
  const capability = { service_name: 'rph.inventory', function_name: 'all-rph', method: 'GET', value: 'rph.inventory.all-rph' };
  let rows = [];
  roleService.getAll.mockResolvedValue([{ id: 19, nama: 'Operator biasa' }]);
  permissionService.getDefinitions.mockResolvedValue([]);
  permissionService.getByRole.mockImplementation(async () => rows);
  permissionService.bulkCreate.mockImplementation(async () => { rows = [{ ...capability, pid: 'grant' }]; });
  permissionService.delete.mockImplementation(async () => { rows = []; });
  render(<PermissionManagementPage />);
  fireEvent.click(await screen.findByText('Atur Permission'));
  fireEvent.click(await screen.findByText('Persediaan lintas kantor (ALL RPH)'));
  fireEvent.click(screen.getAllByText('Simpan Perubahan')[0]);
  await waitFor(() => expect(permissionService.bulkCreate).toHaveBeenCalledWith([{ ...capability, roles_id: 19 }]));
  await waitFor(() => expect(permissionService.getByRole).toHaveBeenCalledTimes(2));
  fireEvent.click(await screen.findByText('Persediaan lintas kantor (ALL RPH)'));
  fireEvent.click(screen.getAllByText('Simpan Perubahan')[0]);
  await waitFor(() => expect(permissionService.delete).toHaveBeenCalledWith('grant'));
});
