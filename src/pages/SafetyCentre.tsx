import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import * as API from '../services/api';
import {
  AlertTriangle,
  Copy,
  Heart,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';

interface SafetyCentreProps {
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  onCloseSidebar?: () => void;
  currentUser?: any;
}

type SafetyTab = 'profile' | 'contacts' | 'history';

const safetyTips = [
  'Share your Junto profile ID before heading out.',
  'Use check-ins when meeting someone new for the first time.',
  'Keep at least two trusted contacts active at all times.',
  'Report suspicious behaviour the moment something feels off.',
];

const historyItems = [
  {
    id: '1',
    title: 'SOS Activated',
    time: 'May 18, 2026 · 6:32 PM',
    detail: 'Location: Lekki Beach, Lagos. 2 contacts notified.',
    status: 'Resolved',
    icon: Heart,
    accent: 'red',
  },
  {
    id: '2',
    title: 'Safety Alert Sent',
    time: 'May 15, 2026 · 3:14 PM',
    detail: 'Shared profile with Mom at Imax Cinema.',
    status: 'Delivered',
    icon: MapPin,
    accent: 'amber',
  },
];

export const SafetyCentre: React.FC<SafetyCentreProps> = ({ onNavigate, setActiveNav = () => {}, onCloseSidebar = () => {}, currentUser }) => {
  const [activeTab, setActiveTab] = useState<SafetyTab>('profile');
  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(0);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRelationship, setNewContactRelationship] = useState('Friend');
  const [contacts, setContacts] = useState([
    {
      id: '1',
      name: 'Mom',
      phone: '+234 703 123 4567',
      relationship: 'Mother',
    },
    {
      id: '2',
      name: 'Tunde',
      phone: '+234 801 987 6543',
      relationship: 'Best Friend',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [sosMessage, setSosMessage] = useState('');

  const profileId = 'JTO-9201-NG';
  const profilePhone = '+234 803 456 7890';

  const handleSOSActivate = async () => {
    if (!currentUser?.id) {
      setSosMessage('User ID not found');
      return;
    }

    try {
      setSosActive(true);
      setSosCountdown(5);
      setSosMessage('Sending emergency signal to trusted contacts...');

      // Call SOS API
      await API.triggerSOS(currentUser.id, 'Emergency SOS activated - please contact me immediately');

      const timer = setInterval(() => {
        setSosCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setSosMessage('Emergency signal sent to all trusted contacts');
            setTimeout(() => setSosMessage(''), 3000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to activate SOS:', error);
      setSosMessage('Failed to send emergency signal. Please try again.');
      setSosActive(false);
      setSosCountdown(0);
    }
  };

  const handleSOSCancel = () => {
    setSosActive(false);
    setSosCountdown(0);
    setSosMessage('');
  };

  const handleAddContact = async () => {
    if (!newContactName || !newContactPhone) {
      setSosMessage('Please fill in all fields');
      setTimeout(() => setSosMessage(''), 2000);
      return;
    }

    if (!currentUser?.id) {
      setSosMessage('User ID not found');
      return;
    }

    try {
      setLoading(true);
      
      // Call API to add contact
      const response = await API.addTrustedContact(
        currentUser.id,
        newContactName,
        newContactPhone,
        false
      );

      // Add to local state
      const newContact = {
        id: response?.id || Date.now().toString(),
        name: newContactName,
        phone: newContactPhone,
        relationship: newContactRelationship,
      };
      
      setContacts([...contacts, newContact]);
      setNewContactName('');
      setNewContactPhone('');
      setNewContactRelationship('Friend');
      setShowAddContactModal(false);
      setSosMessage('✓ Contact added successfully');
      setTimeout(() => setSosMessage(''), 2000);
    } catch (error) {
      console.error('Failed to add contact:', error);
      setSosMessage('Failed to add contact. Please try again.');
      setTimeout(() => setSosMessage(''), 2000);
    } finally {
      setLoading(false);
    }
  };

  const tabButtonClass = (tab: SafetyTab) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      activeTab === tab
        ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/20'
        : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
    }`;

  const handleDeleteContact = async (contactId: string) => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      await API.deleteTrustedContact(contactId);
      setContacts(contacts.filter(c => c.id !== contactId));
      setSosMessage('✓ Contact deleted');
      setTimeout(() => setSosMessage(''), 2000);
    } catch (error) {
      console.error('Failed to delete contact:', error);
      setSosMessage('Failed to delete contact');
      setTimeout(() => setSosMessage(''), 2000);
    } finally {
      setLoading(false);
    }
  };

  // Load contacts on mount
  useEffect(() => {
    if (currentUser?.id) {
      const fetchContacts = async () => {
        try {
          const data = await API.getTrustedContacts(currentUser.id);
          if (data && Array.isArray(data)) {
            setContacts(data.map((c: any) => ({
              id: c.id,
              name: c.contact_name || c.name,
              phone: c.contact_phone || c.phone,
              relationship: c.relationship || 'Contact',
            })));
          }
        } catch (error) {
          console.error('Failed to fetch contacts:', error);
        }
      };
      fetchContacts();
    }
  }, [currentUser?.id]);

  return (
    <div className="flex min-h-screen bg-[#0F0F13] text-white">
      <div className="relative z-50">
        <Sidebar activeNav="Safety" onNavigate={onNavigate} setActiveNav={setActiveNav} onCloseSidebar={onCloseSidebar} />
      </div>

      {sosMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-6 left-1/2 transform -translate-x-1/2 z-40 bg-yellow-500/20 border border-yellow-500/40 rounded-full px-6 py-3 text-yellow-300 text-sm font-medium backdrop-blur-sm"
        >
          {sosMessage}
        </motion.div>
      )}

      <main className="mobile-page-main flex-1 ml-0 relative overflow-hidden pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.14),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.10),transparent_24%),#0F0F13]" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative pb-20"
        >
          <section className="border-b border-yellow-500/20 px-6 py-10 md:px-10">
            <div className="max-w-5xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-yellow-500/80">
                Safety Centre
              </p>
              <h1 className="max-w-3xl text-4xl font-serif font-bold tracking-tight text-yellow-400 md:text-5xl">
                Your calm corner for check-ins, alerts, and trusted people.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-gray-300 md:text-lg">
                Built to feel consistent with the rest of Junto: warm, clear, and ready the second
                you need it.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <TopStat
                  icon={<ShieldCheck size={18} />}
                  title="Protection ready"
                  description="SOS, live profile sharing, and trusted contact support."
                />
                <TopStat
                  icon={<Users size={18} />}
                  title={`${contacts.length} trusted contacts`}
                  description="People who receive your alerts and location updates."
                />
                <TopStat
                  icon={<Phone size={18} />}
                  title="Phone verified"
                  description="Your registered line is attached to every safety alert."
                />
              </div>
            </div>
          </section>

          <section className="px-6 py-8 md:px-10">
            {sosActive ? (
              <div className="rounded-[2rem] border border-red-500/40 bg-gradient-to-r from-red-950/80 via-red-800/60 to-red-950/80 p-6 shadow-2xl shadow-red-950/40">
                <div className="grid gap-5 lg:grid-cols-[1.5fr_0.9fr] lg:items-center">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-300">
                      <AlertTriangle size={28} className="animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-200/80">
                        SOS active
                      </p>
                      <h2 className="mt-1 text-3xl font-bold text-white">Emergency signal in progress</h2>
                      <p className="mt-2 max-w-xl text-sm text-red-100/85">
                        Live GPS is being prepared for your trusted contacts. Cancel only if you are
                        safe and no longer need help.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-5">
                    <div className="flex items-end justify-between">
                      <span className="text-sm text-red-100/80">Countdown</span>
                      <span className="text-5xl font-bold text-white">{sosCountdown}s</span>
                    </div>
                    <p className="mt-3 text-xs text-red-100/70">
                      Once this finishes, your emergency notification is fully sent.
                    </p>
                    <button
                      onClick={handleSOSCancel}
                      className="mt-5 w-full rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                      I&apos;m safe now
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr]">
                <div className="rounded-[2rem] border border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 via-[#17171d] to-black p-6 shadow-xl shadow-yellow-950/10">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400/80">
                    Emergency access
                  </p>
                  <h2 className="mt-2 text-3xl font-serif font-semibold text-yellow-300">
                    One tap when the vibe turns wrong.
                  </h2>
                  <p className="mt-3 max-w-xl text-sm text-gray-300">
                    Your SOS instantly shares your live location and identity details with trusted
                    contacts so someone knows exactly where you are.
                  </p>

                  <button
                    onClick={handleSOSActivate}
                    className="mt-6 w-full rounded-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 px-6 py-5 text-xl font-bold text-white transition hover:scale-[1.01] hover:shadow-lg hover:shadow-red-900/40"
                  >
                    SEND SOS
                  </button>

                  <p className="mt-3 text-xs text-gray-400">
                    Includes your profile ID, phone number, and live GPS signal.
                  </p>
                </div>

                <div className="rounded-[2rem] border border-amber-500/25 bg-gradient-to-br from-amber-900/15 via-black to-[#121218] p-6">
                  <h3 className="text-xl font-serif font-semibold text-amber-300">Before you head out</h3>
                  <div className="mt-5 space-y-4">
                    {safetyTips.slice(0, 3).map((tip) => (
                      <div key={tip} className="flex gap-3">
                        <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-400" />
                        <p className="text-sm text-gray-300">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="px-6 md:px-10">
            <div className="flex flex-wrap rounded-full border border-white/10 bg-white/5 p-1">
              <button onClick={() => setActiveTab('profile')} className={`${tabButtonClass('profile')} flex-1 sm:flex-none`}>
                My profile
              </button>
              <button onClick={() => setActiveTab('contacts')} className={`${tabButtonClass('contacts')} flex-1 sm:flex-none`}>
                Contacts
              </button>
              <button onClick={() => setActiveTab('history')} className={`${tabButtonClass('history')} flex-1 sm:flex-none`}>
                History
              </button>
            </div>
          </section>

          <section className="grid gap-6 px-6 py-8 md:px-10 xl:grid-cols-[1.55fr_0.8fr]">
            <div className="space-y-6">
              {activeTab === 'profile' && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <PanelCard
                    eyebrow="Identity"
                    title="Your Junto profile ID"
                    description="This stays the same even if your number changes, so trusted people always know it is you."
                  >
                    <div className="rounded-[1.5rem] border border-yellow-500/20 bg-black/30 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="break-all text-xl font-bold tracking-[0.2em] text-yellow-300">{profileId}</p>
                        <button className="rounded-full border border-white/10 bg-white/5 p-3 text-gray-300 transition hover:text-white">
                          <Copy size={18} />
                        </button>
                      </div>
                    </div>
                  </PanelCard>

                  <PanelCard
                    eyebrow="Primary line"
                    title="Registered phone number"
                    description="Shared together with your profile during urgent safety alerts."
                  >
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
                          <Phone size={18} />
                        </div>
                        <span className="min-w-0 break-all font-mono text-lg text-white">{profilePhone}</span>
                      </div>
                    </div>
                  </PanelCard>
                </div>
              )}

              {activeTab === 'contacts' && (
                <PanelCard
                  eyebrow="Trusted people"
                  title="People who get your alerts"
                  description="Keep this list fresh so the right people can step in fast."
                >
                  <div className="space-y-4">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/15 text-sm font-semibold text-yellow-300">
                            {contact.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white">{contact.name}</p>
                            <p className="text-xs uppercase tracking-[0.18em] text-amber-300/80">
                              {contact.relationship}
                            </p>
                            <p className="mt-1 text-sm font-mono text-gray-400">{contact.phone}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          disabled={loading}
                          className="self-end rounded-full border border-red-500/20 bg-red-500/10 p-3 text-red-300 transition hover:bg-red-500/15 sm:self-auto disabled:opacity-50"
                          aria-label={`Remove ${contact.name}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}

              <button 
                onClick={() => setShowAddContactModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-[1.5rem] border border-dashed border-yellow-500/30 bg-yellow-500/5 px-4 py-4 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/10">
                <Plus size={18} />
                Add trusted contact
              </button>
                  </div>
                </PanelCard>
              )}

              {activeTab === 'history' && (
                <PanelCard
                  eyebrow="Recent activity"
                  title="Your latest safety moments"
                  description="A quick record of alerts, profile shares, and resolved check-ins."
                >
                  <div className="space-y-4">
                    {historyItems.map((item) => {
                      const Icon = item.icon;
                      const iconClasses =
                        item.accent === 'red'
                          ? 'bg-red-500/15 text-red-300'
                          : 'bg-amber-500/15 text-amber-300';
                      const statusClasses =
                        item.accent === 'red'
                          ? 'text-green-300 bg-green-500/10 border-green-500/20'
                          : 'text-amber-300 bg-amber-500/10 border-amber-500/20';

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="flex min-w-0 gap-4">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-full ${iconClasses}`}>
                              <Icon size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white">{item.title}</p>
                              <p className="mt-1 text-xs text-gray-400">{item.time}</p>
                              <p className="mt-2 break-words text-sm text-gray-300">{item.detail}</p>
                            </div>
                          </div>

                          <span className={`self-start rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses}`}>
                            {item.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </PanelCard>
              )}
            </div>

            <aside className="space-y-6">
              <PanelCard
                eyebrow="Quick reminders"
                title="A few simple habits"
                description="Little steps that make meetups and nights out feel safer."
              >
                <div className="space-y-4">
                  {safetyTips.map((tip, index) => (
                    <div key={tip} className="flex gap-4 rounded-[1.25rem] border border-white/8 bg-black/20 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-500/15 text-sm font-semibold text-yellow-300">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-gray-300">{tip}</p>
                    </div>
                  ))}
                </div>
              </PanelCard>

              <div className="rounded-[2rem] border border-amber-500/25 bg-gradient-to-br from-amber-900/15 via-black to-[#121218] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300/75">
                  Junto promise
                </p>
                <h3 className="mt-2 text-2xl font-serif font-semibold text-amber-200">
                  Safety tools should feel reassuring, not stressful.
                </h3>
                <p className="mt-3 text-sm text-gray-300">
                  This space keeps the same warm design language as the rest of the app while making urgent actions impossible to miss.
                </p>
              </div>
            </aside>
          </section>
        </motion.div>
      </main>

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#1A1A21] border border-white/10 rounded-3xl max-w-md w-full"
          >
            <div className="p-6 border-b border-white/5">
              <h3 className="text-2xl font-semibold text-white">Add Trusted Contact</h3>
              <p className="text-sm text-gray-400 mt-1">Add someone who'll get your safety alerts</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="e.g. Mom, Best Friend"
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="+234 803 456 7890"
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Relationship
                </label>
                <select
                  value={newContactRelationship}
                  onChange={(e) => setNewContactRelationship(e.target.value)}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                >
                  <option>Family</option>
                  <option>Mother</option>
                  <option>Father</option>
                  <option>Sibling</option>
                  <option>Best Friend</option>
                  <option>Friend</option>
                  <option>Partner</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3">
              <button
                onClick={() => setShowAddContactModal(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white font-medium transition-colors hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContact}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-yellow-500 text-black font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Contact'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

function TopStat({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-300">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
    </div>
  );
}

function PanelCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-yellow-500/18 bg-gradient-to-br from-white/[0.04] via-black/40 to-black/70 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-yellow-400/75">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-serif font-semibold text-yellow-300">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm text-gray-400">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export default SafetyCentre;
