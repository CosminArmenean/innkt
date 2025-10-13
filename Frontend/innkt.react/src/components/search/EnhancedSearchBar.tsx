import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../../services/search.service';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  ClockIcon,
  FireIcon,
  HashtagIcon,
  UserGroupIcon,
  DocumentTextIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface EnhancedSearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  onResultClick?: (result: any) => void;
}

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  placeholder = "Search for posts, users, groups...",
  className = '',
  onSearch,
  onResultClick
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecentSearches();
    loadTrendingSearches();
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      loadSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadRecentSearches = () => {
    const recent = searchService.getRecentSearches();
    setRecentSearches(recent);
  };

  const loadTrendingSearches = async () => {
    try {
      const trending = await searchService.getTrendingSearches(5);
      setTrendingSearches(trending.map(t => t.query));
    } catch (error) {
      console.error('Failed to load trending searches:', error);
    }
  };

  const loadSuggestions = useCallback(async () => {
    if (query.length < 2) return;

    setLoading(true);
    try {
      const suggestions = await searchService.getSearchSuggestions(query, 8);
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowDropdown(true);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    const totalItems = getDropdownItems().length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0) {
          const items = getDropdownItems();
          const selectedItem = items[activeIndex];
          if (selectedItem) {
            handleItemClick(selectedItem);
          }
        } else if (query.trim()) {
          handleSearch(query.trim());
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setActiveIndex(-1);
        break;
    }
  };

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setShowDropdown(false);
    setActiveIndex(-1);
    searchService.addToRecentSearches(searchQuery);
    loadRecentSearches();

    if (onSearch) {
      onSearch(searchQuery);
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleItemClick = (item: DropdownItem) => {
    setQuery(item.query || '');
    setShowDropdown(false);
    setActiveIndex(-1);
    handleSearch(item.query || '');
  };

  const clearSearch = () => {
    setQuery('');
    setShowDropdown(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const getDropdownItems = (): DropdownItem[] => {
    const items: DropdownItem[] = [];

    // Add suggestions
    if (suggestions.length > 0) {
      items.push({
        type: 'header',
        title: 'Suggestions',
        icon: MagnifyingGlassIcon
      });
      suggestions.forEach(suggestion => {
        items.push({
          type: 'suggestion',
          query: suggestion,
          icon: MagnifyingGlassIcon
        });
      });
    }

    // Add recent searches
    if (recentSearches.length > 0 && query.length < 2) {
      items.push({
        type: 'header',
        title: 'Recent Searches',
        icon: ClockIcon
      });
      recentSearches.slice(0, 5).forEach(recent => {
        items.push({
          type: 'recent',
          query: recent,
          icon: ClockIcon
        });
      });
    }

    // Add trending searches
    if (trendingSearches.length > 0 && query.length < 2) {
      items.push({
        type: 'header',
        title: 'Trending',
        icon: FireIcon
      });
      trendingSearches.slice(0, 3).forEach(trending => {
        items.push({
          type: 'trending',
          query: trending,
          icon: FireIcon
        });
      });
    }

    return items;
  };

  const renderDropdownItem = (item: DropdownItem, index: number) => {
    const isActive = index === activeIndex;
    const Icon = item.icon;

    if (item.type === 'header') {
      return (
        <div
          key={`header-${index}`}
          className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100"
        >
          <div className="flex items-center space-x-2">
            <Icon className="w-3 h-3" />
            <span>{item.title}</span>
          </div>
        </div>
      );
    }

    return (
      <button
        key={`${item.type}-${index}`}
        onClick={() => handleItemClick(item)}
        className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center space-x-3 ${
          isActive ? 'bg-gray-50' : ''
        }`}
      >
        <Icon className={`w-4 h-4 ${
          item.type === 'suggestion' ? 'text-blue-500' :
          item.type === 'recent' ? 'text-gray-400' :
          item.type === 'trending' ? 'text-orange-500' : 'text-gray-400'
        }`} />
        <span className="text-sm text-gray-900 truncate">{item.query}</span>
        {item.type === 'trending' && (
          <span className="ml-auto text-xs text-orange-500">🔥</span>
        )}
      </button>
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-4 text-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-xs text-gray-500 mt-1">Searching...</p>
            </div>
          ) : (
            <div>
              {getDropdownItems().length > 0 ? (
                getDropdownItems().map((item, index) => renderDropdownItem(item, index))
              ) : (
                <div className="px-3 py-4 text-center text-gray-500">
                  <p className="text-sm">No suggestions found</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface DropdownItem {
  type: 'header' | 'suggestion' | 'recent' | 'trending';
  query?: string;
  title?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default EnhancedSearchBar;
