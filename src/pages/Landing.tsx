import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  ArrowUpRight,
  Instagram,
  Twitter,
  Youtube,
  Music2,
  Apple,
  Play,
  X,
  Heart,
  Mail,
  Lock,
  Eye,
  EyeOff } from
'lucide-react';

interface LandingProps {
  onEnter: () => void;
  onLogin?: (email: string, password: string) => void;
}
const MOSAIC_IMAGES = [
{
  url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400',
  name: 'Ada 22'
},
{
  url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
  name: 'Oge 24'
},
{
  url: 'https://images.unsplash.com/photo-1533777324565-a040eb52facd?w=400',
  name: 'Kemi 25'
},
{
  url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
  name: 'Tunde 28'
},
{
  url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
  name: 'Zara 23'
},
{
  url: 'https://images.unsplash.com/photo-1571266028243-d220bc1c8d1f?w=400',
  name: 'Chidi 26'
},
{
  url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  name: 'Sarah 21'
},
{
  url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
  name: 'Joy 24'
},
{
  url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
  name: 'David 27'
},
{
  url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400',
  name: 'Amara 22'
},
{
  url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
  name: 'Michael 25'
},
{
  url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
  name: 'Nia 23'
},
// Repeat some to fill the grid
{
  url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400',
  name: 'Ada 22'
},
{
  url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
  name: 'Oge 24'
},
{
  url: 'https://images.unsplash.com/photo-1533777324565-a040eb52facd?w=400',
  name: 'Kemi 25'
},
{
  url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
  name: 'Tunde 28'
},
{
  url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
  name: 'Zara 23'
},
{
  url: 'https://images.unsplash.com/photo-1571266028243-d220bc1c8d1f?w=400',
  name: 'Chidi 26'
},
{
  url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  name: 'Sarah 21'
},
{
  url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
  name: 'Joy 24'
}];

const STORIES = [
{
  title: 'Ada & Bayo',
  excerpt:
  "We matched on Junto for a movie night. Three months later we're inseparable.",
  image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600'
},
{
  title: 'Femi & Ngozi',
  excerpt:
  'Met through a beach day post in Lagos. Now we travel everywhere together.',
  image: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=600'
},
{
  title: 'Layla & Kai',
  excerpt:
  'A random brunch tag-along turned into a business partnership. Funny how vibes work.',
  image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600'
},
{
  title: 'Sade & Tomi',
  excerpt: 'My gym buddy from Junto became my maid of honor last year. Wild.',
  image: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=600'
}];

