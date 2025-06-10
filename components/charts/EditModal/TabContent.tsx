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
  selectedDataSourceItems: EventInfo[]
  setSelectedDataSourceItems: (items: EventInfo[]) => void
}

export function TabContent({
  activeTab,
  editingChart,
  setEditingChart,
  selectedDataSourceItems,
  setSelectedDataSourceItems
}: TabContentProps) {
  switch (activeTab) {
    case "datasource":
      return (
        <div className="h-full overflow-y-auto">
          <DataSourceTab
            selectedDataSourceItems={selectedDataSourceItems}
            setSelectedDataSourceItems={setSelectedDataSourceItems}
          />
        </div>
      )
    
    case "parameters":
      return (
        <div className="h-full">
          <ParametersTab 
            editingChart={editingChart} 
            setEditingChart={setEditingChart}
            selectedDataSourceItems={selectedDataSourceItems}
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