"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface ManualEntrySectionProps {
  onCreateManualEntry: () => void
}

export function ManualEntrySection({ onCreateManualEntry }: ManualEntrySectionProps) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">Manual Entry</h4>
        <Button
          variant="default"
          size="sm"
          className="h-7 text-xs"
          onClick={onCreateManualEntry}
        >
          <Plus className="h-3 w-3 mr-1" />
          Create Manual Entry
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Click "Create Manual Entry" to add custom data points with specific time ranges and labels.
      </p>
    </div>
  )
}