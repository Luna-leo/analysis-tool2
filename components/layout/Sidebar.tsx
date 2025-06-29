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
  FileUp,
  Cloud,
  Server
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileExplorer } from "./FileExplorer"
import { ActiveView, FileNode, SystemNodeConfig, ActivityBarItem } from "@/types"
import { useViewStore } from "@/stores/useViewStore"
import { useFileStore } from "@/stores/useFileStore"
import { useLayoutStore } from "@/stores/useLayoutStore"
import { useUIStore } from "@/stores/useUIStore"
import { cn } from "@/lib/utils"

// Constants
const SYSTEM_NODES: Record<string, SystemNodeConfig> = {
  csvImport: {
    id: 'csv-import',
    name: 'CSV Import',
    type: 'csv-import',
    icon: FileUp,
    viewType: 'database'
  },
  eventMaster: {
    id: 'event-master',
    name: 'Event Master',
    type: 'event-master',
    icon: Calendar,
    viewType: 'database'
  },
  interlockMaster: {
    id: 'interlock-master',
    name: 'Interlock Master',
    type: 'interlock-master',
    icon: Gauge,
    viewType: 'database'
  },
  formulaMaster: {
    id: 'formula-master',
    name: 'Formula Master',
    type: 'formula-master',
    icon: FunctionSquare,
    viewType: 'calculator'
  },
  triggerConditionMaster: {
    id: 'trigger-condition-master',
    name: 'Trigger Condition Master',
    type: 'trigger-condition-master',
    icon: Zap,
    viewType: 'calculator'
  },
  unitConverterFormulaMaster: {
    id: 'unit-converter-formula-master',
    name: 'Unit Converter Formula Master',
    type: 'unit-converter-formula-master',
    icon: ArrowLeftRight,
    viewType: 'calculator'
  },
  serverSync: {
    id: 'server-sync',
    name: 'サーバー連携',
    type: 'server-sync',
    icon: Server,
    viewType: 'server'
  },
  settings: {
    id: 'settings',
    name: 'Personal Settings',
    type: 'settings',
    icon: Settings,
    viewType: 'settings'
  }
}

const ACTIVITY_BAR_ITEMS: ActivityBarItem[] = [
  { view: 'explorer', icon: ChartLine },
  { view: 'search', icon: Search },
  { view: 'database', icon: Database },
  { view: 'calculator', icon: Calculator },
  { view: 'server', icon: Cloud },
  { view: 'settings', icon: Settings }
]

