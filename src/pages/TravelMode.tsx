import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";

interface TravelModeProps {
  onNavigate?: (page: string) => void;
  isLightMode?: boolean;
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

export const TravelMode: React.FC<TravelModeProps> = ({ onNavigate = () => {}, isLightMode = false }) => {
  const [selectedCity, setSelectedCity] = useState("Lagos");
  const [eventType, setEventType] = useState<"all" | "virtual" | "physical">("all");
  const [headerVisible, setHeaderVisible] = useState(false);
  const pageClass = isLightMode ? 'bg-[#f7f3ea] text-[#241b10]' : 'bg-[#050505] text-white';
  const shellClass = isLightMode ? 'bg-[#fffaf2]' : 'bg-[#050505]';
  const panelClass = isLightMode ? 'bg-white/80 border-black/10' : 'bg-[#0a0a0a] border-[#1c1c1c]';
  const textMutedClass = isLightMode ? 'text-[#8d7758]' : 'text-[#888]';
  const textSoftClass = isLightMode ? 'text-[#7a674f]' : 'text-[#aaa]';
  const lineClass = isLightMode ? 'border-black/10' : 'border-[#111]';
  const selectButtonClass = isLightMode ? 'border-black/10 bg-white/80 text-[#7a674f]' : 'border-[#1a1a1a] bg-[#0a0a0a] text-[#aaa]';

  useEffect(() => {
    const t = setTimeout(() => setHeaderVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const cities = [
    "🇳🇬 Lagos",
    "🇳🇬 Abuja",
    "🇬🇭 Accra",
    "🇰🇪 Nairobi",
    "🇿🇦 Johannesburg",
    "🇬🇧 London",
    "🇯🇵 Tokyo",
    "🇦🇪 Dubai",
    "🇺🇸 New York",
    "🇫🇷 Paris",
  ];

  const events = [
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

  const filteredEvents = events.filter((e) => {
    if (eventType === "all") return true;
    return e.type === eventType;
  });

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

      <Sidebar activeNav="Travel Mode" setActiveNav={() => {}} onNavigate={onNavigate} />

      <main className="mobile-page-main" style={{ flex: 1, marginLeft: 256, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", background: isLightMode ? "#f7f3ea" : "#050505" }}>
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

          {/* City Selector */}
          <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: isLightMode ? "#7a674f" : "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, display: "block" }}>
              Select City
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
              {cities.map((city, idx) => {
                const cityName = city.split(" ")[1];
                const isSelected = selectedCity === cityName;
                return (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(cityName)}
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
                    {city}
                  </button>
                );
              })}
            </div>
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

          {/* Events List */}
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
        </div>
      </main>
    </div>
  );
};
