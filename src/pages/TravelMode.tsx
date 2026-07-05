import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Save, Trash2, ChevronRight, Filter, MapPin, Search, Sparkles, Compass } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { Sidebar } from "../components/Sidebar";
import * as API from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info } from "lucide-react";
import {
  cleanupTravelSearches,
  readTravelSearches,
  writeTravelSearches,
  type TravelSearchRecord,
} from '../utils/localActivity';

type ToastMessage = { id: string; text: string; type: 'success' | 'error' | 'info' };

interface TravelModeProps {
  initialCity?: string;
}

function TravelEventCard({ event, index, isLightMode = false }: { event: any; index: number; isLightMode?: boolean }) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80 * index);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      style={{
        background: isLightMode ? "#fffaf2" : "#0a0a0a",
        border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1c1c1c",
        borderRadius: 16,
        padding: 16,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.5s ease, transform 0.5s ease, border-color 0.3s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as any).style.borderColor = "#F69D11";
        (e.currentTarget as any).style.backgroundColor = isLightMode ? "rgba(245,158,11,0.06)" : "rgba(246,157,17,0.03)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as any).style.borderColor = isLightMode ? "rgba(36,27,16,0.1)" : "#1c1c1c";
        (e.currentTarget as any).style.backgroundColor = isLightMode ? "#fffaf2" : "#0a0a0a";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: isLightMode ? "#241b10" : "#fff" }}>{event.title}</h3>
            {event.isGuide && (
              <span style={{
                fontSize: 10,
                background: "rgba(246,157,17,0.15)",
                color: "#F69D11",
                padding: "2px 8px",
                borderRadius: 4,
                fontWeight: 700,
              }}>🗺️ Guide</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: isLightMode ? "#8d7758" : "#888", display: "flex", gap: 8, marginBottom: 8 }}>
            <span>📍 {event.location}</span>
            <span>👤 {event.host}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{
              fontSize: 11,
              background: event.type === "virtual" ? "rgba(59,130,246,0.15)" : "rgba(34,197,94,0.15)",
              color: event.type === "virtual" ? "#3b82f6" : "#22c55e",
              padding: "4px 10px",
              borderRadius: 6,
              fontWeight: 600,
            }}>
              {event.type === "virtual" ? "💻 Virtual" : "📍 In-Person"}
            </span>
            <span style={{
              fontSize: 11,
              background: "rgba(246,157,17,0.1)",
              color: "#F69D11",
              padding: "4px 10px",
              borderRadius: 6,
              fontWeight: 600,
            }}>❤️ {event.interested} interested</span>
          </div>
        </div>
            <button
              style={{
                background: "none",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                color: isLightMode ? "#7a674f" : "#555",
                transition: "color 0.2s ease",
              }}
          onMouseEnter={(e) => { (e.currentTarget as any).style.color = "#F69D11"; }}
          onMouseLeave={(e) => { (e.currentTarget as any).style.color = isLightMode ? "#7a674f" : "#555"; }}
            >
              🔖
            </button>
      </div>
    </div>
  );
}

