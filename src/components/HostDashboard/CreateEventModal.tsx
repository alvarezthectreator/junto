import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader } from 'lucide-react';
import * as API from '../../services/api';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLightMode?: boolean;
  currentUser?: any;
  onEventCreated?: (event: any) => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, isLightMode = false, currentUser, onEventCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxGuests: '',
    price: '',
    billingTier: '1'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pageClass = isLightMode ? 'bg-[#f7f3ea]' : 'bg-[#0F0F13]';
  const surfaceClass = isLightMode ? 'bg-white border-black/10' : 'bg-gray-900 border-gray-800';
  const mutedClass = isLightMode ? 'text-[#7a674f]' : 'text-gray-400';

  const modalVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const contentVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!currentUser?.id) {
        setError('You must be logged in to create an event');
        setLoading(false);
        return;
      }

      if (!formData.title || !formData.location || !formData.date || !formData.time) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Call API to create event
      const newEvent = await API.createEvent({
        host_id: currentUser.id,
        title: formData.title,
        description: formData.description,
        location_city: formData.location,
        event_date: formData.date,
        event_time: formData.time,
        max_guests: parseInt(formData.maxGuests) || 20,
        guest_fee: parseFloat(formData.price) || 0,
        host_fee: parseFloat(formData.price) ? (parseFloat(formData.price) * 0.1) : 0,
        billing_tier: parseInt(formData.billingTier)
      });

      onEventCreated?.(newEvent);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        maxGuests: '',
        price: '',
        billingTier: '1'
      });
      
      setLoading(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            variants={contentVariants}
            className={`${surfaceClass} rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold">Create New Event</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Event Title */}
              <div>
                <label className="block text-sm font-semibold mb-2">Event Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="e.g., Rooftop Dinner Party"
                  className={`w-full px-4 py-2 rounded-lg ${
                    isLightMode
                      ? 'bg-[#f7f3ea] border-black/10'
                      : 'bg-gray-800 border-gray-700'
                  } border focus:outline-none focus:ring-2 focus:ring-red-500`}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Tell guests about your event..."
                  rows={4}
                  className={`w-full px-4 py-2 rounded-lg ${
                    isLightMode
                      ? 'bg-[#f7f3ea] border-black/10'
                      : 'bg-gray-800 border-gray-700'
                  } border focus:outline-none focus:ring-2 focus:ring-red-500`}
                  required
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full px-4 py-2 rounded-lg ${
                      isLightMode
                        ? 'bg-[#f7f3ea] border-black/10'
                        : 'bg-gray-800 border-gray-700'
                    } border focus:outline-none focus:ring-2 focus:ring-red-500`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Time *</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full px-4 py-2 rounded-lg ${
                      isLightMode
                        ? 'bg-[#f7f3ea] border-black/10'
                        : 'bg-gray-800 border-gray-700'
                    } border focus:outline-none focus:ring-2 focus:ring-red-500`}
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold mb-2">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="e.g., San Francisco, CA"
                  className={`w-full px-4 py-2 rounded-lg ${
                    isLightMode
                      ? 'bg-[#f7f3ea] border-black/10'
                      : 'bg-gray-800 border-gray-700'
                  } border focus:outline-none focus:ring-2 focus:ring-red-500`}
                  required
                />
              </div>

              {/* Billing Tier, Max Guests & Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Tier *</label>
                  <select
                    name="billingTier"
                    value={formData.billingTier}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full px-4 py-2 rounded-lg ${
                      isLightMode
                        ? 'bg-[#f7f3ea] border-black/10'
                        : 'bg-gray-800 border-gray-700'
                    } border focus:outline-none focus:ring-2 focus:ring-red-500`}
                  >
                    <option value="1">Tier 1 (Starter)</option>
                    <option value="2">Tier 2 (Social)</option>
                    <option value="3">Tier 3 (Premium)</option>
                    <option value="4">Tier 4 (Elite)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Max Guests *</label>
                  <input
                    type="number"
                    name="maxGuests"
                    value={formData.maxGuests}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="20"
                    min="1"
                    className={`w-full px-4 py-2 rounded-lg ${
                      isLightMode
                        ? 'bg-[#f7f3ea] border-black/10'
                        : 'bg-gray-800 border-gray-700'
                    } border focus:outline-none focus:ring-2 focus:ring-red-500`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Price (Optional)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="45"
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2 rounded-lg ${
                      isLightMode
                        ? 'bg-[#f7f3ea] border-black/10'
                        : 'bg-gray-800 border-gray-700'
                    } border focus:outline-none focus:ring-2 focus:ring-red-500`}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                    isLightMode
                      ? 'bg-gray-300 text-[#241b10] hover:bg-gray-400'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      Creating...
                    </>
                  ) : (
                    'Create Event'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateEventModal;
