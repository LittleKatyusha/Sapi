import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginPageSecure from './LoginPageSecure';
import { TENANTS } from '../config/tenantConfig';

let mockTenant = TENANTS.puput;

jest.mock('../hooks/useTenant', () => ({
  useTenant: () => mockTenant
}));

jest.mock('../hooks/useAuthSecure', () => ({
  useAuthSecure: () => ({
    login: jest.fn()
  })
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: null })
}), { virtual: true });

describe('LoginPageSecure multi-tenant design', () => {
  beforeEach(() => {
    mockTenant = TENANTS.puput;
  });

  test('renders Puput design with split panel and TernaSys', () => {
    mockTenant = TENANTS.puput;
    render(<LoginPageSecure />);

    expect(screen.getAllByText('TernaSys').length).toBeGreaterThan(0);
    expect(screen.getByText('CV Puput Bersaudara')).toBeInTheDocument();
  });

  test('renders Rph design with industrial terminal layout', () => {
    mockTenant = TENANTS.rph;
    render(<LoginPageSecure />);

    expect(screen.getByText('TERMINAL OPERASIONAL RPH')).toBeInTheDocument();
    expect(screen.getByText('PT RPH')).toBeInTheDocument();
    expect(screen.getByText('ID Petugas / Email')).toBeInTheDocument();
    expect(screen.getByText('Masuk Terminal')).toBeInTheDocument();
  });

  test('renders Feedmil design with agro-industry card layout', () => {
    mockTenant = TENANTS.feedmil;
    render(<LoginPageSecure />);

    expect(screen.getByText('Sistem Pakan Konsentrat')).toBeInTheDocument();
    expect(screen.getByText('Solusi Nutrisi Ternak Terintegrasi')).toBeInTheDocument();
    expect(screen.getByText('Masuk ke Akun')).toBeInTheDocument();
  });
});
