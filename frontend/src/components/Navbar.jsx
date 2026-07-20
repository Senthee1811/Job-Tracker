import React from 'react';
import logo from '../assets/logo.svg';
import { useAuth } from '../contexts/AuthContext';

const Navbar = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'tracker', label: 'Tracker' },
    { id: 'explore', label: 'Explore' },
    { id: 'bookmarks', label: 'Bookmarks' },
    { id: 'profile', label: 'Profile' }
  ];

  return (
    <nav className='flex justify-between items-center px-6 md:px-12 py-4 select-none relative z-50'>
      <div className='flex items-center gap-2 cursor-pointer' onClick={() => setActiveTab('home')}>
        <img src={logo} alt="JT Logo" className='h-8 md:h-10 object-contain' />
      </div>

      <div className='flex gap-3 md:gap-6 items-center justify-center bg-lime-400/10 border border-lime-400/30 px-4 md:px-6 py-2 rounded-full backdrop-blur-md shadow-sm'>
        <ul className='flex gap-3 md:gap-5 items-center justify-center text-xs md:text-sm font-medium text-neutral-700'>
          {navItems.map((item) => (
            <li
              key={item.id}
              onClick={() => {
                if (item.id !== 'home' && !user) {
                  onOpenAuth();
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`cursor-pointer hover:text-lime-600 transition-colors ${
                activeTab === item.id ? 'text-lime-600 font-bold' : ''
              }`}
            >
              {item.label}
            </li>
          ))}
        </ul>

        {user ? (
          <div className='flex items-center gap-2'>
            <span className='hidden md:inline text-xs text-neutral-600 bg-lime-400/20 px-2 py-0.5 rounded-full font-semibold border border-lime-400/30'>
              Hi, {user.firstname}
            </span>
            <button
              onClick={logout}
              className='bg-red-400 text-white text-xs md:text-sm font-semibold px-3 py-1.5 border border-black rounded-lg transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer'
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className='bg-[#a3e635] text-neutral-900 text-xs md:text-sm font-bold px-4 py-1.5 border border-black rounded-lg hover:bg-lime-500 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer'
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;