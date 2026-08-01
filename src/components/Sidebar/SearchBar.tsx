import React from 'react';
import { Search, Filter } from 'lucide-react';
import { ChatFilter } from '../../types';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: ChatFilter;
  onFilterChange: (filter: ChatFilter) => void;
  darkTheme: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  darkTheme,
}) => {
  const filters: { id: ChatFilter; label: string }[] = [
    { id: 'all', label: 'הכל' },
    { id: 'unread', label: 'שלא נקראו' },
    { id: 'favorites', label: 'מועדפים' },
    { id: 'groups', label: 'קבוצות' },
  ];

  return (
    <div className={`p-2 flex flex-col gap-2 ${
      darkTheme ? 'bg-[#111b21] border-b border-[#222d34]' : 'bg-white border-b border-[#e9edef]'
    }`}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute right-3 text-[#8696a0] pointer-events-none">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="חפש או התחל צ'אט חדש..."
          className={`w-full pr-10 pl-4 py-1.5 text-sm rounded-lg focus:outline-none transition-colors ${
            darkTheme 
              ? 'bg-[#202c33] text-[#e9edef] placeholder-[#8696a0] focus:bg-[#111b21]' 
              : 'bg-[#f0f2f5] text-[#111b21] placeholder-[#667781] focus:bg-white'
          }`}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute left-3 text-[#8696a0] hover:text-[#e9edef] text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Tabs / Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#00a884]/20 text-[#00a884] ring-1 ring-[#00a884]/50'
                  : darkTheme
                  ? 'bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]'
                  : 'bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
