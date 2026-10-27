import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IoChevronDownOutline,
  IoPersonOutline,
  IoSettingsOutline,
  IoLogOutOutline,
  IoDocumentTextOutline
} from 'react-icons/io5';

const Navbar = ({ onOpenAuth }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close profile menu on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

  // Main navigation items
  const navItems = user
    ? [
        { id: 'dashboard', path: '/dashboard', label: 'Dashboard' },
        { id: 'tracker', path: '/tracker', label: 'Tracker' },
        { id: 'explore', path: '/explore', label: 'Explored' },
        { id: 'bookmarks', path: '/bookmarks', label: 'Bookmarks' }
      ]
    : [
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
    setProfileMenuOpen(false);
    logout();
    navigate('/');
  };

  // Generate user initials
  const initials = user
    ? `${user.firstname?.[0] || ''}${user.lastname?.[0] || ''}`.toUpperCase() || 'U'
    : '';

  return (
    <nav className="flex justify-between items-center px-4 sm:px-8 py-4 select-none relative z-50">
      {/* Brand Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer select-none group"
        onClick={() => navigate(user ? '/dashboard' : '/')}
      >
        <div className="w-8 h-8 rounded-lg bg-[#a3e635] border-2 border-black flex items-center justify-center font-black text-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:bg-lime-400 transition-colors">
          JT
        </div>
        <span className="font-extrabold text-xl tracking-tight text-neutral-900 group-hover:text-green-700 transition-colors">
          Job Tracker
        </span>
      </div>

      {/* Nav pill container */}
      <div className="flex gap-4 items-center justify-center bg-lime-400/20 px-4 sm:px-6 py-2 rounded-3xl border border-transparent">
        <ul className="flex gap-3 sm:gap-4 items-center justify-center font-medium text-neutral-800 text-xs sm:text-sm">
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
          /* Profile Menu Dropdown */
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-expanded={profileMenuOpen}
              aria-haspopup="true"
              aria-label="User profile menu"
              className="flex items-center gap-2 bg-white text-neutral-900 font-bold px-3 py-1.5 border-2 border-neutral-900 rounded-xl hover:bg-neutral-50 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer text-xs"
            >
              <div className="w-6 h-6 rounded-md bg-[#a3e635] border border-neutral-900 flex items-center justify-center text-[10px] font-black text-neutral-900">
                {initials}
              </div>
              <span className="hidden sm:inline font-bold text-neutral-800">
                {user.firstname}
              </span>
              <IoChevronDownOutline
                className={`w-3.5 h-3.5 text-neutral-600 transition-transform duration-200 ${
                  profileMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown panel */}
            {profileMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white border-2 border-neutral-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                role="menu"
                aria-orientation="vertical"
              >
                {/* User info snippet */}
                <div className="px-4 py-2 border-b border-neutral-100">
                  <p className="text-xs font-black text-neutral-900 truncate">
                    {user.firstname} {user.lastname}
                  </p>
                  <p className="text-[11px] text-neutral-500 truncate font-mono">
                    {user.email}
                  </p>
                </div>

                {/* Menu items */}
                <div className="py-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/profile');
                    }}
                    className={`w-full text-left px-4 py-2 flex items-center gap-2.5 font-bold hover:bg-lime-50 transition-colors cursor-pointer ${
                      location.pathname === '/profile'
                        ? 'text-lime-700 bg-lime-50/60 font-black'
                        : 'text-neutral-700'
                    }`}
                    role="menuitem"
                  >
                    <IoPersonOutline className="w-4 h-4 text-lime-700 flex-shrink-0" />
                    <span>Candidate Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/settings');
                    }}
                    className={`w-full text-left px-4 py-2 flex items-center gap-2.5 font-bold hover:bg-lime-50 transition-colors cursor-pointer ${
                      location.pathname === '/settings'
                        ? 'text-lime-700 bg-lime-50/60 font-black'
                        : 'text-neutral-700'
                    }`}
                    role="menuitem"
                  >
                    <IoSettingsOutline className="w-4 h-4 text-neutral-700 flex-shrink-0" />
                    <span>Settings</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-neutral-100 my-1"></div>

                {/* Logout action */}
                <div className="px-2 py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 flex items-center gap-2.5 font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-xs"
                    role="menuitem"
                  >
                    <IoLogOutOutline className="w-4 h-4 flex-shrink-0" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="bg-[#a3e635] text-neutral-950 font-extrabold px-5 py-2 border-2 border-neutral-900 rounded-xl hover:bg-lime-400 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer text-sm"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;