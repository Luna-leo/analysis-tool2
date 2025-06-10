"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CSVImportContent } from "@/components/csv-import/CSVImportContent"
import { CSVImportData } from "@/types"

interface ImportCSVDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: CSVImportData) => Promise<void>
}

export function ImportCSVDialog({ open, onOpenChange }: ImportCSVDialogProps) {
  const handleClose = () => {
    onOpenChange(false)
  }

  const handleImportComplete = () => {
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>
            CSVファイルをインポートして、データを取り込みます。
          </DialogDescription>
        </DialogHeader>
        
        <CSVImportContent 
          mode="dialog" 
          onImportComplete={handleImportComplete}
        />

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}