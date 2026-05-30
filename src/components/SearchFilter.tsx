import React, { useState, useEffect } from 'react';
import { searchEvents, getEventCategories } from '../services/api';

interface SearchFilterProps {
  onSearch: (results: any[]) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ onSearch }) => {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [billingTier, setBillingTier] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await getEventCategories();
      setCategories(response.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await searchEvents(keyword, category, billingTier ? parseInt(billingTier) : undefined);
      onSearch(response.events);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 rounded-lg p-4 space-y-3 border border-white/10">
      <div>
        <label className="text-xs font-semibold text-gray-300">Search</label>
        <input
          type="text"
          placeholder="Search events..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-300">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-300">Billing Tier</label>
          <select
            value={billingTier}
            onChange={(e) => setBillingTier(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white"
          >
            <option value="">All Tiers</option>
            <option value="1">💚 100% Covered</option>
            <option value="2">💙 ~75% Covered</option>
            <option value="3">💜 50% Covered</option>
            <option value="4">👑 Host Me</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSearch}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded px-3 py-2 text-sm font-semibold text-white transition"
      >
        {loading ? 'Searching...' : 'Search Events'}
      </button>
    </div>
  );
};
