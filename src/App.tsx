import { useCallback, useEffect, useState } from 'react';
import { Bell, Plus, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeProvider } from 'next-themes';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { Settings } from './pages/Settings';
import { SafetyCentre } from './pages/SafetyCentre';
import { TravelMode } from './pages/TravelMode';
import { Help } from './pages/Help';
import { Notifications } from './pages/Notifications';
import { ComprehensiveAssessment } from './pages/ComprehensiveAssessment';
import { PublicHostProfile } from './pages/PublicHostProfile';
import SquadsPage from './pages/Squads';
import { AdminModerator } from './pages/AdminModerator';
import { OTPSignup } from './pages/OTPSignup';
import { OnboardingInterests } from './pages/OnboardingInterests';
import { OnboardingLocation } from './pages/OnboardingLocation';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import { logout as clearApiSession, getLastSessionActivity, markSessionActivity, getSessionToken, verifySession } from './services/api';

const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const SESSION_ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'focus'];
const ONBOARDING_FLOW_KEY = 'junto-onboarding-flow';

type RouteState = {
  event?: any;
  showProfilePrompt?: boolean;
};

function getPageFromPath(pathname: string) {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  if (cleanPath === '/' || cleanPath === '') return 'landing';
  if (cleanPath === '/signup-otp') return 'signup-otp';
  if (cleanPath === '/onboarding/interests') return 'onboarding-interests';
  if (cleanPath === '/onboarding/location') return 'onboarding-location';
  if (cleanPath.startsWith('/event/')) return 'event';
  if (cleanPath.startsWith('/public-profile/')) return 'public-profile';
  if (cleanPath === '/discover') return 'main';
  if (cleanPath === '/nearby') return 'nearby';
  if (cleanPath === '/requests') return 'requests';
  if (cleanPath === '/messages') return 'messages';
  if (cleanPath === '/safety') return 'safety';
  if (cleanPath === '/profile') return 'profile';
  if (cleanPath === '/dashboard') return 'dashboard';
  if (cleanPath === '/myhost') return 'myhost';
  if (cleanPath === '/premium') return 'premium';
  if (cleanPath === '/settings') return 'settings';
  if (cleanPath === '/travel') return 'travel';
  if (cleanPath === '/squads') return 'squads';
  if (cleanPath === '/admin') return 'admin';
  if (cleanPath === '/help') return 'help';
  if (cleanPath === '/notifications') return 'notifications';
  if (cleanPath === '/assessment') return 'assessment';

  return 'main';
}

function getPagePath(page: string, eventId?: string | null) {
  switch (page) {
    case 'landing':
    case 'main':
    case 'discover':
      return '/discover';
    case 'signup-otp':
      return '/signup-otp';
    case 'onboarding-interests':
      return '/onboarding/interests';
    case 'onboarding-location':
      return '/onboarding/location';
    case 'nearby':
      return '/nearby';
    case 'requests':
      return '/requests';
    case 'messages':
      return '/messages';
    case 'safety':
      return '/safety';
    case 'profile':
      return '/profile';
    case 'dashboard':
      return '/dashboard';
    case 'myhost':
      return '/myhost';
    case 'premium':
      return '/premium';
    case 'settings':
      return '/settings';
    case 'travel':
      return '/travel';
    case 'squads':
      return '/squads';
    case 'admin':
      return '/admin';
    case 'help':
      return '/help';
    case 'notifications':
      return '/notifications';
    case 'assessment':
      return '/assessment';
    case 'event':
      return eventId ? `/event/${encodeURIComponent(eventId)}` : '/discover';
    case 'public-profile':
      return '/public-profile';
    default:
      return '/discover';
  }
}

function getRouteIds(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);

  return {
    eventId: parts[0] === 'event' ? decodeURIComponent(parts[1] || '') : null,
    publicHostId: parts[0] === 'public-profile' ? decodeURIComponent(parts[1] || '') : null,
  };
}

function getStoredSessionActivity() {
  return getLastSessionActivity();
}

