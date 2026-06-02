import React, { useState, useEffect } from 'react';
import { searchEvents, getEventCategories } from '../services/api';

interface SearchFilterProps {
  onSearch: (results: any[]) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ onSearch }) => {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
      const response = await searchEvents(keyword, category);
      onSearch(response.events);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <input
        type="text"
        placeholder="Search events..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
      />

      {isSearchFocused && (
        <div className="mt-4 bg-white/10 rounded-2xl p-4 space-y-3 border border-white/10">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-xl px-3 py-2 text-sm font-semibold text-white transition"
          >
            {loading ? 'Searching...' : 'Search Events'}
          </button>
        </div>
      )}
    </div>
  );
};
