"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { EventInfo, FileNode } from "@/types"
import { DataSourceTab } from "./EditModal/data-source/DataSourceTab"
import { useFileStore } from "@/stores/useFileStore"
import { DataSourceStyleDrawer } from "./DataSourceStyleDrawer"

interface DataSourceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileNode
}

export function DataSourceModal({ open, onOpenChange, file }: DataSourceModalProps) {
  const { updateFileDataSources } = useFileStore()
  const [selectedDataSourceItems, setSelectedDataSourceItems] = useState<EventInfo[]>([])
  const [selectedDataSource, setSelectedDataSource] = useState<EventInfo | null>(null)
  const [styleDrawerOpen, setStyleDrawerOpen] = useState(false)
  const [useDataSourceStyle, setUseDataSourceStyle] = useState(false)

  // Initialize with current file's data sources
  useEffect(() => {
    if (open && file.selectedDataSources) {
      setSelectedDataSourceItems(file.selectedDataSources)
      
      // Initialize based on whether any data source has custom styles
      const hasCustomStyles = file.selectedDataSources.some((ds) => !!file.dataSourceStyles?.[ds.id])
      setUseDataSourceStyle(hasCustomStyles)
    }
  }, [open, file.selectedDataSources, file.dataSourceStyles])

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
        
        <div className="flex-1 overflow-y-auto">
          <DataSourceTab
            selectedDataSourceItems={selectedDataSourceItems}
            setSelectedDataSourceItems={setSelectedDataSourceItems}
            file={file}
            onOpenStyleDrawer={(dataSource) => {
              setSelectedDataSource(dataSource)
              setStyleDrawerOpen(true)
            }}
            useDataSourceStyle={useDataSourceStyle}
            setUseDataSourceStyle={setUseDataSourceStyle}
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
      
      {/* Data Source Style Drawer */}
      {selectedDataSource && (
        <DataSourceStyleDrawer
          open={styleDrawerOpen}
          onOpenChange={setStyleDrawerOpen}
          dataSource={selectedDataSource}
          fileId={file.id}
          currentStyle={file.dataSourceStyles?.[selectedDataSource.id]}
        />
      )}
    </Dialog>
  )
}