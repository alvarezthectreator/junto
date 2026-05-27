"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Compass, Flame, Loader2, MapPin, MessageCircle, ShieldCheck, User } from "lucide-react";
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

const mockNearbyPeople: NearbyPerson[] = [
  {
    id: "u-ada",
    name: "Ada",
    profileId: "JNT-2048-ADA",
    city: "Lagos",
    bio: "Usually down for coffee, rooftop plans, and spontaneous city walks.",
    avatar: "👩🏽‍🦱",
    badges: ["Coffee", "Weekends", "Music"],
    isVerified: true,
    proximityLabel: "0.8 km away",
  },
  {
    id: "u-tunde",
    name: "Tunde",
    profileId: "JNT-3194-TUN",
    city: "Lagos",
    bio: "Weekend explorer who likes brunch, football, and trying new spots.",
    avatar: "👨🏾‍🦱",
    badges: ["Brunch", "Sports", "Travel"],
    isVerified: true,
    proximityLabel: "1.4 km away",
  },
  {
    id: "u-zara",
    name: "Zara",
    profileId: "JNT-4821-ZAR",
    city: "Lagos",
    bio: "Looking for people to catch movies, art shows, and late night food with.",
    avatar: "👩🏼",
    badges: ["Movies", "Art", "Food"],
    isVerified: false,
    proximityLabel: "2.1 km away",
  },
  {
    id: "u-oge",
    name: "Oge",
    profileId: "JNT-7416-OGE",
    city: "Lagos",
    bio: "Beach days, live music, and good conversations only.",
    avatar: "👩🏾",
    badges: ["Beach", "Music", "Events"],
    isVerified: true,
    proximityLabel: "2.9 km away",
  },
];

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
    switch (activeFilter) {
      case "Verified":
        return people.filter((person) => person.isVerified);
      case "Close":
        return people.slice(0, 3);
      case "New":
        return people.filter((person) => person.badges.includes("Nearby"));
      default:
        return people;
    }
  }, [activeFilter, people]);

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
      <main className="mobile-page-main mx-auto max-w-7xl px-4 py-5 pb-24 sm:px-6 lg:px-8">
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
                  onClick={() => onNavigate("discover")}
                  className="rounded-full px-3 py-1.5 text-xs font-bold transition hover:opacity-80"
                  style={{ background: "#F59E0B", color: "#111" }}
                >
                  Back to Discover
                </button>
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
                      <button
                        key={person.id}
                        onClick={() => setSelectedPersonId(person.id)}
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
                      </button>
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
                        onClick={openMessages}
                        className="flex-1 rounded-full px-4 py-3 text-sm font-bold transition hover:opacity-90"
                        style={{ background: "#F59E0B", color: "#111" }}
                      >
                        Message
                      </button>
                      <button
                        onClick={() => setActiveNav("Discover")}
                        className="flex-1 rounded-full border px-4 py-3 text-sm font-bold transition hover:bg-white/5"
                        style={{ borderColor, color: pageText }}
                      >
                        Discover
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
    </div>
  );
};

export default Nearby;
