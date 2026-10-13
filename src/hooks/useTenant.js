import { useState, useEffect } from 'react';
import { resolveTenant } from '../config/tenantConfig';

export const useTenant = () => {
  const [tenant, setTenant] = useState(resolveTenant);

  useEffect(() => {
    const current = resolveTenant();
    setTenant(current);
    document.documentElement.setAttribute('data-tenant', current.id);
  }, []);

  return tenant;
};
