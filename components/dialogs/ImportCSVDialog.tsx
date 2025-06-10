"use client"

import { useState, useCallback, useRef } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CSVDataSourceType, CSVImportData } from "@/types"

interface ImportCSVDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: CSVImportData) => Promise<void>
}

export function ImportCSVDialog({ open, onOpenChange, onImport }: ImportCSVDialogProps) {
  const [dataSourceType, setDataSourceType] = useState<CSVDataSourceType>("SSAC")
  const [plant, setPlant] = useState("")
  const [machineNo, setMachineNo] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      const csvFiles = Array.from(selectedFiles).filter(file => 
        file.name.endsWith('.csv') || file.name.endsWith('.CSV')
      )
      setFiles(csvFiles)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
      file.name.endsWith('.csv') || file.name.endsWith('.CSV')
    )
    setFiles(droppedFiles)
  }, [])

  const handleImport = async () => {
    const importData: CSVImportData = {
      dataSourceType,
      plant,
      machineNo,
      files
    }
    await onImport(importData)
    handleReset()
    onOpenChange(false)
  }

  const handleReset = () => {
    setDataSourceType("SSAC")
    setPlant("")
    setMachineNo("")
    setFiles([])
  }

  const isValid = plant && machineNo && files.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>
            CSVファイルをインポートして、データを取り込みます。
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Data Source Type Selection */}
          <div className="space-y-2">
            <Label>データソースの種類</Label>
            <RadioGroup value={dataSourceType} onValueChange={(value) => setDataSourceType(value as CSVDataSourceType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SSAC" id="ssac" />
                <Label htmlFor="ssac">SSAC</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SCA" id="sca" />
                <Label htmlFor="sca">SCA</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="INOMOT" id="inomot" />
                <Label htmlFor="inomot">INOMOT</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Plant and Machine No */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plant">Plant</Label>
              <Input
                id="plant"
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
                placeholder="例: Plant A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="machineNo">Machine No</Label>
              <Input
                id="machineNo"
                value={machineNo}
                onChange={(e) => setMachineNo(e.target.value)}
                placeholder="例: M-001"
              />
            </div>
          </div>

          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>ファイル選択</Label>
            <div
              className={`
                border-2 border-dashed rounded-lg p-6 text-center transition-colors
                ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}
                ${files.length > 0 ? 'bg-gray-50' : ''}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {files.length === 0 ? (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    CSVファイルをドラッグ＆ドロップ、または
                  </p>
                  <div className="mt-2 flex gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      ファイルを選択
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => folderInputRef.current?.click()}
                    >
                      フォルダを選択
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.CSV"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <input
                    ref={folderInputRef}
                    type="file"
                    accept=".csv,.CSV"
                    multiple
                    {...{ webkitdirectory: "" } as any}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{files.length}個のファイルが選択されました</p>
                  <div className="max-h-32 overflow-y-auto">
                    {files.map((file, index) => (
                      <p key={index} className="text-xs text-gray-600">{file.name}</p>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFiles([])}
                  >
                    クリア
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleImport} disabled={!isValid}>
            インポート
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}