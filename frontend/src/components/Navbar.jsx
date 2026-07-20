import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ onOpenAuth }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Revert back to original nav items layout (matching mockup), adding Dashboard/Profile when logged in
  const navItems = user ? [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard' },
    { id: 'tracker', path: '/tracker', label: 'Tracker' },
    { id: 'explore', path: '/explore', label: 'Explored' },
    { id: 'bookmarks', path: '/bookmarks', label: 'Bookmarks' },
    { id: 'profile', path: '/profile', label: 'Profile' }
  ] : [
    { id: 'home', path: '/', label: 'Home' },
    { id: 'tracker', path: '/tracker', label: 'Tracker' },
    { id: 'explore', path: '/explore', label: 'Explored' },
    { id: 'bookmarks', path: '/bookmarks', label: 'Bookmarks' }
  ];

  const handleNavClick = (item) => {
    if (item.path === '/' || user) {
      navigate(item.path);
    } else {
      onOpenAuth();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className='flex justify-between items-center px-8 py-4 select-none relative z-50'>
      <div>
        <h1 
          className='text-2xl font-bold cursor-pointer hover:text-green-700 transition-colors' 
          onClick={() => navigate(user ? '/dashboard' : '/')}
        >
          Job Tracker
        </h1>
      </div>
      
      <div className='flex gap-4 items-center justify-center bg-lime-400/20 px-6 py-2 rounded-3xl border border-transparent'>
        <ul className='flex gap-4 items-center justify-center font-medium text-neutral-800 text-sm'>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`cursor-pointer hover:text-green-700 transition-colors ${
                  isActive ? 'text-green-700 font-bold' : ''
                }`}
              >
                {item.label}
              </li>
            );
          })}
        </ul>

        {user ? (
          <div className='flex items-center gap-3'>
            <span className='hidden sm:inline text-xs font-bold text-neutral-800 bg-lime-400/20 px-3 py-1 rounded-full border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'>
              Hi, {user.firstname}
            </span>
            <button
              onClick={handleLogout}
              className='bg-rose-500 text-white font-extrabold px-5 py-2 border-2 border-neutral-900 rounded-xl hover:bg-rose-400 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer text-sm'
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className='bg-[#a3e635] text-neutral-950 font-extrabold px-5 py-2 border-2 border-neutral-900 rounded-xl hover:bg-lime-400 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer text-sm'
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;