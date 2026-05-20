import React from 'react';
import {
  Compass,
  ClipboardList,
  MessageCircle,
  ShieldAlert,
  ChevronRight,
  Zap,
  Globe,
  HelpCircle,
  User,
  Heart,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
interface SidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onNavigate?: (page: string) => void;
  onCloseSidebar?: () => void;
}
export function Sidebar({ activeNav, setActiveNav, onNavigate, onCloseSidebar }: SidebarProps) {
  return (
    <div className="sidebar-shell flex md:flex w-64 h-screen fixed left-0 top-0 border-r border-white/5 bg-[#0F0F13] flex-col pt-6 sm:pt-8 pb-4 sm:pb-6 px-3 sm:px-4 z-50 overflow-y-auto overflow-x-hidden transition-transform duration-300">
      {/* Logo Area */}
      <div className="sidebar-logo mb-8 sm:mb-12 px-2 shrink-0">
        <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight">
          Jun<span className="text-gradient">to</span>
        </h1>
        <p className="sidebar-eyebrow text-[9px] sm:text-[10px] font-semibold tracking-widest text-gray-500 mt-1 uppercase line-clamp-2">
          Together. No strings.
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6">
        <div>
          <p className="sidebar-section-label px-3 text-[10px] font-semibold tracking-widest text-gray-500 mb-2 uppercase">
            Discover
          </p>
          <div className="space-y-1">
            <NavItem
              icon={<Compass size={20} />}
              label="Discover"
              isActive={activeNav === 'Discover'}
              onClick={() => {
                setActiveNav('Discover');
                onNavigate?.('main');
                onCloseSidebar?.();
              }} />
            
            <NavItem
              icon={<Heart size={20} />}
              label="Nearby"
              isActive={activeNav === 'Nearby'}
              onClick={() => {
                onNavigate?.('nearby');
                onCloseSidebar?.();
              }} />
            
            <NavItem
              icon={<ClipboardList size={20} />}
              label="My Requests"
              isActive={activeNav === 'My Requests'}
              onClick={() => {
                setActiveNav('My Requests');
                onNavigate?.('main');
                onCloseSidebar?.();
              }} />
            
          </div>
        </div>

        <div>
          <p className="sidebar-section-label px-3 text-[10px] font-semibold tracking-widest text-gray-500 mb-2 uppercase">
            Personal
          </p>
          <div className="space-y-1">
            <NavItem
              icon={<MessageCircle size={20} />}
              label="Messages"
              isActive={activeNav === 'Messages'}
              onClick={() => {
                setActiveNav('Messages');
                onNavigate?.('main');
                onCloseSidebar?.();
              }} />
            
            <NavItem
              icon={<ShieldAlert size={20} />}
              label="Safety"
              badge="2"
              isActive={activeNav === 'Safety'}
              onClick={() => {
                onNavigate?.('safety');
                onCloseSidebar?.();
              }} />
            
            <NavItem
              icon={<Zap size={20} />}
              label="Premium"
              isActive={activeNav === 'Premium'}
              onClick={() => {
                onNavigate?.('premium');
                onCloseSidebar?.();
              }} />
            
          </div>
        </div>

        <div>
          <p className="sidebar-section-label px-3 text-[10px] font-semibold tracking-widest text-gray-500 mb-2 uppercase">
            Hosting
          </p>
          <div className="space-y-1">
            <NavItem
              icon={<Layers size={20} />}
              label="My Host Studio"
              isActive={activeNav === 'My Host Studio'}
              onClick={() => {
                onNavigate?.('myhost');
                onCloseSidebar?.();
              }} />
            
          </div>
        </div>

        <div>
          <p className="sidebar-section-label px-3 text-[10px] font-semibold tracking-widest text-gray-500 mb-2 uppercase">
            More
          </p>
          <div className="space-y-1">
            <NavItem
              icon={<Globe size={20} />}
              label="Travel Mode"
              isActive={activeNav === 'Travel Mode'}
              onClick={() => {
                onNavigate?.('travel');
                onCloseSidebar?.();
              }} />
            
            <NavItem
              icon={<HelpCircle size={20} />}
              label="Help & Support"
              isActive={activeNav === 'Help'}
              onClick={() => {
                onNavigate?.('help');
                onCloseSidebar?.();
              }} />
            
          </div>
        </div>
      </nav>

      {/* User Profile Chip */}
      <div className="sidebar-profile mt-auto pt-4 border-t border-white/5">
        <button 
          onClick={() => {
            onNavigate?.('profile');
            onCloseSidebar?.();
          }}
          className="sidebar-profile-button flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-colors text-left group">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FB923C] flex items-center justify-center text-white font-medium shadow-sm">
              <User size={18} />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0F0F13] rounded-full"></div>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="sidebar-profile-name text-sm font-medium text-white truncate group-hover:text-[#F59E0B] transition-colors">
              Jay Doe
            </p>
            <p className="sidebar-profile-handle text-xs text-gray-500 truncate">@jayvibes</p>
          </div>
          <ChevronRight
            size={16}
            className="sidebar-profile-arrow text-gray-500 group-hover:text-white transition-colors" />
          
        </button>
      </div>
    </div>);

}
function NavItem({
  icon,
  label,
  isActive,
  badge,
  onClick






}: {icon: React.ReactNode;label: string;isActive?: boolean;badge?: string;onClick: () => void;}) {
  return (
    <button
      onClick={onClick}
      className={`sidebar-nav-item w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors relative ${isActive ? 'text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
      
      {isActive &&
      <motion.div
        layoutId="activeNavBackground"
        className="absolute inset-0 bg-white/10 rounded-xl"
        initial={false}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }} />

      }
      {isActive &&
      <motion.div
        layoutId="activeNavIndicator"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#F59E0B] rounded-r-full"
        initial={false}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }} />

      }
      <div className="flex items-center gap-3 relative z-10">
        <div className={isActive ? 'text-[#F59E0B]' : ''}>{icon}</div>
        <span className="font-medium text-sm">{label}</span>
      </div>
      {badge &&
      <span className="bg-[#F59E0B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center relative z-10 shadow-sm">
          {badge}
        </span>
      }
    </button>);

}
