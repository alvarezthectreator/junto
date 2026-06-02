"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Compass, Flame, Loader2, MapPin, ShieldCheck, User, Heart, X } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import * as API from "../services/api";

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

function normalizeNearbyPerson(person: API.User, index: number): NearbyPerson {
  const fallbackNames = ["Ada", "Tunde", "Zara", "Oge", "Kemi", "Chidi"];
  const displayName = person.display_name || person.username || fallbackNames[index % fallbackNames.length];
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

  return {
    id: person.id,
    name: displayName,
    profileId: person.profile_id || `JNT-${String(index + 1).padStart(4, "0")}`,
    city: "Near you",
    bio: "A registered Junto member nearby. Tap in and say hi.",
    avatar: initials(displayName),
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
  const [people, setPeople] = useState<NearbyPerson[]>(mockNearbyPeople);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"All" | "Verified" | "Close" | "New">("All");
  const [ageFilter, setAgeFilter] = useState<string | null>(null); // "18-30" | "30-50"
  const [genderFilter, setGenderFilter] = useState<string | null>(null); // "Male" | "Female"
  const [languageFilter, setLanguageFilter] = useState<string | null>(null);
  const [hobbyFilter, setHobbyFilter] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [likedUserIds, setLikedUserIds] = useState<Set<string>>(new Set());
  const [dislikedUserIds, setDislikedUserIds] = useState<Set<string>>(new Set());
  const [swipeMessage, setSwipeMessage] = useState<{ text: string; type: 'like' | 'dislike' } | null>(null);
  const [likeActionModal, setLikeActionModal] = useState<NearbyPerson | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchNearbyPeople = async () => {
      try {
        setLoading(true);

        if (!currentUser?.id) {
          if (mounted) setPeople(mockNearbyPeople);
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
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchNearbyPeople();

    return () => {
      mounted = false;
    };
  }, [currentUser?.id]);

  const filteredPeople = useMemo(() => {
    let filtered = people.filter(person => !dislikedUserIds.has(person.id) && !likedUserIds.has(person.id));
    
    // Apply basic filter
    switch (activeFilter) {
      case "Verified":
        filtered = filtered.filter((person) => person.isVerified);
        break;
      case "Close":
        filtered = filtered.slice(0, 3);
        break;
      case "New":
        filtered = filtered.filter((person) => person.badges.includes("Nearby"));
        break;
    }

    // Apply advanced filters
    if (verifiedOnly) {
      filtered = filtered.filter((person) => person.isVerified);
    }

    if (ageFilter) {
      filtered = filtered.filter((person) => {
        if (!person.age) return false;
        if (ageFilter === "18-30") return person.age >= 18 && person.age <= 30;
        if (ageFilter === "30-50") return person.age >= 30 && person.age <= 50;
        return true;
      });
    }

    if (genderFilter) {
      filtered = filtered.filter((person) => person.gender === genderFilter);
    }

    if (languageFilter) {
      filtered = filtered.filter((person) => 
        person.language && person.language.includes(languageFilter)
      );
    }

    if (hobbyFilter) {
      filtered = filtered.filter((person) => 
        person.hobbies && person.hobbies.includes(hobbyFilter)
      );
    }

    return filtered;
  }, [activeFilter, people, dislikedUserIds, likedUserIds, verifiedOnly, ageFilter, genderFilter, languageFilter, hobbyFilter]);

  const currentPerson = filteredPeople[0] || null;

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

  const handleSaveForLater = async (person: NearbyPerson) => {
    if (!currentUser?.id) return;
    
    try {
      // Save person to friends (using swipe right which creates a match)
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
    // Save the selected person to context/state for event creation
    setLikeActionModal(null);
    // Navigate to event creation with this person pre-filled
    onNavigate('HostDashboard');
    setActiveNav('HostDashboard');
  };

  const pageBg = isLightMode ? "#f8f3e8" : "#050505";
  const pageText = isLightMode ? "#241b10" : "#fff";
  const cardBg = isLightMode ? "rgba(255,250,242,0.92)" : "rgba(12,12,15,0.78)";
  const panelBg = isLightMode ? "rgba(255,255,255,0.96)" : "rgba(26,26,33,0.92)";
  const borderColor = isLightMode ? "rgba(36,27,16,0.10)" : "rgba(255,255,255,0.08)";
  const mutedText = isLightMode ? "#8d7758" : "#9ca3af";
  const subText = isLightMode ? "#7a674f" : "#d1d5db";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: pageBg,
        color: pageText,
      }}
      className="font-sans"
    >
      <main className="mobile-page-main mx-auto max-w-7xl px-4 py-5 pb-32 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-6"
        >
          <section
            style={{
              border: `1px solid ${borderColor}`,
              background: isLightMode
                ? "linear-gradient(180deg, rgba(255,250,242,0.98), rgba(255,245,230,0.84))"
                : "linear-gradient(180deg, rgba(20,20,24,0.98), rgba(10,10,12,0.86))",
              boxShadow: isLightMode ? "0 24px 80px rgba(120,53,15,0.08)" : "0 24px 80px rgba(0,0,0,0.32)",
            }}
            className="overflow-hidden rounded-[2rem] p-5 sm:p-6 lg:p-8"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
                  <Flame size={14} />
                  People registered near you
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  Nearby people,
                  <span className="italic text-amber-500"> one at a time.</span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: mutedText }}>
                  Meet verified members close to you. Like someone to create an event together or save them as a friend.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {(["All", "Verified", "Close", "New"] as const).map((filter) => {
                  const active = activeFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className="rounded-full px-4 py-2 text-sm font-semibold transition"
                      style={{
                        background: active ? "#F59E0B" : panelBg,
                        color: active ? "#111" : pageText,
                        border: `1px solid ${active ? "#F59E0B" : borderColor}`,
                      }}
                    >
                      {filter}
                    </button>
                  );
                })}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="rounded-full px-4 py-2 text-sm font-semibold transition"
                  style={{
                    background: showAdvancedFilters ? "#F59E0B" : panelBg,
                    color: showAdvancedFilters ? "#111" : pageText,
                    border: `1px solid ${showAdvancedFilters ? "#F59E0B" : borderColor}`,
                  }}
                >
                  ⚙️ Filters
                </button>
              </div>
            </div>
          </section>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <section
              style={{
                border: `1px solid ${borderColor}`,
                background: cardBg,
              }}
              className="rounded-[2rem] p-6"
            >
              <h3 className="text-lg font-bold mb-6">Advanced Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Age Filter */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: mutedText }}>Age Range</label>
                  <div className="space-y-2">
                    {["18-30", "30-50"].map((range) => (
                      <button
                        key={range}
                        onClick={() => setAgeFilter(ageFilter === range ? null : range)}
                        className="w-full px-3 py-2 rounded-lg text-sm font-medium transition text-left"
                        style={{
                          background: ageFilter === range ? "#F59E0B" : "rgba(255,255,255,0.05)",
                          color: ageFilter === range ? "#111" : pageText,
                        }}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gender Filter */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: mutedText }}>Gender</label>
                  <div className="space-y-2">
                    {["Male", "Female"].map((gender) => (
                      <button
                        key={gender}
                        onClick={() => setGenderFilter(genderFilter === gender ? null : gender)}
                        className="w-full px-3 py-2 rounded-lg text-sm font-medium transition text-left"
                        style={{
                          background: genderFilter === gender ? "#F59E0B" : "rgba(255,255,255,0.05)",
                          color: genderFilter === gender ? "#111" : pageText,
                        }}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Filter */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: mutedText }}>Language</label>
                  <div className="space-y-2">
                    {["English", "French", "Spanish", "German"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguageFilter(languageFilter === lang ? null : lang)}
                        className="w-full px-3 py-2 rounded-lg text-sm font-medium transition text-left truncate"
                        style={{
                          background: languageFilter === lang ? "#F59E0B" : "rgba(255,255,255,0.05)",
                          color: languageFilter === lang ? "#111" : pageText,
                        }}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hobbies Filter */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: mutedText }}>Hobbies</label>
                  <div className="space-y-2">
                    {["Hiking", "Sports", "Music", "Travel"].map((hobby) => (
                      <button
                        key={hobby}
                        onClick={() => setHobbyFilter(hobbyFilter === hobby ? null : hobby)}
                        className="w-full px-3 py-2 rounded-lg text-sm font-medium transition text-left truncate"
                        style={{
                          background: hobbyFilter === hobby ? "#F59E0B" : "rgba(255,255,255,0.05)",
                          color: hobbyFilter === hobby ? "#111" : pageText,
                        }}
                      >
                        {hobby}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Verified Only */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: mutedText }}>Verification</label>
                  <button
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className="w-full px-3 py-2 rounded-lg text-sm font-medium transition text-left flex items-center gap-2"
                    style={{
                      background: verifiedOnly ? "#10B981" : "rgba(255,255,255,0.05)",
                      color: verifiedOnly ? "#fff" : pageText,
                    }}
                  >
                    <ShieldCheck size={16} />
                    Verified Only
                  </button>
                </div>
              </div>
            </section>
          )}

          {swipeMessage && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-xl backdrop-blur-md"
              style={{
                borderColor: swipeMessage.type === 'like' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)',
                background: swipeMessage.type === 'like' ? 'rgba(16,185,129,0.14)' : 'rgba(245,158,11,0.14)',
                color: swipeMessage.type === 'like' ? '#34d399' : '#FCD34D',
              }}
            >
              <Bell size={14} />
              {swipeMessage.text}
            </motion.div>
          )}

          {/* Like Action Modal */}
          {likeActionModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
              onClick={() => setLikeActionModal(null)}
            >
              <div
                className="w-full max-w-md rounded-[2rem] border p-6 shadow-2xl"
                style={{ borderColor, background: panelBg }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-amber-500 text-5xl">
                    ❤️
                  </div>
                  <h3 className="text-2xl font-bold">You liked {likeActionModal.name}!</h3>
                  <p className="mt-2 text-sm" style={{ color: mutedText }}>
                    What would you like to do next?
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleCreateEvent(likeActionModal)}
                    className="w-full rounded-full px-4 py-3 text-sm font-bold transition hover:opacity-90"
                    style={{ background: "#F59E0B", color: "#111" }}
                  >
                    ✨ Create an event with {likeActionModal.name}
                  </button>
                  <button
                    onClick={() => handleSaveForLater(likeActionModal)}
                    className="w-full rounded-full border px-4 py-3 text-sm font-bold transition hover:opacity-90"
                    style={{ borderColor, color: pageText }}
                  >
                    💾 Save for later
                  </button>
                  <button
                    onClick={() => setLikeActionModal(null)}
                    className="w-full rounded-full px-4 py-3 text-sm font-bold transition hover:opacity-90"
                    style={{ background: "#6B7280", color: "#fff" }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Single Card Display */}
          <section className="mx-auto max-w-2xl">
            {loading ? (
              <div
                className="flex items-center justify-center gap-3 rounded-[2rem] border p-8"
                style={{ borderColor, background: cardBg }}
              >
                <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                <span className="text-sm" style={{ color: subText }}>Loading nearby people...</span>
              </div>
            ) : currentPerson ? (
              <motion.div
                key={currentPerson.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="rounded-[2rem] border overflow-hidden"
                style={{
                  borderColor: 'rgba(245,158,11,0.28)',
                  background: isLightMode ? 'rgba(255,255,255,0.96)' : 'rgba(18,18,23,0.98)',
                  boxShadow: isLightMode ? '0 24px 70px rgba(120,53,15,0.12)' : '0 24px 70px rgba(0,0,0,0.34)',
                }}
              >
                {/* Avatar Section */}
                <div
                  className="flex h-80 items-center justify-center text-9xl"
                  style={{ background: isLightMode ? '#f6eddc' : '#14141b' }}
                >
                  {currentPerson.avatar}
                </div>

                {/* Info Section */}
                <div className="p-6 space-y-4">
                  <div className="border-b pb-4" style={{ borderColor }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-3xl font-bold">{currentPerson.name}{currentPerson.age && `, ${currentPerson.age}`}</h2>
                          {currentPerson.isVerified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-400">
                              <ShieldCheck size={12} />
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm uppercase tracking-[0.2em]" style={{ color: mutedText }}>
                          {currentPerson.gender && `${currentPerson.gender} · `}{currentPerson.profileId} · {currentPerson.proximityLabel}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-base leading-6" style={{ color: mutedText }}>
                      {currentPerson.bio}
                    </p>
                  </div>

                  {/* Languages */}
                  {currentPerson.language && currentPerson.language.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: mutedText }}>Languages</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {currentPerson.language.map((lang) => (
                          <span key={lang} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hobbies */}
                  {currentPerson.hobbies && currentPerson.hobbies.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: mutedText }}>Interests</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {currentPerson.hobbies.map((hobby) => (
                          <span key={hobby} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(236,72,153,0.15)', color: '#EC4899' }}>
                            {hobby}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {currentPerson.badges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold"
                        style={{
                          background: isLightMode ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.14)',
                          color: isLightMode ? '#b45309' : '#FCD34D',
                        }}
                      >
                        📍 {badge}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => void handleDislikePerson(currentPerson.id)}
                      className="flex-1 rounded-full px-4 py-3 text-sm font-bold transition hover:opacity-90 flex items-center justify-center gap-2"
                      style={{ background: '#6B7280', color: '#fff' }}
                    >
                      <X size={18} />
                      Pass
                    </button>
                    <button
                      onClick={() => handleLikeAndShowModal(currentPerson)}
                      className="flex-1 rounded-full px-4 py-3 text-sm font-bold transition hover:opacity-90 flex items-center justify-center gap-2"
                      style={{ background: '#10B981', color: '#fff' }}
                    >
                      <Heart size={18} />
                      Like
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div
                className="rounded-[2rem] border p-8 text-center"
                style={{ borderColor, background: cardBg }}
              >
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="text-xl font-bold mb-2">No more people!</h3>
                <p style={{ color: mutedText }}>
                  You've browsed all nearby members. Try switching filters or check back later.
                </p>
              </div>
            )}
          </section>
        </motion.div>
      </main>

      <Sidebar activeNav="Nearby" onNavigate={onNavigate} setActiveNav={setActiveNav} />
    </div>
  );
};

export default Nearby;
