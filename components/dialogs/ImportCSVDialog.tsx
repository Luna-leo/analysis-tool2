"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CSVDataSourceType, CSVImportData } from "@/types"
import { getDataSourceTypes } from "@/data/dataSourceTypes"
import { useToast } from "@/hooks/use-toast"
import { validateCSVFiles } from "@/utils/csv/parseUtils"
import { PlantMachineFields } from "@/components/charts/EditModal/parameters/PlantMachineFields"
import { EventFields } from "@/components/charts/EditModal/parameters/EventFields"
import { useInputHistoryStore } from "@/stores/useInputHistoryStore"
import { Separator } from "@/components/ui/separator"

interface ImportCSVDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: CSVImportData) => Promise<void>
}

export function ImportCSVDialog({ open, onOpenChange, onImport }: ImportCSVDialogProps) {
  const [files, setFiles] = useState<File[]>([])
  const [plant, setPlant] = useState("")
  const [machineNo, setMachineNo] = useState("")
  const [dataSourceType, setDataSourceType] = useState<CSVDataSourceType>('CASS')
  const [label, setLabel] = useState("")
  const [labelDescription, setLabelDescription] = useState("")
  const [event, setEvent] = useState("")
  const [eventDetail, setEventDetail] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const { toast } = useToast()
  const { addPlantHistory, addMachineHistory } = useInputHistoryStore()
  
  // Debug log to check onImport prop
  React.useEffect(() => {
    console.log('[ImportCSVDialog] Component mounted/updated', {
      hasOnImport: !!onImport,
      onImportType: typeof onImport,
      isFunction: typeof onImport === 'function'
    })
  }, [onImport])

  const handleClose = () => {
    onOpenChange(false)
    // Reset form
    setFiles([])
    setPlant("")
    setMachineNo("")
    setDataSourceType('CASS')
    setLabel("")
    setLabelDescription("")
    setEvent("")
    setEventDetail("")
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      const csvFiles = validateCSVFiles(Array.from(selectedFiles))
      setFiles(csvFiles)
    }
  }

  const handleImport = async () => {
    console.log('[ImportCSVDialog] handleImport called')
    
    // Manual validation
    const errors: string[] = []
    if (!plant?.trim()) {
      errors.push('Plant is required')
    }
    if (!machineNo?.trim()) {
      errors.push('Machine No is required')
    }
    if (!files || files.length === 0) {
      errors.push('Please select at least one CSV file')
    }
    if (!label?.trim()) {
      errors.push('Label is required')
    }
    if (!event?.trim()) {
      errors.push('Event is required')
    }
    
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(', '),
        variant: "destructive",
      })
      return
    }

    console.log('[ImportCSVDialog] Validation passed, starting import', {
      files: files.map(f => ({ name: f.name, size: f.size })),
      plant,
      machineNo,
      dataSourceType
    })

    setIsImporting(true)
    try {
      console.log('[ImportCSVDialog] Calling onImport', {
        hasOnImport: !!onImport,
        onImportType: typeof onImport
      })
      
      if (!onImport) {
        throw new Error('onImport callback is not defined')
      }
      
      const importData = {
        files,
        plant,
        machineNo,
        dataSourceType,
        label,
        labelDescription,
        event,
        eventDetail
      }
      
      console.log('[ImportCSVDialog] Calling onImport with data:', importData)
      
      try {
        const result = await onImport(importData)
        console.log('[ImportCSVDialog] onImport returned:', result)
      } catch (onImportError) {
        console.error('[ImportCSVDialog] onImport threw error:', onImportError)
        throw onImportError
      }
      
      console.log('[ImportCSVDialog] onImport completed successfully')
      
      // Save to history on successful import
      addPlantHistory(plant)
      addMachineHistory(machineNo)
      
      handleClose()
    } catch (error) {
      console.error('[ImportCSVDialog] Import failed:', {
        error,
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        files: files.map(f => ({ name: f.name, size: f.size })),
        plant,
        machineNo,
        dataSourceType
      })
      
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "An error occurred during import",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const isValid = plant && machineNo && files.length > 0 && label && event

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>
            Import CSV files to register data periods
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="csv-files">Select CSV Files</Label>
            <Input
              id="csv-files"
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileSelect}
              disabled={isImporting}
            />
            {files.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {files.length} file(s) selected
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium mb-2">
              Plant * / Machine No *
            </div>
            <PlantMachineFields
              plant={plant}
              onPlantChange={setPlant}
              machineNo={machineNo}
              onMachineNoChange={setMachineNo}
              disabled={isImporting}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-sm font-medium mb-2">
              Event Information (Label & Event are required)
            </div>
            <EventFields
              label={label}
              onLabelChange={setLabel}
              labelDescription={labelDescription}
              onLabelDescriptionChange={setLabelDescription}
              event={event}
              onEventChange={setEvent}
              eventDetail={eventDetail}
              onEventDetailChange={setEventDetail}
              disabled={isImporting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data-source-type">Data Source Type</Label>
            <Select
              value={dataSourceType}
              onValueChange={(value) => setDataSourceType(value as CSVDataSourceType)}
              disabled={isImporting}
            >
              <SelectTrigger id="data-source-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getDataSourceTypes().map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!isValid || isImporting}>
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}