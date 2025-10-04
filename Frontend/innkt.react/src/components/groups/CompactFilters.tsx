import React from 'react';
import { 
  ClockIcon, 
  FireIcon, 
  ChatBubbleLeftRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface CompactFiltersProps {
  activeFilter: 'all' | 'recent' | 'popular' | 'discussions';
  onFilterChange: (filter: 'all' | 'recent' | 'popular' | 'discussions') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showSearch: boolean;
  onToggleSearch: () => void;
}

const CompactFilters: React.FC<CompactFiltersProps> = ({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  showSearch,
  onToggleSearch
}) => {
  const filters = [
    { id: 'all', icon: null, label: 'All' },
    { id: 'recent', icon: ClockIcon, label: 'Recent' },
    { id: 'popular', icon: FireIcon, label: 'Popular' },
    { id: 'discussions', icon: ChatBubbleLeftRightIcon, label: 'Discussions' }
  ];

  return (
    <div className="flex items-center justify-between">
      {/* Compact Filter Pills */}
      <div className="flex items-center space-x-1">
        {filters.map((filter) => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id as any)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeFilter === filter.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {Icon && <Icon className="w-3 h-3" />}
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search and Filter Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleSearch}
          className={`p-1.5 rounded-lg transition-colors ${
            showSearch 
              ? 'bg-purple-100 text-purple-600' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
        >
          <MagnifyingGlassIcon className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <FunnelIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Compact Search Bar */}
      {showSearch && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactFilters;
