import React from 'react';
import {
  Compass,
  ClipboardList,
  MessageCircle,
  ShieldAlert,
  User,
  Heart,
} from 'lucide-react';
import { motion } from 'framer-motion';
interface SidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onNavigate?: (page: string) => void;
  onCloseSidebar?: () => void;
}
export function Sidebar({ activeNav, setActiveNav, onNavigate, onCloseSidebar }: SidebarProps) {
  const navigate = (nav: string, page: string) => {
    setActiveNav(nav);
    onNavigate?.(page);
    onCloseSidebar?.();
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
            onClick={() => navigate('Discover', 'main')}
          />
          
          <NavItem
            icon={<Heart size={18} />}
            label="Nearby"
            isActive={activeNav === 'Nearby'}
            onClick={() => navigate('Nearby', 'nearby')}
          />
          
          <NavItem
            icon={<ClipboardList size={18} />}
            label="Requests"
            isActive={activeNav === 'My Requests'}
            onClick={() => navigate('My Requests', 'requests')}
          />

          {/* Personal Section */}
          <NavItem
            icon={<MessageCircle size={18} />}
            label="Messages"
            isActive={activeNav === 'Messages'}
            onClick={() => navigate('Messages', 'messages')}
          />
          
          <NavItem
            icon={<ShieldAlert size={18} />}
            label="Safety"
            badge="2"
            isActive={activeNav === 'Safety'}
            onClick={() => navigate('Safety', 'safety')}
          />
        </div>

        {/* Profile Button */}
        <button 
          onClick={() => navigate('Profile', 'profile')}
          className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FB923C] text-white font-medium hover:opacity-90 transition-opacity relative">
          <User size={16} />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-[#0F0F13] rounded-full"></div>
        </button>
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
