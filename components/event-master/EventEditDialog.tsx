"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EventMaster } from "@/types"
import { formatDateTimeForInput } from "@/utils/dateUtils"

interface EventEditDialogProps {
  item: EventMaster
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (item: EventMaster) => void
  mode: 'add' | 'edit' | 'duplicate'
}

export function EventEditDialog({
  item,
  open,
  onOpenChange,
  onSave,
  mode,
}: EventEditDialogProps) {
  const [formData, setFormData] = useState<EventMaster>(item)

  useEffect(() => {
    setFormData(item)
  }, [item])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (field: keyof EventMaster, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Event' : mode === 'edit' ? 'Edit Event' : 'Duplicate Event'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plant">Plant</Label>
                <Input
                  id="plant"
                  value={formData.plant}
                  onChange={(e) => handleChange("plant", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="machineNo">Machine No</Label>
                <Input
                  id="machineNo"
                  value={formData.machineNo}
                  onChange={(e) => handleChange("machineNo", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => handleChange("label", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="labelDescription">Label Description</Label>
                <Input
                  id="labelDescription"
                  value={formData.labelDescription}
                  onChange={(e) =>
                    handleChange("labelDescription", e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event">Event</Label>
              <Input
                id="event"
                value={formData.event}
                onChange={(e) => handleChange("event", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDetail">Event Detail</Label>
              <Textarea
                id="eventDetail"
                value={formData.eventDetail}
                onChange={(e) => handleChange("eventDetail", e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={formatDateTimeForInput(formData.start)}
                  onChange={(e) => handleChange("start", e.target.value)}
                  step="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={formatDateTimeForInput(formData.end)}
                  onChange={(e) => handleChange("end", e.target.value)}
                  step="1"
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}