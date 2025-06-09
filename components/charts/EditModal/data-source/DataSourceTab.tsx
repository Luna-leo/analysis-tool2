"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Database, CalendarDays } from "lucide-react"
import { ManualEntryDialog, TriggerSignalDialog } from "../../../dialogs"
import { useManualEntry } from "@/hooks/useManualEntry"
import { EventInfo } from "@/types"
import {
  ManualEntrySection,
  SignalSearchSection,
  EventInformationSection,
  TimeOffsetSettings,
  SelectedDataSourceTable
} from "./components"

type DataSourceType = 'manual' | 'signal' | 'event'

interface DataSourceTabProps {
  selectedDataSourceItems: EventInfo[]
  setSelectedDataSourceItems: React.Dispatch<React.SetStateAction<EventInfo[]>>
}

export function DataSourceTab({
  selectedDataSourceItems,
  setSelectedDataSourceItems,
}: DataSourceTabProps) {
  const [events, setEvents] = useState<EventInfo[]>([
    {
      id: "1",
      plant: "Plant A",
      machineNo: "M001",
      label: "Maintenance",
      labelDescription: "Regular check",
      event: "Scheduled Stop",
      eventDetail: "Monthly maintenance",
      start: "2024-01-15T10:00:00",
      end: "2024-01-15T12:00:00",
    },
    {
      id: "2",
      plant: "Plant A",
      machineNo: "M002",
      label: "Production",
      labelDescription: "Normal run",
      event: "Normal Operation",
      eventDetail: "Batch processing",
      start: "2024-01-15T08:00:00",
      end: "2024-01-15T16:00:00",
    },
    {
      id: "3",
      plant: "Plant B",
      machineNo: "M003",
      label: "Alert",
      labelDescription: "Warning state",
      event: "Temperature Warning",
      eventDetail: "Above threshold",
      start: "2024-01-15T14:30:00",
      end: "2024-01-15T14:45:00",
    },
  ])
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())
  const [activeDataSourceType, setActiveDataSourceType] = useState<DataSourceType>('event')

  const manualEntry = useManualEntry()
  const [triggerSignalDialogOpen, setTriggerSignalDialogOpen] = useState(false)

  const [startOffset, setStartOffset] = useState(0)
  const [startOffsetUnit, setStartOffsetUnit] = useState<'min' | 'sec'>('min')
  const [endOffset, setEndOffset] = useState(0)
  const [endOffsetUnit, setEndOffsetUnit] = useState<'min' | 'sec'>('min')
  const [offsetSectionOpen, setOffsetSectionOpen] = useState(false)

  const handleSaveManualEntry = (data: any, editingItemId: string | null) => {
    if (editingItemId) {
      const updatedItem = { ...data }
      if (data.legend) {
        const legendMatch = data.legend.match(/^(.+?)\s*\((.+)\)$/)
        if (legendMatch) {
          updatedItem.label = legendMatch[1].trim()
          updatedItem.labelDescription = legendMatch[2].trim()
        } else {
          updatedItem.label = data.legend
          updatedItem.labelDescription = ""
        }
      }
      setSelectedDataSourceItems(
        selectedDataSourceItems.map((item) =>
          item.id === editingItemId ? updatedItem : item
        )
      )
    } else {
      const newEntry: EventInfo = {
        ...data,
        id: Date.now().toString(),
      }
      setSelectedDataSourceItems([...selectedDataSourceItems, newEntry])
    }
    manualEntry.close()
  }

  const handleAddTriggerSignalResults = (results: EventInfo[]) => {
    setSelectedDataSourceItems([...selectedDataSourceItems, ...results])
  }

  return (
    <>
      <div className="space-y-4">
        {/* Data Source Type Selection */}
        <div className="border rounded-lg p-3">
          <h4 className="text-sm font-medium mb-3">Add Data Source</h4>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={activeDataSourceType === 'manual' ? 'default' : 'outline'}
              size="sm"
              className="h-10 justify-start gap-2 px-3"
              onClick={() => setActiveDataSourceType('manual')}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="text-xs">Manual Entry</span>
            </Button>
            <Button
              variant={activeDataSourceType === 'signal' ? 'default' : 'outline'}
              size="sm"
              className="h-10 justify-start gap-2 px-3"
              onClick={() => setActiveDataSourceType('signal')}
            >
              <Database className="h-4 w-4 shrink-0" />
              <span className="text-xs">Signal Search</span>
            </Button>
            <Button
              variant={activeDataSourceType === 'event' ? 'default' : 'outline'}
              size="sm"
              className="h-10 justify-start gap-2 px-3"
              onClick={() => setActiveDataSourceType('event')}
            >
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span className="text-xs">Event Information</span>
            </Button>
          </div>
        </div>

        {/* Active Data Source Section */}
        {activeDataSourceType === 'manual' && (
          <ManualEntrySection onCreateManualEntry={manualEntry.openForNew} />
        )}

        {activeDataSourceType === 'signal' && (
          <SignalSearchSection onSearchSignals={() => setTriggerSignalDialogOpen(true)} />
        )}

        {activeDataSourceType === 'event' && (
          <EventInformationSection
            events={events}
            selectedEventIds={selectedEventIds}
            setSelectedEventIds={setSelectedEventIds}
            selectedDataSourceItems={selectedDataSourceItems}
            onAddSelectedEvents={(selectedEvents) => {
              const newItems = [...selectedDataSourceItems]
              selectedEvents.forEach((event) => {
                if (!newItems.find((item) => item.id === event.id)) {
                  newItems.push(event)
                }
              })
              setSelectedDataSourceItems(newItems)
            }}
          />
        )}

        {/* Selected Data Source */}
        <div className="border rounded-lg p-3 bg-muted/30">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Selected Data Source</h4>
          </div>

          {selectedDataSourceItems.length > 0 ? (
            <div className="space-y-3">
              <SelectedDataSourceTable
                selectedDataSourceItems={selectedDataSourceItems}
                onEditItem={(item) => manualEntry.openForEdit(item)}
                onRemoveItem={(itemId) => {
                  setSelectedDataSourceItems(
                    selectedDataSourceItems.filter((i) => i.id !== itemId)
                  )
                }}
              />

              <TimeOffsetSettings
                startOffset={startOffset}
                setStartOffset={setStartOffset}
                startOffsetUnit={startOffsetUnit}
                setStartOffsetUnit={setStartOffsetUnit}
                endOffset={endOffset}
                setEndOffset={setEndOffset}
                endOffsetUnit={endOffsetUnit}
                setEndOffsetUnit={setEndOffsetUnit}
                offsetSectionOpen={offsetSectionOpen}
                setOffsetSectionOpen={setOffsetSectionOpen}
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No data source items selected. Use the options above to add data sources.</p>
          )}
        </div>
      </div>

      <ManualEntryDialog
        isOpen={manualEntry.isOpen}
        editingItemId={manualEntry.editingItemId}
        data={manualEntry.data}
        onClose={manualEntry.close}
        onUpdateData={manualEntry.updateData}
        onSave={handleSaveManualEntry}
        isValid={manualEntry.isValid()}
      />

      <TriggerSignalDialog
        isOpen={triggerSignalDialogOpen}
        onClose={() => setTriggerSignalDialogOpen(false)}
        onAddToDataSource={handleAddTriggerSignalResults}
        availableEvents={events}
      />
    </>
  )
}

