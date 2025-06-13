"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { EventInfo, FileNode } from "@/types"
import { DataSourceTab } from "./EditModal/data-source/DataSourceTab"
import { useFileStore } from "@/stores/useFileStore"
import { DataSourceStyleDrawer } from "./DataSourceStyleDrawer"
import { Badge } from "@/components/ui/badge"
import { DataSourceBadgePreview } from "./DataSourceBadgePreview"
import { Palette } from "lucide-react"

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
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <DataSourceTab
            selectedDataSourceItems={selectedDataSourceItems}
            setSelectedDataSourceItems={setSelectedDataSourceItems}
          />
          
          {/* Selected Data Sources with Style Settings */}
          {selectedDataSourceItems.length > 0 && (
            <div className="border-t pt-4 px-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Selected Data Sources - Click to customize appearance</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedDataSourceItems.map((source, index) => (
                  <Badge
                    key={source.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={() => {
                      setSelectedDataSource(source)
                      setStyleDrawerOpen(true)
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <DataSourceBadgePreview
                        dataSourceStyle={file.dataSourceStyles?.[source.id]}
                        defaultColor={getDefaultColor(source.id, index)}
                      />
                      <span>{source.label}</span>
                      <Palette className="h-3 w-3 ml-1 opacity-50" />
                    </div>
                  </Badge>
                ))}
              </div>
            </div>
          )}
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

// Helper function to get default color for data source
const defaultColors = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // yellow
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
]

const getDefaultColor = (dataSourceId: string, index: number) => {
  // Use index for consistent color
  return defaultColors[index % defaultColors.length]
}