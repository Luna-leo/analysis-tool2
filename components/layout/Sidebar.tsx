"use client"

import React, { useEffect } from "react"
import { 
  FolderOpen, 
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
  BarChart3,
  Lock,
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
  const { fileTree, setCreatingNode, openFile } = useFileStore()
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
    openFile(formulaMasterNode, 'database')
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
    openFile(triggerConditionMasterNode, 'database')
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
    openFile(unitConverterFormulaMasterNode, 'database')
  }

  const renderSidebarContent = () => {
    switch (activeView) {
      case "explorer":
        return (
          <>
            <div className="flex items-center justify-between px-4 py-2">
              <h2 className="text-sm font-semibold">Explorer</h2>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setCreatingNode("folder", null)}
                  title="New Folder"
                >
                  <FolderPlus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setCreatingNode("file", null)}
                  title="New File"
                >
                  <FilePlus className="h-3 w-3" />
                </Button>
              </div>
            </div>
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
            <h2 className="text-sm font-semibold px-4 py-2">Database</h2>
            <div className="px-2 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-auto min-h-[36px] px-2 py-2 text-sm font-normal"
                onClick={handleOpenCSVImport}
              >
                <FileUp className="h-4 w-4 shrink-0" />
                <div className="flex flex-col items-start flex-1">
                  <span>CSV Import</span>
                  <span className="text-xs text-muted-foreground">CSVデータのインポート機能</span>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-auto min-h-[36px] px-2 py-2 text-sm font-normal"
                onClick={handleOpenEventMaster}
              >
                <Calendar className="h-4 w-4 shrink-0" />
                <div className="flex flex-col items-start flex-1">
                  <span>Event Master</span>
                  <span className="text-xs text-muted-foreground">イベント情報</span>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-auto min-h-[36px] px-2 py-2 text-sm font-normal"
                onClick={handleOpenInterlockMaster}
              >
                <Lock className="h-4 w-4 shrink-0" />
                <div className="flex flex-col items-start flex-1">
                  <span>Interlock Master</span>
                  <span className="text-xs text-muted-foreground">登録済み管理値、プラント・号機毎</span>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-auto min-h-[36px] px-2 py-2 text-sm font-normal"
                onClick={() => console.log("Sensor data Master")}
              >
                <BarChart3 className="h-4 w-4 shrink-0" />
                <div className="flex flex-col items-start flex-1">
                  <span>Sensor data Master</span>
                  <span className="text-xs text-muted-foreground">プラントとか号機毎のデータ存在期間とか</span>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-auto min-h-[36px] px-2 py-2 text-sm font-normal"
                onClick={() => console.log("Parameter Master")}
                disabled
              >
                <Hash className="h-4 w-4 shrink-0" />
                <div className="flex flex-col items-start flex-1">
                  <span>Parameter Master</span>
                  <span className="text-xs text-muted-foreground">パラメータID、パラメータ名、単位</span>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-auto min-h-[36px] px-2 py-2 text-sm font-normal"
                onClick={() => console.log("Tag Master")}
                disabled
              >
                <Tag className="h-4 w-4 shrink-0" />
                <span>Tag Master</span>
              </Button>
            </div>
          </>
        )
      case "calculator":
        return (
          <>
            <h2 className="text-sm font-semibold px-4 py-2">Calculator</h2>
            <div className="px-2 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-auto min-h-[36px] px-2 py-2 text-sm font-normal"
                onClick={handleOpenFormulaMaster}
              >
                <FunctionSquare className="h-4 w-4 shrink-0" />
                <div className="flex flex-col items-start flex-1">
                  <span>Formula Master</span>
                  <span className="text-xs text-muted-foreground">登録済み数式</span>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-auto min-h-[36px] px-2 py-2 text-sm font-normal"
                onClick={handleOpenTriggerConditionMaster}
              >
                <Zap className="h-4 w-4 shrink-0" />
                <div className="flex flex-col items-start flex-1">
                  <span>Trigger Condition Master</span>
                  <span className="text-xs text-muted-foreground">登録済みキック信号コンディション</span>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-auto min-h-[36px] px-2 py-2 text-sm font-normal"
                onClick={handleOpenUnitConverterFormulaMaster}
              >
                <ArrowLeftRight className="h-4 w-4 shrink-0" />
                <div className="flex flex-col items-start flex-1">
                  <span>Unit Convert Formula Master</span>
                  <span className="text-xs text-muted-foreground">単位換算式</span>
                </div>
              </Button>
            </div>
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
          variant={activeView === "calculator" ? "secondary" : "ghost"}
          size="icon"
          className="h-10 w-10"
          onClick={() => handleViewClick("calculator")}
        >
          <Calculator className="h-5 w-5" />
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