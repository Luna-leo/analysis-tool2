import React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TabBar } from "./TabBar"
import { FileNode } from "@/types"

interface TabHeaderProps {
  openTabs: FileNode[]
  activeTab: string | null
  onChartClick?: () => void
  onSelectClick?: () => void
  onTemplateAction?: (action: string) => void
  gridSelectionMode?: boolean
  selectedCount?: number
  showActionButtons?: boolean
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
      />
    </div>
  )
}