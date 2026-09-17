"use client";

import React from "react";
import { Search, Globe, MapPin } from "lucide-react";
import { useCategories } from "@/lib/query/categories.query";

interface EventFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string | undefined;
  onCategoryChange: (categoryId: string | undefined) => void;
  isOnline: boolean | undefined;
  onFormatChange: (isOnline: boolean | undefined) => void;
}

export function EventFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  isOnline,
  onFormatChange,
}: EventFiltersProps) {
  const { data: categories = [] } = useCategories();

  return (
    <div className="space-y-4">
      {/* Search and Format Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events by title, topic, or location..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2.5 pr-4 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
        </div>

        {/* Format Selector Pills */}
        <div className="flex shrink-0 items-center rounded-lg border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => onFormatChange(undefined)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              isOnline === undefined
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Formats
          </button>
          <button
            type="button"
            onClick={() => onFormatChange(false)}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              isOnline === false
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPin className="h-3 w-3" />
            In-Person
          </button>
          <button
            type="button"
            onClick={() => onFormatChange(true)}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              isOnline === true
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3 w-3" />
            Online
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            Category:
          </span>
          <button
            type="button"
            onClick={() => onCategoryChange(undefined)}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
              selectedCategory === undefined
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                onCategoryChange(
                  selectedCategory === cat.id ? undefined : cat.id,
                )
              }
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                selectedCategory === cat.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
