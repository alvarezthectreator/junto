import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
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

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeNav, setActiveNav] = useState('Discover');
  const [currentPage, setCurrentPage] = useState('Discover');
  const [selectedLocation, setSelectedLocation] = useState('Lagos');
  const [selectedEvent, setSelectedEvent] = useState<EventDetailData | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Restore authentication state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const sessionToken = localStorage.getItem('sessionToken');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('displayName') || 'User';

    if (sessionToken && userId) {
      // User is still logged in
      setIsAuthenticated(true);
      setHasEntered(true);
      setCurrentUser({ id: userId, display_name: userName });
    }
  }, []);

  const handleLogin = (user: any, token: string) => {
    setCurrentUser({ ...user, token });
    setIsAuthenticated(true);
    setHasEntered(true);
  };

  const handleLogout = () => {
    setHasEntered(false);
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('displayName');
  };

  const handleNavigate = (page: string) => {
    // Special handling for logout
    if (page === 'logout') {
      handleLogout();
      return;
    }

    // Map navigation commands to page names
    const pageMap: { [key: string]: string } = {
      'main': 'Discover',
      'event': 'EventDetail',
      'nearby': 'Nearby',
      'requests': 'MyRequests',
      'messages': 'Messages',
      'safety': 'Safety',
      'premium': 'Premium',
      'hosting': 'HostDashboard',
      'notifications': 'Notifications',
      'settings': 'Settings',
      'travel': 'TravelMode',
      'profile': 'Profile',
      'help': 'Help',
      'venues': 'MyHost',
      'celeb': 'Discover',
      'safety-centre': 'SafetyCentre'
    };
    
    const pageToLoad = pageMap[page] || 'Discover';
    setCurrentPage(pageToLoad);
  };

  const handleOpenEvent = (event: EventDetailData) => {
    setSelectedEvent(event);
  };

  const handleOpenUser = (user: any) => {
    setSelectedUser(user);
  };

  // If not authenticated, show Landing
  if (!isAuthenticated) {
    return (
      <Landing 
        onEnter={() => setHasEntered(true)}
        onLogin={handleLogin}
      />
    );
  }

  // If has entered, show the app shell with the current page
  if (hasEntered) {
    const renderPage = () => {
      switch (currentPage) {
        case 'Discover':
          return <Discover selectedLocation={selectedLocation} currentUser={currentUser} onNavigate={handleNavigate} onOpenEvent={handleOpenEvent} />;
        case 'EventDetail':
          return <EventDetail eventData={selectedEvent} onNavigate={handleNavigate} />;
        case 'Nearby':
          return <Nearby currentUser={currentUser} onNavigate={handleNavigate} onOpenUser={handleOpenUser} onOpenEvent={handleOpenEvent} />;
        case 'MyRequests':
          return <MyRequests currentUser={currentUser} onNavigate={handleNavigate} />;
        case 'Messages':
          return <Messages currentUser={currentUser} onNavigate={handleNavigate} />;
        case 'Safety':
          return <Safety currentUser={currentUser} onNavigate={handleNavigate} />;
        case 'Premium':
          return <Premium currentUser={currentUser} onNavigate={handleNavigate} />;
        case 'HostDashboard':
          return <HostDashboard currentUser={currentUser} onNavigate={handleNavigate} />;
        case 'Notifications':
          return <Notifications currentUser={currentUser} onNavigate={handleNavigate} />;
        case 'Settings':
          return <Settings currentUser={currentUser} onNavigate={handleNavigate} />;
        case 'TravelMode':
          return <TravelMode currentUser={currentUser} onNavigate={handleNavigate} />;
        case 'Profile':
          return <Profile selectedUser={selectedUser} currentUser={currentUser} onNavigate={handleNavigate} />;
        case 'Help':
          return <Help currentUser={currentUser} onNavigate={handleNavigate} />;
        case 'MyHost':
          return <MyHost currentUser={currentUser} onNavigate={handleNavigate} />;
        case 'SafetyCentre':
          return <SafetyCentre currentUser={currentUser} onNavigate={handleNavigate} />;
        default:
          return <Discover selectedLocation={selectedLocation} currentUser={currentUser} onNavigate={handleNavigate} onOpenEvent={handleOpenEvent} />;
      }
    };

    return (
      <div className="flex flex-col min-h-screen bg-[#0F0F13] text-white font-sans">
        <main className="flex-1 pb-24">
          {renderPage()}
        </main>
        <Sidebar 
          activeNav={activeNav} 
          setActiveNav={setActiveNav}
          onNavigate={handleNavigate}
        />
      </div>
    );
  }

  // Fallback
  return <div className="text-white p-8">Loading...</div>;
}
