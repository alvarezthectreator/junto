import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  MapPin,
  ShieldCheck,
  Flag,
  CheckCircle2,
  XCircle,
  Phone,
  Menu,
  X,
  Plus,
  Bell
} from 'lucide-react';

export function Safety() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-[#0F0F13] text-white">
      <main className="mobile-page-main flex-1 w-full overflow-x-hidden">
        <motion.div
          initial={{
            opacity: 0,
            y: 10
          }}
          animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.3
      }}
      className="pb-12 sm:pb-20 px-4 sm:px-6 md:px-8">
      
      {/* Header with Navigation and Post Button */}
      <div className="flex items-center justify-between gap-4 mb-8 md:mb-6">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/myhost')}
            className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black px-3 md:px-4 py-2 rounded-full font-semibold text-sm transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Post</span>
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="View notifications"
          >
            <Bell size={18} />
          </button>
        </div>
      </div>
      
      {/* Header */}
      <div className="mb-8 sm:mb-10 md:mb-12 border-b border-yellow-500/30 pb-6 sm:pb-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-2 sm:mb-4 tracking-tight text-yellow-400">
          Stay <span className="italic text-yellow-300 font-normal">safe</span>{' '}
          out there.
        </h2>
        <p className="text-gray-300 text-xs sm:text-sm md:text-base lg:text-lg max-w-xl break-words">
          Your wellbeing is the vibe. Tools and tips to hang out with
          confidence.
        </p>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div className="bg-gradient-to-br from-yellow-900/20 to-black border border-yellow-500/40 rounded-3xl p-6 relative overflow-hidden group hover:border-yellow-500/60 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
              <Phone className="text-yellow-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-300 mb-1">
                Verify your phone number
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Verified members get more responses. Takes 30 seconds.
              </p>
              <button className="text-yellow-400 text-sm font-medium hover:text-yellow-300 transition-colors flex items-center gap-1">
                Verify now →
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-900/20 to-black border border-amber-500/40 rounded-3xl p-6 relative overflow-hidden group hover:border-amber-500/60 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <MapPin className="text-amber-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-300 mb-1">
                New safety check-in feature
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Auto-share your live location with a trusted contact during
                hangouts.
              </p>
              <button className="text-amber-400 text-sm font-medium hover:text-amber-300 transition-colors flex items-center gap-1">
                Try it →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toolkit Grid */}
      <h3 className="text-xl font-serif font-semibold text-yellow-400 mb-6">
        Safety toolkit
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <ToolkitCard
          icon={<Users size={20} />}
          color="text-yellow-400"
          bgColor="bg-yellow-500/10"
          title="Trusted contacts"
          description="Choose 3 people who get notified when you head out."
          linkText="Set up →" />
        
        <ToolkitCard
          icon={<MapPin size={20} />}
          color="text-amber-400"
          bgColor="bg-amber-500/10"
          title="Live check-ins"
          description="Share your location during a hangout. Auto-stops when you mark safe."
          linkText="Learn more →" />
        
        <ToolkitCard
          icon={<ShieldCheck size={20} />}
          color="text-yellow-400"
          bgColor="bg-yellow-500/10"
          title="Verified meetups"
          description="Filter to only meet verified members."
          linkText="Set up →" />
        
        <ToolkitCard
          icon={<Flag size={20} />}
          color="text-amber-400"
          bgColor="bg-amber-500/10"
          title="Report & block"
          description="Flag bad vibes instantly. We act within 24h."
          linkText="Learn more →" />
        
      </div>

      {/* Guidelines & Blocked */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-yellow-900/10 to-black border border-yellow-500/30 rounded-3xl p-8 hover:border-yellow-500/50 transition-colors">
          <h3 className="text-xl font-serif font-semibold text-yellow-400 mb-6">
            Community guidelines
          </h3>
          <div className="space-y-4">
            <GuidelineItem
              icon={
              <CheckCircle2 className="text-yellow-400 shrink-0" size={20} />
              }
              text="Meet in public places for the first time." />
            
            <GuidelineItem
              icon={
              <CheckCircle2 className="text-yellow-400 shrink-0" size={20} />
              }
              text="Respect boundaries and communicate clearly." />
            
            <GuidelineItem
              icon={
              <CheckCircle2 className="text-yellow-400 shrink-0" size={20} />
              }
              text="Tell a friend where you're going." />
            
            <GuidelineItem
              icon={<XCircle className="text-amber-400 shrink-0" size={20} />}
              text="Don't share personal financial information." />
            
            <GuidelineItem
              icon={<XCircle className="text-amber-400 shrink-0" size={20} />}
              text="No harassment, hate speech, or bad vibes." />
            
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-900/10 to-black border border-amber-500/30 rounded-3xl p-8 hover:border-amber-500/50 transition-colors">
          <h3 className="text-xl font-serif font-semibold text-amber-400 mb-6">
            Blocked & reported
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-medium">
                  M
                </div>
                <span className="text-sm text-gray-300">Mike T.</span>
              </div>
              <button className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                Unblock
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-medium">
                  S
                </div>
                <span className="text-sm text-gray-300">Sarah J.</span>
              </div>
              <button className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                Unblock
              </button>
            </div>
          </div>
        </div>
      </div>
        </motion.div>
      </main>
    </div>
  );
}
function ToolkitCard({
  icon,
  color,
  bgColor,
  title,
  description,
  linkText
}: any) {
  return (
    <div className={`bg-gradient-to-br from-black to-black border border-${color.split('-')[1]}-500/30 rounded-2xl p-6 flex flex-col gap-4 sm:flex-row sm:items-start hover:border-${color.split('-')[1]}-500/60 transition-colors`}>
      <div
        className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center shrink-0`}>
        
        <div className={color}>{icon}</div>
      </div>
      <div className="min-w-0">
        <h4 className="text-white font-medium mb-1">{title}</h4>
        <p className="text-sm text-gray-300 mb-3">{description}</p>
        <button className={`text-sm font-medium ${color} hover:opacity-80 transition-opacity`}>
          {linkText}
        </button>
      </div>
    </div>);

}
function GuidelineItem({
  icon,
  text



}: {icon: React.ReactNode;text: string;}) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      {icon}
      <p className="min-w-0 break-words text-gray-200 text-sm">{text}</p>
    </div>);

}
