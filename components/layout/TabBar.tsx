"use client"

import React, { useRef, useState, useEffect } from "react"
import { X, ChartLine, Database, Calculator, FunctionSquare, Zap, ArrowLeftRight, Calendar, Gauge, FileUp, Hash, Tag, ChevronLeft, ChevronRight } from "lucide-react"
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

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftButton, setShowLeftButton] = useState(true)
  const [showRightButton, setShowRightButton] = useState(true)

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftButton(scrollLeft > 0)
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    checkScrollButtons()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollButtons)
      window.addEventListener('resize', checkScrollButtons)
      return () => {
        container.removeEventListener('scroll', checkScrollButtons)
        window.removeEventListener('resize', checkScrollButtons)
      }
    }
  }, [openTabs])

  useEffect(() => {
    // Auto-scroll to active tab when it changes
    if (activeTab && scrollContainerRef.current) {
      const activeTabElement = scrollContainerRef.current.querySelector(`[data-tab-id="${activeTab}"]`)
      if (activeTabElement) {
        activeTabElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
    }
  }, [activeTab])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

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
    <div className="relative flex items-center h-full">
      {/* Left gradient and button */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 z-10 flex items-center",
        showLeftButton ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className="h-full w-12 bg-gradient-to-r from-background/95 to-transparent" />
        <button
          className="absolute left-1 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-background hover:border-border transition-all duration-200 flex items-center justify-center"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tabs container */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-0.5 overflow-x-auto scrollbar-hide pl-2 pr-12 scroll-smooth h-full items-center flex-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {openTabs.map((tab, index) => (
          <div
            key={tab.id}
            data-tab-id={tab.id}
            draggable
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={(e) => handleDragOver(e, tab.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, tab.id)}
            onDragEnd={handleDragEnd}
            className={cn(
            "flex items-center gap-2 px-4 py-2 cursor-pointer select-none transition-all flex-shrink-0 min-w-[120px] relative group",
            activeTab === tab.id
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
            draggedTab === tab.id && "opacity-50",
            dragOverTab === tab.id && "bg-accent/20"
          )}
          onClick={() => setActiveTab(tab.id)}
        >
          {/* Specific tab type icons */}
          {tab.type === 'formula-master' && (
            <FunctionSquare className="h-4 w-4 flex-shrink-0" />
          )}
          {tab.type === 'trigger-condition-master' && (
            <Zap className="h-4 w-4 flex-shrink-0" />
          )}
          {tab.type === 'unit-converter-formula-master' && (
            <ArrowLeftRight className="h-4 w-4 flex-shrink-0" />
          )}
          {tab.type === 'event-master' && (
            <Calendar className="h-4 w-4 flex-shrink-0" />
          )}
          {tab.type === 'interlock-master' && (
            <Gauge className="h-4 w-4 flex-shrink-0" />
          )}
          {tab.type === 'csv-import' && (
            <FileUp className="h-4 w-4 flex-shrink-0" />
          )}
          {tab.type === 'sensor-data-master' && (
            <Database className="h-4 w-4 flex-shrink-0" />
          )}
          {tab.type === 'parameter-master' && (
            <Hash className="h-4 w-4 flex-shrink-0" />
          )}
          {tab.type === 'tag-master' && (
            <Tag className="h-4 w-4 flex-shrink-0" />
          )}
          {/* Default icons for other types */}
          {!['formula-master', 'trigger-condition-master', 'unit-converter-formula-master', 'event-master', 'interlock-master', 'csv-import', 'sensor-data-master', 'parameter-master', 'tag-master'].includes(tab.type) && (
            <>
              {((tab as any).source === 'explorer' || !(tab as any).source) && (
                <ChartLine className="h-4 w-4 flex-shrink-0" />
              )}
              {(tab as any).source === 'database' && (
                <Database className="h-4 w-4 flex-shrink-0" />
              )}
              {(tab as any).source === 'calculator' && (
                <Calculator className="h-4 w-4 flex-shrink-0" />
              )}
            </>
          )}
          <span className="text-sm font-medium truncate max-w-[150px]">{tab.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              closeTab(tab.id)
            }}
            className="opacity-0 group-hover:opacity-100 hover:bg-accent rounded p-1 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          
          {/* Modern underline indicator */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 h-0.5 transition-all",
            activeTab === tab.id
              ? "bg-primary"
              : "bg-transparent group-hover:bg-border"
          )} />
          
          {/* Separator */}
          {index < openTabs.length - 1 && (
            <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-border/50" />
          )}
          </div>
        ))}
      </div>

      {/* Right gradient and button */}
      <div className={cn(
        "absolute right-0 top-0 bottom-0 z-10 flex items-center",
        showRightButton ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className="h-full w-12 bg-gradient-to-l from-background/95 to-transparent" />
        <button
          className="absolute right-1 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-background hover:border-border transition-all duration-200 flex items-center justify-center"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}