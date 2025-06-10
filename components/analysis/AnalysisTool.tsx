"use client"

import React from "react"
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable"
import { Sidebar, TabHeader, BreadcrumbNavigation, WelcomeMessage } from "../layout"
import { ChartGrid, ChartEditModal } from "../charts"
import { useFileStore } from "@/stores/useFileStore"

export default function AnalysisTool() {
  const { openTabs, activeTab } = useFileStore()

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Sidebar with Activity Bar */}
        <div className="flex">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <ResizablePanel defaultSize={75} minSize={50}>
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