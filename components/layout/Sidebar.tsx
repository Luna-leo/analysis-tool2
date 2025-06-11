"use client"

import React, { useEffect } from "react"
import { 
  ChartLine, 
  Search, 
  Database, 
  Calculator, 
  Settings, 
  FolderPlus, 
  FilePlus,
  FunctionSquare,
  ArrowLeftRight,
  Zap,
  Calendar,
  Hash,
  Tag,
  Gauge,
  FileUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileExplorer } from "./FileExplorer"
import { ActiveView, FileNode } from "@/types"
import { useViewStore } from "@/stores/useViewStore"
import { useFileStore } from "@/stores/useFileStore"
import { useLayoutStore } from "@/stores/useLayoutStore"
import { useUIStore } from "@/stores/useUIStore"

export function Sidebar() {
  const { activeView, sidebarOpen, setActiveView, setSidebarOpen } = useViewStore()
  const { setCreatingNode, openFile } = useFileStore()
  const layoutStore = useLayoutStore()
  const uiStore = useUIStore()

  // Auto-collapse sidebar on narrow screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && sidebarOpen) { // 1024px = lg breakpoint
        setSidebarOpen(false)
      }
    }

    // Check initial size
    handleResize()

    // Add resize listener
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sidebarOpen, setSidebarOpen])

  const handleViewClick = (view: ActiveView) => {
    if (activeView === view) {
      setSidebarOpen(!sidebarOpen)
    } else {
      setActiveView(view)
      setSidebarOpen(true)
    }
  }

  const handleOpenCSVImport = () => {
    // Create a special CSV Import tab
    const csvImportNode: FileNode = {
      id: 'csv-import',
      name: 'CSV Import',
      type: 'csv-import',
      isSystemNode: true
    }
    
    // Open the CSV Import as a tab
    openFile(csvImportNode, 'database')
    // Set current page and initialize settings
    setTimeout(() => {
      uiStore.setCurrentPage(1)
      layoutStore.initializeSettings(csvImportNode.id)
    }, 0)
  }

  const handleOpenEventMaster = () => {
    // Create a special Event Master tab
    const eventMasterNode: FileNode = {
      id: 'event-master',
      name: 'Event Master',
      type: 'event-master',
      isSystemNode: true
    }
    
    // Open the Event Master as a tab
    openFile(eventMasterNode, 'database')
  }

  const handleOpenInterlockMaster = () => {
    // Create a special Interlock Master tab
    const interlockMasterNode: FileNode = {
      id: 'interlock-master',
      name: 'Interlock Master',
      type: 'interlock-master',
      isSystemNode: true
    }
    
    // Open the Interlock Master as a tab
    openFile(interlockMasterNode, 'database')
  }

  const handleOpenFormulaMaster = () => {
    // Create a special Formula Master tab
    const formulaMasterNode: FileNode = {
      id: 'formula-master',
      name: 'Formula Master',
      type: 'formula-master',
      isSystemNode: true
    }
    
    // Open the Formula Master as a tab
    openFile(formulaMasterNode, 'calculator')
  }

  const handleOpenTriggerConditionMaster = () => {
    // Create a special Trigger Condition Master tab
    const triggerConditionMasterNode: FileNode = {
      id: 'trigger-condition-master',
      name: 'Trigger Condition Master',
      type: 'trigger-condition-master',
      isSystemNode: true
    }
    
    // Open the Trigger Condition Master as a tab
    openFile(triggerConditionMasterNode, 'calculator')
  }

  const handleOpenUnitConverterFormulaMaster = () => {
    // Create a special Unit Converter Formula Master tab
    const unitConverterFormulaMasterNode: FileNode = {
      id: 'unit-converter-formula-master',
      name: 'Unit Converter Formula Master',
      type: 'unit-converter-formula-master',
      isSystemNode: true
    }
    
    // Open the Unit Converter Formula Master as a tab
    openFile(unitConverterFormulaMasterNode, 'calculator')
  }

  const handleOpenSettings = () => {
    const settingsNode: FileNode = {
      id: 'settings',
      name: 'Personal Settings',
      type: 'settings',
      isSystemNode: true
    }
    
    openFile(settingsNode, 'settings')
  }

  const renderSidebarContent = () => {
    switch (activeView) {
      case "explorer":
        return (
          <>
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="text-base font-semibold">Explorer</h2>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCreatingNode("folder", null)}
                  title="New Folder"
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCreatingNode("file", null)}
                  title="New File"
                >
                  <FilePlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <FileExplorer />
          </>
        )
      case "search":
        return (
          <>
            <h2 className="text-base font-semibold px-4 py-3">Search</h2>
            <div className="px-4 py-2 text-base text-muted-foreground">Search functionality coming soon...</div>
          </>
        )
      case "database":
        return (
          <>
            <h2 className="text-base font-semibold px-4 py-3">Database</h2>
            <div className="px-2 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 px-3 text-base font-normal"
                onClick={handleOpenCSVImport}
              >
                <FileUp className="h-5 w-5 shrink-0" />
                <span className="text-base">CSV Import</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 px-3 text-base font-normal"
                onClick={handleOpenEventMaster}
              >
                <Calendar className="h-5 w-5 shrink-0" />
                <span className="text-base">Event Master</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 px-3 text-base font-normal"
                onClick={handleOpenInterlockMaster}
              >
                <Gauge className="h-5 w-5 shrink-0" />
                <span className="text-base">Interlock Master</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 px-3 text-base font-normal"
                onClick={() => console.log("Sensor data Master")}
              >
                <Database className="h-5 w-5 shrink-0" />
                <span className="text-base">Sensor data Master</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 px-3 text-base font-normal"
                onClick={() => console.log("Parameter Master")}
                disabled
              >
                <Hash className="h-5 w-5 shrink-0" />
                <span className="text-base">Parameter Master</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 px-3 text-base font-normal"
                onClick={() => console.log("Tag Master")}
                disabled
              >
                <Tag className="h-5 w-5 shrink-0" />
                <span className="text-base">Tag Master</span>
              </Button>
            </div>
          </>
        )
      case "calculator":
        return (
          <>
            <h2 className="text-base font-semibold px-4 py-3">Calculator</h2>
            <div className="px-2 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 px-3 text-base font-normal"
                onClick={handleOpenFormulaMaster}
              >
                <FunctionSquare className="h-5 w-5 shrink-0" />
                <span className="text-base">Formula Master</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 px-3 text-base font-normal"
                onClick={handleOpenTriggerConditionMaster}
              >
                <Zap className="h-5 w-5 shrink-0" />
                <span className="text-base">Trigger Condition Master</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 px-3 text-base font-normal"
                onClick={handleOpenUnitConverterFormulaMaster}
              >
                <ArrowLeftRight className="h-5 w-5 shrink-0" />
                <span className="text-base">Unit Convert Formula Master</span>
              </Button>
            </div>
          </>
        )
      case "settings":
        return (
          <>
            <h2 className="text-base font-semibold px-4 py-3">Settings</h2>
            <div className="px-2 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 px-3 text-base font-normal"
                onClick={handleOpenSettings}
              >
                <Settings className="h-5 w-5 shrink-0" />
                <span className="text-base">Personal Settings</span>
              </Button>
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <>
      {/* Activity Bar */}
      <div className="w-14 bg-muted/50 border-r flex flex-col items-center py-2 gap-1">
        <div className="relative">
          <Button
            variant={activeView === "explorer" ? "secondary" : "ghost"}
            size="icon"
            className="h-14 w-14 p-2 [&_svg]:size-auto relative"
            onClick={() => handleViewClick("explorer")}
          >
            <ChartLine className="h-full w-full" />
          </Button>
          {activeView === "explorer" && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-primary rounded-r-sm" />
          )}
        </div>
        <div className="relative">
          <Button
            variant={activeView === "search" ? "secondary" : "ghost"}
            size="icon"
            className="h-14 w-14 p-2 [&_svg]:size-auto relative"
            onClick={() => handleViewClick("search")}
          >
            <Search className="h-full w-full" />
          </Button>
          {activeView === "search" && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-primary rounded-r-sm" />
          )}
        </div>
        <div className="relative">
          <Button
            variant={activeView === "database" ? "secondary" : "ghost"}
            size="icon"
            className="h-14 w-14 p-2 [&_svg]:size-auto relative"
            onClick={() => handleViewClick("database")}
          >
            <Database className="h-full w-full" />
          </Button>
          {activeView === "database" && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-primary rounded-r-sm" />
          )}
        </div>
        <div className="relative">
          <Button
            variant={activeView === "calculator" ? "secondary" : "ghost"}
            size="icon"
            className="h-14 w-14 p-2 [&_svg]:size-auto relative"
            onClick={() => handleViewClick("calculator")}
          >
            <Calculator className="h-full w-full" />
          </Button>
          {activeView === "calculator" && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-primary rounded-r-sm" />
          )}
        </div>
        <div className="relative">
          <Button
            variant={activeView === "settings" ? "secondary" : "ghost"}
            size="icon"
            className="h-14 w-14 p-2 [&_svg]:size-auto relative"
            onClick={() => handleViewClick("settings")}
          >
            <Settings className="h-full w-full" />
          </Button>
          {activeView === "settings" && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-primary rounded-r-sm" />
          )}
        </div>
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