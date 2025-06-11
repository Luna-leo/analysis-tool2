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

interface ImportCSVDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: CSVImportData) => Promise<void>
}

export function ImportCSVDialog({ open, onOpenChange, onImport }: ImportCSVDialogProps) {
  const [files, setFiles] = useState<File[]>([])
  const [plant, setPlant] = useState("")
  const [machineNo, setMachineNo] = useState("")
  const [dataSourceType, setDataSourceType] = useState<CSVDataSourceType>("SSAC")
  const [isImporting, setIsImporting] = useState(false)
  const { toast } = useToast()

  const handleClose = () => {
    onOpenChange(false)
    // Reset form
    setFiles([])
    setPlant("")
    setMachineNo("")
    setDataSourceType("SSAC")
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      const csvFiles = Array.from(selectedFiles).filter(
        file => file.name.toLowerCase().endsWith('.csv')
      )
      setFiles(csvFiles)
    }
  }

  const handleImport = async () => {
    if (!plant || !machineNo || files.length === 0) {
      toast({
        title: "入力エラー",
        description: "すべての必須項目を入力してください",
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
      handleClose()
    } catch (error) {
      toast({
        title: "インポートエラー",
        description: error instanceof Error ? error.message : "インポート中にエラーが発生しました",
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
            CSVファイルをインポートして、データ期間を登録します。
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="csv-files">CSVファイル</Label>
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
                {files.length}個のファイルが選択されています
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="plant">Plant</Label>
            <Input
              id="plant"
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              placeholder="例: Plant A"
              disabled={isImporting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="machine-no">Machine No</Label>
            <Input
              id="machine-no"
              value={machineNo}
              onChange={(e) => setMachineNo(e.target.value)}
              placeholder="例: GT-01"
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
            キャンセル
          </Button>
          <Button onClick={handleImport} disabled={!isValid || isImporting}>
            {isImporting ? "インポート中..." : "インポート"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}