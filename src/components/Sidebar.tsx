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
    <motion.div 
      className="fixed inset-x-0 bottom-0 z-[9999] border-t border-white/10 bg-gradient-to-t from-[#0F0F13]/99 to-[#0F0F13]/95 px-2 md:px-4 py-2 md:py-3 rounded-t-3xl shadow-[0_-12px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
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
          <motion.button
            onClick={handleLogoutClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-red-500/15 text-red-400 hover:text-red-300 transition-all"
            title="Logout"
            aria-haspopup="menu"
            aria-expanded={showLogoutMenu}
          >
            <motion.div
              animate={{ rotate: showLogoutMenu ? 90 : 0 }}
              transition={{ type: 'spring', stiffness: 250, damping: 20 }}
            >
              <LogOut size={16} className="md:w-5 md:h-5" />
            </motion.div>
          </motion.button>

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
    </motion.div>
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
  const [isHovered, setIsHovered] = React.useState(false);

  const iconVariants = {
    inactive: { scale: 1, rotate: 0 },
    active: { 
      scale: 1.2, 
      rotate: [0, -8, 8, -8, 0],
      transition: { 
        rotate: { type: 'spring', stiffness: 200, damping: 10, duration: 0.6 },
        scale: { type: 'spring', stiffness: 300, damping: 15 }
      }
    },
    hover: { 
      scale: 1.15,
      rotate: [0, 3, -3, 3, 0],
      transition: { 
        rotate: { type: 'spring', stiffness: 150, damping: 8, duration: 0.5 },
        scale: { type: 'spring', stiffness: 250, damping: 12 }
      }
    }
  };

  const bgVariants = {
    inactive: { 
      backgroundColor: 'rgba(255, 255, 255, 0)',
      boxShadow: 'none'
    },
    active: { 
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      boxShadow: '0 0 12px rgba(245, 158, 11, 0.2), inset 0 0 8px rgba(245, 158, 11, 0.1)'
    },
    hover: { 
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      boxShadow: '0 0 8px rgba(255, 255, 255, 0.1)'
    }
  };

  const textVariants = {
    inactive: { color: '#9CA3AF' },
    active: { color: '#FFFFFF' },
    hover: { color: '#FFFFFF' }
  };

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      variants={bgVariants}
      animate={isActive ? 'active' : isHovered ? 'hover' : 'inactive'}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`flex flex-col items-center gap-0.5 md:gap-1 px-1 md:px-2 py-1.5 md:py-2 rounded-xl relative group text-[9px] md:text-xs font-semibold whitespace-nowrap backdrop-blur-sm border border-transparent ${
        isActive 
          ? 'border-[#F59E0B]/30' 
          : 'border-white/5'
      }`}
      title={label}
      whileTap={{ scale: 0.95 }}
    >
      {/* Animated background glow */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#F59E0B]/10 via-transparent to-[#A78BFA]/10 opacity-0"
          animate={{ opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Icon with animation */}
      <motion.div
        variants={iconVariants}
        animate={isActive ? 'active' : isHovered ? 'hover' : 'inactive'}
        transition={{ type: 'spring', stiffness: 250, damping: 15 }}
        className={`relative z-10 ${
          isActive ? 'text-white drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'text-gray-300'
        }`}
      >
        {icon}
      </motion.div>

      {/* Text label with animation */}
      <motion.span
        variants={textVariants}
        animate={isActive ? 'active' : isHovered ? 'hover' : 'inactive'}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="block leading-none relative z-10 font-semibold"
      >
        {label}
      </motion.span>

      {/* Animated underline for active state */}
      {isActive && (
        <motion.div
          layoutId="nav-underline"
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-1 bg-gradient-to-r from-[#F59E0B] to-[#A78BFA] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: '60%' }}
          exit={{ width: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}

      {/* Badge with pop animation */}
      {badge && (
        <motion.span
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.1 }}
          className="absolute -top-1 -right-1 bg-gradient-to-r from-[#F59E0B] to-[#FB923C] text-white text-[7px] md:text-[9px] font-bold w-3.5 md:w-4 h-3.5 md:h-4 rounded-full flex items-center justify-center shadow-lg shadow-[#F59E0B]/50"
        >
          {badge}
        </motion.span>
      )}
    </motion.button>
  );
}
