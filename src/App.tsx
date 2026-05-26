import React, { useEffect, useRef, useState } from 'react';
import { Search, MapPin, Bell, Menu, PanelLeftClose, ChevronDown, Check } from 'lucide-react';
import { ThemeProvider } from 'next-themes';
import { AppProvider, useAppContext } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Landing } from './pages/Landing';
import { Discover } from './pages/Discover';
import { MyRequests } from './pages/MyRequests';
import { Messages } from './pages/Messages';
import { Safety } from './pages/Safety';
import { Profile } from './pages/Profile';
import { EventDetail, type EventDetailData } from './pages/EventDetail';
import { Nearby } from './pages/Nearby';
import { HostDashboard } from './pages/HostDashboard';
import { MyHost } from './pages/MyHost';
import { Premium } from './pages/Premium';
import { SafetyCentre } from './pages/SafetyCentre';
import { TravelMode } from './pages/TravelMode';
import { Help } from './pages/Help';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { discoverEvents, getDiscoverEventById, toEventDetail } from './data/discoverEvents';
// Re-export for backward compatibility
export { useAppContext } from './context/AppContext';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeNav, setActiveNav] = useState('Discover');
  const [currentPage, setCurrentPage] = useState<string>('main');
  const [selectedEvent, setSelectedEvent] = useState<EventDetailData | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState('Lagos');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
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
  const topBarRef = useRef<HTMLDivElement | null>(null);
  
  const searchPlaceholders: Record<string, string> = {
    Discover: 'Search vibes, places, people...',
    'My Requests': 'Search your requests...',
    Messages: 'Search conversations...',
    Safety: 'Search safety topics...'
  };
  const mainNavSections = new Set(['Discover', 'My Requests', 'Messages', 'Safety']);
  const shellNav = mainNavSections.has(activeNav) ? activeNav : 'Discover';

  const handleLogin = (user: any, token: string) => {
    // Backend authentication with API token
    setCurrentUser({ ...user, token });
    setIsAuthenticated(true);
    setHasEntered(true);
  };

  const handleEnterApp = (userData: any) => {
    setCurrentUser(userData);
    setHasEntered(true);
  };

  const handleLogout = () => {
    setHasEntered(false);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedEvent(null);
    setIsNotificationsOpen(false);
    setIsLocationOpen(false);
  };

  const handleOpenEvent = (event: EventDetailData) => {
    setSelectedEvent(event);
    setSelectedEventId(event.id);
    setActiveNav('Discover');
    setCurrentPage('event');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('page', 'event');
      url.searchParams.set('eventId', event.id);
      window.history.pushState({ page: 'event', eventId: event.id }, '', url.toString());
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    if (page === 'main') {
      setSelectedEvent(null);
      setSelectedEventId(null);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  };

  const handleOpenMessages = () => {
    setActiveNav('Messages');
    setCurrentPage('main');
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const handleCloseSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!topBarRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
        setIsLocationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    const eventId = params.get('eventId');

    if (page === 'event' && eventId) {
      const event = getDiscoverEventById(eventId);
      if (event) {
        setSelectedEvent(toEventDetail(event, discoverEvents.findIndex((item) => item.id === event.id)));
        setSelectedEventId(event.id);
        setCurrentPage('event');
      }
    }

    const onPopState = () => {
      const nextParams = new URLSearchParams(window.location.search);
      const nextPage = nextParams.get('page');
      const nextEventId = nextParams.get('eventId');

      if (nextPage === 'event' && nextEventId) {
        const event = getDiscoverEventById(nextEventId);
        if (event) {
          setSelectedEvent(toEventDetail(event, discoverEvents.findIndex((item) => item.id === event.id)));
          setSelectedEventId(event.id);
          setCurrentPage('event');
        }
        return;
      }

      setCurrentPage('main');
      setSelectedEvent(null);
      setSelectedEventId(null);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  
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
    // Show Landing page first
    if (!isAuthenticated) {
      return (
        <Landing 
          onEnter={() => setHasEntered(true)}
          onLogin={handleLogin}
        />
      );
    }

    // After login, if not completed onboarding, show onboarding
    if (!hasEntered) {
      return (
        <div className="min-h-screen bg-[#0F0F13] text-white font-sans flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-6xl mb-6">✨</div>
            <h2 className="text-4xl font-serif font-bold mb-4">Welcome to Junto!</h2>
            <p className="text-gray-400 mb-8 max-w-md">
              Let's complete your profile to get started
            </p>
            <button
              onClick={() => setHasEntered(true)}
              className="bg-gradient-to-r from-[#F59E0B] to-[#FB923C] text-white px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">
              Continue to App →
            </button>
          </div>
        </div>
      );
    }

    // Full-screen pages (no sidebar)
    if (currentPage === 'event') {
      return (
        <EventDetail
          eventId={selectedEventId ?? selectedEvent?.id}
          eventData={selectedEvent ?? undefined}
          onNavigate={handleNavigate}
          onOpenMessages={handleOpenMessages}
        />
      );
    }
    if (currentPage === 'nearby') {
      return (
        <Nearby
          onNavigate={handleNavigate}
          setActiveNav={setActiveNav}
          onCloseSidebar={handleCloseSidebar}
          isLightMode={isLightMode}
        />
      );
    }
    if (currentPage === 'profile') {
      return (
        <Profile
          onNavigate={handleNavigate}
          isLightMode={isLightMode}
          setActiveNav={setActiveNav}
          onCloseSidebar={handleCloseSidebar}
          onToggleLightMode={() => setIsLightMode((current) => !current)}
        />
      );
    }
    if (currentPage === 'dashboard') return <HostDashboard onNavigate={handleNavigate} isLightMode={isLightMode} />;
    if (currentPage === 'myhost') return <MyHost onNavigate={handleNavigate} isLightMode={isLightMode} setActiveNav={setActiveNav} onCloseSidebar={handleCloseSidebar} />;
    if (currentPage === 'premium') return <Premium onNavigate={handleNavigate} setActiveNav={setActiveNav} onCloseSidebar={handleCloseSidebar} />;
    if (currentPage === 'safety') return <SafetyCentre onNavigate={handleNavigate} setActiveNav={setActiveNav} onCloseSidebar={handleCloseSidebar} />;
    if (currentPage === 'travel') return <TravelMode onNavigate={handleNavigate} isLightMode={isLightMode} setActiveNav={setActiveNav} onCloseSidebar={handleCloseSidebar} />;
    if (currentPage === 'help') return <Help onNavigate={handleNavigate} isLightMode={isLightMode} setActiveNav={setActiveNav} onCloseSidebar={handleCloseSidebar} />;
    if (currentPage === 'notifications') return <Notifications onNavigate={handleNavigate} setActiveNav={setActiveNav} activeNav={activeNav} onCloseSidebar={handleCloseSidebar} />;
    if (currentPage === 'settings') return <Settings onNavigate={handleNavigate} setActiveNav={setActiveNav} onCloseSidebar={handleCloseSidebar} isLightMode={isLightMode} onToggleLightMode={() => setIsLightMode((current) => !current)} />;
    if (currentPage === 'terms') return <Terms onNavigate={handleNavigate} setActiveNav={setActiveNav} onCloseSidebar={handleCloseSidebar} />;
    if (currentPage === 'privacy') return <Privacy onNavigate={handleNavigate} setActiveNav={setActiveNav} onCloseSidebar={handleCloseSidebar} />;

    return (
      <div className="flex min-h-screen bg-[#0F0F13] text-white selection:bg-[#F59E0B]/30 font-sans">
        <Sidebar 
          activeNav={activeNav} 
          setActiveNav={setActiveNav}
          onNavigate={(page: string) => setCurrentPage(page)}
          onCloseSidebar={handleCloseSidebar}
        />

        <main className="flex-1 ml-0 md:ml-64">
          <div className="max-w-5xl mx-auto px-4 py-4 md:px-8 md:py-8">
            {/* Shared Top Bar */}
            <header ref={topBarRef} className="relative z-40 mb-6 flex flex-col gap-4 md:mb-12 md:flex-row md:items-center md:justify-between md:gap-6">
              <div className="relative group w-full max-w-none flex-1 md:max-w-md">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#F59E0B] transition-colors"
                  size={18} />
                
                <input
                  type="text"
          placeholder={searchPlaceholders[shellNav] || 'Search...'}
                  className="w-full bg-[#1A1A21] border border-white/5 rounded-full py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#F59E0B]/50 focus:ring-1 focus:ring-[#F59E0B]/50 transition-all shadow-sm" />
                
              </div>

              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <div className="relative">
                  <button
                    onClick={() => setCurrentPage('notifications')}
                    className="relative p-3 rounded-full bg-[#1A1A21] border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell size={18} />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#F59E0B] rounded-full border border-[#1A1A21]"></span>
                  </button>
                </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      setIsLocationOpen((current) => !current);
                      setIsNotificationsOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-full border border-white/5 bg-[#1A1A21] px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white md:px-5"
                    aria-expanded={isLocationOpen}
                    aria-haspopup="menu"
                  >
                    <MapPin size={16} className="text-gray-500" />
                    {selectedLocation}
                    <ChevronDown size={14} className="text-gray-500" />
                  </button>
                  {isLocationOpen && (
                    <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#111115] shadow-2xl shadow-black/30">
                      <div className="border-b border-white/5 px-4 py-3">
                        <p className="text-sm font-semibold text-white">Select location</p>
                        <p className="text-xs text-gray-400">Choose your city</p>
                      </div>
                      <div className="p-2">
                        {['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Accra'].map((location) => (
                          <button
                            key={location}
                            onClick={() => {
                              setSelectedLocation(location);
                              setIsLocationOpen(false);
                            }}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                          >
                            <span>{location}</span>
                            {selectedLocation === location && <Check size={16} className="text-[#F59E0B]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setCurrentPage('myhost')}
                  className="rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FB923C] px-5 py-2.5 text-sm font-semibold text-white transition-opacity shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:opacity-90"
                >
                  + Post
                </button>
              </div>
            </header>

            {/* Page Content */}
            {shellNav === 'Discover' && <Discover onNavigate={setCurrentPage} onOpenEvent={handleOpenEvent} />}
            {shellNav === 'My Requests' && <MyRequests />}
            {shellNav === 'Messages' && <Messages />}
            {shellNav === 'Safety' && <Safety />}
          </div>
        </main>
      </div>
    );
  })();

  const contextValue = {
    selectedEvent,
    handleLogout,
  };

  return (
    <AppProvider value={contextValue}>
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
    </AppProvider>
  );
}
