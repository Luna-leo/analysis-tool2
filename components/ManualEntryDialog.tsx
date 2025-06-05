import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { TimeAdjustmentSection } from "./TimeAdjustmentSection"
import { useTimeAdjustment } from "@/hooks/useTimeAdjustment"
import { ManualEntryData } from "@/hooks/useManualEntry"
import { EventInfo } from "@/types"

interface ManualEntryDialogProps {
  isOpen: boolean
  editingItemId: string | null
  data: ManualEntryData
  onClose: () => void
  onUpdateData: (updates: Partial<ManualEntryData>) => void
  onSave: (data: ManualEntryData, editingItemId: string | null) => void
  isValid: boolean
}

export const ManualEntryDialog: React.FC<ManualEntryDialogProps> = ({
  isOpen,
  editingItemId,
  data,
  onClose,
  onUpdateData,
  onSave,
  isValid
}) => {
  const { target, setTarget, unit, setUnit, adjustTime } = useTimeAdjustment()

  const handleTimeAdjustment = (amount: number) => {
    adjustTime(
      { start: data.start, end: data.end },
      amount,
      (timeData) => onUpdateData(timeData)
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {editingItemId ? "Edit Data Entry" : "Add Manual Data Entry"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-y-auto p-2">
          {/* Required Fields */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-muted-foreground">Required Fields</h5>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manual-plant" className="text-sm">
                  Plant <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="manual-plant"
                  value={data.plant}
                  onChange={(e) => onUpdateData({ plant: e.target.value })}
                  className="mt-1"
                  placeholder="Enter plant name"
                  disabled={!!editingItemId}
                />
              </div>
              <div>
                <Label htmlFor="manual-machine" className="text-sm">
                  Machine No <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="manual-machine"
                  value={data.machineNo}
                  onChange={(e) => onUpdateData({ machineNo: e.target.value })}
                  className="mt-1"
                  placeholder="Enter machine number"
                  disabled={!!editingItemId}
                />
              </div>
            </div>
            
            {/* Legend Field */}
            <div>
              <Label htmlFor="manual-legend" className="text-sm">
                Legend <span className="text-red-500">*</span>
              </Label>
              <Input
                id="manual-legend"
                value={editingItemId ? data.legend : data.label}
                onChange={(e) => {
                  if (editingItemId) {
                    onUpdateData({ legend: e.target.value })
                  } else {
                    onUpdateData({ label: e.target.value })
                  }
                }}
                className="mt-1"
                placeholder="Enter legend"
              />
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manual-start" className="text-sm">
                    Start <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="manual-start"
                    type="datetime-local"
                    step="1"
                    value={data.start}
                    onChange={(e) => onUpdateData({ start: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-end" className="text-sm">
                    End <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="manual-end"
                    type="datetime-local"
                    step="1"
                    value={data.end}
                    onChange={(e) => onUpdateData({ end: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              {/* Time Adjustment */}
              {data.start && data.end && (
                <TimeAdjustmentSection
                  target={target}
                  unit={unit}
                  onTargetChange={setTarget}
                  onUnitChange={setUnit}
                  onAdjust={handleTimeAdjustment}
                />
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end items-center mt-4 flex-shrink-0 border-t pt-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={() => onSave(data, editingItemId)}
              disabled={!isValid}
            >
              {editingItemId ? "Update Entry" : "Add Entry"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}