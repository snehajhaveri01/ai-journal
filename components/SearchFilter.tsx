"use client";

import { useState } from "react";

export interface SearchFilterOptions {
  searchQuery: string;
  moodFilter: string;
  categoryFilter: string;
  dateRange: "all" | "today" | "week" | "month" | "year";
}

interface SearchFilterProps {
  onFilterChange: (filters: SearchFilterOptions) => void;
  categories: string[];
}

export default function SearchFilter({
  onFilterChange,
  categories,
}: SearchFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [moodFilter, setMoodFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateRange, setDateRange] = useState<
    "all" | "today" | "week" | "month" | "year"
  >("all");

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    onFilterChange({ searchQuery: value, moodFilter, categoryFilter, dateRange });
  }

  function handleMoodChange(value: string) {
    setMoodFilter(value);
    onFilterChange({ searchQuery, moodFilter: value, categoryFilter, dateRange });
  }

  function handleCategoryChange(value: string) {
    setCategoryFilter(value);
    onFilterChange({ searchQuery, moodFilter, categoryFilter: value, dateRange });
  }

  function handleDateRangeChange(value: "all" | "today" | "week" | "month" | "year") {
    setDateRange(value);
    onFilterChange({ searchQuery, moodFilter, categoryFilter, dateRange: value });
  }

  function clearFilters() {
    setSearchQuery("");
    setMoodFilter("");
    setCategoryFilter("");
    setDateRange("all");
    onFilterChange({ searchQuery: "", moodFilter: "", categoryFilter: "", dateRange: "all" });
  }

  const hasActiveFilters = searchQuery || moodFilter || categoryFilter || dateRange !== "all";

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search your journal..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Filter Toggle Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl border-2 transition-all ${
            hasActiveFilters
              ? "border-purple-500 bg-purple-50 text-purple-700"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 text-xs bg-purple-600 text-white rounded-full">
              •
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Options */}
      {isOpen && (
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-4">
          {/* Date Range */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Time Period
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "All Time" },
                { value: "today", label: "Today" },
                { value: "week", label: "This Week" },
                { value: "month", label: "This Month" },
                { value: "year", label: "This Year" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDateRangeChange(option.value as any)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                    dateRange === option.value
                      ? "bg-purple-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-purple-500"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mood Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Mood
            </label>
            <div className="flex gap-2">
              {[
                { value: "", label: "All", emoji: "🌈" },
                { value: "positive", label: "Positive", emoji: "😊" },
                { value: "neutral", label: "Neutral", emoji: "😐" },
                { value: "negative", label: "Negative", emoji: "😔" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleMoodChange(option.value)}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg transition-all ${
                    moodFilter === option.value
                      ? "bg-purple-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-purple-500"
                  }`}
                >
                  <div className="text-lg mb-1">{option.emoji}</div>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
