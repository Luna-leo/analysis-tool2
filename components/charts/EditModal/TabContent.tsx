"use client"

import React from "react"
import { DataSourceTab } from "./data-source"
import { ParametersTab } from "./parameters"
import { AppearanceTab } from "./appearance"
import { TabType } from "./TabNavigation"
import { ChartComponent, EventInfo } from "@/types"

interface TabContentProps {
  activeTab: TabType
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  selectedDataSourceItems?: EventInfo[]
  setSelectedDataSourceItems?: React.Dispatch<React.SetStateAction<EventInfo[]>>
  includeDataSourceTab?: boolean
  isBulkEdit?: boolean
  currentScales?: {
    xDomain: [any, any]
    yDomain: [number, number]
    xAxisType: string
  } | null
}

export function TabContent({
  activeTab,
  editingChart,
  setEditingChart,
  selectedDataSourceItems = [],
  setSelectedDataSourceItems,
  includeDataSourceTab = true,
  isBulkEdit = false,
  currentScales
}: TabContentProps) {
  switch (activeTab) {
    case "datasource":
      if (!includeDataSourceTab || !setSelectedDataSourceItems) return null
      return (
        <div className="h-full overflow-y-auto">
          <DataSourceTab
            selectedDataSourceItems={selectedDataSourceItems}
            setSelectedDataSourceItems={setSelectedDataSourceItems}
            file={editingChart}
          />
        </div>
      )
    
    case "parameters":
      return (
        <div className="h-full overflow-y-auto">
          <ParametersTab 
            editingChart={editingChart} 
            setEditingChart={setEditingChart}
            selectedDataSourceItems={selectedDataSourceItems}
            isBulkEdit={isBulkEdit}
            currentScales={currentScales}
          />
        </div>
      )
    
    case "appearance":
      return (
        <div className="h-full overflow-y-auto">
          <AppearanceTab
            editingChart={editingChart}
            setEditingChart={setEditingChart}
            selectedDataSourceItems={selectedDataSourceItems}
          />
        </div>
      )
    
    default:
      return null
  }
}