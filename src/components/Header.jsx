import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Menu, LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    };

    return (
        <header className="bg-white p-4 flex justify-between items-center rounded-xl shadow-md mb-6">
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

              {/* User Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <div 
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <img src="https://placehold.co/40x40/E2E8F0/4A5568?text=A" alt="Avatar" className="w-10 h-10 rounded-full"/>
                  <div className="hidden md:block">
                    <p className="font-semibold text-sm">Budi Santoso</p>
                    <p className="text-xs text-gray-500">Admin</p>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  />
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-semibold text-sm text-gray-900">Budi Santoso</p>
                      <p className="text-xs text-gray-500">admin@example.com</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User size={16} className="mr-3" />
                      Profile
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings size={16} className="mr-3" />
                      Settings
                    </button>
                    
                    <hr className="my-1" />
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} className="mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
        </header>
    );
};

export default Header;
