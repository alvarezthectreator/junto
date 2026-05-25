import React, { useState } from 'react';
import { Bell, Plus, MoreVertical, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopHeaderProps {
  onNavigate?: (page: string) => void;
}

export function TopHeader({ 
  onNavigate = () => {} 
}: TopHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0F0F13]/95 backdrop-blur-md">
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Left: Logo & Branding */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FB923C] flex items-center justify-center font-bold text-white">
                J
              </div>
              <div className="hidden xs:flex flex-col gap-0">
                <span className="text-base sm:text-lg font-bold text-white leading-none">Junto</span>
                <span className="text-[10px] sm:text-xs text-gray-400 leading-none">good times</span>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Post Button */}
            <button
              onClick={() => onNavigate('hosting')}
              className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black px-2.5 sm:px-3 md:px-4 py-2 rounded-full font-semibold text-xs sm:text-sm transition-colors"
              title="Create a post"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Post</span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => onNavigate('notifications')}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors relative"
              title="View notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* 3-Dot Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                title="More options"
              >
                <MoreVertical size={18} />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 rounded-xl bg-[#1A1A21] border border-white/10 shadow-lg overflow-hidden"
                >
                  <button
                    onClick={() => {
                      onNavigate('venues');
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Venues
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('celeb');
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
                  >
                    Celeb
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('premium');
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
                  >
                    Premium
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('help');
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
                  >
                    Help
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('sessionToken');
                      localStorage.removeItem('userId');
                      localStorage.removeItem('displayName');
                      window.location.href = '/';
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-3 transition-colors border-t border-white/5"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