export function Sidebar() {
  const { activeView, sidebarOpen, setActiveView, toggleSidebar } = useViewStore()
  const { setCreatingNode, openFile } = useFileStore()
  const layoutStore = useLayoutStore()
  const uiStore = useUIStore()

  // Auto-collapse sidebar on narrow screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && sidebarOpen) { // 1024px = lg breakpoint
        useViewStore.setState({ sidebarOpen: false })
      }
    }

    // Check initial size
    handleResize()

    // Add resize listener
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sidebarOpen])

  const handleViewClick = (view: ActiveView) => {
    if (activeView === view) {
      toggleSidebar()
    } else {
      setActiveView(view)
      if (!sidebarOpen) {
        toggleSidebar()
      }
    }
  }

  const openSystemNode = (nodeConfig: SystemNodeConfig) => {
    const node: FileNode = {
      id: nodeConfig.id,
      name: nodeConfig.name,
      type: nodeConfig.type as FileNode['type'],
      isSystemNode: true
    }
    
    openFile(node, nodeConfig.viewType as any)
    
    // Special handling for CSV Import
    if (nodeConfig.id === 'csv-import') {
      setTimeout(() => {
        uiStore.setCurrentPage(1)
        layoutStore.initializeSettings(node.id)
      }, 0)
    }
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
              <SidebarButton
                icon={SYSTEM_NODES.csvImport.icon}
                label={SYSTEM_NODES.csvImport.name}
                onClick={() => openSystemNode(SYSTEM_NODES.csvImport)}
              />
              <SidebarButton
                icon={SYSTEM_NODES.eventMaster.icon}
                label={SYSTEM_NODES.eventMaster.name}
                onClick={() => openSystemNode(SYSTEM_NODES.eventMaster)}
              />
              <SidebarButton
                icon={SYSTEM_NODES.interlockMaster.icon}
                label={SYSTEM_NODES.interlockMaster.name}
                onClick={() => openSystemNode(SYSTEM_NODES.interlockMaster)}
              />
              <SidebarButton
                icon={Database}
                label="Sensor data Master"
                onClick={() => {}}
              />
              <SidebarButton
                icon={Hash}
                label="Parameter Master"
                onClick={() => {}}
                disabled
              />
              <SidebarButton
                icon={Tag}
                label="Tag Master"
                onClick={() => {}}
                disabled
              />
            </div>
          </>
        )
      case "calculator":
        return (
          <>
            <h2 className="text-base font-semibold px-4 py-3">Calculator</h2>
            <div className="px-2 space-y-1">
              <SidebarButton
                icon={SYSTEM_NODES.formulaMaster.icon}
                label={SYSTEM_NODES.formulaMaster.name}
                onClick={() => openSystemNode(SYSTEM_NODES.formulaMaster)}
              />
              <SidebarButton
                icon={SYSTEM_NODES.triggerConditionMaster.icon}
                label={SYSTEM_NODES.triggerConditionMaster.name}
                onClick={() => openSystemNode(SYSTEM_NODES.triggerConditionMaster)}
              />
              <SidebarButton
                icon={SYSTEM_NODES.unitConverterFormulaMaster.icon}
                label="Unit Convert Formula Master"
                onClick={() => openSystemNode(SYSTEM_NODES.unitConverterFormulaMaster)}
              />
            </div>
          </>
        )
      case "server":
        return (
          <>
            <h2 className="text-base font-semibold px-4 py-3">Server Sync</h2>
            <div className="px-2 space-y-1">
              <SidebarButton
                icon={SYSTEM_NODES.serverSync.icon}
                label={SYSTEM_NODES.serverSync.name}
                onClick={() => openSystemNode(SYSTEM_NODES.serverSync)}
              />
            </div>
          </>
        )
      case "settings":
        return (
          <>
            <h2 className="text-base font-semibold px-4 py-3">Settings</h2>
            <div className="px-2 space-y-1">
              <SidebarButton
                icon={SYSTEM_NODES.settings.icon}
                label={SYSTEM_NODES.settings.name}
                onClick={() => openSystemNode(SYSTEM_NODES.settings)}
              />
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-full border-r">
      {/* Activity Bar */}
      <div className={cn(
        "w-14 bg-muted/50 flex flex-col items-center py-2 gap-1",
        sidebarOpen && "border-r"
      )}>
        {ACTIVITY_BAR_ITEMS.map(({ view, icon: Icon }) => (
          <ActivityBarButton
            key={view}
            icon={Icon}
            isActive={activeView === view}
            onClick={() => handleViewClick(view)}
          />
        ))}
      </div>

      {/* Sidebar Panel */}
      {sidebarOpen && (
        <div className="w-56 bg-background">
          <ScrollArea className="h-full">
            {renderSidebarContent()}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

// Sub-components
function ActivityBarButton({ 
  icon: Icon, 
  isActive, 
  onClick 
}: {
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
  onClick: () => void
}) {
  return (
    <div className="relative">
      <Button
        variant={isActive ? "secondary" : "ghost"}
        size="icon"
        className="h-14 w-14 p-2 [&_svg]:size-auto relative"
        onClick={onClick}
      >
        <Icon className="h-full w-full" />
      </Button>
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-primary rounded-r-sm" />
      )}
    </div>
  )
}

function SidebarButton({ 
  icon: Icon, 
  label, 
  onClick, 
  disabled = false 
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 h-12 px-3 text-base font-normal"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="text-base">{label}</span>
    </Button>
  )
}