export const TravelMode = ({ initialCity }: TravelModeProps) => {
  const navigate = useNavigate();
  const { currentUser } = useAppContext();
  const [isLightMode] = useState(false);
  const [selectedCity, setSelectedCity] = useState(initialCity || 'Lagos');
  const [citySearch, setCitySearch] = useState("");
  const [eventType, setEventType] = useState<"all" | "virtual" | "physical">("all");
  const [travelModeEnabled, setTravelModeEnabled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");
  const [savedTrips, setSavedTrips] = useState<Array<{ id: string; city: string; startDate: string; endDate: string }>>([]);
  const [showSavedTrips, setShowSavedTrips] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [travelEvents, setTravelEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [savedSearches, setSavedSearches] = useState<TravelSearchRecord[]>([]);
  const storagePrefix = 'junto-travel-mode';
  const [editingSearchId, setEditingSearchId] = useState<string | null>(null);
  const [editingSearchLabel, setEditingSearchLabel] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setHeaderVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (initialCity) {
      setSelectedCity(initialCity);
    }
  }, [initialCity]);

  useEffect(() => {
    try {
      const savedTripsRaw = localStorage.getItem(`${storagePrefix}-trips`);
      if (savedTripsRaw) {
        const parsedTrips = JSON.parse(savedTripsRaw);
        if (Array.isArray(parsedTrips)) {
          setSavedTrips(parsedTrips);
        }
      }

      const cleanedSearches = cleanupTravelSearches(14);
      if (cleanedSearches.length > 0) {
        setSavedSearches(cleanedSearches);
      } else {
        setSavedSearches(readTravelSearches());
      }
    } catch {
      // Ignore bad cached data.
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const hydrateTravelSettings = async () => {
      if (!currentUser?.id) {
        return;
      }

      try {
        const profile = await API.getUserProfile(currentUser.id);
        if (!mounted) {
          return;
        }

        if (profile.travel_destination_city) {
          setSelectedCity(profile.travel_destination_city);
        }

        setTravelModeEnabled(Boolean(profile.travel_mode_enabled));
      } catch (error) {
        console.error('Failed to load travel settings:', error);
      }
    };

    hydrateTravelSettings();

    return () => {
      mounted = false;
    };
  }, [currentUser?.id]);

  useEffect(() => {
    let mounted = true;

    const loadTravelEvents = async () => {
      try {
        setEventsLoading(true);
        setEventsError('');

        const response = await API.getEvents({ city: selectedCity });
        const mappedEvents = (response?.events || []).map((event: any) => {
          const eventTypeValue = String(event.event_type || event.type || 'physical').toLowerCase();
          return {
            id: String(event.id),
            title: event.title,
            type: eventTypeValue.includes('virtual') ? 'virtual' : 'physical',
            location: event.location_address || event.location_city || selectedCity,
            host: event.display_name || 'Junto host',
            interested: Number(event.current_guests_count || 0),
            isGuide: Boolean(event.is_tour_guide),
          };
        });

        if (mounted) {
          setTravelEvents(mappedEvents);
        }
      } catch (error) {
        console.error('Failed to load travel events:', error);
        if (mounted) {
          setTravelEvents([]);
          setEventsError('Could not load live events right now.');
        }
      } finally {
        if (mounted) {
          setEventsLoading(false);
        }
      }
    };

    loadTravelEvents();

    return () => {
      mounted = false;
    };
  }, [selectedCity]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const saveTrip = async () => {
    if (!tripStartDate || !selectedCity) {
      showToast('Please select a city and start date', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (currentUser?.id) {
        await API.updateUserProfile(currentUser.id, {
          travel_mode_enabled: travelModeEnabled,
          travel_destination_city: selectedCity,
        });
        showToast(`${travelModeEnabled ? '✈️ Travel mode saved' : 'Travel destination saved'} for ${selectedCity}!`, 'success');
      }

      const newTrip = {
        id: Date.now().toString(),
        city: selectedCity,
        startDate: tripStartDate,
        endDate: tripEndDate || tripStartDate,
      };
      const nextTrips = [...savedTrips, newTrip];
      setSavedTrips(nextTrips);
      localStorage.setItem(`${storagePrefix}-trips`, JSON.stringify(nextTrips));

      const nextSearch: TravelSearchRecord = {
        id: `${selectedCity}-${eventType}`.toLowerCase().replace(/\s+/g, '-'),
        city: selectedCity,
        eventType,
        label: `${selectedCity} · ${eventType}`,
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      };
      const dedupedSearches = [
        nextSearch,
        ...savedSearches
          .filter((search) => !(search.city === nextSearch.city && search.eventType === nextSearch.eventType))
          .map((search) => ({
            ...search,
            lastUsedAt: search.lastUsedAt || search.createdAt,
          })),
      ].slice(0, 6);
      setSavedSearches(dedupedSearches);
      writeTravelSearches(dedupedSearches);
    } catch (error) {
      console.error('Failed to save travel destination:', error);
      showToast('Failed to save travel destination', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTrip = (id: string) => {
    const nextTrips = savedTrips.filter(trip => trip.id !== id);
    setSavedTrips(nextTrips);
    localStorage.setItem(`${storagePrefix}-trips`, JSON.stringify(nextTrips));
  };

  const loadTrip = (trip: typeof savedTrips[0]) => {
    setSelectedCity(trip.city);
    setTripStartDate(trip.startDate);
    setTripEndDate(trip.endDate);
    setShowSavedTrips(false);
  };

  const handleSelectSavedSearch = (city: string, type: "all" | "virtual" | "physical") => {
    setSelectedCity(city);
    setEventType(type);
    setCitySearch(city);
    const nextSearches = savedSearches.map((search) =>
      search.city === city && search.eventType === type
        ? { ...search, lastUsedAt: new Date().toISOString() }
        : search
    );
    setSavedSearches(nextSearches);
    writeTravelSearches(nextSearches);
    showToast(`Loaded saved search for ${city}`, 'info');
  };

  const beginRenameSavedSearch = (search: TravelSearchRecord) => {
    setEditingSearchId(search.id);
    setEditingSearchLabel(search.label || `${search.city} · ${search.eventType}`);
  };

  const saveRenamedSearch = () => {
    if (!editingSearchId) return;

    const trimmedLabel = editingSearchLabel.trim();
    const nextSearches = savedSearches.map((search) =>
      search.id === editingSearchId
        ? { ...search, label: trimmedLabel || `${search.city} · ${search.eventType}` }
        : search
    );

    setSavedSearches(nextSearches);
    writeTravelSearches(nextSearches);
    setEditingSearchId(null);
    setEditingSearchLabel('');
    showToast('Saved search renamed', 'success');
  };

  const deleteSavedSearch = (searchId: string) => {
    const nextSearches = savedSearches.filter((search) => search.id !== searchId);
    setSavedSearches(nextSearches);
    writeTravelSearches(nextSearches);
    if (editingSearchId === searchId) {
      setEditingSearchId(null);
      setEditingSearchLabel('');
    }
    showToast('Saved search removed', 'info');
  };

  const cities = [
    { label: "🇳🇬 Lagos", value: "Lagos" },
    { label: "🇳🇬 Abuja", value: "Abuja" },
    { label: "🇬🇭 Accra", value: "Accra" },
    { label: "🇰🇪 Nairobi", value: "Nairobi" },
    { label: "🇿🇦 Johannesburg", value: "Johannesburg" },
    { label: "🇬🇧 London", value: "London" },
    { label: "🇯🇵 Tokyo", value: "Tokyo" },
    { label: "🇦🇪 Dubai", value: "Dubai" },
    { label: "🇺🇸 New York", value: "New York" },
    { label: "🇫🇷 Paris", value: "Paris" },
  ];

  const filteredCities = cities.filter((city) => {
    const query = citySearch.trim().toLowerCase();
    if (!query) return true;
    return city.label.toLowerCase().includes(query) || city.value.toLowerCase().includes(query);
  });

  const filteredEvents = travelEvents.filter((e) => {
    if (eventType === "all") return true;
    return e.type === eventType;
  });

  const handleToggleTravelMode = async () => {
    const nextEnabled = !travelModeEnabled;
    setTravelModeEnabled(nextEnabled);

    if (!currentUser?.id) {
      showToast('Sign in to save travel mode', 'error');
      return;
    }

    try {
      await API.updateUserProfile(currentUser.id, {
        travel_mode_enabled: nextEnabled,
        travel_destination_city: selectedCity,
      });
      showToast(nextEnabled ? 'Travel mode enabled' : 'Travel mode disabled', 'success');
    } catch (error) {
      console.error('Failed to update travel mode:', error);
      setTravelModeEnabled(!nextEnabled);
      showToast('Failed to update travel mode', 'error');
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: isLightMode
        ? "radial-gradient(circle at top left, rgba(246,157,17,0.14), transparent 36%), linear-gradient(180deg, #fffaf2 0%, #f6efe2 100%)"
        : "radial-gradient(circle at top left, rgba(246,157,17,0.18), transparent 34%), radial-gradient(circle at top right, rgba(59,130,246,0.14), transparent 28%), linear-gradient(180deg, #09090b 0%, #050505 100%)",
      color: isLightMode ? "#241b10" : "#fff",
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      overflowX: "hidden"
    }}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes floaty {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .travel-shell {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 20px 16px 40px;
        }
        .travel-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(280px, 420px);
          gap: 18px;
          align-items: stretch;
          margin-bottom: 18px;
          animation: fadeUp 0.55s ease both;
        }
        .travel-hero-card, .travel-panel, .travel-feed, .travel-section {
          border-radius: 28px;
          overflow: hidden;
          backdrop-filter: blur(18px);
        }
        .travel-hero-card {
          padding: 24px;
          border: 1px solid ${isLightMode ? 'rgba(36,27,16,0.08)' : 'rgba(255,255,255,0.08)'};
          background: ${isLightMode ? 'rgba(255,250,242,0.86)' : 'rgba(15,15,19,0.82)'};
          box-shadow: ${isLightMode ? '0 18px 60px rgba(122,103,79,0.12)' : '0 22px 70px rgba(0,0,0,0.45)'};
          position: relative;
        }
        .travel-panel {
          padding: 20px;
          border: 1px solid ${isLightMode ? 'rgba(36,27,16,0.08)' : 'rgba(255,255,255,0.08)'};
          background: ${isLightMode ? 'rgba(255,250,242,0.74)' : 'rgba(10,10,10,0.82)'};
          box-shadow: ${isLightMode ? '0 16px 48px rgba(122,103,79,0.10)' : '0 16px 52px rgba(0,0,0,0.35)'};
        }
        .travel-grid {
          display: grid;
          grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }
        .travel-column {
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-width: 0;
        }
        .travel-feed {
          padding: 20px;
          border: 1px solid ${isLightMode ? 'rgba(36,27,16,0.08)' : 'rgba(255,255,255,0.08)'};
          background: ${isLightMode ? 'rgba(255,250,242,0.6)' : 'rgba(8,8,10,0.72)'};
          box-shadow: ${isLightMode ? '0 14px 44px rgba(122,103,79,0.08)' : '0 18px 56px rgba(0,0,0,0.35)'};
        }
        .travel-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.01em;
        }
        .travel-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }
        .travel-stat {
          border-radius: 18px;
          padding: 14px 16px;
          border: 1px solid ${isLightMode ? 'rgba(36,27,16,0.08)' : 'rgba(255,255,255,0.08)'};
          background: ${isLightMode ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.04)'};
        }
        .travel-input::placeholder {
          color: ${isLightMode ? '#8d7758' : '#7f7f87'};
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${isLightMode ? '#f3eadc' : '#0a0a0a'}; }
        ::-webkit-scrollbar-thumb { background: ${isLightMode ? '#d8c7ab' : '#1c1c1c'}; border-radius: 2px; }
        @media (max-width: 1024px) {
          .travel-hero,
          .travel-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .travel-shell {
            padding: 12px 12px 28px;
          }
          .travel-hero-card, .travel-panel, .travel-feed {
            border-radius: 22px;
          }
          .travel-hero-card, .travel-panel, .travel-feed {
            padding: 18px;
          }
          .travel-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main
        className="travel-shell"
        style={{
          minHeight: "100vh",
          paddingBottom: "110px",
        }}
      >
        <div
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? "translateY(0)" : "translateY(-8px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}
        >
        <div className="travel-hero">
            <div className="travel-hero-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", flexWrap: "wrap" }}>
                <div style={{ maxWidth: 680 }}>
                  <div className="travel-pill" style={{ background: travelModeEnabled ? "rgba(34,197,94,0.14)" : "rgba(246,157,17,0.14)", color: travelModeEnabled ? "#22c55e" : "#F69D11", border: `1px solid ${travelModeEnabled ? 'rgba(34,197,94,0.22)' : 'rgba(246,157,17,0.22)'}` }}>
                    <Sparkles size={14} />
                    Explore smarter
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                    <div style={{
                      width: 54,
                      height: 54,
                      borderRadius: 18,
                      background: "linear-gradient(135deg, #F69D11 0%, #FB923C 100%)",
                      display: "grid",
                      placeItems: "center",
                      color: "#111",
                      boxShadow: "0 12px 30px rgba(246,157,17,0.35)",
                      animation: "floaty 4s ease-in-out infinite",
                    }}>
                      <Compass size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#F69D11", marginBottom: 2 }}>
                        Travel Mode
                      </div>
                      <h1 style={{ margin: 0, fontSize: "clamp(30px, 4vw, 52px)", fontWeight: 900, lineHeight: 1, letterSpacing: -1 }}>
                        Find events like a local
                      </h1>
                    </div>
                  </div>
                  <p style={{ margin: "16px 0 0", fontSize: 15, lineHeight: 1.6, color: isLightMode ? "#7a674f" : "#a1a1aa", maxWidth: 700 }}>
                    Browse cities, save trip plans, and switch travel mode on to see the best physical and virtual events for where you’re headed.
                  </p>
                  <div className="travel-stats">
                    <div className="travel-stat">
                      <div style={{ fontSize: 12, color: isLightMode ? "#8d7758" : "#a1a1aa", marginBottom: 6 }}>Current city</div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{selectedCity}</div>
                    </div>
                    <div className="travel-stat">
                      <div style={{ fontSize: 12, color: isLightMode ? "#8d7758" : "#a1a1aa", marginBottom: 6 }}>Live events</div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{filteredEvents.length}</div>
                    </div>
                    <div className="travel-stat">
                      <div style={{ fontSize: 12, color: isLightMode ? "#8d7758" : "#a1a1aa", marginBottom: 6 }}>Mode</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: travelModeEnabled ? "#22c55e" : "#F69D11" }}>
                        {travelModeEnabled ? 'Enabled' : 'Off'}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => void handleToggleTravelMode()}
                  style={{
                    alignSelf: "start",
                    padding: "14px 18px",
                    background: travelModeEnabled ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" : "linear-gradient(135deg, #F69D11 0%, #FB923C 100%)",
                    color: "#08110a",
                    border: "none",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: travelModeEnabled ? "0 12px 30px rgba(34,197,94,0.24)" : "0 12px 30px rgba(246,157,17,0.28)",
                    minWidth: 160,
                  }}
                >
                  {travelModeEnabled ? 'Disable mode' : 'Enable mode'}
                </button>
              </div>
            </div>

            <div className="travel-panel">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 14,
                  background: "rgba(246,157,17,0.14)",
                  display: "grid",
                  placeItems: "center",
                  color: "#F69D11",
                }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Your trip</p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: isLightMode ? "#8d7758" : "#a1a1aa" }}>Pick a destination and dates</p>
                </div>
              </div>

              <label style={{ fontSize: 11, fontWeight: 800, color: "#F69D11", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, display: "block" }}>
                Search city
              </label>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: isLightMode ? "#8d7758" : "#6b7280" }} />
                <input
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Search cities"
                  className="travel-input"
                  style={{
                    width: "100%",
                    padding: "13px 14px 13px 42px",
                    borderRadius: 16,
                    border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid rgba(255,255,255,0.08)",
                    background: isLightMode ? "#fffaf2" : "rgba(255,255,255,0.04)",
                    color: isLightMode ? "#241b10" : "#fff",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))", gap: 10 }}>
                {filteredCities.map((city) => {
                const isSelected = selectedCity === city.value;
                return (
                  <button
                    key={city.value}
                    onClick={() => setSelectedCity(city.value)}
                    style={{
                      padding: "10px 14px",
                      background: isSelected ? "#F69D11" : (isLightMode ? "#fffaf2" : "#0a0a0a"),
                      border: isSelected ? "1px solid #F69D11" : (isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a"),
                      borderRadius: 10,
                      color: isSelected ? "#000" : (isLightMode ? "#7a674f" : "#aaa"),
                      fontSize: 13,
                      fontWeight: isSelected ? 700 : 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as any).style.borderColor = "#F69D11";
                        (e.currentTarget as any).style.color = isLightMode ? "#241b10" : "#fff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as any).style.borderColor = isLightMode ? "rgba(36,27,16,0.1)" : "#1a1a1a";
                        (e.currentTarget as any).style.color = isLightMode ? "#7a674f" : "#aaa";
                      }
                    }}
                  >
                    {city.label}
                  </button>
                );
              })}
                </div>
                {citySearch.trim() && filteredCities.length === 0 && (
                  <div style={{
                    marginTop: 12,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid rgba(255,255,255,0.08)",
                    background: isLightMode ? "#fffaf2" : "rgba(255,255,255,0.04)",
                    color: isLightMode ? "#7a674f" : "#aaa",
                    fontSize: 12,
                  }}>
                    No cities found. Try a different search.
                  </div>
                )}
              </div>
            </div>
          <div className="travel-grid">
            <div className="travel-column">
              <div className="travel-panel">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    background: "rgba(246,157,17,0.14)",
                    display: "grid",
                    placeItems: "center",
                    color: "#F69D11",
                  }}>
                    <Filter size={18} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Filter events</p>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: isLightMode ? "#8d7758" : "#a1a1aa" }}>Choose the vibe you want</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { value: "all", label: "All Events" },
                    { value: "virtual", label: "💻 Virtual" },
                    { value: "physical", label: "📍 In-Person" },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setEventType(filter.value as any)}
                      style={{
                        padding: "10px 14px",
                        background: eventType === filter.value ? "#F69D11" : "transparent",
                        border: `1px solid ${eventType === filter.value ? "#F69D11" : (isLightMode ? "rgba(36,27,16,0.1)" : "rgba(255,255,255,0.08)")}`,
                        borderRadius: 999,
                        color: eventType === filter.value ? "#000" : (isLightMode ? "#7a674f" : "#c4c4cc"),
                        fontSize: 12,
                        fontWeight: eventType === filter.value ? 800 : 700,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (eventType !== filter.value) {
                          (e.currentTarget as any).style.borderColor = "#F69D11";
                          (e.currentTarget as any).style.color = isLightMode ? "#241b10" : "#fff";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (eventType !== filter.value) {
                          (e.currentTarget as any).style.borderColor = isLightMode ? "rgba(36,27,16,0.1)" : "rgba(255,255,255,0.08)";
                          (e.currentTarget as any).style.color = isLightMode ? "#7a674f" : "#c4c4cc";
                        }
                      }}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="travel-panel">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    background: "rgba(246,157,17,0.14)",
                    display: "grid",
                    placeItems: "center",
                    color: "#F69D11",
                  }}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Plan your trip</p>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: isLightMode ? "#8d7758" : "#a1a1aa" }}>Save dates and reuse the search later</p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#F69D11", marginBottom: 6, textTransform: "uppercase" }}>Start Date</label>
                    <input
                      type="date"
                      value={tripStartDate}
                      onChange={(e) => setTripStartDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 12px",
                        borderRadius: 14,
                        border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid rgba(255,255,255,0.08)",
                        background: isLightMode ? "#fffaf2" : "rgba(255,255,255,0.04)",
                        color: isLightMode ? "#241b10" : "#fff",
                        fontSize: 13,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#F69D11", marginBottom: 6, textTransform: "uppercase" }}>End Date</label>
                    <input
                      type="date"
                      value={tripEndDate}
                      onChange={(e) => setTripEndDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 12px",
                        borderRadius: 14,
                        border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid rgba(255,255,255,0.08)",
                        background: isLightMode ? "#fffaf2" : "rgba(255,255,255,0.04)",
                        color: isLightMode ? "#241b10" : "#fff",
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, color: isLightMode ? "#8d7758" : "#a1a1aa" }}>
                    {tripStartDate ? `${Math.ceil((new Date(tripEndDate || tripStartDate).getTime() - new Date(tripStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day trip` : 'Pick dates to save a trip'}
                  </div>
                  <button
                    onClick={saveTrip}
                    disabled={isSaving}
                    style={{
                      padding: "11px 16px",
                      background: isSaving ? "rgba(255,255,255,0.12)" : "#F69D11",
                      color: isSaving ? "#8b8b93" : "#111",
                      border: "none",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 900,
                      cursor: isSaving ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Save size={14} /> {isSaving ? 'Saving...' : 'Save trip'}
                  </button>
                </div>
                {savedTrips.length > 0 && (
                  <button
                    onClick={() => setShowSavedTrips(!showSavedTrips)}
                    style={{
                      marginTop: 14,
                      background: "transparent",
                      border: "none",
                      color: "#F69D11",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    View {savedTrips.length} saved trip{savedTrips.length !== 1 ? 's' : ''} →
                  </button>
                )}
              </div>

              {showSavedTrips && savedTrips.length > 0 && (
                <div className="travel-panel">
                  <h4 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 800, color: "#F69D11", textTransform: "uppercase", letterSpacing: 1 }}>
                    My Trips
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {savedTrips.map((trip) => (
                      <div
                        key={trip.id}
                        style={{
                          background: isLightMode ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.04)",
                          border: isLightMode ? "1px solid rgba(36,27,16,0.08)" : "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 16,
                          padding: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: isLightMode ? "#241b10" : "#fff" }}>
                            🌍 {trip.city}
                          </p>
                          <p style={{ margin: "4px 0 0", fontSize: 11, color: isLightMode ? "#8d7758" : "#a1a1aa" }}>
                            {trip.startDate} to {trip.endDate}
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          <button
                            onClick={() => loadTrip(trip)}
                            style={{
                              background: "transparent",
                              border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid rgba(255,255,255,0.08)",
                              color: "#F69D11",
                              padding: "7px 10px",
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <ChevronRight size={12} /> Load
                          </button>
                          <button
                            onClick={() => deleteTrip(trip.id)}
                            style={{
                              background: "rgba(239,68,68,0.12)",
                              border: "1px solid rgba(239,68,68,0.18)",
                              color: "#fca5a5",
                              padding: "7px 10px",
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="travel-column">
              <div className="travel-feed">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Live events</h2>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: isLightMode ? "#8d7758" : "#a1a1aa" }}>
                      Showing {filteredEvents.length} result{filteredEvents.length !== 1 ? 's' : ''} in {selectedCity}
                    </p>
                  </div>
                  <div style={{
                    padding: "10px 12px",
                    borderRadius: 999,
                    background: "rgba(246,157,17,0.1)",
                    border: "1px solid rgba(246,157,17,0.18)",
                    color: "#F69D11",
                    fontSize: 12,
                    fontWeight: 800,
                  }}>
                    {eventType === 'all' ? 'All event types' : eventType === 'virtual' ? 'Virtual only' : 'In-person only'}
                  </div>
                </div>

                {eventsLoading && (
                  <div style={{
                    background: isLightMode ? "#fffaf2" : "rgba(255,255,255,0.04)",
                    border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 20,
                    padding: "18px",
                    marginBottom: 16,
                    color: isLightMode ? "#8d7758" : "#aaa",
                    fontSize: 13,
                  }}>
                    Loading live events for {selectedCity}...
                  </div>
                )}

                {!eventsLoading && eventsError && (
                  <div style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 20,
                    padding: "18px",
                    marginBottom: 16,
                    color: "#fca5a5",
                    fontSize: 13,
                  }}>
                    {eventsError}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event, idx) => <TravelEventCard key={event.id} event={event} index={idx} isLightMode={isLightMode} />)
                  ) : (
                    <div style={{
                      textAlign: "center",
                      padding: "56px 20px",
                      borderRadius: 22,
                      border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid rgba(255,255,255,0.08)",
                      background: isLightMode ? "rgba(255,250,242,0.6)" : "rgba(255,255,255,0.03)",
                      color: "#8b8b93"
                    }}>
                      <div style={{ fontSize: 34, marginBottom: 12 }}>◌</div>
                      <p style={{ fontSize: 14, margin: 0 }}>
                        No {eventType !== "all" ? eventType : ""} events in {selectedCity}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="travel-panel">
                <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 800, color: isLightMode ? "#241b10" : "#fff" }}>💡 Traveler Pro Tips</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: isLightMode ? "#7a674f" : "#a1a1aa", fontSize: 13, lineHeight: 1.8 }}>
                  <li style={{ marginBottom: 6 }}>Look for Tour Guide listings - locals sharing their city.</li>
                  <li style={{ marginBottom: 6 }}>Join virtual events to meet people before you arrive.</li>
                  <li style={{ marginBottom: 6 }}>Use trip dates to keep your planning organized.</li>
                  <li>Share your profile with trusted contacts for safety.</li>
                </ul>
              </div>

              {savedSearches.length > 0 && (
                <div className="travel-panel">
                  <h4 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 800, color: "#F69D11", textTransform: "uppercase", letterSpacing: 1 }}>
                    Saved Searches
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {savedSearches.map((search, index) => (
                      <div
                        key={search.id || `${search.city}-${search.eventType}-${index}`}
                        style={{
                          border: "1px solid rgba(246,157,17,0.2)",
                          background: "rgba(246,157,17,0.08)",
                          color: "#F69D11",
                          borderRadius: 18,
                          padding: "12px 14px",
                          fontSize: 11,
                          fontWeight: 800,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          minWidth: 200,
                          flex: "1 1 220px",
                        }}
                      >
                        <button
                          onClick={() => handleSelectSavedSearch(search.city, search.eventType as "all" | "virtual" | "physical")}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#F69D11",
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: "pointer",
                            textAlign: "left",
                            padding: 0,
                          }}
                        >
                          {search.label || `${search.city} · ${search.eventType}`}
                        </button>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => beginRenameSavedSearch(search)}
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#fff",
                              borderRadius: 999,
                              padding: "6px 10px",
                              fontSize: 10,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => deleteSavedSearch(search.id)}
                            style={{
                              background: "rgba(239,68,68,0.12)",
                              border: "1px solid rgba(239,68,68,0.18)",
                              color: "#fca5a5",
                              borderRadius: 999,
                              padding: "6px 10px",
                              fontSize: 10,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {editingSearchId && (
                    <div style={{
                      marginTop: 14,
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}>
                      <input
                        value={editingSearchLabel}
                        onChange={(e) => setEditingSearchLabel(e.target.value)}
                        placeholder="Rename saved search"
                        style={{
                          flex: 1,
                          minWidth: 220,
                          padding: "12px 14px",
                          borderRadius: 14,
                          border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid rgba(255,255,255,0.08)",
                          background: isLightMode ? "#fffaf2" : "rgba(255,255,255,0.04)",
                          color: isLightMode ? "#241b10" : "#fff",
                          fontSize: 13,
                        }}
                      />
                      <button
                        onClick={saveRenamedSearch}
                        style={{
                          padding: "12px 14px",
                          background: "#F69D11",
                          color: "#000",
                          border: "none",
                          borderRadius: 14,
                          fontSize: 12,
                          fontWeight: 900,
                          cursor: "pointer",
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingSearchId(null);
                          setEditingSearchLabel('');
                        }}
                        style={{
                          padding: "12px 14px",
                          background: "transparent",
                          color: isLightMode ? "#7a674f" : "#aaa",
                          border: `1px solid ${isLightMode ? 'rgba(36,27,16,0.1)' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: 14,
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
        </div>

        {/* Toast Notifications */}
        <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 50, left: "auto", maxWidth: "calc(100vw - 32px)" }}>
          <AnimatePresence>
            {toasts.map((toast, index) => {
              const typeStyles = {
                success: { bg: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', text: '#22c55e', icon: '✓' },
                error: { bg: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', text: '#ef4444', icon: '✕' },
                info: { bg: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', text: '#3b82f6', icon: 'ℹ' }
              };
              const style = typeStyles[toast.type];
              return (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, x: 400 }}
                  animate={{ opacity: 1, x: 0, y: index * 80 }}
                  exit={{ opacity: 0, x: 400 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{
                    background: style.bg,
                    border: style.border,
                    borderRadius: 14,
                    padding: '12px 16px',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    backdropFilter: 'blur(10px)',
                    color: style.text,
                    fontSize: 14,
                    fontWeight: 500,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  <span style={{ fontSize: 16 }}>{style.icon}</span>
                  {toast.text}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        </div>
      </main>
      <Sidebar activeNav="Travel" />
    </div>
  );
};
