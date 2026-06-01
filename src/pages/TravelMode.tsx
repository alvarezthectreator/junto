import { useState, useEffect } from "react";
import { Calendar, Save, Trash2, ChevronRight } from "lucide-react";
import { useAppContext } from "../context/AppContext";
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

export const TravelMode = () => {
  const { currentUser } = useAppContext();
  const [isLightMode] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Lagos");
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

    const fallbackEvents = [
      {
        id: "1",
        title: "Rooftop Wine Tasting",
        type: "physical",
        location: "VI, Lagos",
        host: "Amina K.",
        interested: 12,
        isGuide: false,
      },
      {
        id: "2",
        title: "Language Exchange - Spanish 101",
        type: "virtual",
        location: "Online",
        host: "Carlos M.",
        interested: 28,
        isGuide: false,
      },
      {
        id: "3",
        title: "Lekki Conservation Centre Tour",
        type: "physical",
        location: "Lekki, Lagos",
        host: "Tunde O.",
        interested: 34,
        isGuide: true,
      },
    ];

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
          setTravelEvents(mappedEvents.length > 0 ? mappedEvents : fallbackEvents);
        }
      } catch (error) {
        console.error('Failed to load travel events:', error);
        if (mounted) {
          setTravelEvents(fallbackEvents);
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
    <div style={{ display: "flex", minHeight: "100vh", background: isLightMode ? "#f7f3ea" : "#050505", color: isLightMode ? "#241b10" : "#fff", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${isLightMode ? '#f3eadc' : '#0a0a0a'}; }
        ::-webkit-scrollbar-thumb { background: ${isLightMode ? '#d8c7ab' : '#1c1c1c'}; border-radius: 2px; }
      `}</style>

      <main className="mobile-page-main" style={{ flex: 1, marginLeft: 0, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", background: isLightMode ? "#f7f3ea" : "#050505" }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            background: isLightMode ? "rgba(247,243,234,0.92)" : "rgba(5,5,5,0.9)",
            backdropFilter: "blur(20px)",
            borderBottom: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #111",
            padding: "16px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? "translateY(0)" : "translateY(-8px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
            width: "100%",
            maxWidth: 720,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#F69D11", marginBottom: 2 }}>
              Explore
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: isLightMode ? "#241b10" : "#fff", letterSpacing: -0.5 }}>
              ✈️ Travel Mode
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: isLightMode ? "#7a674f" : "#888" }}>Exploring {selectedCity}</p>
          </div>
        </div>

        <div style={{ padding: "24px 28px", maxWidth: 720, width: "100%", flex: 1, overflowY: "auto" }}>
          {/* Premium Badge */}
          <div
            style={{
              background: isLightMode ? "rgba(245,158,11,0.10)" : "rgba(246,157,17,0.08)",
              border: isLightMode ? "1px solid rgba(245,158,11,0.18)" : "1px solid rgba(246,157,17,0.2)",
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 20 }}>✈️</span>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#F69D11", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Premium Feature
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: isLightMode ? "#8d7758" : "#888" }}>Paid members unlock travel discovery</p>
            </div>
          </div>

          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 999,
              background: travelModeEnabled ? "rgba(34,197,94,0.12)" : (isLightMode ? "#fffaf2" : "#0a0a0a"),
              border: travelModeEnabled ? "1px solid rgba(34,197,94,0.2)" : (isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a"),
            }}>
              <span style={{ fontSize: 18 }}>{travelModeEnabled ? '🟢' : '✈️'}</span>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: isLightMode ? "#241b10" : "#fff" }}>
                  {travelModeEnabled ? 'Travel mode enabled' : 'Travel mode off'}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: isLightMode ? "#8d7758" : "#888" }}>
                  {travelModeEnabled ? `Showing live events for ${selectedCity}` : 'Turn it on to save your destination'}
                </p>
              </div>
            </div>

            <button
              onClick={() => void handleToggleTravelMode()}
              style={{
                padding: "10px 14px",
                background: travelModeEnabled ? "#22c55e" : "#F69D11",
                color: "#000",
                border: "none",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {travelModeEnabled ? 'Disable' : 'Enable'} travel mode
            </button>
          </div>

          {/* City Selector */}
          <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: isLightMode ? "#7a674f" : "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, display: "block" }}>
              Select City
            </label>
            <div style={{ marginBottom: 12 }}>
              <input
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Search cities"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 12,
                  border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a",
                  background: isLightMode ? "#fffaf2" : "#0a0a0a",
                  color: isLightMode ? "#241b10" : "#fff",
                  fontSize: 13,
                }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
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
                border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a",
                background: isLightMode ? "#fffaf2" : "#0a0a0a",
                color: isLightMode ? "#7a674f" : "#aaa",
                fontSize: 12,
              }}>
                No cities found. Try a different search.
              </div>
            )}
          </div>

          {/* Event Type Filter */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {[
              { value: "all", label: "All Events" },
              { value: "virtual", label: "💻 Virtual" },
              { value: "physical", label: "📍 In-Person" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setEventType(filter.value as any)}
                style={{
                  padding: "9px 16px",
                  background: eventType === filter.value ? "#F69D11" : "transparent",
                  border: `1px solid ${eventType === filter.value ? "#F69D11" : (isLightMode ? "rgba(36,27,16,0.1)" : "#1a1a1a")}`,
                  borderRadius: 10,
                  color: eventType === filter.value ? "#000" : (isLightMode ? "#7a674f" : "#888"),
                  fontSize: 12,
                  fontWeight: eventType === filter.value ? 700 : 600,
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
                    (e.currentTarget as any).style.borderColor = isLightMode ? "rgba(36,27,16,0.1)" : "#1a1a1a";
                    (e.currentTarget as any).style.color = isLightMode ? "#7a674f" : "#888";
                  }
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Trip Date Picker */}
          <div style={{
            background: isLightMode ? "rgba(245,158,11,0.08)" : "rgba(246,157,17,0.08)",
            border: isLightMode ? "1px solid rgba(245,158,11,0.18)" : "1px solid rgba(246,157,17,0.2)",
            borderRadius: 16,
            padding: "18px",
            marginBottom: 28,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Calendar size={18} color="#F69D11" />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: isLightMode ? "#241b10" : "#fff" }}>
                Plan Your Trip
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "flex-end" }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#F69D11", marginBottom: 6, textTransform: "uppercase" }}>Start Date</label>
                <input
                  type="date"
                  value={tripStartDate}
                  onChange={(e) => setTripStartDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a",
                    background: isLightMode ? "#fffaf2" : "#0a0a0a",
                    color: isLightMode ? "#241b10" : "#fff",
                    fontSize: 12,
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#F69D11", marginBottom: 6, textTransform: "uppercase" }}>End Date</label>
                <input
                  type="date"
                  value={tripEndDate}
                  onChange={(e) => setTripEndDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a",
                    background: isLightMode ? "#fffaf2" : "#0a0a0a",
                    color: isLightMode ? "#241b10" : "#fff",
                    fontSize: 12,
                  }}
                />
              </div>
              <div style={{ fontSize: 12, color: isLightMode ? "#8d7758" : "#888" }}>
                {tripStartDate && (
                  <span>
                    {Math.ceil((new Date(tripEndDate || tripStartDate).getTime() - new Date(tripStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                  </span>
                )}
              </div>
              <button
                onClick={saveTrip}
                disabled={isSaving}
                style={{
                  padding: "8px 14px",
                  background: isSaving ? "#ccc" : "#F69D11",
                  color: isSaving ? "#666" : "#000",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isSaving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "opacity 0.2s",
                  opacity: isSaving ? 0.7 : 1,
                }}
                onMouseEnter={(e) => { if (!isSaving) (e.currentTarget as any).style.opacity = "0.9"; }}
                onMouseLeave={(e) => { if (!isSaving) (e.currentTarget as any).style.opacity = "1"; }}
              >
                <Save size={14} /> {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
            {savedTrips.length > 0 && (
              <button
                onClick={() => setShowSavedTrips(!showSavedTrips)}
                style={{
                  marginTop: 12,
                  background: "transparent",
                  border: "none",
                  color: "#F69D11",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                View {savedTrips.length} saved trip{savedTrips.length !== 1 ? 's' : ''} →
              </button>
            )}
          </div>

          {/* Saved Trips Modal */}
          {showSavedTrips && savedTrips.length > 0 && (
            <div style={{
              background: isLightMode ? "rgba(255,250,242,0.9)" : "rgba(12,12,15,0.95)",
              border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: "16px",
              marginBottom: 28,
              maxHeight: "250px",
              overflowY: "auto"
            }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#F69D11", textTransform: "uppercase" }}>
                My Trips
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {savedTrips.map((trip) => (
                  <div
                    key={trip.id}
                    style={{
                      background: isLightMode ? "rgba(255,255,255,0.5)" : "rgba(26,26,33,0.5)",
                      border: isLightMode ? "1px solid rgba(36,27,16,0.08)" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      padding: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isLightMode ? "#241b10" : "#fff" }}>
                        🌍 {trip.city}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: isLightMode ? "#8d7758" : "#888" }}>
                        {trip.startDate} to {trip.endDate}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => loadTrip(trip)}
                        style={{
                          background: "transparent",
                          border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid rgba(255,255,255,0.1)",
                          color: "#F69D11",
                          padding: "6px 10px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
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
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          color: "#ef4444",
                          padding: "6px 10px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
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

          {/* Events List */}
          {eventsLoading && (
            <div style={{
              background: isLightMode ? "#fffaf2" : "#0a0a0a",
              border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a",
              borderRadius: 16,
              padding: "16px",
              marginBottom: 24,
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
              borderRadius: 16,
              padding: "16px",
              marginBottom: 24,
              color: "#fca5a5",
              fontSize: 13,
            }}>
              {eventsError}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event, idx) => <TravelEventCard key={event.id} event={event} index={idx} isLightMode={isLightMode} />)
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#2a2a2a" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>◌</div>
                <p style={{ fontSize: 14 }}>No {eventType !== "all" ? eventType : ""} events in {selectedCity}</p>
              </div>
            )}
          </div>

          {/* Travel Tips */}
          <div
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: 12,
              padding: "16px",
              marginBottom: 32,
            }}
          >
            <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: isLightMode ? "#241b10" : "#fff" }}>💡 Traveler Pro Tips</h3>
            <ul style={{ margin: 0, paddingLeft: 18, color: isLightMode ? "#7a674f" : "#aaa", fontSize: 12, lineHeight: 1.6 }}>
              <li style={{ marginBottom: 6 }}>Look for Tour Guide listings - locals sharing their city!</li>
              <li style={{ marginBottom: 6 }}>Join virtual events to meet people before you arrive</li>
              <li style={{ marginBottom: 6 }}>Check-in to confirm you'll be physically present</li>
              <li>Share your profile with trusted contacts for safety</li>
            </ul>
          </div>

          {savedSearches.length > 0 && (
            <div
              style={{
                background: isLightMode ? "rgba(255,250,242,0.9)" : "rgba(12,12,15,0.95)",
                border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: "16px",
                marginBottom: 24,
              }}
            >
              <h4 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#F69D11", textTransform: "uppercase" }}>
                Saved Searches
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {savedSearches.map((search, index) => (
                  <div
                    key={search.id || `${search.city}-${search.eventType}-${index}`}
                    style={{
                      border: "1px solid rgba(246,157,17,0.2)",
                      background: "rgba(246,157,17,0.08)",
                      color: "#F69D11",
                      borderRadius: 16,
                      padding: "10px 12px",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      minWidth: 180,
                    }}
                  >
                    <button
                      onClick={() => handleSelectSavedSearch(search.city, search.eventType as "all" | "virtual" | "physical")}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#F69D11",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        textAlign: "left",
                        padding: 0,
                      }}
                    >
                      {search.label || `${search.city} · ${search.eventType}`}
                    </button>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => beginRenameSavedSearch(search)}
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#fff",
                          borderRadius: 999,
                          padding: "5px 8px",
                          fontSize: 10,
                          fontWeight: 700,
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
                          padding: "5px 8px",
                          fontSize: 10,
                          fontWeight: 700,
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
                  marginTop: 12,
                  display: "flex",
                  gap: 8,
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
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a",
                      background: isLightMode ? "#fffaf2" : "#0a0a0a",
                      color: isLightMode ? "#241b10" : "#fff",
                      fontSize: 12,
                    }}
                  />
                  <button
                    onClick={saveRenamedSearch}
                    style={{
                      padding: "10px 12px",
                      background: "#F69D11",
                      color: "#000",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 800,
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
                      padding: "10px 12px",
                      background: "transparent",
                      color: isLightMode ? "#7a674f" : "#aaa",
                      border: `1px solid ${isLightMode ? 'rgba(36,27,16,0.1)' : '#1a1a1a'}`,
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {!eventsLoading && !eventsError && filteredEvents.length === 0 && (
            <div
              style={{
                background: isLightMode ? "#fffaf2" : "#0a0a0a",
                border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a",
                borderRadius: 16,
                padding: "18px",
                marginBottom: 24,
                color: isLightMode ? "#8d7758" : "#aaa",
                fontSize: 13,
              }}
            >
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: isLightMode ? "#241b10" : "#fff" }}>
                No matching events right now
              </p>
              <p style={{ margin: "6px 0 0" }}>
                Try another city, switch event type, or save your current search for later.
              </p>
            </div>
          )}
        </div>

        {/* Toast Notifications */}
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}>
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
                    borderRadius: 8,
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
      </main>
    </div>
  );
};
