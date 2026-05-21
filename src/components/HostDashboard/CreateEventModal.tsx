import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLightMode?: boolean;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, isLightMode = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxGuests: '',
    price: ''
  });

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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form data:', formData);
    onClose();
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
              {/* Event Title */}
              <div>
                <label className="block text-sm font-semibold mb-2">Event Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
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
                  placeholder="e.g., San Francisco, CA"
                  className={`w-full px-4 py-2 rounded-lg ${
                    isLightMode
                      ? 'bg-[#f7f3ea] border-black/10'
                      : 'bg-gray-800 border-gray-700'
                  } border focus:outline-none focus:ring-2 focus:ring-red-500`}
                  required
                />
              </div>

              {/* Max Guests & Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Max Guests *</label>
                  <input
                    type="number"
                    name="maxGuests"
                    value={formData.maxGuests}
                    onChange={handleChange}
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
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                    isLightMode
                      ? 'bg-gray-300 text-[#241b10] hover:bg-gray-400'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Create Event
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
