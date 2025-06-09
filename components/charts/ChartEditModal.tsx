"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAnalysisStore } from "@/stores/useAnalysisStore"
import { DataSourceTab } from "./EditModal/data-source"
import { ParametersTab } from "./EditModal/parameters"
import { AppearanceTab } from "./EditModal/appearance"
import { ChartPreview } from "./ChartPreview"
import { EventInfo } from "@/types"

export function ChartEditModal() {
  const { editingChart, editModalOpen, setEditingChart, setEditModalOpen } = useAnalysisStore()
  const [activeTab, setActiveTab] = useState<"parameters" | "datasource" | "appearance">("datasource")
  const [selectedDataSourceItems, setSelectedDataSourceItems] = useState<EventInfo[]>([])

  if (!editingChart) return null

  return (
    <>
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-7xl w-[90vw] h-[90vh] flex flex-col overflow-hidden" hideCloseButton>
          <DialogHeader className="flex-shrink-0">
            <div className="flex justify-between items-center">
              <DialogTitle>Edit Chart: {editingChart.title}</DialogTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setEditModalOpen(false)}>Save Changes</Button>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-[7fr_5fr] gap-4 flex-1 min-h-0">
            <div className="border rounded-lg p-4 overflow-hidden h-full flex flex-col">
              <div className="flex gap-2 mb-4">
                <button
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "datasource" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                  }`}
                  onClick={() => setActiveTab("datasource")}
                >
                  DataSource
                </button>
                <button
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "parameters" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                  }`}
                  onClick={() => setActiveTab("parameters")}
                >
                  Parameters
                </button>
                <button
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "appearance" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                  }`}
                  onClick={() => setActiveTab("appearance")}
                >
                  Appearance
                </button>
              </div>

              <div className="flex-1 min-h-0">
                {activeTab === "datasource" && (
                  <div className="h-full overflow-y-auto">
                    <DataSourceTab
                      selectedDataSourceItems={selectedDataSourceItems}
                      setSelectedDataSourceItems={setSelectedDataSourceItems}
                    />
                  </div>
                )}
                {activeTab === "parameters" && (
                  <div className="h-full">
                    <ParametersTab 
                      editingChart={editingChart} 
                      setEditingChart={setEditingChart}
                      selectedDataSourceItems={selectedDataSourceItems}
                    />
                  </div>
                )}
                {activeTab === "appearance" && (
                  <div className="h-full overflow-y-auto">
                    <AppearanceTab
                      editingChart={editingChart}
                      setEditingChart={setEditingChart}
                      selectedDataSourceItems={selectedDataSourceItems}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4 overflow-hidden h-full flex flex-col">
              <h3 className="text-base font-semibold border-b pb-1 mb-2 flex-shrink-0">Chart Preview</h3>
              <div className="flex-1 min-h-0">
                <ChartPreview
                  editingChart={editingChart}
                  selectedDataSourceItems={selectedDataSourceItems}
                  setEditingChart={setEditingChart}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

