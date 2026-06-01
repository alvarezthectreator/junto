"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Compass, Flame, Loader2, MapPin, MessageCircle, ShieldCheck, User, Heart, X } from "lucide-react";
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
  const [selectedPersonId, setSelectedPersonId] = useState<string>(mockNearbyPeople[0].id);
  const [likedUserIds, setLikedUserIds] = useState<Set<string>>(new Set());
  const [dislikedUserIds, setDislikedUserIds] = useState<Set<string>>(new Set());
  const [swipeMessage, setSwipeMessage] = useState<{ text: string; type: 'like' | 'dislike' } | null>(null);
  const [matchPerson, setMatchPerson] = useState<NearbyPerson | null>(null);

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
          setSelectedPersonId((apiPeople[0] || mockNearbyPeople[0]).id);
        }
      } catch (error) {
        console.error("Failed to fetch nearby people:", error);
        if (mounted) {
          setPeople(mockNearbyPeople);
          setSelectedPersonId(mockNearbyPeople[0].id);
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
    
    switch (activeFilter) {
      case "Verified":
        return filtered.filter((person) => person.isVerified);
      case "Close":
        return filtered.slice(0, 3);
      case "New":
        return filtered.filter((person) => person.badges.includes("Nearby"));
      default:
        return filtered;
    }
  }, [activeFilter, people, dislikedUserIds, likedUserIds]);

  const swipeDeck = useMemo(() => filteredPeople.slice(0, 3), [filteredPeople]);
  const activeSwipePerson = swipeDeck[0];

  useEffect(() => {
    if (!filteredPeople.some((person) => person.id === selectedPersonId)) {
      setSelectedPersonId(filteredPeople[0]?.id || people[0]?.id || "");
    }
  }, [filteredPeople, people, selectedPersonId]);

  const selectedPerson =
    filteredPeople.find((person) => person.id === selectedPersonId) || filteredPeople[0] || people[0];

  const openMessages = () => {
    setActiveNav("Messages");
    onNavigate("main");
  };

  const handleLikePerson = async (personId: string) => {
    if (!currentUser?.id) return;
    
    try {
      const newLiked = new Set(likedUserIds);
      newLiked.add(personId);
      setLikedUserIds(newLiked);
      setSwipeMessage({ text: `❤️ Liked ${people.find(p => p.id === personId)?.name}!`, type: 'like' });
      
      const response = await API.swipeUser(currentUser.id, personId, 'right');
      if (response?.match) {
        const matched = people.find((person) => person.id === personId) || null;
        setMatchPerson(matched);
      }
      
      setTimeout(() => setSwipeMessage(null), 2000);
    } catch (error) {
      console.error('Failed to like user:', error);
      const newLiked = new Set(likedUserIds);
      newLiked.delete(personId);
      setLikedUserIds(newLiked);
    }
  };

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
                  <span className="italic text-amber-500"> before anything else.</span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: mutedText }}>
                  We removed the map and brought the actual registered people to the front. Browse
                  who is close, verified, and ready to connect.
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
              </div>
            </div>
          </section>

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

          {matchPerson && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
              onClick={() => setMatchPerson(null)}
            >
              <div
                className="w-full max-w-md rounded-[2rem] border p-6 shadow-2xl"
                style={{ borderColor, background: panelBg }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500 text-4xl">
                    ❤️
                  </div>
                  <p className="text-xs uppercase tracking-[0.24em]" style={{ color: mutedText }}>
                    It&apos;s a match
                  </p>
                  <h3 className="mt-2 text-2xl font-bold">{matchPerson.name}</h3>
                  <p className="mt-2 text-sm" style={{ color: mutedText }}>
                    You both liked each other. Start the conversation while the energy is fresh.
                  </p>
                </div>

                <div className="mt-5 rounded-2xl p-4" style={{ background: isLightMode ? "#fff" : "#14141b" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: isLightMode ? "#f4ead7" : "#1f1f28", color: pageText }}>
                      {matchPerson.avatar}
                    </div>
                    <div>
                      <p className="font-bold">{matchPerson.name}</p>
                      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: mutedText }}>
                        {matchPerson.profileId}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setMatchPerson(null)}
                    className="flex-1 rounded-full border px-4 py-3 text-sm font-bold transition hover:opacity-90"
                    style={{ borderColor, color: pageText }}
                  >
                    Keep Browsing
                  </button>
                  <button
                    onClick={() => {
                      setMatchPerson(null);
                      openMessages();
                    }}
                    className="flex-1 rounded-full px-4 py-3 text-sm font-bold transition hover:opacity-90"
                    style={{ background: "#F59E0B", color: "#111" }}
                  >
                    Message now
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <section className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
            <div
              style={{
                border: `1px solid ${borderColor}`,
                background: cardBg,
                boxShadow: isLightMode ? "0 18px 50px rgba(120,53,15,0.08)" : "0 18px 50px rgba(0,0,0,0.3)",
              }}
              className="rounded-[2rem] p-4 sm:p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <User size={16} color="#F59E0B" />
                  <h2 className="text-lg font-bold">People close to you</h2>
                </div>
                <button
                  onClick={() => {
                    setActiveNav("Discover");
                    onNavigate("main");
                  }}
                  className="rounded-full px-3 py-1.5 text-xs font-bold transition hover:opacity-80"
                  style={{ background: "#F59E0B", color: "#111" }}
                >
                  Back to Discover
                </button>
              </div>

              <div
                className="mb-5 rounded-[1.75rem] border p-4"
                style={{ borderColor, background: panelBg }}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em]" style={{ color: mutedText }}>
                      Swipe deck
                    </p>
                    <h3 className="text-lg font-bold">Drag left or right to decide</h3>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ background: 'rgba(245,158,11,0.12)', color: isLightMode ? '#b45309' : '#FCD34D' }}
                  >
                    {swipeDeck.length} cards left
                  </span>
                </div>

                {activeSwipePerson ? (
                  <div className="relative mx-auto flex min-h-[440px] w-full max-w-md items-center justify-center">
                    {swipeDeck.slice(1).map((person, index) => (
                      <div
                        key={person.id}
                        className="absolute inset-x-0 mx-auto rounded-[2rem] border p-4"
                        style={{
                          maxWidth: '26rem',
                          borderColor,
                          background: isLightMode ? 'rgba(255,255,255,0.92)' : 'rgba(26,26,33,0.88)',
                          transform: `translateY(${(index + 1) * 12}px) scale(${0.96 - index * 0.03})`,
                          opacity: 0.55 - index * 0.08,
                          zIndex: 10 - index,
                        }}
                      >
                        <div className="overflow-hidden rounded-[1.5rem]" style={{ background: isLightMode ? '#f6eddc' : '#14141b' }}>
                          <div className="flex h-56 items-center justify-center text-6xl">
                            {person.avatar}
                          </div>
                          <div className="space-y-2 border-t p-4" style={{ borderColor }}>
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h4 className="text-lg font-bold">{person.name}</h4>
                                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: mutedText }}>
                                  {person.profileId}
                                </p>
                              </div>
                              <span
                                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                style={{ background: 'rgba(245,158,11,0.12)', color: isLightMode ? '#b45309' : '#FCD34D' }}
                              >
                                {person.proximityLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <motion.div
                      key={activeSwipePerson.id}
                      drag="x"
                      dragElastic={0.18}
                      dragMomentum={false}
                      onDragEnd={(_, info) => {
                        if (info.offset.x > 120) {
                          void handleLikePerson(activeSwipePerson.id);
                        } else if (info.offset.x < -120) {
                          void handleDislikePerson(activeSwipePerson.id);
                        }
                      }}
                      className="relative z-20 w-full max-w-md rounded-[2rem] border p-4 shadow-2xl"
                      style={{
                        borderColor: 'rgba(245,158,11,0.28)',
                        background: isLightMode ? 'rgba(255,255,255,0.96)' : 'rgba(18,18,23,0.98)',
                        boxShadow: isLightMode ? '0 24px 70px rgba(120,53,15,0.12)' : '0 24px 70px rgba(0,0,0,0.34)',
                      }}
                    >
                      <div className="overflow-hidden rounded-[1.5rem]" style={{ background: isLightMode ? '#f6eddc' : '#14141b' }}>
                        <div className="flex h-64 items-center justify-center text-7xl">
                          {activeSwipePerson.avatar}
                        </div>
                        <div className="border-t p-4" style={{ borderColor }}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-2xl font-bold">{activeSwipePerson.name}</h3>
                                {activeSwipePerson.isVerified && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-400">
                                    <ShieldCheck size={12} />
                                    Verified
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs uppercase tracking-[0.2em]" style={{ color: mutedText }}>
                                {activeSwipePerson.profileId} · {activeSwipePerson.city}
                              </p>
                            </div>
                            <span
                              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                              style={{ background: 'rgba(245,158,11,0.12)', color: isLightMode ? '#b45309' : '#FCD34D' }}
                            >
                              {activeSwipePerson.proximityLabel}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-6" style={{ color: mutedText }}>
                            {activeSwipePerson.bio}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {activeSwipePerson.badges.map((badge) => (
                              <span
                                key={badge}
                                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                style={{
                                  background: isLightMode ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.06)',
                                  color: pageText,
                                }}
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <button
                          onClick={() => void handleDislikePerson(activeSwipePerson.id)}
                          className="rounded-full px-4 py-3 text-sm font-bold transition hover:opacity-90"
                          style={{ background: '#6B7280', color: '#fff' }}
                        >
                          Pass
                        </button>
                        <button
                          onClick={() => {
                            void handleLikePerson(activeSwipePerson.id);
                          }}
                          className="rounded-full px-4 py-3 text-sm font-bold transition hover:opacity-90"
                          style={{ background: '#10B981', color: '#fff' }}
                        >
                          Like
                        </button>
                        <button
                          onClick={openMessages}
                          className="rounded-full px-4 py-3 text-sm font-bold transition hover:opacity-90"
                          style={{ background: '#F59E0B', color: '#111' }}
                        >
                          Message
                        </button>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border p-5 text-sm" style={{ borderColor, color: mutedText }}>
                    No more people in this filter. Try switching tabs or come back later.
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-5 text-sm" style={{ color: subText }}>
                  <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  Loading nearby people...
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredPeople.map((person) => {
                    const selected = selectedPerson?.id === person.id;
                    return (
                    <div
                      role="button"
                      tabIndex={0}
                      key={person.id}
                      onClick={() => setSelectedPersonId(person.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedPersonId(person.id);
                        }
                      }}
                      className="w-full rounded-[1.5rem] border p-4 text-left transition hover:translate-y-[-1px]"
                      style={{
                        borderColor: selected ? "rgba(245,158,11,0.45)" : borderColor,
                        background: selected ? "rgba(245,158,11,0.10)" : panelBg,
                      }}
                    >
                        <div className="flex items-start gap-4">
                          <div
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black"
                            style={{
                              background: selected ? "#F59E0B" : isLightMode ? "#f4ead7" : "#1f1f28",
                              color: selected ? "#111" : pageText,
                            }}
                          >
                            {person.avatar}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold">{person.name}</h3>
                              {person.isVerified && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-400">
                                  <ShieldCheck size={12} />
                                  Verified
                                </span>
                              )}
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold"
                                style={{ background: "rgba(245,158,11,0.12)", color: isLightMode ? "#b45309" : "#FCD34D" }}
                              >
                                  <MapPin size={12} />
                                  {person.proximityLabel}
                                </span>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleLikePerson(person.id);
                                }}
                                disabled={likedUserIds.has(person.id)}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition hover:opacity-90 disabled:opacity-50"
                                style={{ 
                                  background: likedUserIds.has(person.id) ? "#EF4444" : "#10B981",
                                  color: "#fff" 
                                }}
                              >
                                <Heart size={12} fill={likedUserIds.has(person.id) ? "#fff" : "none"} />
                                Like
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDislikePerson(person.id);
                                }}
                                disabled={dislikedUserIds.has(person.id)}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition hover:opacity-90 disabled:opacity-50"
                                style={{ 
                                  background: dislikedUserIds.has(person.id) ? "#6B7280" : "#F59E0B",
                                  color: "#111" 
                                }}
                              >
                                <X size={12} />
                                Pass
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openMessages();
                                }}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition hover:opacity-90"
                                style={{ background: "#F59E0B", color: "#111" }}
                              >
                                <MessageCircle size={12} />
                                Message
                              </button>
                            </div>

                            <p className="mt-1 text-xs uppercase tracking-[0.2em]" style={{ color: mutedText }}>
                              {person.profileId} · {person.city}
                            </p>

                            <p className="mt-3 text-sm leading-6" style={{ color: mutedText }}>
                              {person.bio}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {person.badges.map((badge) => (
                                <span
                                  key={badge}
                                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                  style={{
                                    background: isLightMode ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.06)",
                                    color: pageText,
                                  }}
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                            </div>
                        </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>

            <div
              style={{
                border: `1px solid ${borderColor}`,
                background: cardBg,
                boxShadow: isLightMode ? "0 18px 50px rgba(120,53,15,0.08)" : "0 18px 50px rgba(0,0,0,0.3)",
              }}
              className="rounded-[2rem] p-4 sm:p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <Compass size={16} color="#F59E0B" />
                <h2 className="text-lg font-bold">Close To You</h2>
              </div>

              {selectedPerson ? (
                <div
                  className="overflow-hidden rounded-[1.5rem] border"
                  style={{ borderColor, background: panelBg }}
                >
                  <div className="flex items-center justify-between gap-3 border-b px-4 py-4" style={{ borderColor }}>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: mutedText }}>
                        Selected member
                      </p>
                      <h3 className="truncate text-xl font-bold">{selectedPerson.name}</h3>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-lg font-black text-black">
                      {selectedPerson.avatar}
                    </div>
                  </div>

                  <div className="space-y-4 px-4 py-4">
                    <p className="text-sm leading-6" style={{ color: mutedText }}>
                      {selectedPerson.bio}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPerson.badges.map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{
                            background: isLightMode ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.14)",
                            color: isLightMode ? "#b45309" : "#FCD34D",
                          }}
                        >
                          {badge}
                        </span>
                      ))}
                    </div>

                    <div className="rounded-2xl p-4" style={{ background: isLightMode ? "#fff" : "#14141b" }}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: mutedText }}>
                            Profile ID
                          </p>
                          <p className="mt-1 font-mono text-sm">{selectedPerson.profileId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: mutedText }}>
                            Nearby
                          </p>
                          <p className="mt-1 text-sm font-semibold">{selectedPerson.proximityLabel}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleLikePerson(selectedPerson.id)}
                        disabled={likedUserIds.has(selectedPerson.id)}
                        className="flex-1 rounded-full px-4 py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: likedUserIds.has(selectedPerson.id) ? "#EF4444" : "#10B981", color: "#fff" }}
                      >
                        <Heart size={16} fill={likedUserIds.has(selectedPerson.id) ? "#fff" : "none"} />
                        Like
                      </button>
                      <button
                        onClick={() => handleDislikePerson(selectedPerson.id)}
                        disabled={dislikedUserIds.has(selectedPerson.id)}
                        className="flex-1 rounded-full px-4 py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: dislikedUserIds.has(selectedPerson.id) ? "#6B7280" : "#F59E0B", color: "#111" }}
                      >
                        <X size={16} />
                        Pass
                      </button>
                      <button
                        onClick={openMessages}
                        className="flex-1 rounded-full px-4 py-3 text-sm font-bold transition hover:opacity-90"
                        style={{ background: "#F59E0B", color: "#111" }}
                      >
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.5rem] border p-5 text-sm" style={{ borderColor, color: mutedText }}>
                  No nearby people found right now.
                </div>
              )}
            </div>
          </section>
        </motion.div>
      </main>

      <Sidebar activeNav="Nearby" onNavigate={onNavigate} setActiveNav={setActiveNav} />
    </div>
  );
};

export default Nearby;
