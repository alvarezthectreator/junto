"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Compass, Flame, MapPin, X, Heart } from "lucide-react";
import {
  InteractiveMap,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerLabel,
} from "@/components/ui/map";
import * as API from "../services/api";

interface NearbyProps {
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  onCloseSidebar?: () => void;
  isLightMode?: boolean;
  currentUser?: any;
}

interface NearbyVibe {
  id: string;
  userName: string;
  actionText: string;
  emoji: string;
  description: string;
  date: string;
  audience: string;
  interestedCount: number;
  coverImage: string;
  coords: [number, number];
  accent: string;
  locationName: string;
}

const vibes: NearbyVibe[] = [
  {
    id: "ada-movie",
    userName: "Ada",
    actionText: "watch a movie",
    emoji: "🎬",
    description: "Silverbird Cinema, VI. Catching the new Marvel drop!",
    date: "Sunday, 6pm",
    audience: "Open to all",
    interestedCount: 3,
    coverImage: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=900",
    coords: [3.4219, 6.4281],
    accent: "#FF6B6B",
    locationName: "Silverbird Cinema",
  },
  {
    id: "oge-beach",
    userName: "Oge",
    actionText: "go to the beach",
    emoji: "🌊",
    description: "Bar Beach, Lagos. Vibes only, no drama.",
    date: "Monday, 3pm",
    audience: "Males only",
    interestedCount: 7,
    coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900",
    coords: [3.4214, 6.4131],
    accent: "#4ECDC4",
    locationName: "Bar Beach",
  },
  {
    id: "kemi-brunch",
    userName: "Kemi",
    actionText: "grab brunch",
    emoji: "☕",
    description: "Hard Rock Cafe, Lekki. Sunday vibes!",
    date: "Sat, 11am",
    audience: "Females only",
    interestedCount: 5,
    coverImage: "https://images.unsplash.com/photo-1533777324565-a040eb52facd?w=900",
    coords: [3.4736, 6.4474],
    accent: "#F59E0B",
    locationName: "Hard Rock Cafe",
  },
  {
    id: "tunde-gym",
    userName: "Tunde",
    actionText: "hit the gym",
    emoji: "💪",
    description: "Smart Fitness, Ikoyi. Push day energy.",
    date: "Tue, 7am",
    audience: "Open to all",
    interestedCount: 2,
    coverImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900",
    coords: [3.4333, 6.45],
    accent: "#38BDF8",
    locationName: "Smart Fitness",
  },
  {
    id: "zara-sushi",
    userName: "Zara",
    actionText: "try sushi",
    emoji: "🍣",
    description: "Izanagi, VI. New rolls on the menu!",
    date: "Fri, 8pm",
    audience: "Open to all",
    interestedCount: 12,
    coverImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900",
    coords: [3.4106, 6.4281],
    accent: "#FB7185",
    locationName: "Izanagi",
  },
  {
    id: "chidi-club",
    userName: "Chidi",
    actionText: "go clubbing",
    emoji: "🪩",
    description: "Quilox, VI. Saturday night turn up.",
    date: "Sat, 11pm",
    audience: "Males only",
    interestedCount: 9,
    coverImage: "https://images.unsplash.com/photo-1571266028243-d220bc1c8d1f?w=900",
    coords: [3.4197, 6.425],
    accent: "#FF8E72",
    locationName: "Quilox",
  },
];

const filters = [
  "All vibes",
  "Tonight",
  "This week",
  "Open to all",
  "Females only",
  "Males only",
  "Trending 🔥",
];

const getFilteredVibes = (activeFilter: string) => {
  switch (activeFilter) {
    case "Tonight":
      return vibes.filter((vibe) => vibe.date.toLowerCase().includes("pm"));
    case "This week":
      return vibes;
    case "Open to all":
    case "Females only":
    case "Males only":
      return vibes.filter((vibe) => vibe.audience === activeFilter);
    case "Trending 🔥":
      return vibes.filter((vibe) => vibe.interestedCount >= 7);
    default:
      return vibes;
  }
};

