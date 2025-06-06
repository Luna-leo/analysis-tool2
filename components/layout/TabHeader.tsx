import React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TabBar } from "./TabBar"
import { LayoutSettings } from "./LayoutSettings"
import { FileNode } from "@/types"

interface TabHeaderProps {
  openTabs: FileNode[]
  activeTab: string | null
}

export const TabHeader: React.FC<TabHeaderProps> = ({
  openTabs,
  activeTab,
}) => {
  if (openTabs.length === 0) return null

  return (
    <div className="border-b bg-muted/50">
      <ScrollArea className="h-9">
        <div className="flex items-center justify-between pr-2">
          <TabBar openTabs={openTabs} />
          
          {/* Layout Settings - show only when there's an active tab */}
          {activeTab && (
            <div className="flex items-center gap-2 ml-2">
              <LayoutSettings fileId={activeTab} />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}