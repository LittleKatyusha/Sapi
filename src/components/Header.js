import React from 'react';
import { Search, ChevronDown, Menu } from 'lucide-react';

const Header = ({ onMenuClick }) => {
    return (
        <header className="bg-white p-4 flex justify-between items-center rounded-xl shadow-md mb-6 sticky top-0 z-20">
            <div className="flex items-center">
                <button onClick={onMenuClick} className="md:hidden mr-4 p-2 rounded-md hover:bg-gray-100">
                    <Menu size={24} className="text-gray-600"/>
                </button>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Manajemen Aplikasi</h1>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="hidden sm:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" placeholder="Cari..." className="pl-10 pr-4 py-2 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 w-32 md:w-64"/>
              </div>

              {/* Tombol Notifikasi telah dihapus */}

              <div className="flex items-center space-x-2 cursor-pointer">
                <img src="https://placehold.co/40x40/E2E8F0/4A5568?text=A" alt="Avatar" className="w-10 h-10 rounded-full"/>
                <div className="hidden md:block">
                  <p className="font-semibold text-sm">Budi Santoso</p>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
                <ChevronDown size={16} className="text-gray-500" />
              </div>
            </div>
        </header>
    );
};

export default Header;