export const Nearby: React.FC<NearbyProps> = ({
  onNavigate = () => {},
  setActiveNav = () => {},
  onCloseSidebar = () => {},
  isLightMode = false,
  currentUser
}) => {
  const [activeFilter, setActiveFilter] = useState("All vibes");
  const [selectedVibeId, setSelectedVibeId] = useState(vibes[0].id);
  const [hiddenCardIds, setHiddenCardIds] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [likedVibes, setLikedVibes] = useState<string[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedVibe, setMatchedVibe] = useState<NearbyVibe | null>(null);

  const filteredVibes = useMemo(() => getFilteredVibes(activeFilter), [activeFilter]);
  const visibleCards = useMemo(
    () => filteredVibes.filter((vibe) => !hiddenCardIds.includes(vibe.id)),
    [filteredVibes, hiddenCardIds],
  );

  useEffect(() => {
    if (!filteredVibes.some((vibe) => vibe.id === selectedVibeId)) {
      setSelectedVibeId(filteredVibes[0]?.id ?? vibes[0].id);
    }
  }, [filteredVibes, selectedVibeId]);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < 768);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  const selectedVibe =
    filteredVibes.find((vibe) => vibe.id === selectedVibeId) ?? filteredVibes[0] ?? vibes[0];

  const hideCard = (vibeId: string) => {
    setHiddenCardIds((current) => (current.includes(vibeId) ? current : [...current, vibeId]));
  };

  const showAllCards = () => {
    setHiddenCardIds([]);
  };

  const hideAllCards = () => {
    setHiddenCardIds(vibes.map((vibe) => vibe.id));
  };

  const handleLikeVibe = async (vibeId: string) => {
    if (!likedVibes.includes(vibeId)) {
      setLikedVibes([...likedVibes, vibeId]);
      
      // Call API to swipe right
      try {
        if (currentUser?.id) {
          const result = await API.swipeUser(currentUser.id, vibeId, 'right');
          
          // Check for mutual match
          if (result.mutual_match) {
            const vibe = vibes.find(v => v.id === vibeId);
            if (vibe) {
              setMatchedVibe(vibe);
              setShowMatchModal(true);
            }
          }
        }
      } catch (error) {
        console.error('Failed to swipe:', error);
      }
    }
  };

  const handlePassVibe = async (vibeId: string) => {
    hideCard(vibeId);
    
    // Call API to swipe left
    try {
      if (currentUser?.id) {
        await API.swipeUser(currentUser.id, vibeId, 'left');
      }
    } catch (error) {
      console.error('Failed to pass:', error);
    }
  };

  const pageBackground = isLightMode ? "#f8f3e8" : "#050505";
  const pageText = isLightMode ? "#241b10" : "#fff";
  const cardBackground = isLightMode ? "rgba(255,250,242,0.88)" : "rgba(12,12,15,0.76)";
  const softCardBackground = isLightMode ? "rgba(255,255,255,0.92)" : "rgba(26,26,33,0.88)";
  const borderColor = isLightMode ? "rgba(36,27,16,0.10)" : "rgba(255,255,255,0.08)";
  const subTextColor = isLightMode ? "#7a674f" : "#d1d5db";
  const mutedTextColor = isLightMode ? "#8d7758" : "#9ca3af";
  const panelShadow = isLightMode ? "0 18px 50px rgba(120,53,15,0.12)" : "0 18px 50px rgba(0,0,0,0.35)";
  const heroShadow = isLightMode ? "0 24px 80px rgba(120,53,15,0.12)" : "0 24px 80px rgba(0,0,0,0.35)";
  const overlayGradient = isLightMode
    ? "linear-gradient(to top, rgba(255,250,242,0.98), rgba(255,250,242,0.22))"
    : "linear-gradient(to top, rgba(12,12,15,0.96), rgba(12,12,15,0.18))";
  const chipBackground = isLightMode ? "rgba(245,158,11,0.10)" : "rgba(245,158,11,0.12)";
  const chipBorder = isLightMode ? "1px solid rgba(245,158,11,0.20)" : "1px solid rgba(245,158,11,0.24)";
  const filterInactiveBackground = isLightMode ? "rgba(255,255,255,0.96)" : "rgba(26,26,33,0.92)";
  const filterInactiveColor = isLightMode ? "#4b3b28" : "#d1d5db";
  const mapStyle = isLightMode
    ? "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    : "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: pageBackground,
        color: pageText,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <main
        className="mobile-page-main"
        style={{
          flex: 1,
          marginLeft: 0,
          minHeight: "100dvh",
          overflowY: isMobile ? "auto" : "hidden",
          position: "relative",
          background:
            isLightMode
              ? "radial-gradient(circle at top, rgba(245,158,11,0.12), transparent 34%), #f8f3e8"
              : "radial-gradient(circle at top, rgba(245,158,11,0.12), transparent 34%), #050505",
        }}
      >
        <div
          style={
            isMobile
              ? { position: "relative", height: "42vh", minHeight: 320 }
              : { position: "absolute", inset: 0 }
          }
        >
          <InteractiveMap
            center={[3.4219, 6.4281]}
            zoom={12.6}
            styles={{
              dark: mapStyle,
              light: mapStyle,
            }}
          >
            <MapControls position="top-right" showZoom showLocate />

            {filteredVibes.map((vibe) => {
              const isSelected = vibe.id === selectedVibe.id;

              return (
                <MapMarker
                  key={vibe.id}
                  longitude={vibe.coords[0]}
                  latitude={vibe.coords[1]}
                >
                  <MarkerContent>
                    <button
                      onClick={() => setSelectedVibeId(vibe.id)}
                      style={{
                        position: "relative",
                        display: "grid",
                        placeItems: "center",
                        width: isSelected ? 56 : 46,
                        height: isSelected ? 56 : 46,
                        borderRadius: 999,
                        border: isSelected
                          ? "2px solid rgba(255,255,255,0.9)"
                          : "1px solid rgba(255,255,255,0.5)",
                        background: vibe.accent,
                        color: "#111",
                        boxShadow: isSelected
                          ? `0 0 0 10px ${vibe.accent}35, 0 18px 28px rgba(0,0,0,0.35)`
                          : "0 12px 24px rgba(0,0,0,0.35)",
                        cursor: "pointer",
                        transition: "transform 0.18s ease, box-shadow 0.18s ease",
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.transform = "translateY(-2px) scale(1.06)";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.transform = "translateY(0) scale(1)";
                      }}
                      aria-label={`View ${vibe.locationName}`}
                    >
                      <MapPin size={isSelected ? 22 : 18} color="#111" fill="#111" />
                    </button>

                    <MarkerLabel position="bottom">
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background: isSelected ? "#F59E0B" : isLightMode ? "rgba(255,250,242,0.96)" : "rgba(10,10,10,0.88)",
                          color: isSelected ? "#111" : isLightMode ? "#241b10" : "#fff",
                          boxShadow: isLightMode ? "0 4px 16px rgba(120,53,15,0.12)" : "0 4px 16px rgba(0,0,0,0.24)",
                        }}
                      >
                        <span>{vibe.locationName}</span>
                        <span style={{ opacity: 0.7 }}>{vibe.interestedCount}</span>
                      </span>
                    </MarkerLabel>
                  </MarkerContent>
                </MapMarker>
              );
            })}
          </InteractiveMap>
        </div>

        {isMobile && (
          <div style={{ padding: "14px 14px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 999,
                  border: chipBorder,
                  background: chipBackground,
                  padding: "8px 12px",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Flame size={16} color="#F59E0B" />
                <span style={{ fontSize: 13, color: subTextColor }}>
                  <span style={{ color: pageText, fontWeight: 600 }}>Trending nearby:</span> Lagos
                  plans
                </span>
              </div>
              <button
                onClick={() => onNavigate("main")}
                style={{
                  border: "none",
                  borderRadius: 999,
                  background: "#F59E0B",
                  color: "#111",
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Back
              </button>
            </div>

            <div
              style={{
                background: isLightMode ? "rgba(255,250,242,0.88)" : "rgba(12,12,15,0.72)",
                border: `1px solid ${borderColor}`,
                borderRadius: 28,
                padding: "18px 16px",
                backdropFilter: "blur(18px)",
                boxShadow: heroShadow,
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(2rem, 8vw, 3rem)",
                  lineHeight: 1,
                  letterSpacing: -1.2,
                  fontWeight: 800,
                }}
              >
                Nearby vibes
                <span style={{ color: "#F59E0B", fontStyle: "italic", fontWeight: 500 }}>
                  {" "}
                  on the map.
                </span>
              </h1>
              <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.6, color: mutedTextColor }}>
                Scroll down to see cards, or tap a pin to preview the selected vibe.
              </p>
              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={showAllCards}
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${borderColor}`,
                    background: "transparent",
                    color: pageText,
                    padding: "10px 14px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Reset cards
                </button>
                <button
                  onClick={hideAllCards}
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${borderColor}`,
                    background: "transparent",
                    color: pageText,
                    padding: "10px 14px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Hide cards
                </button>
              </div>
            </div>

            <div
              style={{
                background: cardBackground,
                border: `1px solid ${borderColor}`,
                borderRadius: 28,
                padding: 16,
                backdropFilter: "blur(18px)",
                boxShadow: panelShadow,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Compass size={16} color="#F59E0B" />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: pageText }}>
                    Close To You
                  </p>
                </div>
                <button
                  onClick={showAllCards}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: mutedTextColor,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Reset
                </button>
              </div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {visibleCards.map((vibe) => {
                  const active = vibe.id === selectedVibe.id;
                  return (
                    <div key={vibe.id} style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
                      <button
                        onClick={() => setSelectedVibeId(vibe.id)}
                        style={{
                          flex: 1,
                          textAlign: "left",
                          borderRadius: 20,
                          border: active
                            ? "1px solid rgba(245,158,11,0.45)"
                            : `1px solid ${isLightMode ? "rgba(36,27,16,0.08)" : "rgba(255,255,255,0.06)"}`,
                          background: active ? "rgba(245,158,11,0.12)" : softCardBackground,
                          padding: 12,
                          cursor: "pointer",
                          color: pageText,
                        }}
                      >
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <img
                            src={vibe.coverImage}
                            alt={vibe.actionText}
                            style={{
                              width: 56,
                              height: 56,
                              objectFit: "cover",
                              borderRadius: 16,
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: pageText }}>
                              {vibe.userName} wants to {vibe.actionText} {vibe.emoji}
                            </p>
                            <p
                              style={{
                                margin: "4px 0 0",
                                fontSize: 12,
                                color: mutedTextColor,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {vibe.description}
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => hideCard(vibe.id)}
                        style={{
                          width: 42,
                          borderRadius: 16,
                          border: `1px solid ${isLightMode ? "rgba(36,27,16,0.08)" : "rgba(255,255,255,0.06)"}`,
                          background: softCardBackground,
                          color: mutedTextColor,
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                        aria-label={`Remove ${vibe.userName}'s card`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedVibe && (
              <div
                style={{
                  background: isLightMode ? "rgba(255,250,242,0.9)" : "rgba(12,12,15,0.78)",
                  border: `1px solid ${borderColor}`,
                  borderRadius: 28,
                  overflow: "hidden",
                  boxShadow: panelShadow,
                }}
              >
                <div style={{ position: "relative", height: 190 }}>
                  <img
                    src={selectedVibe.coverImage}
                    alt={selectedVibe.actionText}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: overlayGradient }} />
                  <div style={{ position: "absolute", left: 20, right: 20, bottom: 18 }}>
                    <p style={{ margin: 0, fontSize: 12, color: subTextColor }}>
                      {selectedVibe.date} · {selectedVibe.audience}
                    </p>
                    <h2 style={{ margin: "6px 0 0", fontSize: 24, lineHeight: 1.1 }}>
                      {selectedVibe.userName} wants to {selectedVibe.actionText} {selectedVibe.emoji}
                    </h2>
                  </div>
                </div>
                <div style={{ padding: 18 }}>
                  <p style={{ margin: 0, color: mutedTextColor, fontSize: 14, lineHeight: 1.6 }}>
                    {selectedVibe.description}
                  </p>
                  <div
                    style={{
                      marginTop: 16,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        color: subTextColor,
                        fontSize: 13,
                      }}
                    >
                      <MapPin size={14} color="#F59E0B" />
                      <span>{selectedVibe.interestedCount} people already interested nearby</span>
                    </div>
                    <button
                      onClick={() => handleLikeVibe(selectedVibe.id)}
                      style={{
                        border: "none",
                        borderRadius: 999,
                        background: likedVibes.includes(selectedVibe.id) ? "#FB7185" : "#F59E0B",
                        color: "#111",
                        padding: "10px 16px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Heart size={16} fill={likedVibes.includes(selectedVibe.id) ? "#FB7185" : "none"} />
                      {likedVibes.includes(selectedVibe.id) ? "Liked!" : "Like"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            display: isMobile ? "none" : "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 24,
            gap: 24,
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 18,
              width: "min(860px, 100%)",
              marginTop: 8,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 999,
                border: chipBorder,
                background: chipBackground,
                padding: "10px 14px",
                backdropFilter: "blur(10px)",
              }}
            >
              <Flame size={16} color="#F59E0B" />
              <span style={{ fontSize: 14, color: subTextColor }}>
                <span style={{ color: pageText, fontWeight: 600 }}>Trending nearby:</span> movie
                nights and beach hangs around Lagos
              </span>
            </div>

            <div
              style={{
                width: "100%",
                background: isLightMode ? "rgba(255,250,242,0.82)" : "rgba(12,12,15,0.66)",
                border: `1px solid ${borderColor}`,
                borderRadius: 32,
                padding: "28px 24px 22px",
                backdropFilter: "blur(18px)",
                boxShadow: heroShadow,
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(2.4rem, 4vw, 4.25rem)",
                  lineHeight: 0.95,
                  letterSpacing: -1.8,
                  fontWeight: 800,
                }}
              >
                Nearby vibes
                <span style={{ color: "#F59E0B", fontStyle: "italic", fontWeight: 500 }}>
                  {" "}
                  on the map.
                </span>
              </h1>
              <p
                style={{
                  margin: "14px auto 0",
                  maxWidth: 640,
                  fontSize: 17,
                  lineHeight: 1.6,
                  color: mutedTextColor,
                }}
              >
                See places and plans close to you, using the same energy as Discover, but with
                the map leading the whole page.
              </p>

              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  justifyContent: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                {filters.map((filter) => {
                  const active = filter === activeFilter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      style={{
                        borderRadius: 999,
                        border: active ? "none" : `1px solid ${borderColor}`,
                        background: active ? "#F59E0B" : filterInactiveBackground,
                        color: active ? "#111" : filterInactiveColor,
                        padding: "10px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  justifyContent: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={hideAllCards}
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${borderColor}`,
                    background: isLightMode ? "rgba(255,255,255,0.94)" : "rgba(12,12,15,0.78)",
                    color: pageText,
                    padding: "10px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Remove all cards
                </button>
                <button
                  onClick={showAllCards}
                  style={{
                    borderRadius: 999,
                    border: chipBorder,
                    background: chipBackground,
                    color: isLightMode ? "#b45309" : "#FCD34D",
                    padding: "10px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Show cards again
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              width: "min(1120px, 100%)",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "end",
              gap: 18,
            }}
          >
            {visibleCards.length > 0 ? (
              <>
                <div
                  style={{
                    pointerEvents: "auto",
                    flex: "1 1 460px",
                    maxWidth: 520,
                    overflow: "hidden",
                    borderRadius: 30,
                    border: `1px solid ${borderColor}`,
                    background: cardBackground,
                    backdropFilter: "blur(18px)",
                    boxShadow: panelShadow,
                  }}
                >
                  <div style={{ position: "relative", height: 210 }}>
                    <img
                      src={selectedVibe.coverImage}
                      alt={selectedVibe.actionText}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: overlayGradient,
                      }}
                    />
                    <button
                      onClick={() => hideCard(selectedVibe.id)}
                      style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        border: `1px solid ${isLightMode ? "rgba(36,27,16,0.12)" : "rgba(255,255,255,0.18)"}`,
                        background: isLightMode ? "rgba(255,255,255,0.92)" : "rgba(12,12,15,0.72)",
                        color: pageText,
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                      }}
                      aria-label="Remove selected card"
                    >
                      <X size={16} />
                    </button>
                    <div style={{ position: "absolute", left: 20, right: 20, bottom: 18 }}>
                      <p style={{ margin: 0, fontSize: 12, color: subTextColor }}>
                        {selectedVibe.date} · {selectedVibe.audience}
                      </p>
                      <h2 style={{ margin: "6px 0 0", fontSize: 28, lineHeight: 1.1 }}>
                        {selectedVibe.userName} wants to {selectedVibe.actionText}{" "}
                        {selectedVibe.emoji}
                      </h2>
                    </div>
                  </div>

                  <div style={{ padding: 20 }}>
                    <p style={{ margin: 0, color: mutedTextColor, fontSize: 14, lineHeight: 1.6 }}>
                      {selectedVibe.description}
                    </p>
                    <div
                      style={{
                        marginTop: 16,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          color: subTextColor,
                          fontSize: 13,
                        }}
                      >
                        <MapPin size={14} color="#F59E0B" />
                        <span>{selectedVibe.interestedCount} people already interested nearby</span>
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={() => handlePassVibe(selectedVibe.id)}
                          style={{
                            flex: 1,
                            border: `1px solid ${borderColor}`,
                            borderRadius: 999,
                            background: "transparent",
                            color: pageText,
                            padding: "10px 16px",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Pass
                        </button>
                        <button
                          onClick={() => handleLikeVibe(selectedVibe.id)}
                          style={{
                            flex: 1,
                            border: "none",
                            borderRadius: 999,
                            background: likedVibes.includes(selectedVibe.id) ? "#FB7185" : "#F59E0B",
                            color: "#111",
                            padding: "10px 16px",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          <Heart size={16} fill={likedVibes.includes(selectedVibe.id) ? "#FB7185" : "none"} />
                          {likedVibes.includes(selectedVibe.id) ? "Liked!" : "Like"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    pointerEvents: "auto",
                    flex: "1 1 320px",
                    maxWidth: 380,
                    borderRadius: 28,
                    border: `1px solid ${borderColor}`,
                    background: cardBackground,
                    backdropFilter: "blur(18px)",
                    padding: 18,
                    boxShadow: panelShadow,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Compass size={16} color="#F59E0B" />
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: 0.4,
                          color: pageText,
                        }}
                      >
                        Close To You
                      </p>
                    </div>
                    <button
                      onClick={hideAllCards}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: mutedTextColor,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Remove all
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      maxHeight: 280,
                      overflowY: "auto",
                    }}
                  >
                    {visibleCards.map((vibe) => {
                      const active = vibe.id === selectedVibe.id;

                      return (
                        <div
                          key={vibe.id}
                          style={{
                            display: "flex",
                            alignItems: "stretch",
                            gap: 10,
                          }}
                        >
                          <button
                            onClick={() => setSelectedVibeId(vibe.id)}
                            style={{
                              flex: 1,
                              textAlign: "left",
                              borderRadius: 20,
                              border: active
                                ? "1px solid rgba(245,158,11,0.45)"
                                : `1px solid ${isLightMode ? "rgba(36,27,16,0.08)" : "rgba(255,255,255,0.06)"}`,
                              background: active ? "rgba(245,158,11,0.12)" : softCardBackground,
                              padding: 12,
                              cursor: "pointer",
                              color: pageText,
                            }}
                          >
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                              <img
                                src={vibe.coverImage}
                                alt={vibe.actionText}
                                style={{
                                  width: 56,
                                  height: 56,
                                  objectFit: "cover",
                                  borderRadius: 16,
                                  flexShrink: 0,
                                }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: pageText,
                                  }}
                                >
                                  {vibe.userName} wants to {vibe.actionText} {vibe.emoji}
                                </p>
                                <p
                                  style={{
                                    margin: "4px 0 0",
                                    fontSize: 12,
                                    color: mutedTextColor,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {vibe.description}
                                </p>
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => hideCard(vibe.id)}
                            style={{
                              width: 42,
                              borderRadius: 16,
                              border: `1px solid ${isLightMode ? "rgba(36,27,16,0.08)" : "rgba(255,255,255,0.06)"}`,
                              background: softCardBackground,
                              color: mutedTextColor,
                              display: "grid",
                              placeItems: "center",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                            aria-label={`Remove ${vibe.userName}'s card`}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{
                  pointerEvents: "auto",
                  width: "min(520px, 100%)",
                  borderRadius: 28,
                  border: `1px solid ${borderColor}`,
                  background: isLightMode ? "rgba(255,250,242,0.9)" : "rgba(12,12,15,0.78)",
                  backdropFilter: "blur(18px)",
                  padding: 24,
                  textAlign: "center",
                  boxShadow: panelShadow,
                }}
              >
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  Cards removed. The map pins are still live.
                </p>
                <p style={{ margin: "8px 0 0", color: mutedTextColor, lineHeight: 1.6 }}>
                  Use the pins to browse nearby locations, or bring the cards back whenever you
                  want.
                </p>
                <button
                  onClick={showAllCards}
                  style={{
                    marginTop: 16,
                    border: "none",
                    borderRadius: 999,
                    background: "#F59E0B",
                    color: "#111",
                    padding: "11px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Restore cards
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Match Modal */}
      {showMatchModal && matchedVibe && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-[#1A1A21] border border-white/10 rounded-3xl max-w-md w-full overflow-hidden"
          >
            <div className="relative h-64 overflow-hidden">
              <img
                src={matchedVibe.coverImage}
                alt={matchedVibe.actionText}
                className="w-full h-full object-cover"
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent to-black/70"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6 }}
                    className="text-6xl mb-3"
                  >
                    ✨
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white">It's a Match!</h3>
                  <p className="text-gray-300 mt-2">{matchedVibe.userName} likes you too!</p>
                </div>
              </motion.div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">You matched on:</p>
                <p className="text-lg font-semibold text-white">
                  {matchedVibe.userName} wants to {matchedVibe.actionText} {matchedVibe.emoji}
                </p>
                <p className="text-sm text-gray-400 mt-2">{matchedVibe.description}</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowMatchModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white font-medium transition-colors hover:bg-white/5"
                >
                  Maybe later
                </button>
                <button
                  onClick={() => {
                    setShowMatchModal(false);
                    onNavigate("messages");
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#F59E0B] text-black font-semibold transition-opacity hover:opacity-90"
                >
                  Message
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Nearby;
