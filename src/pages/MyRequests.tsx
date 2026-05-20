import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  CheckCircle2,
  Edit3,
  Eye,
  Image as ImageIcon } from
'lucide-react';
export function MyRequests() {
  const [activeTab, setActiveTab] = useState('Active');
  const tabs = ['Active', 'Past', 'Drafts'];
  const activeRequests = [
  {
    id: 1,
    title: 'Beach day at Tarkwa Bay',
    date: 'Tomorrow, 10am',
    status: 'Open',
    statusColor: 'bg-emerald-500/10 text-emerald-400',
    interestedCount: 5,
    coverImage:
    'https://images.unsplash.com/photo-1596241913254-2c1308332152?w=800'
  },
  {
    id: 2,
    title: 'Hiking the conservation centre',
    date: 'Saturday, 8am',
    status: 'Closing soon',
    statusColor: 'bg-amber-500/10 text-amber-400',
    interestedCount: 12,
    coverImage:
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800'
  },
  {
    id: 3,
    title: 'Art gallery hopping',
    date: 'Sunday, 2pm',
    status: 'Filled',
    statusColor: 'bg-blue-500/10 text-blue-400',
    interestedCount: 8,
    coverImage:
    'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800'
  }];

  return (
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

      {/* Tab Content */}
      <div className="pb-20">
        {activeTab === 'Active' &&
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeRequests.map((req) =>
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
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                    <Calendar size={14} />
                    {req.date}
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
                    <button className="flex-1 py-3 rounded-2xl bg-[#F59E0B] text-white font-semibold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2">
                      <Eye size={16} /> View interested
                    </button>
                    <button className="p-3 rounded-2xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
                      <Edit3 size={18} />
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
    </motion.div>);

}