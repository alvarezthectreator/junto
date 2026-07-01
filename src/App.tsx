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
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Notifications } from './pages/Notifications';
import { ComprehensiveAssessment } from './pages/ComprehensiveAssessment';
import { PublicHostProfile } from './pages/PublicHostProfile';
import SquadsPage from './pages/Squads';
import { Celebrities } from './pages/Celebrities';
import { Venues } from './pages/Venues';
import { AdminModerator } from './admin/AdminModerator';
import { AdminLogin } from './admin/AdminLogin';
import { AdminUsers } from './admin/AdminUsers';
import { HighRiskAccounts } from './admin/HighRiskAccounts';
import { SafetyPlansPage } from './admin/SafetyPlansPage';
import { VenueCelebrityControl } from './admin/VenueCelebrityControl';
import { SystemStatusPage } from './admin/SystemStatusPage';
import { OTPSignup } from './pages/OTPSignup';
import { OnboardingInterests } from './pages/OnboardingInterests';
import { OnboardingLocation } from './pages/OnboardingLocation';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import { logout as clearApiSession, getLastSessionActivity, markSessionActivity, getSessionToken, getStoredCurrentUser, getUserProfile, verifySession } from './services/api';
import { appConfig } from './config/appConfig';
import { trackEvent, trackPageView } from './services/analytics';
import { updateThemeColor } from './services/pwa';

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
  if (cleanPath === '/venues') return 'venues';
  if (cleanPath === '/celebrities') return 'celebrities';
  if (cleanPath === '/premium') return 'premium';
  if (cleanPath === '/settings') return 'settings';
  if (cleanPath === '/travel') return 'travel';
  if (cleanPath === '/squads') return 'squads';
  if (cleanPath === '/admin/login') return 'admin-login';
  if (cleanPath === '/admin/users') return 'admin-users';
  if (cleanPath === '/admin/high-risk') return 'admin-high-risk';
  if (cleanPath === '/admin/safety-plans') return 'admin-safety-plans';
  if (cleanPath === '/admin/listings') return 'admin-listings';
  if (cleanPath === '/admin/system') return 'admin-system';
  if (cleanPath === '/admin') return 'admin';
  if (cleanPath === '/help') return 'help';
  if (cleanPath === '/terms') return 'terms';
  if (cleanPath === '/privacy') return 'privacy';
  if (cleanPath === '/notifications') return 'notifications';
  if (cleanPath === '/assessment') return 'assessment';

  return 'main';
}

