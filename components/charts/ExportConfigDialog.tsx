import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download } from 'lucide-react'

interface ExportConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (filename?: string) => void
  defaultFilename: string
  isExporting?: boolean
}

export function ExportConfigDialog({
  open,
  onOpenChange,
  onExport,
  defaultFilename,
  isExporting = false
}: ExportConfigDialogProps) {
  const [filename, setFilename] = useState('')
  
  // Format timestamp for preview
  const getTimestamp = () => {
    const now = new Date()
    return now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') + '-' +
      String(now.getMinutes()).padStart(2, '0') + '-' +
      String(now.getSeconds()).padStart(2, '0')
  }

  // Sanitize filename to remove invalid characters
  const sanitizeFilename = (name: string): string => {
    // Remove or replace invalid filename characters
    return name
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid chars with underscore
      .replace(/\.+$/, '') // Remove trailing dots
      .replace(/^\.+/, '') // Remove leading dots
      .trim()
  }

  // Preview filename that will be used
  const getPreviewFilename = () => {
    if (filename.trim()) {
      return `${sanitizeFilename(filename)}.json`
    }
    return `${defaultFilename}_${getTimestamp()}.json`
  }

  // Reset filename when dialog opens
  useEffect(() => {
    if (open) {
      setFilename('')
    }
  }, [open])

  const handleExport = () => {
    const sanitized = filename.trim() ? sanitizeFilename(filename) : undefined
    onExport(sanitized)
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isExporting) {
      handleExport()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Configuration</DialogTitle>
          <DialogDescription>
            Export the current chart configuration to a JSON file
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="filename">Filename (optional)</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={`${defaultFilename}_${getTimestamp()}`}
              onKeyDown={handleKeyDown}
              disabled={isExporting}
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to use default filename with timestamp
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Preview</Label>
            <div className="rounded-md bg-muted px-3 py-2 text-sm font-mono">
              {getPreviewFilename()}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}