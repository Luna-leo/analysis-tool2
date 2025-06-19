import React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TabBar } from "./TabBar"
import { FileNode } from "@/types"
import type { ChartGridConfig } from "@/types/chart-config"

interface TabHeaderProps {
  openTabs: FileNode[]
  activeTab: string | null
  onChartClick?: () => void
  onSelectClick?: () => void
  onTemplateAction?: (action: string) => void
  gridSelectionMode?: boolean
  selectedCount?: number
  showActionButtons?: boolean
  onConfigImport?: (config: ChartGridConfig, mode?: 'overwrite' | 'new-page') => void
  onCreateNewPage?: (fileName: string, config: ChartGridConfig) => void
}

export const TabHeader: React.FC<TabHeaderProps> = ({
  openTabs,
  activeTab,
  onChartClick,
  onSelectClick,
  onTemplateAction,
  gridSelectionMode,
  selectedCount,
  showActionButtons,
  onConfigImport,
  onCreateNewPage,
}) => {
  if (openTabs.length === 0) return null

  return (
    <div className="border-b bg-background/95 backdrop-blur-sm h-11">
      <TabBar 
        openTabs={openTabs} 
        activeTab={activeTab}
        onChartClick={onChartClick}
        onSelectClick={onSelectClick}
        onTemplateAction={onTemplateAction}
        gridSelectionMode={gridSelectionMode}
        selectedCount={selectedCount}
        showActionButtons={showActionButtons}
        onConfigImport={onConfigImport}
        onCreateNewPage={onCreateNewPage}
      />
    </div>
  )
}