import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  ChevronRight,
  Download,
  Edit2,
  HelpCircle,
  LogOut,
  MapPin,
  Moon,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  Trash2,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';

interface ProfileProps {
  onNavigate?: (page: string) => void;
  isLightMode?: boolean;
  onToggleLightMode?: () => void;
}

const quickTraits = ['Reliable', 'Great communicator', 'Brunch planner', 'Weekend explorer'];

export const Profile: React.FC<ProfileProps> = ({
  onNavigate = () => {},
  isLightMode = false,
  onToggleLightMode = () => {},
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Sarah Adeyemi',
    age: 26,
    bio: 'Adventure seeker, coffee lover, dog parent. Usually down for brunch, beach days, and spontaneous city plans.',
    interests: ['Hiking', 'Photography', 'Coffee', 'Art'],
    reliabilityScore: 92,
    isVerified: true,
    location: 'Lagos, Nigeria',
    photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'],
  });

  const stats = {
    outings: 24,
    hosted: 5,
    reviews: 18,
    rating: 4.7,
  };

  const pageClass = isLightMode ? 'bg-[#f7f3ea] text-[#241b10]' : 'bg-[#0F0F13] text-white';
  const mainGlowClass = isLightMode
    ? 'bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_26%),radial-gradient(circle_at_85%_15%,rgba(251,146,60,0.14),transparent_24%),linear-gradient(180deg,#f8f3e8_0%,#f6efe1_100%)]'
    : 'bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(251,146,60,0.12),transparent_22%),#0F0F13]';
  const sectionBorderClass = isLightMode ? 'border-yellow-700/20' : 'border-yellow-500/15';
  const bodyTextClass = isLightMode ? 'text-[#5e4d37]' : 'text-gray-300';
  const mutedTextClass = isLightMode ? 'text-[#8d7758]' : 'text-gray-400';
  const titleClass = isLightMode ? 'text-amber-700' : 'text-yellow-400';
  const heroCardClass = isLightMode
    ? 'border-amber-700/15 bg-gradient-to-br from-white via-[#f7f0e4] to-[#f1e3ce] shadow-[0_24px_80px_rgba(120,53,15,0.12)]'
    : 'border-yellow-500/18 bg-gradient-to-br from-[#1a1712] via-[#141419] to-black shadow-[0_24px_80px_rgba(0,0,0,0.28)]';
  const heroTopClass = isLightMode
    ? 'border-b border-amber-800/10 bg-[linear-gradient(115deg,rgba(251,191,36,0.28),rgba(245,158,11,0.18)),radial-gradient(circle_at_top_left,rgba(255,255,255,0.7),transparent_24%),#f4ead9]'
    : 'border-b border-white/8 bg-[linear-gradient(115deg,rgba(245,158,11,0.42),rgba(120,53,15,0.5)),radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_26%),#18181d]';
  const borderSoftClass = isLightMode ? 'border-black/8' : 'border-white/10';
  const surfaceClass = isLightMode ? 'bg-white/80' : 'bg-black/25';
  const inputClass = isLightMode
    ? 'border-black/10 bg-white/90 text-[#241b10] placeholder:text-[#9b886c] focus:border-amber-500/40'
    : 'border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-yellow-500/40';
  const pillClass = isLightMode
    ? 'border-black/8 bg-white/75 text-[#4b3b28]'
    : 'border-white/10 bg-white/[0.04] text-gray-200';
  const strengthCardClass = isLightMode
    ? 'border-amber-800/10 bg-amber-100/70'
    : 'border-yellow-500/15 bg-yellow-500/[0.06]';
  const panelClass = isLightMode
    ? 'border-amber-800/12 bg-gradient-to-br from-white via-[#fbf7ef] to-[#f3e7d5] shadow-[0_18px_40px_rgba(120,53,15,0.10)]'
    : 'border-yellow-500/15 bg-gradient-to-br from-white/[0.035] via-black/45 to-black/70 shadow-[0_18px_40px_rgba(0,0,0,0.16)]';
  const accentCopyClass = isLightMode ? 'text-amber-700/80' : 'text-yellow-400/75';
  const panelTitleClass = isLightMode ? 'text-amber-700' : 'text-yellow-300';
  const innerCardClass = isLightMode ? 'border-black/8 bg-[#fffaf2]' : 'border-white/8 bg-black/20';
  const interestPillClass = isLightMode
    ? 'border-amber-700/15 bg-amber-100 text-amber-800'
    : 'border-amber-500/20 bg-amber-500/10 text-amber-200';
  const galleryCardClass = isLightMode ? 'border-black/8 bg-white/80' : 'border-white/10 bg-white/5';
  const addPhotoClass = isLightMode
    ? 'border-amber-700/20 bg-amber-50 text-amber-700 hover:bg-amber-100'
    : 'border-yellow-500/30 bg-yellow-500/5 text-yellow-300 hover:bg-yellow-500/10';
  const settingsButtonClass = isLightMode
    ? 'border-black/10 bg-white/75 text-[#6b5539] hover:bg-white hover:text-[#241b10]'
    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white';
  const previewStripeClass = isLightMode
    ? 'border-amber-700/15 bg-amber-100/70'
    : 'border-yellow-500/15 bg-yellow-500/[0.05]';

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${pageClass}`}>
      <div className="relative z-50">
        <Sidebar activeNav="" setActiveNav={() => {}} onNavigate={onNavigate} />
      </div>

      <main className="mobile-page-main relative ml-64 flex-1 overflow-hidden">
        <div className={`absolute inset-0 transition-colors duration-300 ${mainGlowClass}`} />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative pb-20"
        >
          <section className={`border-b px-6 py-8 md:px-10 ${sectionBorderClass}`}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.35em] ${accentCopyClass}`}>
                  Profile
                </p>
                <h1 className={`text-4xl font-serif font-bold tracking-tight md:text-5xl ${titleClass}`}>
                  A polished first impression, before the first meetup.
                </h1>
                <p className={`mt-4 max-w-2xl text-base md:text-lg ${bodyTextClass}`}>
                  Keep your identity, trust signals, and personality details sharp and easy to scan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={onToggleLightMode}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition ${settingsButtonClass}`}
                >
                  {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
                  {isLightMode ? 'Dark mode' : 'Light mode'}
                </button>
                <button className={`rounded-full border p-3 transition ${settingsButtonClass}`}>
                  <Settings size={20} />
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  <span className="inline-flex items-center gap-2">
                    <Edit2 size={16} />
                    {isEditing ? 'Save profile' : 'Edit profile'}
                  </span>
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:gap-6 px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10 xl:grid-cols-[1.45fr_0.8fr] grid-cols-1">
            <div className="space-y-4 sm:space-y-6 w-full min-w-0">
              <div className={`overflow-hidden rounded-2xl sm:rounded-3xl border transition-colors duration-300 ${heroCardClass}`}>
                <div className={`relative h-36 sm:h-40 md:h-44 overflow-hidden ${heroTopClass}`}>
                  <div className="absolute inset-0 opacity-50 bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.05),transparent)]" />
                </div>

                <div className="relative px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="flex flex-col gap-6 sm:gap-8 xl:flex-row xl:items-end xl:justify-between">
                    <div className="-mt-12 sm:-mt-14 flex flex-1 flex-col items-start min-w-0">
                      <div className="relative">
                        <div
                          className={`h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-2xl sm:rounded-[1.75rem] border-4 shadow-xl ${isLightMode ? 'border-[#f7f3ea] bg-white shadow-amber-900/10' : 'border-[#0F0F13] bg-[#1b1b22] shadow-black/30'}`}
                        >
                          <img
                            src={profile.photos[0]}
                            alt={profile.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        {isEditing && (
                          <button
                            className={`absolute bottom-0 right-0 sm:bottom-1 sm:right-1 rounded-full p-1.5 sm:p-2 transition ${isLightMode ? 'bg-white text-amber-700 hover:bg-amber-50' : 'bg-black/75 text-yellow-300 hover:bg-black'}`}
                          >
                            <Camera size={14} className="sm:w-4 sm:h-4" />
                          </button>
                        )}
                      </div>

                      <div className="mt-3 sm:mt-4 w-full min-w-0">
                        {isEditing ? (
                          <div className="space-y-2 sm:space-y-3">
                            <input
                              type="text"
                              value={profile.name}
                              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                              className={`w-full rounded-xl sm:rounded-2xl border px-3 sm:px-4 py-2 sm:py-3 text-lg sm:text-2xl font-bold outline-none transition ${inputClass}`}
                            />
                            <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row">
                              <input
                                type="number"
                                value={profile.age}
                                onChange={(e) =>
                                  setProfile({ ...profile, age: Number.parseInt(e.target.value || '0', 10) })
                                }
                                className={`w-20 sm:w-24 rounded-xl sm:rounded-2xl border px-3 sm:px-4 py-2 sm:py-3 outline-none transition ${inputClass}`}
                                max="99"
                              />
                              <input
                                type="text"
                                value={profile.location}
                                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                className={`flex-1 rounded-xl sm:rounded-2xl border px-3 sm:px-4 py-2 sm:py-3 outline-none transition ${inputClass}`}
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight break-words ${isLightMode ? 'text-[#241b10]' : 'text-white'}`}>
                                {profile.name}, {profile.age}
                              </h2>
                              {profile.isVerified && (
                                <span className="inline-flex items-center gap-1 sm:gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-green-300 flex-shrink-0">
                                  <ShieldCheck size={12} className="sm:w-[14px] sm:h-[14px]" />
                                  Verified
                                </span>
                              )}
                            </div>
                            <p className={`mt-2 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${bodyTextClass} break-words`}>
                              <MapPin size={14} className={`sm:w-4 sm:h-4 flex-shrink-0 ${isLightMode ? 'text-amber-700' : 'text-amber-300'}`} />
                              {profile.location}
                            </p>
                            <p className={`mt-2 sm:mt-4 max-w-xl text-xs sm:text-sm leading-6 sm:leading-7 ${bodyTextClass}`}>
                              {profile.bio}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:w-[320px] w-full sm:w-auto">
                      <MiniStat value={stats.outings} label="Outings" accent="text-yellow-600" lightMode={isLightMode} />
                      <MiniStat value={stats.hosted} label="Hosted" accent="text-amber-600" lightMode={isLightMode} />
                      <MiniStat value={`★ ${stats.rating}`} label={`${stats.reviews} reviews`} accent="text-yellow-700" lightMode={isLightMode} />
                      <MiniStat value={`${profile.reliabilityScore}%`} label="Reliability" accent="text-green-600" lightMode={isLightMode} />
                    </div>
                  </div>

                  <div className={`mt-4 sm:mt-6 grid gap-3 sm:gap-4 border-t pt-4 sm:pt-6 lg:grid-cols-[1.2fr_0.8fr] ${isLightMode ? 'border-black/8' : 'border-white/8'}`}>
                    <div className="flex flex-wrap gap-2">
                      {quickTraits.map((trait) => (
                        <span key={trait} className={`rounded-full border px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium ${pillClass}`}>
                          {trait}
                        </span>
                      ))}
                    </div>
                    <div className={`rounded-2xl sm:rounded-[1.4rem] border p-3 sm:p-4 ${strengthCardClass}`}>
                      <p className={`text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] ${isLightMode ? 'text-amber-700/80' : 'text-yellow-300/80'}`}>
                        Profile strength
                      </p>
                      <div className={`mt-3 h-2 overflow-hidden rounded-full ${isLightMode ? 'bg-black/8' : 'bg-white/10'}`}>
                        <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-yellow-400 to-amber-500" />
                      </div>
                      <p className={`mt-3 text-sm ${bodyTextClass}`}>
                        Strong trust profile with verified identity, clear photos, and consistent reviews.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <PanelCard
                eyebrow="About you"
                title="What people should know"
                description="Clear details make your profile feel intentional, trustworthy, and easy to say yes to."
                lightMode={isLightMode}
              >
                {isEditing ? (
                  <div className="space-y-4">
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      className={`w-full rounded-[1.5rem] border px-4 py-4 text-sm outline-none transition ${inputClass}`}
                      rows={4}
                      placeholder="Tell people what you're into..."
                    />
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest) => (
                        <span key={interest} className={`rounded-full border px-3 py-2 text-xs ${interestPillClass}`}>
                          {interest} x
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Add interest..."
                        className={`rounded-full border px-4 py-2 text-xs outline-none transition ${inputClass}`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                    <div>
                      <p className={`text-sm leading-7 ${bodyTextClass}`}>{profile.bio}</p>
                    </div>
                    <div className={`rounded-[1.4rem] border p-4 ${innerCardClass}`}>
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isLightMode ? 'text-[#8d7758]' : 'text-gray-500'}`}>
                        Interests
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {profile.interests.map((interest) => (
                          <span key={interest} className={`rounded-full border px-3 py-2 text-xs font-medium ${interestPillClass}`}>
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </PanelCard>

              <PanelCard
                eyebrow="Gallery"
                title="Photos that set the tone"
                description="Show enough personality that people can imagine the kind of hangout they'd have with you."
                lightMode={isLightMode}
              >
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {profile.photos.map((photo, idx) => (
                    <div key={idx} className={`overflow-hidden rounded-[1.5rem] border ${galleryCardClass}`}>
                      <img
                        src={photo}
                        alt={`Profile photo ${idx + 1}`}
                        className="aspect-square w-full object-cover transition hover:scale-[1.02]"
                      />
                    </div>
                  ))}
                  {isEditing && (
                    <button
                      className={`flex aspect-square items-center justify-center rounded-[1.5rem] border border-dashed transition ${addPhotoClass}`}
                    >
                      <Camera size={24} />
                    </button>
                  )}
                </div>
              </PanelCard>
            </div>

            <aside className="space-y-6">
              <PanelCard
                eyebrow="Appearance"
                title="Theme controls"
                description="Switch the app between the default dark look and a light interface."
                lightMode={isLightMode}
              >
                <button
                  onClick={onToggleLightMode}
                  className={`flex w-full items-center justify-between rounded-[1.5rem] border px-5 py-4 text-left transition ${
                    isLightMode
                      ? 'border-amber-700/15 bg-amber-100/70 text-amber-900 hover:bg-amber-100'
                      : 'border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full ${
                        isLightMode ? 'bg-white text-amber-700' : 'bg-yellow-500/15 text-yellow-300'
                      }`}
                    >
                      {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
                    </div>
                    <div>
                      <p className={`font-semibold ${isLightMode ? 'text-[#241b10]' : 'text-white'}`}>
                        {isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
                      </p>
                      <p className={`mt-1 text-sm ${isLightMode ? 'text-[#8d7758]' : 'text-gray-400'}`}>
                        Turns black backgrounds light and flips white text darker across the app.
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="opacity-60" />
                </button>
              </PanelCard>

              <PanelCard
                eyebrow="Trust signals"
                title="Trust at a glance"
                description="The details below help other members understand that you are real, responsive, and easy to plan with."
                lightMode={isLightMode}
              >
                <div className="space-y-4">
                  <TrustRow
                    icon={<ShieldCheck size={18} />}
                    title="Identity verified"
                    text="Your account checks out, which gives hosts and guests extra confidence."
                    accent="text-green-600"
                    bg={isLightMode ? 'bg-green-100' : 'bg-green-500/10'}
                    lightMode={isLightMode}
                  />
                  <TrustRow
                    icon={<Star size={18} />}
                    title={`${stats.rating} average rating`}
                    text={`${stats.reviews} reviews from people you've gone out with.`}
                    accent={isLightMode ? 'text-yellow-700' : 'text-yellow-300'}
                    bg={isLightMode ? 'bg-yellow-100' : 'bg-yellow-500/10'}
                    lightMode={isLightMode}
                  />
                  <TrustRow
                    icon={<MapPin size={18} />}
                    title="Lagos local"
                    text="Your location helps nearby people discover and trust your plans faster."
                    accent={isLightMode ? 'text-amber-700' : 'text-amber-300'}
                    bg={isLightMode ? 'bg-amber-100' : 'bg-amber-500/10'}
                    lightMode={isLightMode}
                  />
                </div>
              </PanelCard>

              <PanelCard
                eyebrow="Preview"
                title="How others see you"
                description="A compact view of the signals most people scan before joining a plan."
                lightMode={isLightMode}
              >
                <div className={`rounded-[1.5rem] border p-4 ${innerCardClass}`}>
                  <div className="flex items-center gap-4">
                    <img
                      src={profile.photos[0]}
                      alt={profile.name}
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`truncate font-semibold ${isLightMode ? 'text-[#241b10]' : 'text-white'}`}>{profile.name}</p>
                        {profile.isVerified && <ShieldCheck size={14} className="text-green-500" />}
                      </div>
                      <p className={`mt-1 text-sm ${mutedTextClass}`}>{profile.location}</p>
                    </div>
                  </div>
                  <p className={`mt-4 text-sm leading-6 ${bodyTextClass}`}>
                    Friendly, reliable, and usually up for well-planned city hangouts.
                  </p>
                  <div className={`mt-4 flex items-center justify-between rounded-[1rem] border px-4 py-3 ${previewStripeClass}`}>
                    <span className={`text-sm ${bodyTextClass}`}>Reliability score</span>
                    <span className={isLightMode ? 'font-semibold text-amber-700' : 'font-semibold text-yellow-300'}>
                      {profile.reliabilityScore}%
                    </span>
                  </div>
                </div>
              </PanelCard>

              <PanelCard
                eyebrow="Account"
                title="Manage your profile"
                description="Support, exports, and account actions all in one spot."
                lightMode={isLightMode}
              >
                <div className="space-y-3">
                  <ActionRow icon={<HelpCircle size={18} />} label="Help & Support" lightMode={isLightMode} />
                  <ActionRow icon={<Download size={18} />} label="Export My Data" lightMode={isLightMode} />
                  <ActionRow icon={<Trash2 size={18} />} label="Delete Account" danger lightMode={isLightMode} />
                  <ActionRow icon={<LogOut size={18} />} label="Log Out" subtle lightMode={isLightMode} />
                </div>
              </PanelCard>
            </aside>
          </section>
        </motion.div>
      </main>
    </div>
  );
};

