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
import { useCSVValidation } from "@/hooks/useCSVValidation"
import { CSV_DEFAULTS, CSV_UI_TEXT } from "@/constants/csvImport"
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
  const [dataSourceType, setDataSourceType] = useState<CSVDataSourceType>(CSV_DEFAULTS.dataSourceType)
  const [isImporting, setIsImporting] = useState(false)
  const { toast } = useToast()
  const { validate } = useCSVValidation()
  const { addPlantHistory, addMachineHistory } = useInputHistoryStore()

  const handleClose = () => {
    onOpenChange(false)
    // Reset form
    setFiles([])
    setPlant("")
    setMachineNo("")
    setDataSourceType(CSV_DEFAULTS.dataSourceType)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      const csvFiles = validateCSVFiles(Array.from(selectedFiles))
      setFiles(csvFiles)
    }
  }

  const handleImport = async () => {
    const validation = validate({ plant, machineNo, files })
    
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
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
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "An error occurred during import",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const { isValid } = validate({ plant, machineNo, files })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>
            {CSV_UI_TEXT.importDescription}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="csv-files">{CSV_UI_TEXT.selectFiles}</Label>
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
                {CSV_UI_TEXT.filesSelected(files.length)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium mb-2">
              {CSV_UI_TEXT.plant} * / {CSV_UI_TEXT.machineNo} *
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
            <Label htmlFor="data-source-type">{CSV_UI_TEXT.dataSourceType}</Label>
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
            {CSV_UI_TEXT.cancel}
          </Button>
          <Button onClick={handleImport} disabled={!isValid || isImporting}>
            {isImporting ? CSV_UI_TEXT.importing : CSV_UI_TEXT.import}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}