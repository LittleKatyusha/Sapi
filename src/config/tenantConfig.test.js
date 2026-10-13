import { TENANTS, resolveTenant } from './tenantConfig';

describe('Tenant Configuration Resolution', () => {
  const originalLocation = window.location;

  afterEach(() => {
    delete window.location;
    window.location = originalLocation;
    sessionStorage.clear();
  });

  test('resolves default to puput when no match', () => {
    delete window.location;
    window.location = new URL('https://app.ternasys.com');
    expect(resolveTenant().id).toBe('puput');
  });

  test('resolves rph from subdomain', () => {
    delete window.location;
    window.location = new URL('https://rph.ternasys.com');
    expect(resolveTenant().id).toBe('rph');
    expect(resolveTenant().sidebarBgHex).toBe('#991B1B');
  });

  test('resolves feedmil from subdomain', () => {
    delete window.location;
    window.location = new URL('https://feedmil.ternasys.com');
    expect(resolveTenant().id).toBe('feedmil');
    expect(resolveTenant().sidebarBgHex).toBe('#92400E');
  });

  test('resolves tenant from search query parameter', () => {
    delete window.location;
    window.location = new URL('http://localhost:3000/?tenant=rph');
    expect(resolveTenant().id).toBe('rph');
  });
});
