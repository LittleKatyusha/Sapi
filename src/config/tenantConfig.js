export const TENANTS = {
  puput: {
    id: 'puput',
    companyName: 'CV Puput',
    fullName: 'CV Puput Bersaudara',
    tagline: 'Platform terintegrasi pengelolaan ternak, persediaan, dan distribusi sapi yang efisien dan aman.',
    sidebarBgHex: '#065F46',
    loginGradient: 'from-emerald-950 via-emerald-900 to-teal-950',
    loginAccentText: 'text-emerald-300',
    loginGlow1: 'bg-emerald-500/20',
    loginGlow2: 'bg-teal-400/20',
    loginBtnClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20 hover:shadow-emerald-500/30 focus:ring-emerald-500/20',
    inputFocusClass: 'focus:border-emerald-500 focus:ring-emerald-500/10',
    iconFocusClass: 'group-focus-within:text-emerald-600',
    linkClass: 'text-emerald-600 hover:text-emerald-700',
    checkboxClass: 'text-emerald-600 focus:ring-emerald-500/20',
    mobileIconGradient: 'from-emerald-500 to-teal-600 shadow-emerald-500/20'
  },
  rph: {
    id: 'rph',
    companyName: 'PT RPH',
    fullName: 'PT RPH',
    tagline: 'Platform terintegrasi operasional pemotongan dan distribusi Rumah Potong Hewan.',
    sidebarBgHex: '#991B1B',
    loginGradient: 'from-red-950 via-red-900 to-rose-950',
    loginAccentText: 'text-red-300',
    loginGlow1: 'bg-red-500/20',
    loginGlow2: 'bg-rose-400/20',
    loginBtnClass: 'bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 shadow-red-500/20 hover:shadow-red-500/30 focus:ring-red-500/20',
    inputFocusClass: 'focus:border-red-600 focus:ring-red-600/10',
    iconFocusClass: 'group-focus-within:text-red-700',
    linkClass: 'text-red-700 hover:text-red-800',
    checkboxClass: 'text-red-700 focus:ring-red-700/20',
    mobileIconGradient: 'from-red-700 to-rose-700 shadow-red-500/20'
  },
  feedmil: {
    id: 'feedmil',
    companyName: 'PT Feedmil',
    fullName: 'PT Feedmil',
    tagline: 'Platform terintegrasi pengelolaan pakan ternak konsentrat.',
    sidebarBgHex: '#92400E',
    loginGradient: 'from-amber-950 via-amber-900 to-yellow-950',
    loginAccentText: 'text-amber-300',
    loginGlow1: 'bg-amber-500/20',
    loginGlow2: 'bg-yellow-400/20',
    loginBtnClass: 'bg-gradient-to-r from-amber-700 to-yellow-700 hover:from-amber-800 hover:to-yellow-800 shadow-amber-500/20 hover:shadow-amber-500/30 focus:ring-amber-500/20',
    inputFocusClass: 'focus:border-amber-600 focus:ring-amber-600/10',
    iconFocusClass: 'group-focus-within:text-amber-700',
    linkClass: 'text-amber-700 hover:text-amber-800',
    checkboxClass: 'text-amber-700 focus:ring-amber-700/20',
    mobileIconGradient: 'from-amber-700 to-yellow-700 shadow-amber-500/20'
  }
};

export const resolveTenant = () => {
  if (typeof window === 'undefined') return TENANTS.puput;

  const urlParams = new URLSearchParams(window.location.search);
  const paramTenant = urlParams.get('tenant')?.toLowerCase();
  if (paramTenant && TENANTS[paramTenant]) {
    sessionStorage.setItem('active_tenant', paramTenant);
    return TENANTS[paramTenant];
  }

  const hostname = window.location.hostname.toLowerCase();
  const subdomain = hostname.split('.')[0];
  if (TENANTS[subdomain]) {
    return TENANTS[subdomain];
  }

  const saved = sessionStorage.getItem('active_tenant');
  if (saved && TENANTS[saved]) {
    return TENANTS[saved];
  }

  return TENANTS.puput;
};
