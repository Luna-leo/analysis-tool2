"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface MasterPageHeaderProps {
  title: string
  icon: LucideIcon
  searchQuery: string
  onSearchChange: (value: string) => void
  onAdd: () => void
  searchPlaceholder?: string
  
  // Category filter (optional)
  categories?: string[]
  selectedCategory?: string
  onCategoryChange?: (value: string) => void
  
  // Additional actions (optional)
  additionalActions?: React.ReactNode
}

export function MasterPageHeader({
  title,
  icon: Icon,
  searchQuery,
  onSearchChange,
  onAdd,
  searchPlaceholder = "Search...",
  categories,
  selectedCategory,
  onCategoryChange,
  additionalActions
}: MasterPageHeaderProps) {
  return (
    <div className="p-4 md:p-6 border-b space-y-4">
      {/* Title and Add Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Icon className="h-7 w-7" />
          {title}
        </h1>
        <div className="flex items-center gap-2">
          {additionalActions}
          <Button onClick={onAdd} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {categories && categories.length > 0 && onCategoryChange && (
          <Select value={selectedCategory || 'all'} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}