import React, { useEffect, useState } from 'react';
import { Search, MapPin, Bell, Menu, PanelLeftClose } from 'lucide-react';
import { ThemeProvider } from 'next-themes';
import { Sidebar } from './components/Sidebar';
import { Landing } from './pages/Landing';
import { Discover } from './pages/Discover';
import { MyRequests } from './pages/MyRequests';
import { Messages } from './pages/Messages';
import { Safety } from './pages/Safety';
import { Profile } from './pages/Profile';
import { EventDetail } from './pages/EventDetail';
import { Nearby } from './pages/Nearby';
import { HostDashboard } from './pages/HostDashboard';
import { MyHost } from './pages/MyHost';
import { Premium } from './pages/Premium';
import { SafetyCentre } from './pages/SafetyCentre';
import { TravelMode } from './pages/TravelMode';
import { Help } from './pages/Help';
export function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [activeNav, setActiveNav] = useState('Discover');
  const [currentPage, setCurrentPage] = useState<string>('main');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.innerWidth >= 768;
  });
  const [isLightMode, setIsLightMode] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem('junto-light-mode') === 'true';
  });
  
  const searchPlaceholders: Record<string, string> = {
    Discover: 'Search vibes, places, people...',
    'My Requests': 'Search your requests...',
    Messages: 'Search conversations...',
    Safety: 'Search safety topics...'
  };
  
  useEffect(() => {
    document.body.classList.toggle('theme-light-body', isLightMode);
    window.localStorage.setItem('junto-light-mode', String(isLightMode));
  }, [isLightMode]);

  useEffect(() => {
    const syncSidebarToViewport = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    syncSidebarToViewport();
    window.addEventListener('resize', syncSidebarToViewport);

    return () => {
      window.removeEventListener('resize', syncSidebarToViewport);
    };
  }, []);

  const content = (() => {
    if (!hasEntered) {
      return <Landing onEnter={() => setHasEntered(true)} />;
    }

    // Full-screen pages (no sidebar)
    if (currentPage === 'event') return <EventDetail onNavigate={setCurrentPage} />;
    if (currentPage === 'nearby') {
      return (
        <Nearby
          onNavigate={setCurrentPage}
          setActiveNav={setActiveNav}
          isLightMode={isLightMode}
        />
      );
    }
    if (currentPage === 'profile') {
      return (
        <Profile
          onNavigate={setCurrentPage}
          isLightMode={isLightMode}
          onToggleLightMode={() => setIsLightMode((current) => !current)}
        />
      );
    }
    if (currentPage === 'dashboard') return <HostDashboard onNavigate={setCurrentPage} isLightMode={isLightMode} />;
    if (currentPage === 'myhost') return <MyHost onNavigate={setCurrentPage} isLightMode={isLightMode} />;
    if (currentPage === 'premium') return <Premium onNavigate={setCurrentPage} />;
    if (currentPage === 'safety') return <SafetyCentre onNavigate={setCurrentPage} />;
    if (currentPage === 'travel') return <TravelMode onNavigate={setCurrentPage} isLightMode={isLightMode} />;
    if (currentPage === 'help') return <Help onNavigate={setCurrentPage} isLightMode={isLightMode} />;

    return (
      <div className="flex min-h-screen bg-[#0F0F13] text-white selection:bg-[#F59E0B]/30 font-sans">
        <Sidebar 
          activeNav={activeNav} 
          setActiveNav={setActiveNav}
          onNavigate={(page: string) => setCurrentPage(page)}
          onCloseSidebar={() => {
            // Only close sidebar on mobile (below md breakpoint of 768px)
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              setIsSidebarOpen(false);
            }
          }}
        />

        <main className="flex-1 ml-0 md:ml-64">
          <div className="max-w-5xl mx-auto px-4 py-4 md:px-8 md:py-8">
            {/* Shared Top Bar */}
            <header className="relative z-40 mb-6 flex flex-col gap-4 md:mb-12 md:flex-row md:items-center md:justify-between md:gap-6">
              <div className="relative group w-full max-w-none flex-1 md:max-w-md">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#F59E0B] transition-colors"
                  size={18} />
                
                <input
                  type="text"
                  placeholder={searchPlaceholders[activeNav] || 'Search...'}
                  className="w-full bg-[#1A1A21] border border-white/5 rounded-full py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#F59E0B]/50 focus:ring-1 focus:ring-[#F59E0B]/50 transition-all shadow-sm" />
                
              </div>

              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <button className="relative p-3 rounded-full bg-[#1A1A21] border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  <Bell size={18} />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#F59E0B] rounded-full border border-[#1A1A21]"></span>
                </button>
                <button className="flex items-center gap-2 rounded-full border border-white/5 bg-[#1A1A21] px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:text-white hover:bg-white/5 md:px-5">
                  <MapPin size={16} className="text-gray-500" />
                  Lagos ▾
                </button>
                <button className="rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FB923C] px-5 py-2.5 text-sm font-semibold text-white transition-opacity shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:opacity-90">
                  + Post
                </button>
              </div>
            </header>

            {/* Page Content */}
            {activeNav === 'Discover' && <Discover />}
            {activeNav === 'My Requests' && <MyRequests />}
            {activeNav === 'Messages' && <Messages />}
            {activeNav === 'Safety' && <Safety />}
          </div>
        </main>
      </div>
    );
  })();

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className={`${isLightMode ? 'theme-light ' : ''}${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
        {hasEntered && (
          <>
            {/* Mobile Backdrop Overlay */}
            {isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 z-[45] bg-black/50 md:hidden"
                aria-label="Close sidebar"
              />
            )}
            
            {/* Hamburger Button */}
            <button
              onClick={() => setIsSidebarOpen((current) => !current)}
              className={`fixed top-4 z-[80] inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold backdrop-blur-md transition-all ${
                isLightMode
                  ? 'border-black/10 bg-white/85 text-[#241b10] hover:bg-white'
                  : 'border-white/10 bg-[#141419]/90 text-white hover:bg-[#1b1b22]'
              } ${isSidebarOpen ? 'left-4 md:left-[17.5rem]' : 'left-4'}`}
              aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              {isSidebarOpen ? <PanelLeftClose size={18} /> : <Menu size={18} />}
            </button>
          </>
        )}
        {content}
      </div>
    </ThemeProvider>
  );
}
