import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Plus, Check, X, MapPin, Users, Calendar } from 'lucide-react';

interface HostDashboardProps {
  onNavigate?: (page: string) => void;
  isLightMode?: boolean;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ onNavigate = () => {}, isLightMode = false }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'past' | 'cancelled'>('active');
  const pageClass = isLightMode ? 'bg-[#f7f3ea] text-[#241b10]' : 'bg-[#0F0F13] text-white';
  const shellClass = isLightMode ? 'bg-[#fffaf2]' : 'bg-black';
  const surfaceClass = isLightMode ? 'bg-white/80 border-black/10' : 'bg-gray-900 bg-opacity-50 border-gray-800';
  const mutedClass = isLightMode ? 'text-[#7a674f]' : 'text-gray-400';
  const lineClass = isLightMode ? 'border-black/10' : 'border-gray-800';

  const activeEvents = [
    {
      id: '1',
      title: 'Beach Volleyball at Lekki',
      date: '2026-05-25',
      time: '4:00 PM',
      location: 'Lekki Beach',
      capacity: 4,
      joined: 2,
      applications: 3,
      applicants: [
        {
          id: 'a1',
          name: 'Amara T.',
          reliabilityScore: 94,
          isVerified: true,
          status: 'pending' as const,
          mutualInterests: 2,
        },
        {
          id: 'a2',
          name: 'Chioma O.',
          reliabilityScore: 87,
          isVerified: true,
          status: 'pending' as const,
          mutualInterests: 1,
        },
        {
          id: 'a3',
          name: 'Zainab M.',
          reliabilityScore: 92,
          isVerified: false,
          status: 'accepted' as const,
          mutualInterests: 3,
        },
      ],
    },
  ];

  const pastEvents = [
    {
      id: '2',
      title: 'Movie Night at Imax',
      date: '2026-05-10',
      attendees: 3,
      rating: 4.8,
      reviews: 3,
    },
  ];

  return (
    <div className={`flex min-h-screen ${pageClass}`}>
      <Sidebar activeNav="" setActiveNav={() => {}} onNavigate={onNavigate} />
      
      <main className="mobile-page-main flex-1 ml-64">
        <div className={`${shellClass} min-h-screen pb-20`}>
      {/* Header */}
      <div className={`sticky top-0 bg-opacity-95 backdrop-blur p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b ${lineClass} ${isLightMode ? 'bg-[#fffaf2]/95' : 'bg-black'}`}>
        <h1 className="text-2xl font-bold">Host Dashboard</h1>
        <button className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-purple-600 hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2">
          <Plus size={20} /> Create Event
        </button>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={`p-3 rounded-lg text-center ${surfaceClass}`}>
          <p className="text-xl font-bold text-red-500">1</p>
          <p className={`text-xs ${mutedClass}`}>Active</p>
        </div>
        <div className={`p-3 rounded-lg text-center ${surfaceClass}`}>
          <p className="text-xl font-bold text-green-500">3</p>
          <p className={`text-xs ${mutedClass}`}>Applications</p>
        </div>
        <div className={`p-3 rounded-lg text-center ${surfaceClass}`}>
          <p className="text-xl font-bold text-blue-500">12</p>
          <p className={`text-xs ${mutedClass}`}>Total Hosted</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex flex-wrap border-b px-4 ${lineClass}`}>
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-4 font-semibold transition border-b-2 ${
            activeTab === 'active'
              ? 'border-red-500 text-white'
              : `${isLightMode ? 'border-transparent text-[#7a674f] hover:text-[#241b10]' : 'border-transparent text-gray-400 hover:text-white'}`
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`flex-1 py-4 font-semibold transition border-b-2 ${
            activeTab === 'past'
              ? 'border-red-500 text-white'
              : `${isLightMode ? 'border-transparent text-[#7a674f] hover:text-[#241b10]' : 'border-transparent text-gray-400 hover:text-white'}`
          }`}
        >
          Past
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`flex-1 py-4 font-semibold transition border-b-2 ${
            activeTab === 'cancelled'
              ? 'border-red-500 text-white'
              : `${isLightMode ? 'border-transparent text-[#7a674f] hover:text-[#241b10]' : 'border-transparent text-gray-400 hover:text-white'}`
          }`}
        >
          Cancelled
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeEvents.map(event => (
              <div key={event.id} className={`rounded-lg overflow-hidden ${surfaceClass}`}>
                {/* Event Header */}
                <div className={`p-4 border-b ${lineClass}`}>
                  <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                  <div className={`grid grid-cols-1 gap-2 text-xs mb-3 sm:grid-cols-2 ${mutedClass}`}>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {event.date} at {event.time}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} />
                      {event.joined} / {event.capacity} joined
                    </div>
                    <div className="text-red-500 font-semibold">
                      {event.applications} pending applications
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className={`w-full rounded-full h-2 overflow-hidden ${isLightMode ? 'bg-black/10' : 'bg-gray-800'}`}>
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-purple-600"
                      style={{ width: `${(event.joined / event.capacity) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Applicants */}
                <div className="p-4 space-y-3">
                  <p className={`text-xs font-semibold uppercase ${mutedClass}`}>
                    Pending Applications
                  </p>
                    {event.applicants
                    .filter(a => a.status === 'pending')
                    .map(applicant => (
                      <div
                        key={applicant.id}
                        className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg ${isLightMode ? 'bg-white/80' : 'bg-gray-800 bg-opacity-50'}`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {applicant.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{applicant.name}</p>
                            <div className={`flex items-center gap-2 text-xs ${mutedClass}`}>
                              <span className="bg-green-500 bg-opacity-20 text-green-400 px-2 py-0.5 rounded">
                                {applicant.reliabilityScore}%
                              </span>
                              {applicant.isVerified && (
                                <span className="bg-blue-500 bg-opacity-20 text-blue-400 px-2 py-0.5 rounded">
                                  ✓ Verified
                                </span>
                              )}
                              <span>{applicant.mutualInterests} common interests</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 self-end sm:self-auto">
                          <button className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition">
                            <Check size={16} />
                          </button>
                          <button className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Accepted Attendees */}
                {event.applicants.some(a => a.status === 'accepted') && (
                  <div className={`p-4 border-t ${lineClass}`}>
                    <p className="text-xs font-semibold text-green-400 uppercase mb-2">
                      Accepted Attendees
                    </p>
                    {event.applicants
                      .filter(a => a.status === 'accepted')
                      .map(attendee => (
                        <div key={attendee.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Check size={16} className="text-green-500" />
                            {attendee.name}
                          </div>
                          <span className={`text-xs ${mutedClass}`}>Not checked in</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'past' && (
          <div className="space-y-4">
            {pastEvents.map(event => (
              <div key={event.id} className={`p-4 rounded-lg ${surfaceClass}`}>
                <h3 className="font-bold mb-2">{event.title}</h3>
                <div className={`grid grid-cols-2 gap-2 text-xs mb-3 ${mutedClass}`}>
                  <div>{event.date}</div>
                  <div>{event.attendees} attendees</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-bold">⭐ {event.rating}</span>
                  <span className="text-gray-400 text-xs">({event.reviews} reviews)</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'cancelled' && (
          <div className="text-center py-12">
              <p className={mutedClass}>No cancelled events</p>
          </div>
        )}
      </div>
        </div>
      </main>
    </div>
  );
};

export default HostDashboard;
