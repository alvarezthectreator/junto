import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import {
  Calendar,
  Users,
  CheckCircle2,
  Edit3,
  Eye,
  Image as ImageIcon,
  MessageCircle,
  Check,
  X,
  Clock,
  Trash2
} from 'lucide-react';

interface MyRequestsProps {
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  onCloseSidebar?: () => void;
}

interface InterestedPerson {
  id: string;
  name: string;
  avatar: string;
  joinedAt: string;
  message?: string;
  status: 'interested' | 'accepted' | 'declined';
}

export function MyRequests({ onNavigate = () => {}, setActiveNav = () => {}, onCloseSidebar = () => {} }: MyRequestsProps) {
  const [activeTab, setActiveTab] = useState('Active');
  const [showInterestedModal, setShowInterestedModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'most-interested'>('recent');
  const [requests, setRequests] = useState([
    {
      id: 1,
      title: 'Beach day at Tarkwa Bay',
      date: 'Tomorrow, 10am',
      status: 'Open',
      statusColor: 'bg-emerald-500/10 text-emerald-400',
      interestedCount: 5,
      coverImage: 'https://images.unsplash.com/photo-1596241913254-2c1308332152?w=800',
      createdAt: '2 days ago',
      interested: [
        { id: '1', name: 'Ada M.', avatar: '👩‍🦰', joinedAt: '2 hours ago', message: 'I\'m interested!', status: 'interested' as const },
        { id: '2', name: 'Oge K.', avatar: '👨‍🦱', joinedAt: '1 hour ago', message: 'Count me in', status: 'interested' as const },
      ]
    },
    {
      id: 2,
      title: 'Hiking the conservation centre',
      date: 'Saturday, 8am',
      status: 'Closing soon',
      statusColor: 'bg-amber-500/10 text-amber-400',
      interestedCount: 12,
      coverImage: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
      createdAt: '1 week ago',
      interested: [
        { id: '3', name: 'Zara P.', avatar: '👩', joinedAt: '30 mins ago', status: 'interested' as const },
      ]
    },
    {
      id: 3,
      title: 'Art gallery hopping',
      date: 'Sunday, 2pm',
      status: 'Filled',
      statusColor: 'bg-blue-500/10 text-blue-400',
      interestedCount: 8,
      coverImage: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800',
      createdAt: '3 days ago',
      interested: []
    }
  ]);
  const [showMessage, setShowMessage] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const tabs = ['Active', 'Past', 'Drafts'];

  const handleAccept = (personId: string) => {
    if (!selectedRequestId) return;
    setRequests(prev => prev.map(req => 
      req.id === selectedRequestId ? {
        ...req,
        interested: req.interested.map(p => p.id === personId ? { ...p, status: 'accepted' as const } : p)
      } : req
    ));
    setShowMessage('Application accepted! 🎉');
    setTimeout(() => setShowMessage(''), 2000);
  };

  const handleDecline = (personId: string) => {
    if (!selectedRequestId) return;
    setRequests(prev => prev.map(req => 
      req.id === selectedRequestId ? {
        ...req,
        interested: req.interested.map(p => p.id === personId ? { ...p, status: 'declined' as const } : p)
      } : req
    ));
    setShowMessage('Application declined');
    setTimeout(() => setShowMessage(''), 2000);
  };

  const handleWithdrawEvent = (requestId: number) => {
    setRequests(prev => prev.filter(req => req.id !== requestId));
    setShowMessage('Event withdrawn');
    setTimeout(() => setShowMessage(''), 2000);
  };
  
  const activeRequests = requests;

  const sortedRequests = [...activeRequests].sort((a, b) => {
    if (sortBy === 'most-interested') {
      return b.interestedCount - a.interestedCount;
    }
    return 0; // recent is default order
  });

  const openInterestedModal = (requestId: number) => {
    setSelectedRequestId(requestId);
    setShowInterestedModal(true);
  };

  const selectedRequest = selectedRequestId !== null ? requests.find(r => r.id === selectedRequestId) : null;

  const InterestedModal = () => {
    if (!showInterestedModal || !selectedRequest) return null;

    return (
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
          className="bg-[#1A1A21] border border-white/10 rounded-3xl max-w-md w-full max-h-[80vh] flex flex-col"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h3 className="text-xl font-semibold text-white">{selectedRequest.interestedCount} interested</h3>
            <button
              onClick={() => setShowInterestedModal(false)}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedRequest.interested.length > 0 ? (
              selectedRequest.interested.map((person) => (
                <div key={person.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl flex-shrink-0">{person.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{person.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Clock size={12} /> {person.joinedAt}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                      person.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                      person.status === 'declined' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {person.status}
                    </span>
                  </div>
                  {person.message && (
                    <p className="text-sm text-gray-300 mb-3 italic">"{person.message}"</p>
                  )}
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 text-[#FBBF24] rounded-xl text-sm font-medium transition-colors">
                      <MessageCircle size={14} /> Message
                    </button>
                    {person.status === 'interested' && (
                      <>
                        <button 
                          onClick={() => handleAccept(person.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl text-sm font-medium transition-colors">
                          <Check size={14} /> Accept
                        </button>
                        <button 
                          onClick={() => handleDecline(person.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-colors">
                          <X size={14} /> Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users size={32} className="mx-auto mb-3 opacity-50" />
                <p>No one interested yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#0F0F13]">
      <Sidebar activeNav="My Requests" setActiveNav={setActiveNav} onNavigate={onNavigate} onCloseSidebar={onCloseSidebar} />
      
      {showMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 right-6 bg-[#1A1A21] border border-[#F59E0B]/50 rounded-2xl px-6 py-3 text-white font-medium shadow-lg z-50">
          {showMessage}
        </motion.div>
      )}
      
      <main className="flex-1 ml-64 md:ml-64 lg:ml-64 overflow-auto">
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
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
            }}>
            
            {/* Header */}
            <div className="mb-10">
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 tracking-tight">
                Your <span className="italic text-gradient font-normal">vibes.</span>
              </h2>
              <p className="text-gray-400 text-lg">
                Track who's tagging along with your plans.
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="bg-[#1A1A21] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
                  <Calendar className="text-[#F59E0B]" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Active requests</p>
                  <p className="text-xl font-bold text-white">4</p>
                </div>
              </div>
              <div className="bg-[#1A1A21] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#4ECDC4]/10 flex items-center justify-center">
                  <Users className="text-[#4ECDC4]" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total interested</p>
                  <p className="text-xl font-bold text-white">23</p>
                </div>
              </div>
              <div className="bg-[#1A1A21] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#FB7185]/10 flex items-center justify-center">
                  <CheckCircle2 className="text-[#FB7185]" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Completed hangouts</p>
                  <p className="text-xl font-bold text-white">12</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-white/5 mb-8">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-medium transition-colors relative ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                    
                    {tab}
                    {isActive &&
                    <motion.div
                      layoutId="myRequestsTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F59E0B]"
                      initial={false}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30
                      }} />

                    }
                  </button>);

              })}
            </div>

            {/* Sorting Controls */}
            {activeTab === 'Active' && (
              <div className="mb-8 flex gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'most-interested')}
                  className="bg-[#1A1A21] border border-white/5 rounded-full px-4 py-2 text-sm text-gray-400 focus:outline-none focus:border-[#F59E0B]/50 transition-colors"
                >
                  <option value="recent">Most recent</option>
                  <option value="most-interested">Most interested</option>
                </select>
              </div>
            )}

            {/* Tab Content */}
            <div className="pb-20">
              {activeTab === 'Active' &&
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {sortedRequests.map((req) =>
                <div
                  key={req.id}
                  className="bg-[#1A1A21] border border-white/5 rounded-3xl overflow-hidden group hover:border-white/10 transition-colors flex flex-col">
                  
                      <div className="h-32 w-full relative overflow-hidden bg-[#0F0F13]">
                        <img
                      src={req.coverImage}
                      alt={req.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A21] to-transparent opacity-90"></div>
                      </div>
                      <div className="p-6 flex flex-col flex-1 relative z-10 -mt-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-semibold text-white">
                            {req.title}
                          </h3>
                          <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${req.statusColor}`}>
                        
                            {req.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                          <Calendar size={14} />
                          {req.date}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-6">
                          <Clock size={12} /> Posted {req.createdAt}
                        </div>

                      <div className="flex items-center justify-between mb-6 mt-auto">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {['bg-blue-500', 'bg-purple-500', 'bg-emerald-500'].map(
                          (color, i) =>
                          <div
                            key={i}
                            className={`w-8 h-8 rounded-full border-2 border-[#1A1A21] ${color} flex items-center justify-center text-[10px] font-bold text-white`}>
                            
                                  {String.fromCharCode(65 + i)}
                                </div>

                        )}
                          </div>
                          <span className="text-sm text-gray-300 font-medium ml-2">
                            <span className="text-white">
                              {req.interestedCount}
                            </span>{' '}
                            interested
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => openInterestedModal(req.id)}
                          className="flex-1 py-3 rounded-2xl bg-[#F59E0B] text-white font-semibold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2">
                          <Eye size={16} /> View interested
                        </button>
                        <button className="p-3 rounded-2xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleWithdrawEvent(req.id)}
                          className="p-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                          title="Withdraw event">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
              )}
              </div>
            }

            {activeTab === 'Past' &&
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <ImageIcon className="text-gray-500" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No past hangouts yet 👀
                </h3>
                <p className="text-gray-400 max-w-sm">
                  When you complete a hangout, it will show up here as a memory.
                </p>
              </div>
            }

            {activeTab === 'Drafts' &&
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Edit3 className="text-gray-500" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No drafts saved ✏️
                </h3>
                <p className="text-gray-400 max-w-sm">
                  Start creating a post and save it for later if you're not ready to
                  publish.
                </p>
              </div>
            }
            </div>

            <InterestedModal />
          </motion.div>
        </div>
      </main>
    </div>
  );
}