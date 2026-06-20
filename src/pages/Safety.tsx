import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Send, UserPlus, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MapPin,
  ShieldCheck,
  Flag,
  CheckCircle2,
  XCircle,
  Phone,
} from 'lucide-react';

export function Safety() {
  const navigate = useNavigate();

  // Pre-outing modal state
  const [showPreOutingModal, setShowPreOutingModal] = useState(false);
  const [trustedContacts, setTrustedContacts] = useState([
    { id: '1', name: '', phone: '', relationship: '' },
  ]);
  const [preOutingForm, setPreOutingForm] = useState({
    hostName: '',
    venue: '',
    time: '',
    notes: '',
  });
  const [alertSent, setAlertSent] = useState(false);

  // SOS state
  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [sosFired, setSosFired] = useState(false);
  const [sosCancelled, setSosCancelled] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!sosActive || sosFired) return;

    setSosCountdown(5);
    countdownRef.current = setInterval(() => {
      setSosCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          setSosFired(true);
          setSosActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current!);
  }, [sosActive]);

  const cancelSOS = () => {
    clearInterval(countdownRef.current!);
    setSosActive(false);
    setSosCountdown(5);
    setSosCancelled(true);
    setTimeout(() => setSosCancelled(false), 3000);
  };

  const resetSOS = () => {
    setSosFired(false);
    setSosCountdown(5);
    setSosActive(false);
  };

  const buildSOSLinks = () => {
    const msg = encodeURIComponent(
      `🚨 EMERGENCY SOS from Junto\nI need help. Please call me or contact emergency services immediately.`
    );
    return {
      whatsapp: `https://wa.me/?text=${msg}`,
      sms: `sms:?body=${msg}`,
    };
  };

  return (
    <div className="flex min-h-screen bg-[#0F0F13] text-white">
      <main className="mobile-page-main flex-1 w-full overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pb-12 sm:pb-20 px-4 sm:px-6 md:px-8"
        >
          {/* Header */}
          <div className="mb-8 sm:mb-10 md:mb-12 border-b border-yellow-500/30 pb-6 sm:pb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-2 sm:mb-4 tracking-tight text-yellow-400">
              Stay <span className="italic text-yellow-300 font-normal">safe</span>{' '}
              out there.
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm md:text-base lg:text-lg max-w-xl break-words">
              Your wellbeing is the vibe. Tools and tips to hang out with confidence.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/safety')}
                className="rounded-full bg-yellow-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-yellow-300"
              >
                Open Safety Centre
              </button>
              <button
                onClick={() => navigate('/messages')}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Open Messages
              </button>
            </div>
          </div>

          {/* EMERGENCY SOS SECTION */}
          <div className="mb-10 rounded-3xl border border-red-500/40 bg-gradient-to-br from-red-950/40 to-black p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="text-red-400" size={20} />
                <p className="text-xs font-bold uppercase tracking-widest text-red-400">
                  Emergency SOS
                </p>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mb-1">
                Feel unsafe? Alert your contacts.
              </h3>
              <p className="text-sm text-gray-400 mb-8 max-w-md">
                Tap the SOS button. A 5-second countdown starts — cancel anytime.
                After countdown, your contacts get an emergency message via WhatsApp and SMS.
              </p>

              {sosFired ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center">
                    <CheckCircle className="text-green-400" size={36} />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-lg">SOS Alert Sent</p>
                    <p className="text-gray-400 text-sm mt-1">Your contacts have been notified. Stay safe.</p>
                  </div>
                  <div className="flex gap-3 flex-wrap justify-center">
                    <a
                      href={buildSOSLinks().whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-500 transition"
                    >
                      Open WhatsApp
                    </a>
                    <a
                      href={buildSOSLinks().sms}
                      className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition"
                    >
                      Send SMS
                    </a>
                    <button
                      onClick={resetSOS}
                      className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 transition"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : sosActive ? (
                <div className="flex flex-col items-center gap-6 py-4">
                  <div className="relative w-28 h-28">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50" cy="50" r="44"
                        fill="none"
                        stroke="rgba(239,68,68,0.2)"
                        strokeWidth="6"
                      />
                      <circle
                        cx="50" cy="50" r="44"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 44}`}
                        strokeDashoffset={`${2 * Math.PI * 44 * (sosCountdown / 5)}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold text-red-400">{sosCountdown}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">Sending SOS in {sosCountdown}s...</p>
                    <p className="text-gray-400 text-xs mt-1">Tap cancel to abort</p>
                  </div>
                  <button
                    onClick={cancelSOS}
                    className="rounded-full border-2 border-red-500/50 bg-red-500/10 px-8 py-3 text-sm font-bold text-red-300 hover:bg-red-500/20 transition"
                  >
                    Cancel SOS
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  {sosCancelled && (
                    <p className="text-xs text-gray-400 animate-pulse">SOS cancelled — you're safe.</p>
                  )}
                  <button
                    onClick={() => { setSosActive(true); setSosCancelled(false); }}
                    className="group relative w-32 h-32 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 transition-all duration-150 shadow-[0_0_40px_rgba(239,68,68,0.4)] hover:shadow-[0_0_60px_rgba(239,68,68,0.6)] flex flex-col items-center justify-center gap-1"
                  >
                    <div className="absolute inset-0 rounded-full border-4 border-red-400/30 animate-ping" />
                    <AlertTriangle size={32} className="text-white" />
                    <span className="text-white font-bold text-sm tracking-wider">SOS</span>
                  </button>
                  <p className="text-xs text-gray-500 text-center max-w-xs">
                    Tap to start 5-second countdown. A distress message will be sent to all trusted contacts.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div className="bg-gradient-to-br from-yellow-900/20 to-black border border-yellow-500/40 rounded-3xl p-6 relative overflow-hidden group hover:border-yellow-500/60 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl -mr-10 -mt-10" />
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
                  <button className="text-yellow-400 text-sm font-medium hover:text-yellow-300 transition-colors">
                    Verify now →
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-900/20 to-black border border-amber-500/40 rounded-3xl p-6 relative overflow-hidden group hover:border-amber-500/60 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -mr-10 -mt-10" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="text-amber-400" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-300 mb-1">
                    New safety check-in feature
                  </h3>
                  <p className="text-sm text-gray-300 mb-4">
                    Auto-share your live location with a trusted contact during hangouts.
                  </p>
                  <button
                    onClick={() => setShowPreOutingModal(true)}
                    className="text-amber-400 text-sm font-medium hover:text-amber-300 transition-colors"
                  >
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
              linkText="Set up →"
              onLinkClick={() => setShowPreOutingModal(true)}
            />
            <ToolkitCard
              icon={<MapPin size={20} />}
              color="text-amber-400"
              bgColor="bg-amber-500/10"
              title="Live check-ins"
              description="Share your location during a hangout. Auto-stops when you mark safe."
              linkText="Send pre-outing alert →"
              onLinkClick={() => setShowPreOutingModal(true)}
            />
            <ToolkitCard
              icon={<ShieldCheck size={20} />}
              color="text-yellow-400"
              bgColor="bg-yellow-500/10"
              title="Verified meetups"
              description="Filter to only meet verified members."
              linkText="Set up →"
            />
            <ToolkitCard
              icon={<Flag size={20} />}
              color="text-amber-400"
              bgColor="bg-amber-500/10"
              title="Report & block"
              description="Flag bad vibes instantly. We act within 24h."
              linkText="Learn more →"
            />
          </div>

          {/* Guidelines & Blocked */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gradient-to-br from-yellow-900/10 to-black border border-yellow-500/30 rounded-3xl p-8 hover:border-yellow-500/50 transition-colors">
              <h3 className="text-xl font-serif font-semibold text-yellow-400 mb-6">
                Community guidelines
              </h3>
              <div className="space-y-4">
                <GuidelineItem
                  icon={<CheckCircle2 className="text-yellow-400 shrink-0" size={20} />}
                  text="Meet in public places for the first time."
                />
                <GuidelineItem
                  icon={<CheckCircle2 className="text-yellow-400 shrink-0" size={20} />}
                  text="Respect boundaries and communicate clearly."
                />
                <GuidelineItem
                  icon={<CheckCircle2 className="text-yellow-400 shrink-0" size={20} />}
                  text="Tell a friend where you're going."
                />
                <GuidelineItem
                  icon={<XCircle className="text-amber-400 shrink-0" size={20} />}
                  text="Don't share personal financial information."
                />
                <GuidelineItem
                  icon={<XCircle className="text-amber-400 shrink-0" size={20} />}
                  text="No harassment, hate speech, or bad vibes."
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-900/10 to-black border border-amber-500/30 rounded-3xl p-8 hover:border-amber-500/50 transition-colors">
              <h3 className="text-xl font-serif font-semibold text-amber-400 mb-6">
                Blocked & reported
              </h3>
              <div className="space-y-4">
                {[
                  { initial: 'M', name: 'Mike T.' },
                  { initial: 'S', name: 'Sarah J.' },
                ].map((u) => (
                  <div key={u.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-medium">
                        {u.initial}
                      </div>
                      <span className="text-sm text-gray-300">{u.name}</span>
                    </div>
                    <button className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pre-Outing Safety Alert Modal */}
          <AnimatePresence>
            {showPreOutingModal && (
              <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 sm:pb-0">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  className="w-full max-w-lg rounded-3xl border border-yellow-500/20 bg-[#0F0F13] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400/70">
                        Safety
                      </p>
                      <h3 className="text-xl font-bold text-white mt-1">Pre-Outing Alert</h3>
                    </div>
                    <button
                      onClick={() => { setShowPreOutingModal(false); setAlertSent(false); }}
                      className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
                    >
                      <X size={16} className="text-gray-400" />
                    </button>
                  </div>

                  {alertSent ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                        <Send size={28} className="text-yellow-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">Alert Sent!</h4>
                      <p className="text-sm text-gray-400">
                        Your trusted contacts have been notified with the host details.
                      </p>
                      <button
                        onClick={() => { setShowPreOutingModal(false); setAlertSent(false); }}
                        className="mt-6 rounded-full bg-yellow-400 px-6 py-2.5 text-sm font-semibold text-black hover:bg-yellow-300 transition"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 mb-6">
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
                          Outing details
                        </p>
                        {[
                          { label: 'Host name', key: 'hostName', placeholder: 'e.g. Chioma A.' },
                          { label: 'Venue / location', key: 'venue', placeholder: 'e.g. Terra Kulture, VI Lagos' },
                          { label: 'Time', key: 'time', placeholder: 'e.g. 7:00 PM' },
                          { label: 'Extra notes', key: 'notes', placeholder: 'Any other details...' },
                        ].map(({ label, key, placeholder }) => (
                          <div key={key}>
                            <label className="block text-xs text-gray-400 mb-1">{label}</label>
                            <input
                              type="text"
                              placeholder={placeholder}
                              value={preOutingForm[key as keyof typeof preOutingForm]}
                              onChange={(e) =>
                                setPreOutingForm((prev) => ({ ...prev, [key]: e.target.value }))
                              }
                              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                            Trusted contacts
                          </p>
                          {trustedContacts.length < 3 && (
                            <button
                              onClick={() =>
                                setTrustedContacts((prev) => [
                                  ...prev,
                                  { id: Date.now().toString(), name: '', phone: '', relationship: '' },
                                ])
                              }
                              className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 transition"
                            >
                              <UserPlus size={12} /> Add contact
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {trustedContacts.map((contact, i) => (
                            <div
                              key={contact.id}
                              className="rounded-2xl border border-white/5 bg-white/[0.03] p-4"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-yellow-400 font-semibold">
                                  Contact {i + 1}
                                </span>
                                {trustedContacts.length > 1 && (
                                  <button
                                    onClick={() =>
                                      setTrustedContacts((prev) =>
                                        prev.filter((c) => c.id !== contact.id)
                                      )
                                    }
                                  >
                                    <X size={12} className="text-gray-600 hover:text-gray-400 transition" />
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { key: 'name', placeholder: 'Full name' },
                                  { key: 'phone', placeholder: 'Phone number' },
                                ].map(({ key, placeholder }) => (
                                  <input
                                    key={key}
                                    type={key === 'phone' ? 'tel' : 'text'}
                                    placeholder={placeholder}
                                    value={contact[key as keyof typeof contact]}
                                    onChange={(e) =>
                                      setTrustedContacts((prev) =>
                                        prev.map((c) =>
                                          c.id === contact.id ? { ...c, [key]: e.target.value } : c
                                        )
                                      )
                                    }
                                    className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition"
                                  />
                                ))}
                                <select
                                  value={contact.relationship}
                                  onChange={(e) =>
                                    setTrustedContacts((prev) =>
                                      prev.map((c) =>
                                        c.id === contact.id
                                          ? { ...c, relationship: e.target.value }
                                          : c
                                      )
                                    )
                                  }
                                  className="col-span-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50 transition"
                                >
                                  <option value="">Relationship</option>
                                  {['Parent', 'Sibling', 'Friend', 'Partner', 'Colleague'].map((r) => (
                                    <option key={r} value={r}>
                                      {r}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const hasContact = trustedContacts.some((c) => c.name && c.phone);
                          const hasDetails = preOutingForm.hostName || preOutingForm.venue;
                          if (hasContact && hasDetails) setAlertSent(true);
                        }}
                        className="w-full rounded-full bg-yellow-400 py-3 text-sm font-bold text-black hover:bg-yellow-300 transition flex items-center justify-center gap-2"
                      >
                        <Send size={16} />
                        Send alert to contacts
                      </button>
                      <p className="text-center text-xs text-gray-600 mt-3">
                        Contacts receive an SMS with host details and your planned outing time.
                      </p>
                    </>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
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
  linkText,
  onLinkClick,
}: {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  title: string;
  description: string;
  linkText: string;
  onLinkClick?: () => void;
}) {
  return (
    <div className="bg-gradient-to-br from-black to-black border border-white/10 rounded-2xl p-6 flex flex-col gap-4 sm:flex-row sm:items-start hover:border-white/20 transition-colors">
      <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center shrink-0`}>
        <div className={color}>{icon}</div>
      </div>
      <div className="min-w-0">
        <h4 className="text-white font-medium mb-1">{title}</h4>
        <p className="text-sm text-gray-300 mb-3">{description}</p>
        <button
          onClick={onLinkClick}
          className={`text-sm font-medium ${color} hover:opacity-80 transition-opacity`}
        >
          {linkText}
        </button>
      </div>
    </div>
  );
}

function GuidelineItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      {icon}
      <p className="min-w-0 break-words text-gray-200 text-sm">{text}</p>
    </div>
  );
}