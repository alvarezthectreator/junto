import React, { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ToastProvider } from './components/Toast';
import { Landing } from './pages/Landing';
import { Discover } from './pages/Discover';
import { EventDetail, type EventDetailData } from './pages/EventDetail';
import { Nearby } from './pages/Nearby';
import { MyRequests } from './pages/MyRequests';
import { Messages } from './pages/Messages';
import { Safety } from './pages/Safety';
import { Premium } from './pages/Premium';
import { HostDashboard } from './pages/HostDashboard';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';
import { TravelMode } from './pages/TravelMode';
import { Profile } from './pages/Profile';
import { Help } from './pages/Help';
import { MyHost } from './pages/MyHost';
import { SafetyCentre } from './pages/SafetyCentre';

// Context for shared app data
interface AppContextType {
  currentUser: any;
  selectedEvent: EventDetailData | null;
  selectedUser: any;
  setSelectedEvent: (event: EventDetailData | null) => void;
  setSelectedUser: (user: any) => void;
  handleLogout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

// App shell with sidebar
function AppShell({ handleLogout }: { handleLogout: () => void }) {
  const location = useLocation();

  // Determine active nav based on current route
  const getActiveNav = () => {
    const path = location.pathname;
    if (path === '/discover') return 'Discover';
    if (path === '/nearby') return 'Nearby';
    if (path === '/requests') return 'My Requests';
    if (path === '/messages') return 'Messages';
    if (path === '/safety') return 'Safety';
    if (path === '/profile') return 'Profile';
    return 'Discover';
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0F0F13] text-white font-sans">
      <main className="flex-1 pb-24">
        <Routes>
          <Route path="/discover" element={<Discover />} />
          <Route path="/nearby" element={<Nearby />} />
          <Route path="/requests" element={<MyRequests />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/hosting" element={<HostDashboard />} />
          <Route path="/myhost" element={<MyHost />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/travel" element={<TravelMode />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/help" element={<Help />} />
          <Route path="/venues" element={<MyHost />} />
          <Route path="/safety-centre" element={<SafetyCentre />} />
          <Route path="/event/:eventId" element={<EventDetail />} />
          <Route path="/" element={<Navigate to="/discover" replace />} />
        </Routes>
      </main>
      <Sidebar activeNav={getActiveNav()} onLogout={handleLogout} />
    </div>
  );
}

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDetailData | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const navigate = useNavigate();

  // Restore authentication state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const sessionToken = localStorage.getItem('sessionToken');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('displayName') || 'User';

    if (sessionToken && userId) {
      setIsAuthenticated(true);
      setCurrentUser({ id: userId, display_name: userName });
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = (user: any, token: string) => {
    setCurrentUser({ ...user, token });
    setIsAuthenticated(true);
    localStorage.setItem('sessionToken', token);
    localStorage.setItem('userId', user.id);
    localStorage.setItem('displayName', user.display_name);
    // Redirect to discover after login
    navigate('/discover');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('displayName');
    navigate('/landing');
  };

  if (isAuthenticated === null) {
    return <div className="text-white p-8">Loading...</div>;
  }

  return (
    <ToastProvider>
      <AppContext.Provider value={{ currentUser, selectedEvent, selectedUser, setSelectedEvent, setSelectedUser, handleLogout }}>
        <Routes>
          <Route
            path="/landing"
            element={
              !isAuthenticated ? (
                <Landing onLogin={handleLogin} />
              ) : (
                <Navigate to="/discover" replace />
              )
            }
          />
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <AppShell handleLogout={handleLogout} />
              ) : (
                <Navigate to="/landing" replace />
              )
            }
          />
        </Routes>
      </AppContext.Provider>
    </ToastProvider>
  );
}
