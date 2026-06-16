"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Compass, Flame, Loader2, MapPin, ShieldCheck, User, Heart, X, MessageCircle } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import * as API from "../services/api";
import { useAppContext } from "../context/AppContext";

interface NearbyProps {
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  isLightMode?: boolean;
  currentUser?: any;
}

interface NearbyPerson {
  id: string;
  name: string;
  profileId: string;
  city: string;
  bio: string;
  avatar: string;
  avatarImage?: string;
  gallery?: string[];
  badges: string[];
  isVerified: boolean;
  proximityLabel: string;
  age?: number;
  gender?: string;
  hobbies?: string[];
  language?: string[];
}

const mockNearbyPeople: NearbyPerson[] = [];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function friendlyName(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const value = String(candidate || '').trim();
    if (!value) continue;

    const stripped = value
      .replace(/[_-]+/g, ' ')
      .replace(/\d+$/g, '')
      .trim();

    if (!stripped) {
      continue;
    }

    if (stripped.includes(' ')) {
      return stripped.replace(/\s+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    }

    return stripped.charAt(0).toUpperCase() + stripped.slice(1);
  }

  return 'Nearby friend';
}

function normalizeNearbyPerson(person: API.User, index: number): NearbyPerson {
  const fallbackNames = ["Ada", "Tunde", "Zara", "Oge", "Kemi", "Chidi"];
  const displayName = friendlyName(person.display_name, person.full_name, person.username, fallbackNames[index % fallbackNames.length]);
  const ageRanges = [[25, 28], [32, 35], [19, 24], [45, 48], [29, 31], [22, 26]];
  const genders = ["Female", "Male", "Female", "Male", "Female", "Male"];
  const hobbyLists = [
    ["Hiking", "Photography", "Cooking"],
    ["Sports", "Music", "Travel"],
    ["Art", "Reading", "Yoga"],
    ["Gaming", "Movies", "Cooking"],
    ["Fitness", "Music", "Travel"],
    ["Painting", "Books", "Sports"]
  ];
  const languages = [
    ["English", "French"],
    ["English", "Spanish"],
    ["English", "Yoruba"],
    ["English", "Italian"],
    ["English", "German"],
    ["English", "Hausa"]
  ];

  const age = ageRanges[index % ageRanges.length][0];
  const gallery = Array.isArray((person as any).profile_photos) ? ((person as any).profile_photos as string[]).filter(Boolean) : [];

  return {
    id: person.id,
    name: displayName,
    profileId: person.profile_id || `JNT-${String(index + 1).padStart(4, "0")}`,
    city: person.city || "Near you",
    bio: "A registered Junto member nearby. Tap in and say hi.",
    avatar: initials(displayName),
    avatarImage: gallery[0] || (person as any).profile_photo || undefined,
    gallery,
    badges: ["Nearby"],
    isVerified: true,
    proximityLabel: `${index + 1}.${(index + 3) % 10} km away`,
    age,
    gender: genders[index % genders.length],
    hobbies: hobbyLists[index % hobbyLists.length],
    language: languages[index % languages.length],
  };
}

