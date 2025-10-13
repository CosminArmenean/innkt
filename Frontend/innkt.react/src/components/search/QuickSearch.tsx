import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { socialService, UserProfile } from '../../services/social.service';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface QuickSearchProps {
  onUserSelect?: (user: UserProfile) => void;
  placeholder?: string;
  className?: string;
}

const QuickSearch: React.FC<QuickSearchProps> = ({
  onUserSelect,
  placeholder,
  className = ""
}) => {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t('search.searchUsers');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim()) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        performSearch();
      }, 300);
    } else {
      setResults([]);
      setIsOpen(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const searchResults = await socialService.search({
        query: query.trim(),
        type: 'users'
      });
      setResults(searchResults.users.slice(0, 5)); // Limit to 5 results
      setIsOpen(true);
    } catch (error) {
      console.error('Failed to search users:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (user: UserProfile) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onUserSelect?.(user);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder={defaultPlaceholder}
          className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (results.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="inline-block w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-gray-500">{t('search.searching')}</span>
            </div>
          ) : (
            <div className="py-2">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 text-xs">
                          {user.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 truncate">
                        {user.displayName}
                      </span>
                      {user.isVerified && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                  </div>
                </button>
              ))}
              
              {results.length === 0 && query.trim() && (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  {t('search.noUsersFoundFor', { query })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuickSearch;
