"use client"

import React from 'react'
import { FileX } from 'lucide-react'

interface MasterPageEmptyStateProps {
  itemName: string
  searchQuery?: string
}

export function MasterPageEmptyState({ 
  itemName, 
  searchQuery 
}: MasterPageEmptyStateProps) {
  return (
    <div className="text-center text-gray-500 py-12">
      <FileX className="mx-auto h-12 w-12 text-gray-400 mb-3" />
      <p className="text-lg font-medium">
        {searchQuery 
          ? `No ${itemName}s found matching "${searchQuery}"`
          : `No ${itemName}s found`
        }
      </p>
      <p className="text-sm mt-1">
        {searchQuery 
          ? 'Try adjusting your search terms'
          : `Click "Add New" to create your first ${itemName}`
        }
      </p>
    </div>
  )
}