import React from 'react';
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
import { useAppContext } from '../App';

interface SidebarProps {
  activeNav: string;
  onLogout?: () => void;
}

export function Sidebar({ activeNav, onLogout }: SidebarProps) {
  const navigate = useNavigate();
  const { handleLogout } = useAppContext();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogoutClick = () => {
    handleLogout();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#0F0F13] px-4 py-2 md:py-3 rounded-t-2xl">
      {/* Bottom Navbar */}
      <nav className="flex items-center justify-between gap-1 md:gap-3 max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-1 md:gap-4 flex-1">
          {/* Discover Section */}
          <NavItem
            icon={<Compass size={18} />}
            label="Discover"
            isActive={activeNav === 'Discover'}
            onClick={() => handleNavigate('/discover')}
          />
          
          <NavItem
            icon={<Heart size={18} />}
            label="Nearby"
            isActive={activeNav === 'Nearby'}
            onClick={() => handleNavigate('/nearby')}
          />
          
          <NavItem
            icon={<ClipboardList size={18} />}
            label="Requests"
            isActive={activeNav === 'My Requests'}
            onClick={() => handleNavigate('/requests')}
          />

          {/* Personal Section */}
          <NavItem
            icon={<MessageCircle size={18} />}
            label="Messages"
            isActive={activeNav === 'Messages'}
            onClick={() => handleNavigate('/messages')}
          />
          
          <NavItem
            icon={<ShieldAlert size={18} />}
            label="Safety"
            badge="2"
            isActive={activeNav === 'Safety'}
            onClick={() => handleNavigate('/safety')}
          />

          <NavItem
            icon={<User size={18} />}
            label="Profile"
            isActive={activeNav === 'Profile'}
            onClick={() => handleNavigate('/profile')}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Logout Button */}
          <button
            onClick={handleLogoutClick}
            className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
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
      className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors relative group text-xs font-medium ${
        isActive 
          ? 'text-[#F59E0B] bg-white/5' 
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
      title={label}
    >
      <div className={isActive ? 'text-[#F59E0B]' : 'group-hover:text-white'}>
        {icon}
      </div>
      <span className="whitespace-nowrap">{label}</span>
      {badge && (
        <span className="absolute -top-1 -right-1 bg-[#F59E0B] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}
