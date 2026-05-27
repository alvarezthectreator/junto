import React, { useEffect, useState } from 'react';
import { Bell, Plus, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeProvider } from 'next-themes';
import { useLocation } from 'react-router-dom';
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
import { Notifications } from './pages/Notifications';
import { ToastProvider } from './components/Toast';
export function App() {
  const location = useLocation();
  const [hasEntered, setHasEntered] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeNav, setActiveNav] = useState('Discover');
  const [currentPage, setCurrentPage] = useState<string>('main');
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
  const [showMenu, setShowMenu] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);

  // Track route changes and update activeNav
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/discover')) {
      setActiveNav('Discover');
    } else if (path.includes('/nearby')) {
      setActiveNav('Nearby');
    } else if (path.includes('/requests')) {
      setActiveNav('My Requests');
    } else if (path.includes('/messages')) {
      setActiveNav('Messages');
    } else if (path.includes('/safety')) {
      setActiveNav('Safety');
    } else if (path.includes('/profile')) {
      setActiveNav('Profile');
    }
  }, [location.pathname]);
  
  // Reset openCreateModal when leaving myhost page
  useEffect(() => {
    if (currentPage !== 'myhost') {
      setOpenCreateModal(false);
    }
  }, [currentPage]);
  
  const handleLogin = (user: any, token: string) => {
    // Set current user with provided user data
    const userData = { 
      id: user.id,
      username: user.username || user.display_name || 'User',
      name: user.display_name || user.username || 'User',
      profile_id: user.profile_id
    };
    setCurrentUser(userData);
    // Store session token and user data
    localStorage.setItem('sessionToken', token);
    localStorage.setItem('currentUser', JSON.stringify(userData));
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
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('currentUser');
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

  // Restore session from localStorage on app mount
  useEffect(() => {
    const sessionToken = localStorage.getItem('sessionToken');
    const userData = localStorage.getItem('currentUser');
    
    if (sessionToken && userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        setIsAuthenticated(true);
        setHasEntered(true);
      } catch (e) {
        console.error('Failed to restore session:', e);
      }
    }
  }, []);

  const content = (() => {
    // Show Landing page first
    if (!isAuthenticated) {
      return (
        <Landing 
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
    if (currentPage === 'event') return <EventDetail onNavigate={setCurrentPage} />;
    if (currentPage === 'notifications') return <Notifications onNavigate={setCurrentPage} />;
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
    if (currentPage === 'myhost') return <ToastProvider><MyHost onNavigate={setCurrentPage} isLightMode={isLightMode} openCreateModal={openCreateModal} /></ToastProvider>;
    if (currentPage === 'premium') return <Premium onNavigate={setCurrentPage} />;
    if (currentPage === 'safety') return <SafetyCentre onNavigate={setCurrentPage} />;
    if (currentPage === 'travel') return <TravelMode onNavigate={setCurrentPage} isLightMode={isLightMode} />;
    if (currentPage === 'help') return <Help onNavigate={setCurrentPage} isLightMode={isLightMode} />;

    return (
      <div className="flex min-h-screen bg-[#0F0F13] text-white selection:bg-[#F59E0B]/30 font-sans">
        <Sidebar 
          activeNav={activeNav} 
          handleLogout={handleLogout}
        />

        <main className="flex-1 ml-0 md:ml-64">
          <div className="max-w-5xl mx-auto px-4 py-4 md:px-8 md:py-8">
            {/* Top Header with Action Buttons */}
            <header className="flex items-center justify-end gap-3 mb-8">
              <button 
                onClick={() => {
                  setCurrentPage('myhost');
                  setOpenCreateModal(true);
                }}
                className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black px-4 py-2 rounded-full font-semibold text-sm transition-colors"
              >
                <Plus size={18} />
                <span>Post</span>
              </button>
              <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors relative"
                onClick={() => setCurrentPage('notifications')}>
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors">
                  <MoreVertical size={18} />
                </button>
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
                        setCurrentPage('main');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Help
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </div>
            </header>

            {/* Page Content */}
            {activeNav === 'Discover' && <Discover onNavigate={setCurrentPage} />}
            {activeNav === 'My Requests' && <MyRequests />}
            {activeNav === 'Messages' && <Messages />}
            {activeNav === 'Safety' && <Safety />}
            {activeNav === 'Profile' && <Profile onNavigate={setCurrentPage} isLightMode={isLightMode} onToggleLightMode={() => setIsLightMode((current) => !current)} />}
            {activeNav === 'Nearby' && <Nearby onNavigate={setCurrentPage} setActiveNav={setActiveNav} isLightMode={isLightMode} />}
          </div>
        </main>
      </div>
    );
  })();

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className={`${isLightMode ? 'theme-light ' : ''}${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
        {content}
      </div>
    </ThemeProvider>
  );
}
