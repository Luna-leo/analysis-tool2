"use client"

import React, { useEffect } from "react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Sidebar, TabHeader, BreadcrumbNavigation, WelcomeMessage } from "../layout"
import { ChartGrid, ChartEditModal } from "../charts"
import { useFileStore } from "@/stores/useFileStore"
import { useParameterStore } from "@/stores/useParameterStore"
import { FileNode, ActiveView } from "@/types"

export default function AnalysisTool() {
  const { openTabs, activeTab, openFile, fileTree } = useFileStore()
  const { loadParameters } = useParameterStore()

  useEffect(() => {
    // Load parameters on mount
    loadParameters()
    
    // Open initial tabs on first mount
    if (openTabs.length === 0) {
      // Find Speed Up file from Plant A
      const plantA = fileTree.find(node => node.id === "1")
      const speedUpFile = plantA?.children?.find(child => child.id === "2")
      
      if (speedUpFile) {
        openFile(speedUpFile, 'explorer')
      }

      // Define initial system tabs to open
      const initialSystemTabs: Array<{ id: string; name: string; type: string; viewType: ActiveView }> = [
        { id: "csv-import", name: "CSV Import", type: "csv-import", viewType: 'database' },
        { id: "event-master", name: "Event Master", type: "event-master", viewType: 'database' },
        { id: "formula-master", name: "Formula Master", type: "formula-master", viewType: 'database' },
        { id: "interlock-master", name: "Interlock Master", type: "interlock-master", viewType: 'database' },
        { id: "trigger-condition-master", name: "Trigger Condition Master", type: "trigger-condition-master", viewType: 'database' },
        { id: "unit-converter-formula-master", name: "Unit Conversion Formula Master", type: "unit-converter-formula-master", viewType: 'database' }
      ]

      // Open all initial system tabs
      initialSystemTabs.forEach(tab => {
        const node: FileNode = {
          id: tab.id,
          name: tab.name,
          type: tab.type,
          isSystemNode: true,
          ...(tab.id === "csv-import" && { dataSources: [], charts: [] })
        }
        openFile(node, tab.viewType)
      })
    }
  }, []) // Empty dependency array to run only once on mount

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Sidebar Panel */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
          <Sidebar />
        </ResizablePanel>

        <ResizableHandle />

        {/* Main Content Panel */}
        <ResizablePanel defaultSize={80} minSize={50}>
          <div className="h-full flex flex-col">
            <TabHeader openTabs={openTabs} activeTab={activeTab} />

            {activeTab && openTabs.find((tab) => tab.id === activeTab) && (
              <BreadcrumbNavigation activeTab={activeTab} openTabs={openTabs} />
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab && openTabs.find((tab) => tab.id === activeTab) ? (
                <ChartGrid file={openTabs.find((tab) => tab.id === activeTab)!} />
              ) : (
                <WelcomeMessage />
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      
      {/* Chart Edit Modal */}
      <ChartEditModal />
    </div>
  )
}