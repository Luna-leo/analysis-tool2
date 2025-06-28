"use client"

import React, { useEffect, memo } from "react"
import { InputCombobox } from "@/components/ui/input-combobox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useInputHistoryStore } from "@/stores/useInputHistoryStore"

/**
 * Props for EventFields component
 */
interface EventFieldsProps {
  /** Current label value */
  label: string
  /** Callback when label value changes */
  onLabelChange: (label: string) => void
  /** Current label description value */
  labelDescription: string
  /** Callback when label description changes */
  onLabelDescriptionChange: (labelDescription: string) => void
  /** Current event value */
  event: string
  /** Callback when event value changes */
  onEventChange: (event: string) => void
  /** Current event detail value */
  eventDetail: string
  /** Callback when event detail changes */
  onEventDetailChange: (eventDetail: string) => void
  /** Whether the fields are disabled */
  disabled?: boolean
  /** Flag to indicate when to save to history (typically on successful save/import) */
  onSave?: boolean
}

/**
 * Reusable component for Event registration fields
 * Features input history with suggestions from previous entries
 */
export const EventFields = memo(function EventFields({
  label,
  onLabelChange,
  labelDescription,
  onLabelDescriptionChange,
  event,
  onEventChange,
  eventDetail,
  onEventDetailChange,
  disabled = false,
  onSave = false
}: EventFieldsProps) {
  const { 
    getLabelSuggestions, 
    getEventSuggestions,
    addLabelHistory,
    addEventHistory
  } = useInputHistoryStore()

  // Save to history when onSave flag is true
  useEffect(() => {
    if (onSave) {
      if (label.trim()) {
        addLabelHistory(label)
      }
      if (event.trim()) {
        addEventHistory(event)
      }
    }
  }, [onSave, label, event, addLabelHistory, addEventHistory])

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="event-label">Label</Label>
        <InputCombobox
          value={label}
          onChange={onLabelChange}
          suggestions={getLabelSuggestions()}
          placeholder="e.g., TRIP, ALARM, MAINTENANCE"
          disabled={disabled}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="event-label-description">Label Description</Label>
        <InputCombobox
          value={labelDescription}
          onChange={onLabelDescriptionChange}
          suggestions={[]} // No history for descriptions, they are usually unique
          placeholder="e.g., Emergency shutdown of turbine (Optional)"
          disabled={disabled}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="event-name">Event</Label>
        <InputCombobox
          value={event}
          onChange={onEventChange}
          suggestions={getEventSuggestions()}
          placeholder="e.g., Over Temperature, High Vibration"
          disabled={disabled}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="event-detail">Event Detail</Label>
        <Textarea
          id="event-detail"
          value={eventDetail}
          onChange={(e) => onEventDetailChange(e.target.value)}
          placeholder="Detailed description of what happened... (Optional)"
          disabled={disabled}
          className="min-h-[80px] resize-vertical"
        />
      </div>
    </div>
  )
})