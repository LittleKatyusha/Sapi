import React from 'react';
import { 
  LayoutDashboard, ShoppingCart, DollarSign, 
  Warehouse, Beef, FileText, Settings 
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentPath = pathSegments[0] || 'dashboard';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'penjualan', label: 'Penjualan', icon: DollarSign },
    { id: 'pembelian', label: 'Pembelian', icon: ShoppingCart },
    { id: 'stok_ternak', label: 'Stok', icon: Warehouse },
    { id: 'pengaturan', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(`/${item.id}`)}
            className={`flex flex-col items-center justify-center p-2 w-full ${
              currentPath === item.id ? 'text-red-600' : 'text-gray-600'
            }`}
            aria-label={item.label}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileBottomNav;