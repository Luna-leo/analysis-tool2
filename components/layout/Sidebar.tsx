"use client"

import React from "react"
import { FolderOpen, Search, Database, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileExplorer } from "./FileExplorer"
import { ActiveView } from "@/types"
import { useAnalysisStore } from "@/stores/useAnalysisStore"

export function Sidebar() {
  const { activeView, sidebarOpen, setActiveView, setSidebarOpen, fileTree } = useAnalysisStore()

  const handleViewClick = (view: ActiveView) => {
    if (activeView === view) {
      setSidebarOpen(!sidebarOpen)
    } else {
      setActiveView(view)
      setSidebarOpen(true)
    }
  }

  const renderSidebarContent = () => {
    switch (activeView) {
      case "explorer":
        return (
          <>
            <h2 className="text-sm font-semibold px-4 py-2">Explorer</h2>
            <FileExplorer />
          </>
        )
      case "search":
        return (
          <>
            <h2 className="text-sm font-semibold px-4 py-2">Search</h2>
            <div className="px-4 py-2 text-sm text-muted-foreground">Search functionality coming soon...</div>
          </>
        )
      case "database":
        return (
          <>
            <h2 className="text-sm font-semibold px-4 py-2">Data Sources</h2>
            <div className="px-4 py-2 text-sm text-muted-foreground">Database connections coming soon...</div>
          </>
        )
      case "settings":
        return (
          <>
            <h2 className="text-sm font-semibold px-4 py-2">Settings</h2>
            <div className="px-4 py-2 text-sm text-muted-foreground">Settings panel coming soon...</div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <>
      {/* Activity Bar */}
      <div className="w-12 bg-muted/50 border-r flex flex-col items-center py-2 gap-1">
        <Button
          variant={activeView === "explorer" ? "secondary" : "ghost"}
          size="icon"
          className="h-10 w-10"
          onClick={() => handleViewClick("explorer")}
        >
          <FolderOpen className="h-5 w-5" />
        </Button>
        <Button
          variant={activeView === "search" ? "secondary" : "ghost"}
          size="icon"
          className="h-10 w-10"
          onClick={() => handleViewClick("search")}
        >
          <Search className="h-5 w-5" />
        </Button>
        <Button
          variant={activeView === "database" ? "secondary" : "ghost"}
          size="icon"
          className="h-10 w-10"
          onClick={() => handleViewClick("database")}
        >
          <Database className="h-5 w-5" />
        </Button>
        <Button
          variant={activeView === "settings" ? "secondary" : "ghost"}
          size="icon"
          className="h-10 w-10"
          onClick={() => handleViewClick("settings")}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar Panel */}
      {sidebarOpen && (
        <div className="w-64 border-r bg-background">
          <ScrollArea className="h-full">
            {renderSidebarContent()}
          </ScrollArea>
        </div>
      )}
    </>
  )
}