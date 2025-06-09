"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface SignalSearchSectionProps {
  onSearchSignals: () => void
}

export function SignalSearchSection({ onSearchSignals }: SignalSearchSectionProps) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">Signal Search</h4>
        <Button
          variant="default"
          size="sm"
          className="h-7 text-xs"
          onClick={onSearchSignals}
        >
          <Search className="h-3 w-3 mr-1" />
          Search Signals
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Search for trigger signals to automatically identify events based on conditions.
      </p>
    </div>
  )
}