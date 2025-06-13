"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { EventInfo, FileNode } from "@/types"
import { DataSourceTab } from "./EditModal/data-source/DataSourceTab"
import { useFileStore } from "@/stores/useFileStore"

interface DataSourceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileNode
}

export function DataSourceModal({ open, onOpenChange, file }: DataSourceModalProps) {
  const { updateFileDataSources } = useFileStore()
  const [selectedDataSourceItems, setSelectedDataSourceItems] = useState<EventInfo[]>([])

  // Initialize with current file's data sources
  useEffect(() => {
    if (open && file.selectedDataSources) {
      setSelectedDataSourceItems(file.selectedDataSources)
    }
  }, [open, file.selectedDataSources])

  const handleSave = () => {
    updateFileDataSources(file.id, selectedDataSourceItems)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[80vw] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Data Sources for {file.name}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <DataSourceTab
            selectedDataSourceItems={selectedDataSourceItems}
            setSelectedDataSourceItems={setSelectedDataSourceItems}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}