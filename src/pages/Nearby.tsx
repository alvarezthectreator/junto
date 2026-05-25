"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Calendar, X } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import * as API from "../services/api";

interface NearbyProps {
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  onCloseSidebar?: () => void;
  isLightMode?: boolean;
  currentUser?: any;
}

interface NearbyUser {
  id: string;
  name: string;
  age: number;
  avatar: string;
  distance: string;
  interests: string[];
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

const nearbyUsers: NearbyUser[] = [
  {
    id: "user-1",
    name: "Sarah",
    age: 24,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    distance: "0.5 km away",
    interests: ["Hiking", "Photography", "Brunch"],
  },
  {
    id: "user-2",
    name: "Maria",
    age: 26,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    distance: "1.2 km away",
    interests: ["Art", "Music", "Travel"],
  },
  {
    id: "user-3",
    name: "Emma",
    age: 23,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    distance: "1.8 km away",
    interests: ["Gaming", "Movies", "Fitness"],
  },
  {
    id: "user-4",
    name: "Jessica",
    age: 25,
    avatar: "https://images.unsplash.com/photo-1517849845537-1d51a20414de?w=400",
    distance: "2.1 km away",
    interests: ["Yoga", "Coffee", "Books"],
  },
  {
    id: "user-5",
    name: "Alex",
    age: 27,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    distance: "2.5 km away",
    interests: ["Sports", "BBQ", "Comedy"],
  },
];

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

export const Nearby: React.FC<NearbyProps> = ({
  onNavigate = () => {},
  setActiveNav = () => {},
  onCloseSidebar = () => {},
  isLightMode = false,
  currentUser
}) => {
  const [likedVibes, setLikedVibes] = useState<string[]>([]);
  const [requestedVibes, setRequestedVibes] = useState<string[]>([]);

  const pageBackground = isLightMode ? "#f8f3e8" : "#050505";
  const pageText = isLightMode ? "#241b10" : "#fff";
  const cardBackground = isLightMode ? "rgba(255,250,242,0.88)" : "rgba(12,12,15,0.76)";
  const borderColor = isLightMode ? "rgba(36,27,16,0.10)" : "rgba(255,255,255,0.08)";
  const subTextColor = isLightMode ? "#7a674f" : "#d1d5db";
  const mutedTextColor = isLightMode ? "#8d7758" : "#9ca3af";
  const panelShadow = isLightMode ? "0 18px 50px rgba(120,53,15,0.12)" : "0 18px 50px rgba(0,0,0,0.35)";

  const handleLikeVibe = async (vibeId: string) => {
    if (!likedVibes.includes(vibeId)) {
      setLikedVibes([...likedVibes, vibeId]);
      try {
        if (currentUser?.id) {
          await API.swipeUser(currentUser.id, vibeId, 'right');
        }
      } catch (error) {
        console.error('Failed to swipe:', error);
      }
    }
  };

  const handlePassVibe = async (vibeId: string) => {
    try {
      if (currentUser?.id) {
        await API.swipeUser(currentUser.id, vibeId, 'left');
      }
    } catch (error) {
      console.error('Failed to pass:', error);
    }
  };

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
      <Sidebar activeNav="Nearby" setActiveNav={setActiveNav} onNavigate={onNavigate} onCloseSidebar={onCloseSidebar} />

      <main
        style={{
          flex: 1,
          marginLeft: 256,
          minHeight: "100dvh",
          overflowY: "auto",
          background: isLightMode
            ? "radial-gradient(circle at top, rgba(245,158,11,0.12), transparent 34%), #f8f3e8"
            : "radial-gradient(circle at top, rgba(245,158,11,0.12), transparent 34%), #050505",
        }}
      >
        {/* NEARBY USERS SECTION */}
        <div style={{ padding: "24px 24px", borderBottom: `1px solid ${borderColor}` }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: 24, fontWeight: 700 }}>People Nearby</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16 }}>
            {nearbyUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  background: cardBackground,
                  border: `1px solid ${borderColor}`,
                  boxShadow: panelShadow,
                  transition: "transform 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                <div style={{ position: "relative", paddingBottom: "100%" }}>
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8))" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, color: "white" }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
                      {user.name}, {user.age}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.8 }}>{user.distance}</p>
                  </div>
                </div>
                <div style={{ padding: 12, display: "flex", gap: 8 }}>
                  <button
                    onClick={() => onNavigate("messages")}
                    style={{
                      flex: 1,
                      border: "none",
                      borderRadius: 12,
                      background: "#F59E0B",
                      color: "#000",
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "0.9";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "1";
                    }}
                  >
                    <MessageCircle size={14} />
                    <span>Chat</span>
                  </button>
                  <button
                    onClick={() => onNavigate("hosting")}
                    style={{
                      flex: 1,
                      border: "none",
                      borderRadius: 12,
                      background: "rgba(245,158,11,0.2)",
                      color: "#F59E0B",
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "0.8";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "1";
                    }}
                  >
                    <Calendar size={14} />
                    <span>Event</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* NEARBY EVENTS SECTION */}
        <div style={{ padding: "24px 24px" }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: 24, fontWeight: 700 }}>Nearby Events</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {vibes.map((vibe) => (
              <motion.div
                key={vibe.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  background: cardBackground,
                  border: `1px solid ${borderColor}`,
                  boxShadow: panelShadow,
                  display: "flex",
                  gap: 12,
                  padding: 12,
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                }}
              >
                <img
                  src={vibe.coverImage}
                  alt={vibe.actionText}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 12,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: pageText }}>
                    {vibe.userName} wants to {vibe.actionText} {vibe.emoji}
                  </p>
                  <p style={{ margin: "4px 0", fontSize: 12, color: subTextColor }}>
                    {vibe.date} · {vibe.audience}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: mutedTextColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {vibe.description}
                  </p>
                  <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleLikeVibe(vibe.id)}
                      style={{
                        border: "none",
                        borderRadius: 8,
                        background: "#F59E0B",
                        color: "#000",
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      View event →
                    </button>
                    <button
                      onClick={() => handlePassVibe(vibe.id)}
                      style={{
                        border: `1px solid ${borderColor}`,
                        borderRadius: 8,
                        background: "transparent",
                        color: mutedTextColor,
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Pass
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Nearby;