function MiniStat({
  value,
  label,
  accent,
  lightMode,
}: {
  value: string | number;
  label: string;
  accent: string;
  lightMode: boolean;
}) {
  return (
    <div
      className={`rounded-[1.35rem] border p-4 text-center backdrop-blur-sm ${
        lightMode ? 'border-black/8 bg-white/75' : 'border-white/10 bg-black/25'
      }`}
    >
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className={`mt-1 text-xs uppercase tracking-[0.18em] ${lightMode ? 'text-[#8d7758]' : 'text-gray-500'}`}>
        {label}
      </p>
    </div>
  );
}

function PanelCard({
  eyebrow,
  title,
  description,
  children,
  lightMode,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  lightMode: boolean;
}) {
  return (
    <div
      className={`rounded-[2rem] border p-6 transition-colors duration-300 ${
        lightMode
          ? 'border-amber-800/12 bg-gradient-to-br from-white via-[#fbf7ef] to-[#f3e7d5] shadow-[0_18px_40px_rgba(120,53,15,0.10)]'
          : 'border-yellow-500/15 bg-gradient-to-br from-white/[0.035] via-black/45 to-black/70 shadow-[0_18px_40px_rgba(0,0,0,0.16)]'
      }`}
    >
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${lightMode ? 'text-amber-700/80' : 'text-yellow-400/75'}`}>
        {eyebrow}
      </p>
      <h3 className={`mt-3 text-2xl font-serif font-semibold ${lightMode ? 'text-amber-700' : 'text-yellow-300'}`}>
        {title}
      </h3>
      <p className={`mt-2 text-sm ${lightMode ? 'text-[#8d7758]' : 'text-gray-400'}`}>{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function TrustRow({
  icon,
  title,
  text,
  accent,
  bg,
  lightMode,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  accent: string;
  bg: string;
  lightMode: boolean;
}) {
  return (
    <div className={`flex gap-4 rounded-[1.4rem] border p-4 ${lightMode ? 'border-black/8 bg-white/70' : 'border-white/8 bg-black/20'}`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${bg} ${accent}`}>
        {icon}
      </div>
      <div>
        <p className={`font-semibold ${lightMode ? 'text-[#241b10]' : 'text-white'}`}>{title}</p>
        <p className={`mt-1 text-sm leading-6 ${lightMode ? 'text-[#8d7758]' : 'text-gray-400'}`}>{text}</p>
      </div>
    </div>
  );
}

function ActionRow({
  icon,
  label,
  danger = false,
  subtle = false,
  lightMode,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  subtle?: boolean;
  lightMode: boolean;
}) {
  const tone = danger
    ? lightMode
      ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
      : 'border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/15'
    : subtle
      ? lightMode
        ? 'border-black/8 bg-white/75 text-[#6b5539] hover:bg-white'
        : 'border-white/8 bg-white/[0.03] text-gray-300 hover:bg-white/[0.05]'
      : lightMode
        ? 'border-black/8 bg-white/75 text-[#241b10] hover:bg-white'
        : 'border-white/8 bg-white/[0.03] text-white hover:bg-white/[0.05]';

  return (
    <button className={`flex w-full items-center gap-3 rounded-[1.25rem] border px-4 py-4 text-left transition ${tone}`}>
      {icon}
      <span className="text-sm font-medium">{label}</span>
      <ChevronRight size={16} className="ml-auto text-current opacity-50" />
    </button>
  );
}

export default Profile;
