"use client"

import React from "react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Sidebar } from "./Sidebar"
import { TabBar } from "./TabBar"
import { ChartGrid } from "./ChartGrid"
import { LayoutSettings } from "./LayoutSettings"
import { ChartEditModal } from "./ChartEditModal"
import { useAnalysisStore } from "@/stores/useAnalysisStore"
import { mockFileTree } from "@/data/mockData"
import { FileNode } from "@/types"

// Helper function to get file path
const getFilePath = (fileId: string, nodes: FileNode[], path: string[] = []): string[] | null => {
  for (const node of nodes) {
    const currentPath = [...path, node.name]

    if (node.id === fileId) {
      return currentPath
    }

    if (node.children) {
      const result = getFilePath(fileId, node.children, currentPath)
      if (result) {
        return result
      }
    }
  }
  return null
}

export default function AnalysisTool() {
  const { openTabs, activeTab } = useAnalysisStore()

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Sidebar with Activity Bar */}
        <div className="flex">
          <Sidebar fileTree={mockFileTree} />
        </div>

        {/* Main Content Area */}
        <ResizablePanel defaultSize={75} minSize={50}>
          <div className="h-full flex flex-col">
            {/* Tab Bar */}
            {openTabs.length > 0 && (
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
            )}

            {/* Breadcrumb */}
            {activeTab && openTabs.find((tab) => tab.id === activeTab) && (
              <div className="border-b bg-background px-4 py-2">
                <Breadcrumb>
                  <BreadcrumbList>
                    {(() => {
                      const currentFile = openTabs.find((tab) => tab.id === activeTab)
                      if (!currentFile) return null

                      const filePath = getFilePath(currentFile.id, mockFileTree)
                      if (!filePath) return null

                      return filePath.map((pathItem, index) => (
                        <React.Fragment key={index}>
                          {index === filePath.length - 1 ? (
                            <BreadcrumbItem>
                              <BreadcrumbPage>{pathItem}</BreadcrumbPage>
                            </BreadcrumbItem>
                          ) : (
                            <>
                              <BreadcrumbItem>
                                <BreadcrumbLink href="#" className="text-muted-foreground">
                                  {pathItem}
                                </BreadcrumbLink>
                              </BreadcrumbItem>
                              <BreadcrumbSeparator />
                            </>
                          )}
                        </React.Fragment>
                      ))
                    })()}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab && openTabs.find((tab) => tab.id === activeTab) ? (
                <ChartGrid file={openTabs.find((tab) => tab.id === activeTab)!} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-xl">Select a file from the explorer to view charts</p>
                  </div>
                </div>
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