export const Nearby: React.FC<NearbyProps> = ({
  onNavigate = () => {},
  setActiveNav = () => {},
  isLightMode = false,
  currentUser,
}) => {
  const { setSelectedUser } = useAppContext();
  const [people, setPeople] = useState<NearbyPerson[]>(mockNearbyPeople);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"All" | "Verified" | "Close" | "New">("All");
  const [ageFilter, setAgeFilter] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<string | null>(null);
  const [languageFilter, setLanguageFilter] = useState<string | null>(null);
  const [hobbyFilter, setHobbyFilter] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [likedUserIds, setLikedUserIds] = useState<Set<string>>(new Set());
  const [dislikedUserIds, setDislikedUserIds] = useState<Set<string>>(new Set());
  const [swipeMessage, setSwipeMessage] = useState<{ text: string; type: 'like' | 'dislike' } | null>(null);
  const [likeActionModal, setLikeActionModal] = useState<NearbyPerson | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchNearbyPeople = async () => {
      try {
        setLoading(true);
        setFetchError('');

        if (!currentUser?.id) {
          if (mounted) setPeople(mockNearbyPeople);
          if (mounted) setFetchError('Sign in to see nearby people.');
          return;
        }

        const response = await API.getNearbyUsers(currentUser.id, 0, 0);
        const apiPeople = (response?.nearby_users || []).map((person: API.User, index: number) =>
          normalizeNearbyPerson(person, index),
        );

        if (mounted) {
          setPeople(apiPeople.length > 0 ? apiPeople : mockNearbyPeople);
        }
      } catch (error) {
        console.error("Failed to fetch nearby people:", error);
        if (mounted) {
          setPeople(mockNearbyPeople);
          setFetchError("We couldn't load nearby people right now. Please try again.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchNearbyPeople();

    return () => { mounted = false; };
  }, [currentUser?.id, refreshCount]);

  const filteredPeople = useMemo(() => {
    let filtered = people.filter(person => !dislikedUserIds.has(person.id) && !likedUserIds.has(person.id));
    switch (activeFilter) {
      case "Verified": filtered = filtered.filter((p) => p.isVerified); break;
      case "Close": filtered = filtered.slice(0, 3); break;
      case "New": filtered = filtered.filter((p) => p.badges.includes("Nearby")); break;
    }
    if (verifiedOnly) filtered = filtered.filter((p) => p.isVerified);
    if (ageFilter) {
      filtered = filtered.filter((p) => {
        if (!p.age) return false;
        if (ageFilter === "18-30") return p.age >= 18 && p.age <= 30;
        if (ageFilter === "30-50") return p.age >= 30 && p.age <= 50;
        return true;
      });
    }
    if (genderFilter) filtered = filtered.filter((p) => p.gender === genderFilter);
    if (languageFilter) filtered = filtered.filter((p) => p.language && p.language.includes(languageFilter));
    if (hobbyFilter) filtered = filtered.filter((p) => p.hobbies && p.hobbies.includes(hobbyFilter));
    return filtered;
  }, [activeFilter, people, dislikedUserIds, likedUserIds, verifiedOnly, ageFilter, genderFilter, languageFilter, hobbyFilter]);

  const currentPerson = filteredPeople[0] || null;
  const nextPeople = filteredPeople.slice(1, 4);

  const handleDislikePerson = async (personId: string) => {
    if (!currentUser?.id) return;
    try {
      const newDisliked = new Set(dislikedUserIds);
      newDisliked.add(personId);
      setDislikedUserIds(newDisliked);
      setSwipeMessage({ text: `Passed`, type: 'dislike' });
      await API.swipeUser(currentUser.id, personId, 'left');
      setTimeout(() => setSwipeMessage(null), 1500);
    } catch (error) {
      console.error('Failed to dislike user:', error);
      const newDisliked = new Set(dislikedUserIds);
      newDisliked.delete(personId);
      setDislikedUserIds(newDisliked);
    }
  };

  const handleLikeAndShowModal = (person: NearbyPerson) => {
    setLikeActionModal(person);
  };

  const openProfile = (person: NearbyPerson) => {
    setSelectedUser?.({
      id: person.id,
      name: person.name,
      username: person.name,
      display_name: person.name,
      profile_id: person.profileId,
      city: person.city,
      bio: person.bio,
      avatarImage: person.avatarImage,
      avatar_image: person.avatarImage,
      profile_photos: person.gallery || [],
      age: person.age,
      gender: person.gender,
      interests: person.hobbies || [],
      location: person.city,
    });
    setActiveNav('Profile');
    onNavigate('profile');
  };

  const openMessages = (person: NearbyPerson) => {
    sessionStorage.setItem('junto-message-target', JSON.stringify({
      id: person.id,
      name: person.name,
      display_name: person.name,
      profile_id: person.profileId,
      avatarImage: person.avatarImage || '',
      city: person.city,
    }));
    setActiveNav('Messages');
    onNavigate('messages');
  };

  const handleSaveForLater = async (person: NearbyPerson) => {
    if (!currentUser?.id) return;
    try {
      await API.swipeUser(currentUser.id, person.id, 'right');
      const newLiked = new Set(likedUserIds);
      newLiked.add(person.id);
      setLikedUserIds(newLiked);
      setSwipeMessage({ text: `✅ ${person.name} saved to your friends!`, type: 'like' });
      setLikeActionModal(null);
      setTimeout(() => setSwipeMessage(null), 2500);
    } catch (error) {
      console.error('Failed to save person:', error);
    }
  };

  const handleCreateEvent = (person: NearbyPerson) => {
    setLikeActionModal(null);
    onNavigate('HostDashboard');
    setActiveNav('HostDashboard');
  };

  // ─── Theme tokens ────────────────────────────────────────────────────────────
  const bg         = isLightMode ? "#F0EDE8" : "#0B0C14";
  const surface    = isLightMode ? "rgba(255,255,255,0.85)" : "rgba(17,18,28,0.90)";
  const surfaceAlt = isLightMode ? "rgba(255,255,255,0.65)" : "rgba(22,23,36,0.80)";
  const border     = isLightMode ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)";
  const coral      = "#FF6B47";
  const teal       = "#00C9A7";
  const ink        = isLightMode ? "#111118" : "#F2F0EC";
  const muted      = isLightMode ? "#7a7670" : "#6B7280";
  const glass      = isLightMode
    ? "rgba(255,255,255,0.72)"
    : "rgba(11,12,20,0.72)";

  const filterBtnStyle = (active: boolean) => ({
    background: active ? coral : surfaceAlt,
    color: active ? "#fff" : ink,
    border: `1px solid ${active ? coral : border}`,
    borderRadius: "9999px",
    padding: "6px 18px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.18s ease",
    backdropFilter: "blur(8px)",
  } as React.CSSProperties);

  return (
    <div style={{ minHeight: "100vh", background: bg, color: ink }} className="font-sans">

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {swipeMessage && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          style={{
            position: "fixed", top: 20, right: 20, zIndex: 60,
            background: swipeMessage.type === 'like' ? teal : coral,
            color: "#fff",
            borderRadius: "9999px",
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: 700,
            boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <Bell size={13} />
          {swipeMessage.text}
        </motion.div>
      )}

      {/* ── Like-action Modal ─────────────────────────────────────────────── */}
      {likeActionModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.78)",
            backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 16px",
          }}
          onClick={() => setLikeActionModal(null)}
        >
          <motion.div
            initial={{ scale: 0.93, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            style={{
              width: "100%", maxWidth: 400,
              background: isLightMode ? "#fff" : "#13141F",
              border: `1px solid ${border}`,
              borderRadius: "28px",
              padding: "32px 28px",
              boxShadow: "0 40px 100px rgba(0,0,0,0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Avatar row */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: `linear-gradient(135deg, ${coral}, #FF9F6B)`,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, marginBottom: 12,
              }}>❤️</div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>
                You liked {likeActionModal.name}
              </div>
              <div style={{ color: muted, fontSize: 13, marginTop: 4 }}>What's next?</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "👤  View profile", onClick: () => openProfile(likeActionModal), bg: surfaceAlt, color: ink },
                { label: `💬  Message ${likeActionModal.name}`, onClick: () => openMessages(likeActionModal), bg: "#2563EB", color: "#fff" },
                { label: `✨  Create an event together`, onClick: () => handleCreateEvent(likeActionModal), bg: coral, color: "#fff" },
                { label: "💾  Save for later", onClick: () => handleSaveForLater(likeActionModal), bg: "transparent", color: ink, extraStyle: { border: `1px solid ${border}` } },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.onClick}
                  style={{
                    background: btn.bg,
                    color: btn.color,
                    border: "none",
                    borderRadius: "14px",
                    padding: "13px 18px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "opacity 0.15s",
                    ...(btn.extraStyle || {}),
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  {btn.label}
                </button>
              ))}
              <button
                onClick={() => setLikeActionModal(null)}
                style={{
                  marginTop: 4, background: "transparent", border: "none",
                  color: muted, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", padding: "8px",
                }}
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 120px" }}>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >

          {/* ── Page header ───────────────────────────────────────────────── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: `${coral}18`, border: `1px solid ${coral}30`,
              borderRadius: 9999, padding: "4px 12px",
              fontSize: 11, fontWeight: 700, color: coral,
              textTransform: "uppercase", letterSpacing: "0.08em",
              marginBottom: 12,
            }}>
              <MapPin size={11} />
              People near you
            </div>

            <h1 style={{
              fontSize: "clamp(28px, 6vw, 42px)",
              fontWeight: 900,
              letterSpacing: "-1.2px",
              lineHeight: 1.08,
              margin: "0 0 10px",
            }}>
              Nearby members,{" "}
              <span style={{ color: coral, fontStyle: "italic" }}>one at a time.</span>
            </h1>

            <p style={{ color: muted, fontSize: 14, lineHeight: 1.6, maxWidth: 480, margin: 0 }}>
              Browse verified Junto members close to you. Like to connect or message directly.
            </p>
          </div>

          {/* ── Filter bar ────────────────────────────────────────────────── */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 8,
            marginBottom: showAdvancedFilters ? 16 : 24,
          }}>
            {(["All", "Verified", "Close", "New"] as const).map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)} style={filterBtnStyle(activeFilter === f)}>
                {f}
              </button>
            ))}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={filterBtnStyle(showAdvancedFilters)}
            >
              ⚙ Filters
            </button>
            <button
              onClick={() => { setActiveNav('Messages'); onNavigate('messages'); }}
              style={{
                ...filterBtnStyle(false),
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <MessageCircle size={13} /> Messages
            </button>

            {/* count chip */}
            <span style={{
              marginLeft: "auto",
              background: surfaceAlt,
              border: `1px solid ${border}`,
              borderRadius: 9999,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: muted,
              alignSelf: "center",
              backdropFilter: "blur(8px)",
            }}>
              {filteredPeople.length} nearby
            </span>
          </div>

          {/* ── Advanced filters panel ────────────────────────────────────── */}
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: surface,
                border: `1px solid ${border}`,
                borderRadius: 20,
                padding: "20px 20px",
                marginBottom: 20,
                backdropFilter: "blur(16px)",
              }}
            >
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 20,
              }}>
                {/* Age */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: muted, marginBottom: 8 }}>Age</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {["18-30", "30-50"].map((r) => (
                      <button key={r} onClick={() => setAgeFilter(ageFilter === r ? null : r)}
                        style={{
                          background: ageFilter === r ? coral : "transparent",
                          color: ageFilter === r ? "#fff" : ink,
                          border: `1px solid ${ageFilter === r ? coral : border}`,
                          borderRadius: 10, padding: "7px 12px",
                          fontSize: 13, fontWeight: 600, cursor: "pointer",
                          textAlign: "left", transition: "all 0.15s",
                        }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: muted, marginBottom: 8 }}>Gender</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {["Male", "Female"].map((g) => (
                      <button key={g} onClick={() => setGenderFilter(genderFilter === g ? null : g)}
                        style={{
                          background: genderFilter === g ? coral : "transparent",
                          color: genderFilter === g ? "#fff" : ink,
                          border: `1px solid ${genderFilter === g ? coral : border}`,
                          borderRadius: 10, padding: "7px 12px",
                          fontSize: 13, fontWeight: 600, cursor: "pointer",
                          textAlign: "left", transition: "all 0.15s",
                        }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: muted, marginBottom: 8 }}>Language</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {["English", "French", "Spanish", "German"].map((l) => (
                      <button key={l} onClick={() => setLanguageFilter(languageFilter === l ? null : l)}
                        style={{
                          background: languageFilter === l ? coral : "transparent",
                          color: languageFilter === l ? "#fff" : ink,
                          border: `1px solid ${languageFilter === l ? coral : border}`,
                          borderRadius: 10, padding: "7px 12px",
                          fontSize: 13, fontWeight: 600, cursor: "pointer",
                          textAlign: "left", transition: "all 0.15s",
                        }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hobbies */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: muted, marginBottom: 8 }}>Interests</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {["Hiking", "Sports", "Music", "Travel"].map((h) => (
                      <button key={h} onClick={() => setHobbyFilter(hobbyFilter === h ? null : h)}
                        style={{
                          background: hobbyFilter === h ? coral : "transparent",
                          color: hobbyFilter === h ? "#fff" : ink,
                          border: `1px solid ${hobbyFilter === h ? coral : border}`,
                          borderRadius: 10, padding: "7px 12px",
                          fontSize: 13, fontWeight: 600, cursor: "pointer",
                          textAlign: "left", transition: "all 0.15s",
                        }}>
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Verified */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: muted, marginBottom: 8 }}>Status</div>
                  <button
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    style={{
                      background: verifiedOnly ? teal : "transparent",
                      color: verifiedOnly ? "#fff" : ink,
                      border: `1px solid ${verifiedOnly ? teal : border}`,
                      borderRadius: 10, padding: "7px 12px",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      width: "100%", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 6,
                      transition: "all 0.15s",
                    }}
                  >
                    <ShieldCheck size={14} />
                    Verified only
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Main card area ────────────────────────────────────────────── */}
          {loading ? (
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 14, padding: "72px 0",
              background: surface, border: `1px solid ${border}`,
              borderRadius: 24, backdropFilter: "blur(12px)",
            }}>
              <Loader2 style={{ color: coral, animation: "spin 1s linear infinite", width: 28, height: 28 }} />
              <span style={{ color: muted, fontSize: 14 }}>Finding people near you…</span>
            </div>

          ) : fetchError ? (
            <div style={{
              textAlign: "center", padding: "56px 24px",
              background: surface, border: `1px solid ${border}`,
              borderRadius: 24, backdropFilter: "blur(12px)",
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Couldn't reach nearby</div>
              <div style={{ color: muted, fontSize: 14, marginBottom: 24 }}>{fetchError}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => setRefreshCount(c => c + 1)} style={{ background: coral, color: "#fff", border: "none", borderRadius: 9999, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Retry
                </button>
                <button
                  onClick={() => { setActiveFilter("All"); setAgeFilter(null); setGenderFilter(null); setLanguageFilter(null); setHobbyFilter(null); setVerifiedOnly(false); setRefreshCount(c => c + 1); }}
                  style={{ background: "transparent", color: ink, border: `1px solid ${border}`, borderRadius: 9999, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Reset filters
                </button>
              </div>
            </div>

          ) : currentPerson ? (
            /* ── Person card — cinema-poster layout ── */
            <div style={{ position: "relative" }}>
              {/* Ghost stack cards behind */}
              {nextPeople.slice(0, 2).map((_, i) => (
                <div key={i} style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 28,
                  background: surface,
                  border: `1px solid ${border}`,
                  transform: `translateY(${(i + 1) * 8}px) scale(${0.97 - i * 0.025})`,
                  opacity: 0.35 - i * 0.12,
                  zIndex: -1,
                }} />
              ))}

              <motion.div
                key={currentPerson.id}
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  borderRadius: 28,
                  overflow: "hidden",
                  border: `1px solid ${border}`,
                  boxShadow: isLightMode
                    ? "0 20px 64px rgba(0,0,0,0.12)"
                    : "0 20px 64px rgba(0,0,0,0.5)",
                  background: isLightMode ? "#fff" : "#13141F",
                }}
              >
                {/* ── Photo hero — full-bleed, tall ── */}
                <div style={{ position: "relative", height: 340, background: isLightMode ? "#E8E3DC" : "#0F1018" }}>
                  {currentPerson.avatarImage ? (
                    <img
                      src={currentPerson.avatarImage}
                      alt={currentPerson.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div style={{
                      height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: `linear-gradient(135deg, ${coral}22, ${teal}22)`,
                      fontSize: 72, fontWeight: 900, color: coral,
                      letterSpacing: "-2px",
                    }}>
                      {currentPerson.avatar}
                    </div>
                  )}

                  {/* Gradient overlay so text on photo is readable */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.18) 50%, transparent 100%)",
                  }} />

                  {/* ── Distance pill (top-right) ── */}
                  <div style={{
                    position: "absolute", top: 14, right: 14,
                    background: glass,
                    backdropFilter: "blur(14px)",
                    border: `1px solid ${border}`,
                    borderRadius: 9999,
                    padding: "5px 12px",
                    fontSize: 11, fontWeight: 700, color: "#fff",
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <MapPin size={10} />
                    {currentPerson.proximityLabel}
                  </div>

                  {/* ── Verified badge (top-left) ── */}
                  {currentPerson.isVerified && (
                    <div style={{
                      position: "absolute", top: 14, left: 14,
                      background: `${teal}CC`,
                      backdropFilter: "blur(10px)",
                      borderRadius: 9999,
                      padding: "5px 11px",
                      fontSize: 11, fontWeight: 800, color: "#fff",
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <ShieldCheck size={11} />
                      Verified
                    </div>
                  )}

                  {/* ── Gallery thumbs (bottom-left) ── */}
                  {currentPerson.gallery && currentPerson.gallery.length > 1 && (
                    <div style={{
                      position: "absolute", bottom: 14, left: 14,
                      display: "flex", gap: 6,
                    }}>
                      {currentPerson.gallery.slice(0, 3).map((photo, i) => (
                        <img key={`${currentPerson.id}-g-${i}`} src={photo} alt=""
                          style={{
                            width: 38, height: 38, borderRadius: 10,
                            objectFit: "cover",
                            border: "2px solid rgba(255,255,255,0.25)",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                          }} />
                      ))}
                    </div>
                  )}

                  {/* ── Name overlay on photo ── */}
                  <div style={{ position: "absolute", bottom: 14, right: 14, left: currentPerson.gallery && currentPerson.gallery.length > 1 ? 140 : 14 }}>
                    <div style={{
                      fontSize: "clamp(22px, 5vw, 30px)",
                      fontWeight: 900,
                      color: "#fff",
                      letterSpacing: "-0.6px",
                      lineHeight: 1.1,
                      textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                    }}>
                      {currentPerson.name}{currentPerson.age ? `, ${currentPerson.age}` : ""}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 3, fontWeight: 500 }}>
                      {[currentPerson.city, currentPerson.gender].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>

                {/* ── Card body ── */}
                <div style={{ padding: "20px 20px 24px" }}>
                  {/* Profile ID */}
                  <div style={{
                    fontSize: 10, fontWeight: 800,
                    textTransform: "uppercase", letterSpacing: "0.15em",
                    color: muted, marginBottom: 12,
                    fontFamily: "monospace",
                  }}>
                    {currentPerson.profileId}
                  </div>

                  {/* Bio */}
                  <p style={{ fontSize: 14, color: muted, lineHeight: 1.6, margin: "0 0 16px" }}>
                    {currentPerson.bio}
                  </p>

                  {/* Tags row */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                    {currentPerson.language?.map((l) => (
                      <span key={l} style={{
                        background: `${teal}1A`, color: teal,
                        border: `1px solid ${teal}30`,
                        borderRadius: 9999, padding: "3px 10px",
                        fontSize: 11, fontWeight: 700,
                      }}>{l}</span>
                    ))}
                    {currentPerson.hobbies?.map((h) => (
                      <span key={h} style={{
                        background: `${coral}18`, color: coral,
                        border: `1px solid ${coral}30`,
                        borderRadius: 9999, padding: "3px 10px",
                        fontSize: 11, fontWeight: 700,
                      }}>{h}</span>
                    ))}
                  </div>

                  {/* ── Action buttons ── */}
                  <div style={{ display: "flex", gap: 10 }}>
                    {/* Pass */}
                    <button
                      onClick={() => void handleDislikePerson(currentPerson.id)}
                      style={{
                        flex: 1,
                        background: isLightMode ? "#F0EDE8" : "#1E1F2E",
                        color: muted,
                        border: `1px solid ${border}`,
                        borderRadius: 14,
                        padding: "13px 0",
                        fontSize: 13, fontWeight: 800,
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6B7280"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = border; }}
                    >
                      <X size={15} /> Pass
                    </button>

                    {/* Like */}
                    <button
                      onClick={() => handleLikeAndShowModal(currentPerson)}
                      style={{
                        flex: 2,
                        background: coral,
                        color: "#fff",
                        border: "none",
                        borderRadius: 14,
                        padding: "13px 0",
                        fontSize: 13, fontWeight: 800,
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        boxShadow: `0 6px 24px ${coral}44`,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                    >
                      <Heart size={15} /> Like
                    </button>

                    {/* Message */}
                    <button
                      onClick={() => openMessages(currentPerson)}
                      style={{
                        flex: 1,
                        background: isLightMode ? "#EEF2FF" : "#1E2640",
                        color: "#2563EB",
                        border: `1px solid rgba(37,99,235,0.20)`,
                        borderRadius: 14,
                        padding: "13px 0",
                        fontSize: 13, fontWeight: 800,
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#2563EB"; e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = isLightMode ? "#EEF2FF" : "#1E2640"; e.currentTarget.style.color = "#2563EB"; }}
                    >
                      <Bell size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

          ) : (
            /* ── Empty state ── */
            <div style={{
              textAlign: "center", padding: "64px 24px",
              background: surface, border: `1px solid ${border}`,
              borderRadius: 24,
            }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.4px", marginBottom: 8 }}>
                You've seen everyone nearby
              </div>
              <div style={{ color: muted, fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                Try adjusting your filters or check back a bit later.
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => { setActiveFilter("All"); setAgeFilter(null); setGenderFilter(null); setLanguageFilter(null); setHobbyFilter(null); setVerifiedOnly(false); }}
                  style={{ background: "transparent", color: ink, border: `1px solid ${border}`, borderRadius: 9999, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Clear filters
                </button>
                <button
                  onClick={() => setRefreshCount(c => c + 1)}
                  style={{ background: coral, color: "#fff", border: "none", borderRadius: 9999, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Refresh
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </main>

      <Sidebar activeNav="Nearby" onNavigate={onNavigate} setActiveNav={setActiveNav} />
    </div>
  );
};

export default Nearby;
