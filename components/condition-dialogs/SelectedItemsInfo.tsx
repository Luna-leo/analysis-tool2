"use client"

import React from "react"

interface SelectedItemsInfoProps {
  itemCount: number
  itemLabel?: string
  message: string
  className?: string
}

export function SelectedItemsInfo({ 
  itemCount, 
  itemLabel = "period",
  message,
  className = ""
}: SelectedItemsInfoProps) {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      <p className="text-sm font-medium text-blue-800 mb-2">
        Conditions will be applied to {itemCount} {itemLabel}{itemCount !== 1 ? 's' : ''}
      </p>
      <p className="text-xs text-blue-700">{message}</p>
    </div>
  )
}