export function Landing({ onEnter, onLogin }: LandingProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (isSignUp) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      // SignUp successful - start onboarding
      onEnter();
      setShowLogin(false);
    } else {
      // Login verification (demo mode - any email/password works)
      if (email && password) {
        onLogin?.(email, password);
        setShowLogin(false);
        setEmail('');
        setPassword('');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F13] text-white font-sans selection:bg-[#F59E0B]/30 overflow-x-hidden">
      {/* A. TOP NAV */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-4 py-4 md:px-8 md:py-6 flex items-center justify-between bg-gradient-to-b from-[#0F0F13]/80 to-transparent">
        <div className="flex items-center gap-6 md:gap-12">
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight">
            Jun<span className="text-gradient">to</span>
          </h1>
          <div className="hidden md:flex items-center gap-8 font-medium text-sm">
            <button className="text-white hover:text-[#F59E0B] transition-colors">
              Discover
            </button>
            <button className="text-white hover:text-[#F59E0B] transition-colors">
              Stories
            </button>
            <button className="text-white hover:text-[#F59E0B] transition-colors">
              Safety
            </button>
            <button className="text-white hover:text-[#F59E0B] transition-colors">
              Cities
            </button>
            <button className="text-white hover:text-[#F59E0B] transition-colors">
              Download
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <button className="hidden md:flex items-center gap-2 text-sm font-medium hover:text-[#F59E0B] transition-colors">
            <Globe size={18} />
            Language
          </button>
          <button
            onClick={() => setShowLogin(true)}
            className="bg-white text-gray-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors">
            
            Log in
          </button>
        </div>
      </nav>

      {/* B. HERO */}
      <section className="relative w-full min-h-screen md:min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Tilted Mosaic Background */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div
            className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-4 md:gap-6 opacity-40 md:opacity-60 w-full h-full"
            style={{
              transform:
              'perspective(1000px) rotateX(15deg) rotateZ(-10deg) scale(1.25)',
              willChange: 'transform'
            }}>
            
            {MOSAIC_IMAGES.map((img, i) =>
            <div
              key={i}
              className="w-20 h-40 xs:w-24 xs:h-48 sm:w-28 sm:h-56 md:w-40 md:h-80 rounded-2xl sm:rounded-3xl md:rounded-[2rem] bg-gray-800 relative overflow-hidden border-2 sm:border-3 md:border-4 border-gray-900 shadow-lg md:shadow-2xl">
              
                {/* Fake Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 sm:w-12 md:w-16 h-3 sm:h-4 md:h-5 bg-gray-900 rounded-b-lg md:rounded-b-xl z-10"></div>

                <img
                src={img.url}
                alt="Profile"
                className="w-full h-full object-cover" />
              

                {/* Card Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                {/* Name Label */}
                <div className="absolute bottom-8 sm:bottom-10 md:bottom-16 left-2 sm:left-3 md:left-4 text-white font-semibold text-xs md:text-sm flex items-center gap-1">
                  <span className="truncate">{img.name}</span>
                  <span className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full flex items-center justify-center text-[6px] md:text-[8px] shrink-0">✓</span>
                </div>

                {/* Fake Swipe Buttons */}
                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black/50 border border-rose-500 flex items-center justify-center">
                    <X size={14} className="text-rose-500" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-black/50 border border-emerald-500 flex items-center justify-center">
                    <Heart size={14} className="text-emerald-500" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vignette Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F0F13]/40 via-[#0F0F13]/60 to-[#0F0F13]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0F0F13_80%)]"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 sm:px-6 md:px-8 mt-6 sm:mt-12 w-full max-w-screen-xl mx-auto">
          <motion.h1
            initial={{
              opacity: 0,
              y: 30,
              scale: 0.95
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1
            }}
            transition={{
              duration: 0.8,
              ease: 'easeOut'
            }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl leading-tight sm:leading-none font-serif font-bold tracking-tight text-white mb-4 sm:mb-6 md:mb-8 drop-shadow-2xl px-2">
            
            Find your <span className="italic text-gradient">people.</span>
            <sup className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl top-[-0.5em] relative font-sans font-normal text-white/50 ml-1">
              ™
            </sup>
          </motion.h1>

          <motion.button
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.8,
              delay: 0.3,
              ease: 'easeOut'
            }}
            onClick={onEnter}
            className="bg-gradient-to-r from-[#F59E0B] to-[#FB923C] text-white px-12 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(245,158,11,0.4)]">
            
            Create account
          </motion.button>
        </div>

        <div className="absolute bottom-6 right-8 z-20 text-white/40 text-xs">
          All photos are of models and used for illustrative purposes only.
        </div>
      </section>

      {/* C. STORIES ROW */}
      <section className="bg-[#0F0F13] py-20 px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-serif font-bold text-white mb-2">
              Real vibes. Real people.
            </h2>
            <p className="text-gray-400">Stories from the Junto community.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
            {STORIES.map((story, idx) =>
            <div
              key={idx}
              className="bg-[#1A1A21] rounded-2xl overflow-hidden flex flex-col sm:flex-row h-auto sm:h-64 md:h-72 group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
              
                <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white mb-2 sm:mb-3 text-base sm:text-lg line-clamp-2">
                      {story.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed line-clamp-3 sm:line-clamp-4">
                      "{story.excerpt}"
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[#F59E0B] text-xs sm:text-sm font-medium group-hover:text-[#FB923C] transition-colors mt-3 sm:mt-0">
                    Continue reading <ArrowUpRight size={14} className="sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="w-full sm:w-[45%] h-32 sm:h-auto relative overflow-hidden flex-shrink-0">
                  <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                
                </div>
              </div>
            )}

            {/* 5th Card - Share Story */}
            <div className="bg-[#1A1A21] rounded-2xl overflow-hidden relative group cursor-pointer hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-center p-6 sm:p-8 min-h-48 sm:min-h-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 relative z-10">
                Share your story or read more
              </h3>
              <div className="flex items-center gap-2 text-[#F59E0B] font-medium relative z-10 text-sm sm:text-base">
                Junto Stories <ArrowUpRight size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* D. FOOTER */}
      <footer className="bg-[#0A0A0E] pt-12 sm:pt-20 pb-6 sm:pb-8 px-4 sm:px-6 md:px-8 border-t border-white/5 overflow-x-hidden w-full">
        <div className="max-w-[1400px] mx-auto">
          {/* Top Links Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 mb-12 sm:mb-16">
            <div className="min-w-0">
              <h4 className="text-[8px] sm:text-xs font-bold tracking-widest text-gray-500 uppercase mb-4 sm:mb-6">
                Legal
              </h4>
              <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors truncate block">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors truncate block">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors truncate block">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Accessibility statement
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Community guidelines
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-6">
                Company
              </h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Press room
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Junto blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-6">
                Social
              </h4>
              <div className="flex items-center gap-4 text-gray-400">
                <a href="#" className="hover:text-white transition-colors">
                  <Instagram size={20} />
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <Music2 size={20} />
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <Twitter size={20} />
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <Youtube size={20} />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-6">
                Help
              </h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Cities
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Promo code
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* App Store Badges */}
          <div className="mb-12">
            <h4 className="text-white font-medium mb-4">Get the app!</h4>
            <div className="flex flex-wrap items-center gap-4">
              <button className="flex items-center gap-2 bg-black border border-white/20 rounded-xl px-4 py-2 hover:bg-white/10 transition-colors">
                <Apple size={24} className="text-white" />
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 leading-none mb-0.5">
                    Download on the
                  </div>
                  <div className="text-sm font-semibold text-white leading-tight">
                    App Store
                  </div>
                </div>
              </button>
              <button className="flex items-center gap-2 bg-black border border-white/20 rounded-xl px-4 py-2 hover:bg-white/10 transition-colors">
                <Play size={22} className="text-white" fill="currentColor" />
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 leading-none mb-0.5">
                    Get it on
                  </div>
                  <div className="text-sm font-semibold text-white leading-tight">
                    Google Play
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-white/5 mb-8"></div>

          {/* Marketing Paragraph */}
          <p className="text-gray-500 text-sm leading-relaxed mb-12 max-w-6xl">
            Hey you! Looking for someone to grab brunch with, hit the gym, or
            finally try that new sushi spot? Junto is the no-strings way to find
            company for anything you're already doing. Whether you're new in
            town, working remote, or just want to mix things up — post where
            you're going, find your vibe, and tag along together. Zero
            obligations, just good times. There really is something for everyone
            on Junto. Want to make friends online? Say no more. Just started uni
            and want to make the most of your experience? We've got you covered.
            Junto isn't your average social app; it's the most diverse community
            where adults of all backgrounds and experiences are invited to make
            connections, memories and everything in between.
          </p>

          {/* Bottom Copyright Row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-4 flex-wrap">
              <a href="#" className="hover:text-white transition-colors">
                FAQ
              </a>
              <span>/</span>
              <a href="#" className="hover:text-white transition-colors">
                Safety tips
              </a>
              <span>/</span>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <span>/</span>
              <a href="#" className="hover:text-white transition-colors">
                Cookie Policy
              </a>
              <span>/</span>
              <a href="#" className="hover:text-white transition-colors">
                Privacy settings
              </a>
            </div>
            <div>© 2026 Junto Inc, All Rights Reserved.</div>
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-[#111318] border border-white/10 rounded-3xl p-8 w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-serif font-bold text-white">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {isSignUp ? 'Join Junto to find your people' : 'Sign in to your account'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowLogin(false);
                  setError('');
                  setEmail('');
                  setPassword('');
                }}
                className="text-gray-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="your@email.com"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder={isSignUp ? 'Min 6 characters' : 'Enter password'}
                    className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#F59E0B] to-[#FB923C] hover:from-[#F59E0B]/90 hover:to-[#FB923C]/90 text-white font-bold py-3 rounded-xl transition-all mt-6 shadow-lg hover:shadow-xl">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </button>

              {/* Toggle Auth Mode */}
              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError('');
                      setEmail('');
                      setPassword('');
                    }}
                    className="text-[#F59E0B] hover:text-[#FB923C] font-semibold transition-colors">
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Demo Credentials</p>
              <div className="space-y-1 text-xs text-gray-300">
                <p>📧 <span className="font-mono text-blue-300">demo@junto.app</span></p>
                <p>🔑 <span className="font-mono text-blue-300">password123</span></p>
                <p className="text-gray-500 mt-2">Or create a new account with any email & password</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
