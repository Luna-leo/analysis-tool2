"use client"

import { useState } from "react"
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
import { useInputHistoryStore } from "@/stores/useInputHistoryStore"

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
  const [isImporting, setIsImporting] = useState(false)
  const { toast } = useToast()
  const { addPlantHistory, addMachineHistory } = useInputHistoryStore()

  const handleClose = () => {
    onOpenChange(false)
    // Reset form
    setFiles([])
    setPlant("")
    setMachineNo("")
    setDataSourceType('CASS')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      const csvFiles = validateCSVFiles(Array.from(selectedFiles))
      setFiles(csvFiles)
    }
  }

  const handleImport = async () => {
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
    
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(', '),
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    try {
      await onImport({
        files,
        plant,
        machineNo,
        dataSourceType
      })
      
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

  const isValid = plant && machineNo && files.length > 0

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