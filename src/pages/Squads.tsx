import React, { useState, useEffect } from 'react';
import { Plus, Users, Trash2, LogOut, Settings } from 'lucide-react';
import * as API from '../services/api';

const SquadsPage = () => {
  const [squads, setSquads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    maxMembers: 20,
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' }>({
    message: '',
    type: 'success',
  });

  const userId = API.getUserId();

  useEffect(() => {
    if (userId) {
      loadSquads();
    }
  }, [userId]);

  const loadSquads = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const squads = await API.getUserSquads(userId);
      setSquads(squads);
    } catch (error) {
      console.error('Error loading squads:', error);
      showToast('Failed to load squads', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSquad = async () => {
    if (!formData.name.trim()) {
      showToast('Squad name is required', 'error');
      return;
    }

    try {
      setLoading(true);
      const newSquad = await API.createSquad(
        formData.name,
        formData.description,
        formData.isPublic,
        formData.maxMembers
      );

      setSquads([...squads, newSquad]);
      setFormData({ name: '', description: '', isPublic: false, maxMembers: 20 });
      setShowCreateModal(false);
      showToast('Squad created successfully!', 'success');
    } catch (error) {
      console.error('Error creating squad:', error);
      showToast('Failed to create squad', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSquad = async (squadId: string) => {
    if (!window.confirm('Are you sure you want to delete this squad?')) return;

    try {
      setLoading(true);
      await API.deleteSquad(squadId);
      setSquads(squads.filter((s) => s.id !== squadId));
      showToast('Squad deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting squad:', error);
      showToast('Failed to delete squad', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#141416] to-[#0a0a0c] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Squads</h1>
            <p className="mt-2 text-gray-400">Organize group outings with your friends</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2 font-semibold text-black transition hover:bg-[#FB923C]"
          >
            <Plus size={20} />
            Create Squad
          </button>
        </div>

        {/* Squads Grid */}
        {loading && !squads.length ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-[#F59E0B] mx-auto"></div>
              <p className="text-gray-400">Loading squads...</p>
            </div>
          </div>
        ) : squads.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <Users size={48} className="mx-auto mb-4 text-gray-500" />
            <h2 className="mb-2 text-xl font-semibold">No squads yet</h2>
            <p className="mb-6 text-gray-400">Create a squad to start organizing group events!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-6 py-3 font-semibold text-black transition hover:bg-[#FB923C]"
            >
              <Plus size={20} />
              Create Your First Squad
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {squads.map((squad) => (
              <div
                key={squad.id}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:border-[#F59E0B]/50 hover:bg-white/10"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{squad.name}</h3>
                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-400">
                      <Users size={16} />
                      {squad.memberCount || 1} members
                    </p>
                  </div>
                  {squad.isCreator && (
                    <button
                      onClick={() => handleDeleteSquad(squad.id)}
                      className="rounded-lg bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                {squad.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-gray-400">{squad.description}</p>
                )}

                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Capacity:</span>
                    <span className="font-semibold">{squad.memberCount || 1}/{squad.max_members}</span>
                  </div>
                  {squad.is_public && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-400"></div>
                      <span className="text-green-400">Public Squad</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedSquad(squad)}
                  className="w-full rounded-lg bg-[#F59E0B]/10 py-2 font-semibold text-[#FBBF24] transition hover:bg-[#F59E0B]/20"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Squad Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1a1e] p-6 shadow-2xl">
            <h2 className="mb-4 text-2xl font-bold text-white">Create Squad</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Squad Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E.g., Weekend Explorers"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-500 focus:border-[#F59E0B] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What's your squad about?"
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-500 focus:border-[#F59E0B] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Max Members</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#F59E0B] focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-400 accent-[#F59E0B]"
                />
                <span className="text-sm font-semibold text-gray-300">Make this a public squad</span>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-lg border border-white/10 py-2 font-semibold text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSquad}
                disabled={loading}
                className="flex-1 rounded-lg bg-[#F59E0B] py-2 font-semibold text-black transition hover:bg-[#FB923C] disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.message && (
        <div
          className={`fixed bottom-4 right-4 rounded-lg px-6 py-3 text-white shadow-lg ${
            toast.type === 'success'
              ? 'bg-green-500'
              : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default SquadsPage;
