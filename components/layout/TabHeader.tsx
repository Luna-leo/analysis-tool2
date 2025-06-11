import React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TabBar } from "./TabBar"
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
    <div className="border-b bg-muted/50 h-11">
      <TabBar openTabs={openTabs} />
    </div>
  )
}