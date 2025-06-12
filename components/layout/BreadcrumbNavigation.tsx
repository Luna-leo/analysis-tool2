import React, { useState } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { FileNode } from "@/types"
import { useFileStore } from "@/stores/useFileStore"
import { LayoutSettings } from "./LayoutSettings"
import { Plus, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/stores/useUIStore"
import { BulkSettingsDrawer } from "@/components/charts/BulkSettingsDrawer"

interface BreadcrumbNavigationProps {
  activeTab: string
  openTabs: Array<{ id: string; name: string }>
}

// Helper function to get file path
const getFilePath = (fileId: string, nodes: FileNode[], path: string[] = []): string[] | null => {
  for (const node of nodes) {
    const currentPath = [...path, node.name]

    if (node.id === fileId) {
      return currentPath
    }

    if (node.children) {
      const result = getFilePath(fileId, node.children, currentPath)
      if (result) {
        return result
      }
    }
  }
  return null
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  activeTab,
  openTabs,
}) => {
  const { fileTree } = useFileStore()
  const currentFile = openTabs.find((tab) => tab.id === activeTab)
  const [isBulkSettingsOpen, setIsBulkSettingsOpen] = useState(false)
  
  if (!currentFile) return null

  const filePath = getFilePath(currentFile.id, fileTree)
  
  // Check if this is a graph page (has charts/dataSources)
  const isGraphPage = (currentFile as any).charts || (currentFile as any).dataSources

  return (
    <div className="border-b bg-background px-4 py-2">
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            {filePath ? (
              filePath.map((pathItem, index) => (
              <React.Fragment key={index}>
                {index === filePath.length - 1 ? (
                  <BreadcrumbItem>
                    <BreadcrumbPage>{pathItem}</BreadcrumbPage>
                  </BreadcrumbItem>
                ) : (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#" className="text-muted-foreground">
                        {pathItem}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </>
                )}
              </React.Fragment>
            ))
            ) : (
              // If no file path found (e.g., for special tabs or reconstructed files)
              <BreadcrumbItem>
                <BreadcrumbPage>{currentFile.name}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Layout Settings and New Chart button - show only for graph pages */}
        {isGraphPage && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const uiStore = useUIStore.getState()
                uiStore.setEditingChart({
                  id: `chart_${Date.now()}`,
                  title: "新しいチャート",
                  dataSources: [],
                  parameters: [],
                  referenceLines: [],
                  thresholdPoints: [],
                  searchConditions: [],
                  fileId: activeTab
                })
                uiStore.setEditModalOpen(true)
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              新規チャート
            </Button>
            <LayoutSettings fileId={activeTab} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsBulkSettingsOpen(true)}
              title="一括設定"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Bulk Settings Drawer */}
      {isGraphPage && currentFile && (
        <BulkSettingsDrawer
          open={isBulkSettingsOpen}
          onOpenChange={setIsBulkSettingsOpen}
          file={currentFile as FileNode}
        />
      )}
    </div>
  )
}