export function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasEntered, setHasEntered] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSessionBooting, setIsSessionBooting] = useState(true);
  const [activeNav, setActiveNav] = useState(() => {
    if (typeof window === 'undefined') {
      return 'Discover';
    }

    return window.localStorage.getItem('junto-active-nav') || 'Discover';
  });
  const [currentPage, setCurrentPage] = useState<string>(() => getPageFromPath(typeof window === 'undefined' ? '/' : window.location.pathname));
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
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
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [publicHostId, setPublicHostId] = useState<string | null>(null);
  const { eventId: routeEventId, publicHostId: routePublicHostId } = getRouteIds(location.pathname);
  const routeState = (location.state || {}) as RouteState;

  const onboardingFlowActive = typeof window !== 'undefined' && window.sessionStorage.getItem(ONBOARDING_FLOW_KEY) === 'true';

  const navigateToPage = useCallback((page: string) => {
    if (page === 'event') {
      const eventId = selectedEvent?.id || routeEventId;
      navigate(getPagePath(page, eventId));
      setShowMenu(false);
      return;
    }

    if (page === 'landing') {
      navigate('/');
      setShowMenu(false);
      return;
    }

    navigate(getPagePath(page));
    setShowMenu(false);
  }, [navigate, routeEventId, selectedEvent?.id]);

  // Track route changes and update activeNav
  useEffect(() => {
    const page = getPageFromPath(location.pathname);
    setCurrentPage(page);

    if (page === 'main' || page === 'event') {
      setActiveNav('Discover');
    } else if (page === 'nearby') {
      setActiveNav('Nearby');
    } else if (page === 'requests') {
      setActiveNav('My Requests');
    } else if (page === 'messages') {
      setActiveNav('Messages');
    } else if (page === 'safety') {
      setActiveNav('Safety');
    } else if (page === 'profile' || page === 'public-profile') {
      setActiveNav('Profile');
    }
  }, [location.pathname]);

  // Handle public profile navigation - retrieve hostId from sessionStorage
  useEffect(() => {
    if (currentPage === 'public-profile') {
      const hostId = routePublicHostId || sessionStorage.getItem('publicHostId');
      if (hostId) {
        setPublicHostId(hostId);
      }
    }
  }, [currentPage, routePublicHostId]);
  
  // Reset openCreateModal when leaving myhost page
  useEffect(() => {
    if (currentPage !== 'myhost') {
      setOpenCreateModal(false);
    }
  }, [currentPage]);
  
  // Scroll to top and add padding when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);
  
  const applyAuthenticatedSession = useCallback((user: any, token: string) => {
    // Set current user with provided user data
    const userData = { 
      id: user.id,
      username: user.username || user.display_name || 'User',
      name: user.username || user.display_name || 'User',
      profile_id: user.profile_id,
      date_of_birth: user.date_of_birth || null,
      gender: user.gender || null,
      occupation: user.occupation || null
    };
    setCurrentUser(userData);
    setSelectedUser(null);
    // Store session token and user data
    localStorage.setItem('sessionToken', token);
    localStorage.setItem('junto-session-token', token);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('userId', user.id);
    markSessionActivity();
    setIsAuthenticated(true);
    setHasEntered(true);
    return userData;
  }, []);

  const handleLogin = useCallback((user: any, token: string) => {
    applyAuthenticatedSession(user, token);
    navigate('/discover', { replace: true });
    setActiveNav('Discover');
  }, [applyAuthenticatedSession, navigate]);

  const handleLogout = useCallback(() => {
    setHasEntered(false);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedUser(null);
    navigate('/', { replace: true });
    setActiveNav('Discover');
    setShowMenu(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('junto-current-page');
    localStorage.removeItem('junto-active-nav');
    window.sessionStorage.removeItem(ONBOARDING_FLOW_KEY);
    clearApiSession();
  }, [navigate]);
  
  useEffect(() => {
    document.body.classList.toggle('theme-light-body', isLightMode);
    window.localStorage.setItem('junto-light-mode', String(isLightMode));
  }, [isLightMode]);

  useEffect(() => {
    if (!isAuthenticated || !hasEntered) {
      return;
    }

    window.localStorage.setItem('junto-current-page', currentPage);
    window.localStorage.setItem('junto-active-nav', activeNav);
  }, [activeNav, currentPage, hasEntered, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const storedActivity = getStoredSessionActivity();
    if (!storedActivity) {
      markSessionActivity();
      return;
    }

    if (Date.now() - storedActivity >= SESSION_TIMEOUT_MS) {
      handleLogout();
      return;
    }

    const touchSession = () => {
      const lastActivity = getStoredSessionActivity();
      if (lastActivity && Date.now() - lastActivity >= SESSION_TIMEOUT_MS) {
        handleLogout();
        return;
      }

      markSessionActivity();
    };

    const expireSessionIfIdle = () => {
      touchSession();
    };

    SESSION_ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, touchSession, { passive: true });
    });

    window.addEventListener('mousemove', touchSession, { passive: true });
    window.addEventListener('visibilitychange', expireSessionIfIdle);

    const timerId = window.setInterval(expireSessionIfIdle, 60 * 1000);

    return () => {
      SESSION_ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, touchSession);
      });
      window.removeEventListener('mousemove', touchSession);
      window.removeEventListener('visibilitychange', expireSessionIfIdle);
      window.clearInterval(timerId);
    };
  }, [handleLogout, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if ((currentPage === 'landing' || currentPage === 'signup-otp') && !onboardingFlowActive) {
      navigate('/discover', { replace: true });
    }
  }, [currentPage, isAuthenticated, navigate, onboardingFlowActive]);

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
    const sessionToken = getSessionToken();
    const userData = localStorage.getItem('currentUser');
    
    const restoreSession = async () => {
      if (!sessionToken || !userData) {
        setIsSessionBooting(false);
        return;
      }

      try {
        const user = JSON.parse(userData);
        const storedActivity = getStoredSessionActivity();

        if (storedActivity && Date.now() - storedActivity >= SESSION_TIMEOUT_MS) {
          handleLogout();
          return;
        }

        const sessionResponse = await verifySession();
        const verifiedUser = sessionResponse.user || user;
        const mergedUser = {
          ...user,
          ...verifiedUser,
          name: verifiedUser.username || verifiedUser.display_name || user.name || user.username || 'User',
          username: verifiedUser.username || user.username || user.name || 'User',
        };

        localStorage.setItem('currentUser', JSON.stringify(mergedUser));
        localStorage.setItem('userId', mergedUser.id);
        setCurrentUser(mergedUser);
        setIsAuthenticated(true);
        setHasEntered(true);
        if (!storedActivity) {
          markSessionActivity();
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
        handleLogout();
      } finally {
        setIsSessionBooting(false);
      }
    };

    restoreSession();
  }, []);

  if (isSessionBooting) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark">
        <LanguageProvider>
          <div className="min-h-screen flex items-center justify-center bg-[#0F0F13] text-white">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full border-4 border-white/10 border-t-[#F59E0B] animate-spin" />
              <p className="text-sm text-white/60">Checking your session...</p>
            </div>
          </div>
        </LanguageProvider>
      </ThemeProvider>
    );
  }

  const content = (() => {
    if (currentPage === 'onboarding-interests' && (isAuthenticated || localStorage.getItem('sessionToken'))) {
      return (
        <OnboardingInterests
          currentUser={currentUser}
          onBack={() => navigate('/signup-otp')}
          onComplete={() => navigate('/onboarding/location')}
        />
      );
    }

    if (currentPage === 'onboarding-location' && (isAuthenticated || localStorage.getItem('sessionToken'))) {
      return (
        <OnboardingLocation
          currentUser={currentUser}
          onBack={() => navigate('/onboarding/interests')}
          onComplete={() => {
            window.sessionStorage.removeItem(ONBOARDING_FLOW_KEY);
            localStorage.setItem('junto-profile-completion-prompt', 'true');
            navigate('/discover', { replace: true, state: { showProfilePrompt: true } });
          }}
        />
      );
    }

    // Show OTP Signup page if selected (before Landing check so it takes priority)
    if (currentPage === 'signup-otp' && !isAuthenticated) {
      return (
        <OTPSignup
          onSuccess={(token, user) => {
            window.sessionStorage.setItem(ONBOARDING_FLOW_KEY, 'true');
            applyAuthenticatedSession(user, token);
            navigate('/onboarding/interests', { replace: true });
          }}
          onBack={() => navigate('/discover')}
        />
      );
    }

    // Show Landing page if not authenticated
    if (!isAuthenticated) {
      return (
        <Landing
          onLogin={(user, token) => {
            handleLogin(user, token);
          }}
          onSignupWithOTP={() => navigate('/signup-otp')}
        />
      );
    }

    // Show onboarding welcome screen if logged in but not entered app yet
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
    if (currentPage === 'event') return <EventDetail eventId={routeEventId || selectedEvent?.id || undefined} eventData={routeState.event || selectedEvent || undefined} onNavigate={navigateToPage} setActiveNav={setActiveNav} />;
    if (currentPage === 'notifications') return <Notifications onNavigate={navigateToPage} setActiveNav={setActiveNav} />;
    if (currentPage === 'nearby') {
      return (
        <Nearby
          onNavigate={navigateToPage}
          setActiveNav={setActiveNav}
          isLightMode={isLightMode}
          currentUser={currentUser}
        />
      );
    }
    if (currentPage === 'profile') {
      return (
        <Profile
          selectedUser={selectedUser}
          onNavigate={navigateToPage}
          setActiveNav={setActiveNav}
          isLightMode={isLightMode}
          onToggleLightMode={() => setIsLightMode((current) => !current)}
          handleLogout={handleLogout}
          startEditing={Boolean(routeState?.showProfilePrompt || (routeState as any)?.startEditing)}
        />
      );
    }
    if (currentPage === 'dashboard') return <HostDashboard onNavigate={navigateToPage} isLightMode={isLightMode} />;
    if (currentPage === 'myhost') return <ToastProvider><MyHost onNavigate={navigateToPage} isLightMode={isLightMode} openCreateModal={openCreateModal} handleLogout={handleLogout} /></ToastProvider>;
    if (currentPage === 'premium') return <Premium />;
    if (currentPage === 'settings') return <Settings onNavigate={navigateToPage} setActiveNav={setActiveNav} onCloseSidebar={() => setIsSidebarOpen(false)} isLightMode={isLightMode} onToggleLightMode={() => setIsLightMode((current) => !current)} handleLogout={handleLogout} />;
    if (currentPage === 'safety') return <SafetyCentre onNavigate={navigateToPage} setActiveNav={setActiveNav} />;
    if (currentPage === 'travel') return <TravelMode initialCity={(location.state as any)?.city || currentUser?.city || undefined} />;
    if (currentPage === 'squads') return <SquadsPage />;
    if (currentPage === 'admin') return <AdminModerator onNavigate={navigateToPage} setActiveNav={setActiveNav} onCloseSidebar={() => setIsSidebarOpen(false)} />;
    if (currentPage === 'help') return <Help onNavigate={navigateToPage} isLightMode={isLightMode} />;
    if (currentPage === 'assessment') return <ComprehensiveAssessment onNavigate={navigateToPage} />;
    if (currentPage === 'public-profile' && (routePublicHostId || publicHostId)) return <PublicHostProfile hostId={routePublicHostId || publicHostId || ''} onNavigate={navigateToPage} setActiveNav={setActiveNav} />;

    return (
      <div className="flex min-h-screen bg-[#0F0F13] text-white selection:bg-[#F59E0B]/30 font-sans">
        <Sidebar 
          activeNav={activeNav} 
          handleLogout={handleLogout}
          onNavigate={navigateToPage}
          setActiveNav={setActiveNav}
        />

        <main className="flex-1 ml-0 md:ml-64">
          <div className="max-w-5xl mx-auto px-4 py-4 pb-28 md:px-8 md:py-8 md:pb-32">
            {/* Top Header with Action Buttons */}
            <header className="flex items-center justify-end gap-3 mb-8">
              <button 
                onClick={() => {
                  navigate('/myhost');
                  setOpenCreateModal(true);
                }}
                className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black px-4 py-2 rounded-full font-semibold text-sm transition-colors"
              >
                <Plus size={18} />
                <span>Post</span>
              </button>
              <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors relative"
                onClick={() => navigate('/notifications')}>
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
                        navigate('/premium');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Premium
                    </button>
                    <button
                      onClick={() => {
                        navigate('/squads');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
                    >
                      Squads
                    </button>
                    <button
                      onClick={() => {
                        navigate('/help');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
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
            {activeNav === 'Discover' && <Discover onNavigate={navigateToPage} onOpenEvent={setSelectedEvent} currentUser={currentUser} />}
            {activeNav === 'My Requests' && <MyRequests />}
            {activeNav === 'Messages' && <Messages />}
            {activeNav === 'Safety' && <Safety />}
            {activeNav === 'Profile' && <Profile onNavigate={navigateToPage} setActiveNav={setActiveNav} isLightMode={isLightMode} onToggleLightMode={() => setIsLightMode((current) => !current)} handleLogout={handleLogout} startEditing={Boolean((routeState as any)?.startEditing)} />}
            {activeNav === 'Nearby' && <Nearby onNavigate={navigateToPage} setActiveNav={setActiveNav} isLightMode={isLightMode} currentUser={currentUser} />}
          </div>
        </main>
      </div>
    );
  })();

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <LanguageProvider>
        <AppProvider value={{
          selectedEvent,
          selectedUser,
          setSelectedUser,
          handleLogout,
        }}>
          <ErrorBoundary>
            <div className={`${isLightMode ? 'theme-light ' : ''}${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
              {content}
            </div>
          </ErrorBoundary>
        </AppProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
