"use client"

import React from "react"
import { X, ChartLine, Database, Calculator, FunctionSquare, Zap, ArrowLeftRight, Calendar, Gauge, FileUp, Hash, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileNode } from "@/types"
import { useFileStore } from "@/stores/useFileStore"

interface TabBarProps {
  openTabs: FileNode[]
}

export function TabBar({ openTabs }: TabBarProps) {
  const {
    activeTab,
    setActiveTab,
    closeTab,
    draggedTab,
    dragOverTab,
    setDraggedTab,
    setDragOverTab,
    reorderTabs,
  } = useFileStore()

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverTab(tabId)
  }

  const handleDragLeave = () => {
    setDragOverTab(null)
  }

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault()

    if (!draggedTab || draggedTab === targetTabId) {
      setDraggedTab(null)
      setDragOverTab(null)
      return
    }

    reorderTabs(draggedTab, targetTabId)
    setDraggedTab(null)
    setDragOverTab(null)
  }

  const handleDragEnd = () => {
    setDraggedTab(null)
    setDragOverTab(null)
  }

  return (
    <div className="flex gap-1 px-2 overflow-x-auto">
      {openTabs.map((tab) => (
        <div
          key={tab.id}
          draggable
          onDragStart={(e) => handleDragStart(e, tab.id)}
          onDragOver={(e) => handleDragOver(e, tab.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, tab.id)}
          onDragEnd={handleDragEnd}
          className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-t-md cursor-pointer select-none transition-all",
            activeTab === tab.id
              ? "bg-background border-t border-l border-r"
              : "bg-muted hover:bg-muted/70",
            draggedTab === tab.id && "opacity-50",
            dragOverTab === tab.id && "bg-accent"
          )}
          onClick={() => setActiveTab(tab.id)}
        >
          {/* Specific tab type icons */}
          {tab.type === 'formula-master' && (
            <FunctionSquare className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          {tab.type === 'trigger-condition-master' && (
            <Zap className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          {tab.type === 'unit-converter-formula-master' && (
            <ArrowLeftRight className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          {tab.type === 'event-master' && (
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          {tab.type === 'interlock-master' && (
            <Gauge className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          {tab.type === 'csv-import' && (
            <FileUp className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          {tab.type === 'sensor-data-master' && (
            <Database className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          {tab.type === 'parameter-master' && (
            <Hash className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          {tab.type === 'tag-master' && (
            <Tag className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          {/* Default icons for other types */}
          {!['formula-master', 'trigger-condition-master', 'unit-converter-formula-master', 'event-master', 'interlock-master', 'csv-import', 'sensor-data-master', 'parameter-master', 'tag-master'].includes(tab.type) && (
            <>
              {((tab as any).source === 'explorer' || !(tab as any).source) && (
                <ChartLine className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              {(tab as any).source === 'database' && (
                <Database className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              {(tab as any).source === 'calculator' && (
                <Calculator className="h-3.5 w-3.5 flex-shrink-0" />
              )}
            </>
          )}
          <span className="text-sm truncate max-w-[150px]">{tab.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              closeTab(tab.id)
            }}
            className="hover:bg-accent rounded p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
}