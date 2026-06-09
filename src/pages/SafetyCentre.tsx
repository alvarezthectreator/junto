import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { ReportBlockModal } from '../components/ReportBlockModal';
import * as API from '../services/api';
import {
  appendSafetyAction,
  readBlockedUserRecords,
  readSafetyReportCases,
  readSafetyActions,
  updateSafetyReportCase,
  type BlockedUserRecord,
  type SafetyActionRecord,
  type SafetyReportCase,
} from '../utils/localActivity';
import { getUserLocation, isLocationAvailable } from '../utils/checkInUtils';
import { formatPhoneForWhatsApp, sendSOSViaWhatsApp } from '../utils/whatsappShare';
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
type CheckInState = 'idle' | 'tracking' | 'safe' | 'missed';
const contactsStorageKey = 'junto-safety-contacts';
const historyStorageKey = 'junto-safety-history';

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

type SafetyAction = SafetyActionRecord;

type SafetyContact = {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary?: boolean;
  verified?: boolean;
  verificationStatus?: 'verified' | 'pending' | 'unverified';
  verificationCode?: string;
  lastVerificationRequestAt?: string;
};

function normalizeSafetyContact(contact: any): SafetyContact {
  return {
    id: String(contact?.id || Date.now()),
    name: String(contact?.contact_name || contact?.name || 'Trusted contact'),
    phone: String(contact?.contact_phone || contact?.phone || ''),
    relationship: String(contact?.relationship || 'Contact'),
    isPrimary: Boolean(contact?.is_primary),
    verified: Boolean(contact?.verified ?? contact?.is_verified ?? contact?.verification_status === 'verified'),
    verificationStatus: contact?.verification_status || (contact?.verified || contact?.is_verified ? 'verified' : 'pending'),
    verificationCode: contact?.verification_code || undefined,
    lastVerificationRequestAt: contact?.last_verification_request_at || undefined,
  };
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getMapsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export const SafetyCentre: React.FC<SafetyCentreProps> = ({ onNavigate, setActiveNav = () => {}, onCloseSidebar = () => {}, currentUser }) => {
  const [activeTab, setActiveTab] = useState<SafetyTab>('profile');
  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(0);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRelationship, setNewContactRelationship] = useState('Friend');
  const [contacts, setContacts] = useState<SafetyContact[]>([
    {
      id: '1',
      name: 'Mom',
      phone: '+234 703 123 4567',
      relationship: 'Mother',
      isPrimary: true,
      verified: true,
      verificationStatus: 'verified',
    },
    {
      id: '2',
      name: 'Tunde',
      phone: '+234 801 987 6543',
      relationship: 'Best Friend',
      verified: true,
      verificationStatus: 'verified',
    },
  ]);
  const [historyEntries, setHistoryEntries] = useState(historyItems);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContactName, setEditContactName] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editContactRelationship, setEditContactRelationship] = useState('Friend');
  const [loading, setLoading] = useState(false);
  const [sosMessage, setSosMessage] = useState('');
  const [safetyActions, setSafetyActions] = useState<SafetyAction[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserRecord[]>([]);
  const [reportQueue, setReportQueue] = useState<SafetyReportCase[]>([]);
  const [verificationInputs, setVerificationInputs] = useState<Record<string, string>>({});
  const [checkInState, setCheckInState] = useState<CheckInState>('idle');
  const [checkInCountdown, setCheckInCountdown] = useState(0);
  const [liveLocationText, setLiveLocationText] = useState('');
  const [liveLocationUrl, setLiveLocationUrl] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetUserId, setReportTargetUserId] = useState('demo-user');
  const [reportTargetUserName, setReportTargetUserName] = useState('Suspicious user');
  const sosTimerRef = useRef<number | null>(null);
  const checkInTimerRef = useRef<number | null>(null);
  const wellbeingTimerRef = useRef<number | null>(null);

  const profileId = 'JTO-9201-NG';
  const profilePhone = '+234 803 456 7890';
  const verifiedContacts = contacts.filter((contact) => contact.verificationStatus === 'verified').length;
  const safetyScore = useMemo(() => {
    const base = 72;
    const verificationBonus = Math.min(14, verifiedContacts * 7);
    const blockPenalty = Math.min(18, blockedUsers.length * 4);
    const reportPenalty = Math.min(12, reportQueue.filter((report) => report.status === 'submitted' || report.status === 'under_review').length * 3);
    const checkInBonus = checkInState === 'safe' ? 8 : checkInState === 'tracking' ? 4 : 0;
    return Math.max(30, Math.min(98, base + verificationBonus + checkInBonus - blockPenalty - reportPenalty));
  }, [blockedUsers.length, checkInState, contacts, reportQueue]);

  const persistHistory = (entry: typeof historyEntries[number]) => {
    setHistoryEntries((current) => {
      const nextHistory = [entry, ...current].slice(0, 6);
      localStorage.setItem(historyStorageKey, JSON.stringify(nextHistory));
      return nextHistory;
    });
  };

  const persistSafetyAction = (action: SafetyAction) => {
    const nextActions = appendSafetyAction(action);
    setSafetyActions(nextActions);
  };

  const persistContacts = (nextContacts: SafetyContact[]) => {
    setContacts(nextContacts);
    localStorage.setItem(contactsStorageKey, JSON.stringify(nextContacts));
  };

  const stopCheckInTimers = () => {
    if (checkInTimerRef.current) {
      window.clearInterval(checkInTimerRef.current);
      checkInTimerRef.current = null;
    }
    if (wellbeingTimerRef.current) {
      window.clearTimeout(wellbeingTimerRef.current);
      wellbeingTimerRef.current = null;
    }
  };

  const captureLiveLocation = async () => {
    if (!isLocationAvailable()) {
      return null;
    }

    try {
      const location = await getUserLocation();
      return {
        text: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
        url: getMapsUrl(location.latitude, location.longitude),
      };
    } catch (error) {
      console.error('Failed to capture location:', error);
      return null;
    }
  };

  const handleSOSActivate = async () => {
    if (!currentUser?.id) {
      setSosMessage('User ID not found');
      return;
    }

    try {
      stopCheckInTimers();
      setSosActive(true);
      setSosCountdown(5);
      setSosMessage('Sending emergency signal to trusted contacts...');

      // Call SOS API
      await API.triggerSOS(currentUser.id, 'Emergency SOS activated - please contact me immediately');

      const liveLocation = await captureLiveLocation();
      const locationText = liveLocation?.text || 'Location unavailable';
      const locationUrl = liveLocation?.url || '';

      if (sosTimerRef.current) {
        window.clearInterval(sosTimerRef.current);
      }

      sosTimerRef.current = window.setInterval(() => {
        setSosCountdown((prev) => {
          if (prev <= 1) {
            if (sosTimerRef.current) {
              window.clearInterval(sosTimerRef.current);
              sosTimerRef.current = null;
            }
            contacts.forEach((contact) => {
              if (contact.phone) {
                sendSOSViaWhatsApp(
                  formatPhoneForWhatsApp(contact.phone),
                  currentUser?.name || 'Junto member',
                  profilePhone
                );
              }
            });

            window.open('tel:112', '_self');

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Junto SOS sent', {
                body: `Emergency signal sent to ${contacts.length} trusted contacts. Emergency line 112 is ready.`,
              });
            }

            setLiveLocationText(locationText);
            setLiveLocationUrl(locationUrl);
            setSosMessage(`Emergency signal sent. ${contacts.length} contacts notified and 112 opened.`);
            persistHistory({
              id: Date.now().toString(),
              title: 'SOS Activated',
              time: new Date().toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              }),
              detail: `${contacts.length} contacts notified. Live location ${locationText}. Emergency line 112 opened.`,
              status: 'Resolved',
              icon: Heart,
              accent: 'red',
            });

            persistSafetyAction({
              id: `sos-${Date.now()}`,
              action: 'sos',
              status: 'sent',
              createdAt: new Date().toISOString(),
              description: `SOS sent to ${contacts.length} trusted contacts. Emergency line 112 opened.`,
              locationText,
              locationUrl,
            });

            wellbeingTimerRef.current = window.setTimeout(() => {
              persistSafetyAction({
                id: `wellbeing-${Date.now()}`,
                action: 'wellbeing',
                status: 'scheduled',
                createdAt: new Date().toISOString(),
                description: 'Follow-up wellbeing check scheduled after SOS.',
              });
              setSosMessage('Wellbeing follow-up scheduled for later.');
            }, 10000);

            setTimeout(() => setSosMessage(''), 3000);
            setSosActive(false);
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
      stopCheckInTimers();
    }
  };

  const handleSOSCancel = () => {
    if (sosTimerRef.current) {
      window.clearInterval(sosTimerRef.current);
      sosTimerRef.current = null;
    }
    stopCheckInTimers();
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
        verified: false,
        verificationStatus: 'pending' as const,
        verificationCode: generateVerificationCode(),
        isPrimary: contacts.length === 0,
      };
      
      const nextContacts = [...contacts, newContact];
      persistContacts(nextContacts);
      persistSafetyAction({
        id: `verification-${Date.now()}`,
        action: 'verification',
        targetUserId: newContact.id,
        targetUserName: newContact.name,
        status: 'pending',
        createdAt: new Date().toISOString(),
        description: `Verification code generated for ${newContact.name}.`,
      });
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
      const nextContacts = contacts.filter(c => c.id !== contactId);
      persistContacts(nextContacts);
      persistSafetyAction({
        id: `block-${Date.now()}`,
        action: 'block',
        targetUserId: contactId,
        targetUserName: contacts.find((contact) => contact.id === contactId)?.name || 'Contact',
        status: 'saved',
        createdAt: new Date().toISOString(),
        description: 'Removed from trusted contacts locally.',
      });
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

  const beginEditContact = (contact: typeof contacts[number]) => {
    setEditingContactId(contact.id);
    setEditContactName(contact.name);
    setEditContactPhone(contact.phone);
    setEditContactRelationship(contact.relationship);
    setShowEditContactModal(true);
  };

  const handleSaveContactEdit = async () => {
    if (!editingContactId || !editContactName.trim() || !editContactPhone.trim()) {
      setSosMessage('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const updated = await API.updateTrustedContact(editingContactId, {
        contact_name: editContactName.trim(),
        contact_phone: editContactPhone.trim(),
      });

      const nextContacts = contacts.map((contact) =>
        contact.id === editingContactId
          ? {
              ...contact,
              name: updated.contact?.contact_name || editContactName.trim(),
              phone: updated.contact?.contact_phone || editContactPhone.trim(),
              relationship: editContactRelationship,
              isPrimary: Boolean(updated.contact?.is_primary ?? contact.isPrimary),
              verified: true,
              verificationStatus: 'verified' as const,
              verificationCode: undefined,
            }
          : contact
      );
      persistContacts(nextContacts);
      setShowEditContactModal(false);
      setEditingContactId(null);
      setSosMessage('✓ Contact updated');
      setTimeout(() => setSosMessage(''), 2000);
    } catch (error) {
      console.error('Failed to update contact:', error);
      setSosMessage('Failed to update contact');
      setTimeout(() => setSosMessage(''), 2000);
    } finally {
      setLoading(false);
    }
  };

  const setPrimaryContact = async (contactId: string) => {
    try {
      setLoading(true);
      const nextContacts = contacts.map((contact) => ({
        ...contact,
        isPrimary: contact.id === contactId,
      }));
      persistContacts(nextContacts);
      await API.updateTrustedContact(contactId, { is_primary: true });
      setSosMessage('✓ Primary contact updated');
      setTimeout(() => setSosMessage(''), 2000);
    } catch (error) {
      console.error('Failed to set primary contact:', error);
      setSosMessage('Failed to update primary contact');
      setTimeout(() => setSosMessage(''), 2000);
    } finally {
      setLoading(false);
    }
  };

  const requestVerificationHandshake = async (contactId: string) => {
    const nextCode = generateVerificationCode();
    const nextContacts = contacts.map((contact) =>
      contact.id === contactId
        ? {
            ...contact,
            verificationStatus: 'pending' as const,
            verified: false,
            verificationCode: nextCode,
            lastVerificationRequestAt: new Date().toISOString(),
          }
        : contact
    );

    persistContacts(nextContacts);

    const contact = nextContacts.find((entry) => entry.id === contactId);
    const message = `Junto verification code for ${contact?.name || 'your trusted contact'}: ${nextCode}`;

    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // Clipboard access is best-effort.
    }

    if (contact?.phone) {
      window.open(
        `https://wa.me/${formatPhoneForWhatsApp(contact.phone).replace(/\D/g, '')}?text=${encodeURIComponent(message)}`,
        '_blank'
      );
    }

    setSosMessage(`Verification handshake prepared for ${contact?.name || 'contact'}.`);
    setTimeout(() => setSosMessage(''), 2200);
  };

  const markContactVerified = async (contactId: string) => {
    const nextContacts = contacts.map((contact) =>
      contact.id === contactId
        ? {
            ...contact,
            verificationStatus: 'verified' as const,
            verified: true,
            verificationCode: undefined,
          }
        : contact
    );

    persistContacts(nextContacts);
    persistSafetyAction({
      id: `verification-${Date.now()}`,
      action: 'verification',
      targetUserId: contactId,
      targetUserName: nextContacts.find((contact) => contact.id === contactId)?.name || 'Contact',
      status: 'verified',
      createdAt: new Date().toISOString(),
      description: 'Trusted contact verified locally.',
    });
    setSosMessage('✓ Trusted contact verified');
    setTimeout(() => setSosMessage(''), 2200);
  };

  const handleConfirmVerificationCode = (contactId: string) => {
    const contact = contacts.find((entry) => entry.id === contactId);
    const enteredCode = verificationInputs[contactId]?.trim();

    if (!contact) {
      return;
    }

    if (!enteredCode || enteredCode !== contact.verificationCode) {
      setSosMessage('Verification code does not match.');
      setTimeout(() => setSosMessage(''), 2200);
      return;
    }

    markContactVerified(contactId);
    setVerificationInputs((current) => ({ ...current, [contactId]: '' }));
  };

  const handleStartLiveCheckIn = async () => {
    if (!currentUser?.id) {
      setSosMessage('User ID not found');
      return;
    }

    try {
      setCheckInState('tracking');
      setCheckInCountdown(60);
      setSosMessage('Starting live check-in and location share...');

      const liveLocation = await captureLiveLocation();
      if (liveLocation) {
        setLiveLocationText(liveLocation.text);
        setLiveLocationUrl(liveLocation.url);
      }

      persistSafetyAction({
        id: `checkin-${Date.now()}`,
        action: 'checkin',
        status: 'tracking',
        createdAt: new Date().toISOString(),
        description: 'Live check-in started locally.',
        locationText: liveLocation?.text,
        locationUrl: liveLocation?.url,
      });

      if (checkInTimerRef.current) {
        window.clearInterval(checkInTimerRef.current);
      }

      checkInTimerRef.current = window.setInterval(() => {
        setCheckInCountdown((prev) => {
          if (prev <= 1) {
            if (checkInTimerRef.current) {
              window.clearInterval(checkInTimerRef.current);
              checkInTimerRef.current = null;
            }
            setCheckInState('missed');
            persistSafetyAction({
              id: `noshow-${Date.now()}`,
              action: 'checkin',
              status: 'missed',
              createdAt: new Date().toISOString(),
              description: 'Check-in window expired without confirmation.',
              locationText: liveLocation?.text,
              locationUrl: liveLocation?.url,
            });
            persistHistory({
              id: `noshow-${Date.now()}`,
              title: 'Check-in missed',
              time: new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
              detail: `No-show alert triggered. ${liveLocation?.text ? `Last location: ${liveLocation.text}.` : ''}`,
              status: 'Alerted',
              icon: AlertTriangle,
              accent: 'amber',
            });
            setSosMessage('Check-in window expired. No-show alert recorded.');
            setTimeout(() => setSosMessage(''), 2600);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      wellbeingTimerRef.current = window.setTimeout(() => {
        persistSafetyAction({
          id: `wellbeing-${Date.now()}`,
          action: 'wellbeing',
          status: 'scheduled',
          createdAt: new Date().toISOString(),
          description: 'Wellbeing follow-up scheduled after live check-in.',
        });
      }, 15000);

      setTimeout(() => setSosMessage(''), 2200);
    } catch (error) {
      console.error('Failed to start live check-in:', error);
      setCheckInState('idle');
      setSosMessage('Unable to start live check-in.');
    }
  };

  const handleConfirmSafe = () => {
    stopCheckInTimers();
    setCheckInState('safe');
    persistSafetyAction({
      id: `safe-${Date.now()}`,
      action: 'wellbeing',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      description: 'User confirmed they are safe.',
      locationText: liveLocationText || undefined,
      locationUrl: liveLocationUrl || undefined,
    });
    persistHistory({
      id: `safe-${Date.now()}`,
      title: 'Safe confirmation',
      time: new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
      detail: 'The user confirmed they were safe and the check-in was closed.',
      status: 'Resolved',
      icon: Heart,
      accent: 'amber',
    });
    setSosMessage('Safe confirmation recorded.');
    setTimeout(() => setSosMessage(''), 2200);
  };

  const handleEmergencyServicesEscalation = () => {
    const emergencyNumber = '112';
    window.open(`tel:${emergencyNumber}`, '_self');

    const escalationEntry = {
      id: `emergency-${Date.now()}`,
      title: 'Emergency services escalated',
      time: new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
      detail: `Nigeria emergency line ${emergencyNumber} opened from Safety Centre.`,
      status: 'Dialing',
      icon: AlertTriangle,
      accent: 'red',
    };

    const nextHistory = [escalationEntry, ...historyEntries].slice(0, 6);
    setHistoryEntries(nextHistory);
    localStorage.setItem(historyStorageKey, JSON.stringify(nextHistory));
    persistSafetyAction({
      id: `emergency-${Date.now()}`,
      action: 'sos',
      status: 'dialing',
      createdAt: new Date().toISOString(),
      description: `Emergency services opened via ${emergencyNumber}.`,
      locationText: liveLocationText || undefined,
      locationUrl: liveLocationUrl || undefined,
    });
    setSosMessage('Emergency services path opened via 112.');
    setTimeout(() => setSosMessage(''), 2200);
  };

  // Load contacts on mount
  useEffect(() => {
    if (currentUser?.id) {
      const fetchContacts = async () => {
        try {
          const data = await API.getTrustedContacts(currentUser.id);
          const contactsList = Array.isArray((data as any)?.contacts) ? (data as any).contacts : Array.isArray(data) ? data : [];
          if (contactsList.length > 0) {
            const mapped = contactsList.map((c: any) => normalizeSafetyContact(c));
            setContacts(mapped);
            localStorage.setItem(contactsStorageKey, JSON.stringify(mapped));
          } else {
            const cached = localStorage.getItem(contactsStorageKey);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed)) {
                setContacts(parsed.map((contact: any) => normalizeSafetyContact(contact)));
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch contacts:', error);
          const cached = localStorage.getItem(contactsStorageKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed)) {
                setContacts(parsed.map((contact: any) => normalizeSafetyContact(contact)));
              }
            } catch {
              // ignore
            }
          }
        }
      };
      fetchContacts();
    }
  }, [currentUser?.id]);

  useEffect(() => {
    try {
      const cachedHistory = localStorage.getItem(historyStorageKey);
      if (cachedHistory) {
        const parsed = JSON.parse(cachedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistoryEntries(parsed);
        }
      }
    } catch {
      // ignore cached history issues
    }
  }, []);

  useEffect(() => {
    try {
      setSafetyActions(readSafetyActions());
      setBlockedUsers(readBlockedUserRecords());
      setReportQueue(readSafetyReportCases());
    } catch {
      // ignore cached safety data issues
    }
  }, []);

  useEffect(() => {
    return () => {
      if (sosTimerRef.current) {
        window.clearInterval(sosTimerRef.current);
        sosTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const loadSafetyAudit = () => {
      try {
        setSafetyActions(readSafetyActions());
        setBlockedUsers(readBlockedUserRecords());
        setReportQueue(readSafetyReportCases());
      } catch {
        // ignore refresh issues
      }
    };

    loadSafetyAudit();
    window.addEventListener('junto-local-activity-updated', loadSafetyAudit as EventListener);
    return () => {
      window.removeEventListener('junto-local-activity-updated', loadSafetyAudit as EventListener);
    };
  }, []);

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

              <div className="mt-8 grid gap-4 md:grid-cols-4">
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
                  title={`${blockedUsers.length} blocked users`}
                  description="People you have removed from your safety circle."
                />
                <TopStat
                  icon={<ShieldCheck size={18} />}
                  title={`${safetyScore}/100 safety score`}
                  description="A local trust score based on verification, check-ins, and safety activity."
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
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={handleEmergencyServicesEscalation}
                        className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                      >
                        Call 112
                      </button>
                      <button
                        onClick={() => {
                          const primaryContact = contacts.find((contact) => contact.isPrimary) || contacts[0];
                          if (primaryContact?.phone) {
                            sendSOSViaWhatsApp(
                              formatPhoneForWhatsApp(primaryContact.phone),
                              currentUser?.name || 'Junto member',
                              profilePhone
                            );
                          }
                        }}
                        className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs font-semibold text-yellow-200 transition hover:bg-yellow-500/20"
                      >
                        WhatsApp primary
                      </button>
                    </div>
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
                    eyebrow="Trust score"
                    title="Your local reliability score"
                    description="The score reacts to verified contacts, recent reports, blocked users, and check-ins."
                  >
                    <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-4xl font-bold text-yellow-300">{safetyScore}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-500">out of 100</p>
                        </div>
                        <div className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-yellow-300">
                          {checkInState === 'safe' ? 'Safe' : checkInState === 'tracking' ? 'Tracking' : 'Ready'}
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-gray-300">
                        Verified contacts: {verifiedContacts} · Blocked users: {blockedUsers.length} · Active reports: {reportQueue.length}
                      </p>
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

                  <PanelCard
                    eyebrow="Live check-in"
                    title="Track your safety window"
                    description="Start a short live check-in, share your location snapshot, and mark yourself safe when you’re done."
                  >
                    <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={handleStartLiveCheckIn}
                          className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/15"
                        >
                          Start live check-in
                        </button>
                        <button
                          onClick={handleConfirmSafe}
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                          I am safe
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">State</p>
                          <p className="mt-1 text-sm text-white">{checkInState}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Countdown</p>
                          <p className="mt-1 text-sm text-white">{checkInCountdown}s</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Location</p>
                          <p className="mt-1 truncate text-sm text-white">{liveLocationText || 'Not shared yet'}</p>
                        </div>
                      </div>
                      {liveLocationUrl && (
                        <a
                          href={liveLocationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/15"
                        >
                          Open location map
                        </a>
                      )}
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
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-white">{contact.name}</p>
                              {contact.isPrimary && (
                                <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-green-300">
                                  Primary
                                </span>
                              )}
                              {contact.verificationStatus === 'verified' ? (
                                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-300">
                                  Verified
                                </span>
                              ) : (
                                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                                  {contact.verificationStatus === 'pending' ? 'Pending verification' : 'Not verified'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs uppercase tracking-[0.18em] text-amber-300/80">
                              {contact.relationship}
                            </p>
                            <p className="mt-1 text-sm font-mono text-gray-400">{contact.phone}</p>
                            {contact.verificationCode && contact.verificationStatus === 'pending' && (
                              <p className="mt-1 text-xs text-yellow-200">
                                Verification code: <span className="font-semibold tracking-[0.25em]">{contact.verificationCode}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => setPrimaryContact(contact.id)}
                            disabled={loading || contact.isPrimary}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-white/10 disabled:opacity-50"
                          >
                            Set primary
                          </button>
                          <button
                            onClick={() => beginEditContact(contact)}
                            disabled={loading}
                            className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs font-semibold text-yellow-300 transition hover:bg-yellow-500/15 disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => requestVerificationHandshake(contact.id)}
                            disabled={loading}
                            className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/15 disabled:opacity-50"
                          >
                            {contact.verificationStatus === 'verified' ? 'Resend code' : 'Verify contact'}
                          </button>
                          {contact.verificationStatus === 'pending' && (
                            <button
                              onClick={() => markContactVerified(contact.id)}
                              disabled={loading}
                              className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-300 transition hover:bg-green-500/15 disabled:opacity-50"
                            >
                              Mark verified
                            </button>
                          )}
                          {contact.verificationStatus === 'pending' && (
                            <div className="flex w-full flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                                Enter verification code
                              </label>
                              <div className="flex gap-2">
                                <input
                                  value={verificationInputs[contact.id] || ''}
                                  onChange={(event) =>
                                    setVerificationInputs((current) => ({ ...current, [contact.id]: event.target.value }))
                                  }
                                  placeholder={contact.verificationCode || '6-digit code'}
                                  className="min-w-0 flex-1 rounded-full border border-white/10 bg-[#0F0F13] px-3 py-2 text-xs text-white placeholder:text-gray-500"
                                />
                                <button
                                  onClick={() => handleConfirmVerificationCode(contact.id)}
                                  disabled={loading}
                                  className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/15 disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setReportTargetUserId(contact.id);
                              setReportTargetUserName(contact.name);
                              setShowReportModal(true);
                            }}
                            className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/15"
                          >
                            Report
                          </button>
                          <button
                            onClick={() => handleDeleteContact(contact.id)}
                            disabled={loading}
                            className="rounded-full border border-red-500/20 bg-red-500/10 p-3 text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
                            aria-label={`Remove ${contact.name}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
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
                    {historyEntries.map((item) => {
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
                    {historyEntries.length === 0 && (
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-sm text-gray-300">
                        No safety history yet. Your SOS activity will appear here.
                      </div>
                    )}
                  </div>
                </PanelCard>
              )}

              {activeTab === 'history' && (
                <PanelCard
                  eyebrow="Safety audit"
                  title="Reports, blocks, and escalation"
                  description="Persistent records of block, report, and SOS activity."
                >
                  <div className="space-y-3">
                    {safetyActions.length > 0 ? (
                      safetyActions.map((action) => (
                        <div
                          key={action.id}
                          className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {action.action === 'sos' && 'Emergency SOS sent'}
                                {action.action === 'report' && `Report filed for ${action.targetUserName || 'a user'}`}
                                {action.action === 'block' && `Blocked ${action.targetUserName || 'a user'}`}
                              </p>
                              <p className="mt-1 text-xs text-gray-400">
                                {new Date(action.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-300">
                              {action.status}
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-gray-300">
                            {action.description || action.reason || action.reportType || 'Recorded for future review.'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-sm text-gray-300">
                        No report or block actions yet.
                      </div>
                    )}
                  </div>
                </PanelCard>
              )}

              {activeTab === 'history' && (
                <PanelCard
                  eyebrow="Review queue"
                  title="Cases awaiting moderation"
                  description="Evidence uploads and report details are collected here for case review."
                >
                  <div className="space-y-3">
                    {reportQueue.length > 0 ? (
                      reportQueue.map((reportCase) => (
                        <div key={reportCase.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="font-semibold text-white">
                                {reportCase.targetUserName} - {reportCase.reportType.replace(/_/g, ' ')}
                              </p>
                              <p className="mt-1 text-xs text-gray-400">
                                Submitted {new Date(reportCase.createdAt).toLocaleString()}
                              </p>
                              <p className="mt-2 text-sm text-gray-300">{reportCase.description}</p>
                              <p className="mt-2 text-xs text-amber-200">
                                Evidence attached: {reportCase.evidence.length} file{reportCase.evidence.length === 1 ? '' : 's'}
                              </p>
                            </div>
                            <span className="self-start rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-300">
                              {reportCase.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {reportCase.evidence.length > 0 && (
                            <div className="mt-3 grid gap-2">
                              {reportCase.evidence.map((file) => (
                                <div key={`${reportCase.id}-${file.name}`} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-gray-300">
                                  <p className="font-semibold text-white">{file.name}</p>
                                  <p>{Math.round(file.size / 1024)} KB</p>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                updateSafetyReportCase(reportCase.id, { status: 'under_review' });
                                setReportQueue(readSafetyReportCases());
                              }}
                              className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/15"
                            >
                              Mark reviewing
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateSafetyReportCase(reportCase.id, { status: 'needs_follow_up', reviewNote: 'Follow-up requested from the safety team.' });
                                setReportQueue(readSafetyReportCases());
                              }}
                              className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/15"
                            >
                              Need more info
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateSafetyReportCase(reportCase.id, { status: 'resolved', reviewNote: 'Case closed locally for this demo.' });
                                setReportQueue(readSafetyReportCases());
                              }}
                              className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-300 transition hover:bg-green-500/15"
                            >
                              Mark resolved
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-sm text-gray-300">
                        No reports in the review queue yet.
                      </div>
                    )}
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

              <PanelCard
                eyebrow="Actions"
                title="Report or block someone"
                description="Open the incident form, attach evidence, and save the action locally."
              >
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setReportTargetUserId('demo-user');
                      setReportTargetUserName('Suspicious user');
                      setShowReportModal(true);
                    }}
                    className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/15"
                  >
                    Open report form
                  </button>
                  <button
                    onClick={handleEmergencyServicesEscalation}
                    className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
                  >
                    Dial 112
                  </button>
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

      {showReportModal && (
        <ReportBlockModal
          userId={String(currentUser?.id || 'guest')}
          targetUserId={reportTargetUserId}
          targetUserName={reportTargetUserName}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => {
            setSosMessage('✓ Safety report saved locally');
            setTimeout(() => setSosMessage(''), 2200);
          }}
        />
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
