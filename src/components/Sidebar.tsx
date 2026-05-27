import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ClipboardList,
  MessageCircle,
  ShieldAlert,
  User,
  Heart,
  LogOut,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeNav: string;
  onLogout?: () => void;
  handleLogout?: () => void;
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  onCloseSidebar?: () => void;
}

export function Sidebar({ activeNav, onLogout, handleLogout, onNavigate, setActiveNav, onCloseSidebar }: SidebarProps) {
  const navigate = useNavigate();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const logoutMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (logoutMenuRef.current && !logoutMenuRef.current.contains(event.target as Node)) {
        setShowLogoutMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (page: string, navLabel: string) => {
    if (onNavigate) {
      // Discover lives in the main shell, so normalize it back to the main page state.
      onNavigate(page === 'discover' ? 'main' : page);
      if (setActiveNav) {
        setActiveNav(navLabel);
      }
      onCloseSidebar?.();
    } else {
      navigate(`/${page}`);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutMenu((current) => !current);
  };

  const confirmLogout = () => {
    setShowLogoutMenu(false);
    if (handleLogout) {
      handleLogout();
    } else if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#0F0F13] px-2 md:px-4 py-2 md:py-3 rounded-t-2xl">
      {/* Bottom Navbar */}
      <nav className="flex items-center justify-between gap-0.5 md:gap-3 max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-0.5 md:gap-4 flex-1 min-w-0">
          {/* Discover Section */}
          <NavItem
            icon={<Compass size={18} />}
            label="Discover"
            isActive={activeNav === 'Discover'}
            onClick={() => handleNavigate('discover', 'Discover')}
          />
          
          <NavItem
            icon={<Heart size={18} />}
            label="Nearby"
            isActive={activeNav === 'Nearby'}
            onClick={() => handleNavigate('nearby', 'Nearby')}
          />
          
          <NavItem
            icon={<ClipboardList size={18} />}
            label="Requests"
            isActive={activeNav === 'My Requests'}
            onClick={() => handleNavigate('requests', 'My Requests')}
          />

          {/* Personal Section */}
          <NavItem
            icon={<MessageCircle size={18} />}
            label="Messages"
            isActive={activeNav === 'Messages'}
            onClick={() => handleNavigate('messages', 'Messages')}
          />
          
          <NavItem
            icon={<ShieldAlert size={18} />}
            label="Safety"
            badge="2"
            isActive={activeNav === 'Safety'}
            onClick={() => handleNavigate('safety', 'Safety')}
          />

          <NavItem
            icon={<User size={18} />}
            label="Profile"
            isActive={activeNav === 'Profile'}
            onClick={() => handleNavigate('profile', 'Profile')}
          />
        </div>

        <div className="relative flex items-center gap-1 md:gap-2 flex-shrink-0" ref={logoutMenuRef}>
          {/* Logout Button */}
          <button
            onClick={handleLogoutClick}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all"
            title="Logout"
            aria-haspopup="menu"
            aria-expanded={showLogoutMenu}
          >
            <LogOut size={16} className="md:w-5 md:h-5" />
          </button>

          {showLogoutMenu && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="absolute bottom-full right-0 mb-3 w-44 overflow-hidden rounded-2xl border border-red-500/20 bg-[#18181f] shadow-2xl shadow-black/40"
            >
              <button
                onClick={confirmLogout}
                className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
              >
                <LogOut size={15} />
                Logout
              </button>
            </motion.div>
          )}
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  icon,
  label,
  isActive,
  badge,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 md:gap-1 px-1 md:px-2 py-1.5 md:py-2 rounded-lg transition-colors relative group text-[9px] md:text-xs font-medium whitespace-nowrap ${
        isActive 
          ? 'text-[#F59E0B] bg-white/5' 
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
      title={label}
    >
      <div className={`${isActive ? 'text-[#F59E0B]' : 'group-hover:text-white'}`}>
        {icon}
      </div>
      <span className="block leading-none">{label}</span>
      {badge && (
        <span className="absolute -top-1 -right-1 bg-[#F59E0B] text-white text-[7px] md:text-[9px] font-bold w-3.5 md:w-4 h-3.5 md:h-4 rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}