function getPagePath(page: string, eventId?: string | null) {
  const normalizedPage = page.toLowerCase();

  switch (normalizedPage) {
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
    case 'hostdashboard':
      return '/dashboard';
    case 'myhost':
      return '/myhost';
    case 'venues':
      return '/venues';
    case 'celebrities':
      return '/celebrities';
    case 'premium':
      return '/premium';
    case 'settings':
      return '/settings';
    case 'travel':
      return '/travel';
    case 'squads':
      return '/squads';
    case 'admin-login':
      return '/admin/login';
    case 'admin-users':
      return '/admin/users';
    case 'admin-high-risk':
      return '/admin/high-risk';
    case 'admin-safety-plans':
      return '/admin/safety-plans';
    case 'admin-listings':
      return '/admin/listings';
    case 'admin-system':
      return '/admin/system';
    case 'admin':
      return '/admin';
    case 'help':
      return '/help';
    case 'terms':
      return '/terms';
    case 'privacy':
      return '/privacy';
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
  const [isRouteTransitioning, setIsRouteTransitioning] = useState(false);
  const { eventId: routeEventId, publicHostId: routePublicHostId } = getRouteIds(location.pathname);
  const routeState = (location.state || {}) as RouteState;
  const hasAdminAccess = typeof window !== 'undefined' && window.sessionStorage.getItem('junto-admin-access') === 'true';

  const onboardingFlowActive = typeof window !== 'undefined' && window.sessionStorage.getItem(ONBOARDING_FLOW_KEY) === 'true';

  const navigateToPage = useCallback((page: string) => {
    const normalizedPage = page.toLowerCase();
    setIsRouteTransitioning(true);

    if (normalizedPage === 'event') {
      const eventId = selectedEvent?.id || routeEventId;
      navigate(getPagePath(normalizedPage, eventId));
      setShowMenu(false);
      window.setTimeout(() => setIsRouteTransitioning(false), 250);
      return;
    }

    if (normalizedPage === 'landing') {
      navigate('/');
      setShowMenu(false);
      window.setTimeout(() => setIsRouteTransitioning(false), 250);
      return;
    }

    navigate(getPagePath(normalizedPage));
    setShowMenu(false);
    window.setTimeout(() => setIsRouteTransitioning(false), 250);
  }, [navigate, routeEventId, selectedEvent?.id]);

  const pageMeta = (() => {
    switch (currentPage) {
      case 'landing':
        return {
          title: appConfig.appName,
          description: appConfig.appDescription,
        };
      case 'main':
        return {
          title: 'Discover events on Wantuu',
          description: 'Browse events, discover people nearby, and plan your next outing.',
        };
      case 'nearby':
        return {
          title: 'Nearby people',
          description: 'Swipe through nearby people and see richer profile cards.',
        };
      case 'messages':
        return {
          title: 'Messages',
          description: 'Keep up with conversations and follow up on plans.',
        };
      case 'notifications':
        return {
          title: 'Notifications',
          description: 'Review unread updates, grouped notifications, and alerts.',
        };
      case 'settings':
        return {
          title: 'Settings',
          description: 'Manage account preferences, privacy, and notification settings.',
        };
      case 'terms':
        return {
          title: 'Terms of Service',
          description: 'Read the legal terms for using wantuu.',
        };
      case 'privacy':
        return {
          title: 'Privacy Policy',
          description: 'See how wantuu handles and protects your data.',
        };
      case 'assessment':
        return {
          title: 'Comprehensive Assessment',
          description: 'Current implementation status and outstanding product work.',
        };
      case 'admin-login':
        return {
          title: 'Admin Login',
          description: 'Enter the admin dashboard.',
        };
      case 'admin-users':
        return {
          title: 'Registered Users',
          description: 'Admin user management and moderation.',
        };
      case 'admin-high-risk':
        return {
          title: 'High-Risk Accounts',
          description: 'Manual review queue for risky accounts.',
        };
      case 'admin-safety-plans':
        return {
          title: 'Safety Queue and Payments',
          description: 'Safety workflow and monetization oversight.',
        };
      case 'admin-listings':
        return {
          title: 'Venue and Celebrity Control',
          description: 'Create, edit, review, and delete venues and celebrities.',
        };
      case 'admin-system':
        return {
          title: 'System Status',
          description: 'Operational health and system activity tracking.',
        };
      case 'admin':
        return {
          title: 'Admin Dashboard',
          description: 'Admin dashboard and user management.',
        };
      default:
        return {
          title: appConfig.appName,
          description: appConfig.appDescription,
        };
    }
  })();

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

  useEffect(() => {
    if (currentPage === 'admin' && !hasAdminAccess) {
      navigate('/admin/login', { replace: true });
    }

    if (currentPage === 'admin-login' && hasAdminAccess) {
      navigate('/admin', { replace: true });
    }

    if (currentPage === 'admin-users' && !hasAdminAccess) {
      navigate('/admin/login', { replace: true });
    }

    if (currentPage === 'admin-high-risk' && !hasAdminAccess) {
      navigate('/admin/login', { replace: true });
    }

    if (currentPage === 'admin-safety-plans' && !hasAdminAccess) {
      navigate('/admin/login', { replace: true });
    }

    if (currentPage === 'admin-listings' && !hasAdminAccess) {
      navigate('/admin/login', { replace: true });
    }

    if (currentPage === 'admin-system' && !hasAdminAccess) {
      navigate('/admin/login', { replace: true });
    }
  }, [currentPage, hasAdminAccess, navigate]);

  useEffect(() => {
    document.title = pageMeta.title;
    updateThemeColor();

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', pageMeta.description);
    }

    trackPageView(location.pathname, pageMeta.title, currentUser?.id);
    const timer = window.setTimeout(() => setIsRouteTransitioning(false), 120);

    return () => window.clearTimeout(timer);
  }, [currentUser?.id, location.pathname, pageMeta.description, pageMeta.title]);

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
    const storedSnapshot = (() => {
      if (typeof window === 'undefined') {
        return {};
      }

    try {
      const raw = window.sessionStorage.getItem('junto-current-user');
      return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    })();

    // Set current user with provided user data
    const userData = { 
      id: user.id,
      username: user.username || user.display_name || 'User',
      name: user.username || user.display_name || 'User',
      profile_id: user.profile_id,
      date_of_birth: user.date_of_birth || storedSnapshot.date_of_birth || null,
      gender: user.gender || null,
      occupation: user.occupation || null,
      intro_video_url: user.intro_video_url || storedSnapshot.intro_video_url || null,
      avatar_image: user.avatar_image || user.avatar_url || storedSnapshot.avatar_image || storedSnapshot.avatar_url || null,
      avatar_url: user.avatar_url || user.avatar_image || storedSnapshot.avatar_url || storedSnapshot.avatar_image || null,
      profile_photos: Array.isArray(user.profile_photos)
        ? user.profile_photos
        : Array.isArray(storedSnapshot.profile_photos)
          ? storedSnapshot.profile_photos
          : [],
    };
    setCurrentUser(userData);
    setSelectedUser(null);
    // Store session token and user data
    sessionStorage.setItem('sessionToken', token);
    sessionStorage.setItem('junto-session-token', token);
    sessionStorage.setItem('junto-current-user', JSON.stringify(userData));
    sessionStorage.setItem('junto-user-id', user.id);
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('junto-session-token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    localStorage.removeItem('junto-current-user');
    localStorage.removeItem('junto-user-id');
    markSessionActivity();
    setIsAuthenticated(true);
    setHasEntered(true);
    trackEvent('auth_login', { method: 'password' }, user.id);
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
    window.sessionStorage.removeItem('sessionToken');
    window.sessionStorage.removeItem('junto-session-token');
    window.sessionStorage.removeItem('junto-current-user');
    window.sessionStorage.removeItem('junto-user-id');
    window.sessionStorage.removeItem('junto-admin-access');
    window.sessionStorage.removeItem('junto-admin-user');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('junto-session-token');
    localStorage.removeItem('junto-current-user');
    localStorage.removeItem('junto-user-id');
    localStorage.removeItem('junto-current-page');
    localStorage.removeItem('junto-active-nav');
    window.sessionStorage.removeItem(ONBOARDING_FLOW_KEY);
    clearApiSession();
    trackEvent('auth_logout', {}, currentUser?.id);
  }, [currentUser?.id, navigate]);
  
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
    if (!isAuthenticated || !currentUser?.id) {
      return;
    }

    const alreadyHasAvatar = Boolean(
      currentUser.avatar_image ||
      currentUser.avatar_url ||
      (Array.isArray(currentUser.profile_photos) && currentUser.profile_photos.length > 0)
    );
    const hasIntroVideo = Boolean(currentUser.intro_video_url);

    if (alreadyHasAvatar && hasIntroVideo) {
      return;
    }

    let cancelled = false;

    const hydrateProfileMedia = async () => {
      try {
        const profile = await getUserProfile(currentUser.id);
        const hydratedAvatar = profile.avatar_image || profile.avatar_url || (Array.isArray(profile.profile_photos) ? profile.profile_photos[0] : null);

        if (!hydratedAvatar || cancelled) {
          return;
        }

        const mergedUser = {
          ...currentUser,
          date_of_birth: currentUser.date_of_birth || profile.date_of_birth || null,
          intro_video_url: currentUser.intro_video_url || profile.intro_video_url || null,
          avatar_image: hydratedAvatar,
          avatar_url: hydratedAvatar,
          profile_photos: Array.isArray(profile.profile_photos) ? profile.profile_photos : currentUser.profile_photos || [],
        };

        setCurrentUser(mergedUser);
        sessionStorage.setItem('junto-current-user', JSON.stringify(mergedUser));
      } catch (error) {
        console.error('Failed to hydrate profile media after login:', error);
      }
    };

    void hydrateProfileMedia();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, currentUser?.avatar_image, currentUser?.avatar_url, currentUser?.id, currentUser?.profile_photos]);

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
    const storedUser = getStoredCurrentUser();
    const userData = storedUser ? JSON.stringify(storedUser) : null;
    
    const restoreSession = async () => {
      if (!sessionToken) {
        setIsSessionBooting(false);
        return;
      }

      try {
        const verifiedSession = await verifySession();
        const user = userData ? JSON.parse(userData) : verifiedSession.user;
        const storedActivity = getStoredSessionActivity();

        if (storedActivity && Date.now() - storedActivity >= SESSION_TIMEOUT_MS) {
          handleLogout();
          return;
        }

        const verifiedUser = verifiedSession.user || user;
        const mergedUser = {
          ...user,
          ...verifiedUser,
          date_of_birth: user.date_of_birth || verifiedUser.date_of_birth || null,
          name: verifiedUser.username || verifiedUser.display_name || user.name || user.username || 'User',
          username: verifiedUser.username || user.username || user.name || 'User',
          intro_video_url: verifiedUser.intro_video_url || user.intro_video_url || null,
          avatar_image: verifiedUser.avatar_image || verifiedUser.avatar_url || user.avatar_image || user.avatar_url || null,
          avatar_url: verifiedUser.avatar_url || verifiedUser.avatar_image || user.avatar_url || user.avatar_image || null,
          profile_photos: Array.isArray(verifiedUser.profile_photos)
            ? verifiedUser.profile_photos
            : Array.isArray(user.profile_photos)
              ? user.profile_photos
              : [],
        };

        sessionStorage.setItem('junto-current-user', JSON.stringify(mergedUser));
        sessionStorage.setItem('junto-user-id', mergedUser.id);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userId');
        localStorage.removeItem('junto-current-user');
        localStorage.removeItem('junto-user-id');
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
    if (currentPage === 'admin-login' || (currentPage === 'admin' && !hasAdminAccess)) {
      return (
        <AdminLogin
          onEnterDashboard={() => {
            navigate('/admin', { replace: true });
          }}
        />
      );
    }

    if (currentPage === 'admin-users') {
      return <AdminUsers onNavigate={navigateToPage} />;
    }

    if (currentPage === 'admin-high-risk') {
      return <HighRiskAccounts onNavigate={navigateToPage} />;
    }

    if (currentPage === 'admin-safety-plans') {
      return <SafetyPlansPage onNavigate={navigateToPage} />;
    }

    if (currentPage === 'admin-listings') {
      return <VenueCelebrityControl onNavigate={navigateToPage} />;
    }

    if (currentPage === 'admin-system') {
      return <SystemStatusPage onNavigate={navigateToPage} />;
    }

    if (currentPage === 'admin') {
      return <AdminModerator onNavigate={navigateToPage} setActiveNav={setActiveNav} onCloseSidebar={() => setIsSidebarOpen(false)} />;
    }

    if (currentPage === 'onboarding-interests' && (isAuthenticated || getSessionToken())) {
      return (
        <OnboardingInterests
          currentUser={currentUser}
          onBack={() => navigate('/signup-otp')}
          onComplete={() => navigate('/onboarding/location')}
        />
      );
    }

    if (currentPage === 'onboarding-location' && (isAuthenticated || getSessionToken())) {
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
    if (currentPage === 'venues') return <Venues />;
    if (currentPage === 'celebrities') return <Celebrities />;
    if (currentPage === 'premium') return <Premium />;
    if (currentPage === 'settings') return <Settings onNavigate={navigateToPage} setActiveNav={setActiveNav} onCloseSidebar={() => setIsSidebarOpen(false)} isLightMode={isLightMode} onToggleLightMode={() => setIsLightMode((current) => !current)} handleLogout={handleLogout} />;
    if (currentPage === 'terms') return <Terms onNavigate={navigateToPage} setActiveNav={setActiveNav} onCloseSidebar={() => setIsSidebarOpen(false)} />;
    if (currentPage === 'privacy') return <Privacy onNavigate={navigateToPage} setActiveNav={setActiveNav} onCloseSidebar={() => setIsSidebarOpen(false)} />;
    if (currentPage === 'safety') return <SafetyCentre onNavigate={navigateToPage} setActiveNav={setActiveNav} />;
    if (currentPage === 'travel') return <TravelMode initialCity={(location.state as any)?.city || currentUser?.city || undefined} />;
    if (currentPage === 'squads') return <SquadsPage />;
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
          onClearSelectedUser={() => setSelectedUser(null)}
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
                <span>Create</span>
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
                        navigate('/venues');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Venues
                    </button>
                    <button
                      onClick={() => {
                        navigate('/celebrities');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
                    >
                      Celeb
                    </button>
                    <button
                      onClick={() => {
                        navigate('/premium');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
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
            {activeNav === 'Messages' && <Messages currentUser={currentUser} onNavigate={navigateToPage} />}
            {activeNav === 'Safety' && <Safety />}
            {activeNav === 'Profile' && <Profile onNavigate={navigateToPage} setActiveNav={setActiveNav} isLightMode={isLightMode} onToggleLightMode={() => setIsLightMode((current) => !current)} handleLogout={handleLogout} startEditing={Boolean((routeState as any)?.startEditing)} currentUser={currentUser} setCurrentUser={setCurrentUser} />}
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
              <a
                href="#app-main"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10000] rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-black shadow-lg"
              >
                Skip to content
              </a>
              {isRouteTransitioning && (
                <div className="fixed left-0 top-0 z-[10000] h-1 w-full overflow-hidden bg-white/10">
                  <div className="h-full w-1/3 animate-pulse bg-gradient-to-r from-[#F59E0B] via-[#FB923C] to-[#F59E0B]" />
                </div>
              )}
              <div
                id="app-main"
                role="main"
                tabIndex={-1}
                aria-live="polite"
                aria-busy={isRouteTransitioning}
              >
                {content}
              </div>
            </div>
          </ErrorBoundary>
        </AppProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
