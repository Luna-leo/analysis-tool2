"use client"

import React, { useState } from "react"
import { ChartComponent, EventInfo } from "@/types"
import { XParameterSettings } from "./XParameterSettings"
import { YParametersSettings } from "./YParametersSettings"
import { ReferenceLinesSettings } from "./ReferenceLinesSettings"
import { useReferenceLines } from "@/hooks/useReferenceLines"

interface ParametersTabProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  selectedDataSourceItems: EventInfo[]
  isBulkEdit?: boolean
}


export function ParametersTab({ editingChart, setEditingChart, selectedDataSourceItems, isBulkEdit = false }: ParametersTabProps) {
  const [isReferenceLinesOpen, setIsReferenceLinesOpen] = useState(false)
  
  // Use the new hook for reference line management
  const { referenceLineConfigs, handleUpdateReferenceLines } = useReferenceLines(
    editingChart,
    setEditingChart
  )

  return (
    <div className="flex flex-col space-y-4 pb-4">
      <XParameterSettings 
        editingChart={editingChart} 
        setEditingChart={setEditingChart}
        selectedDataSourceItems={selectedDataSourceItems}
      />
      
      {!isBulkEdit && (
        <YParametersSettings 
          editingChart={editingChart} 
          setEditingChart={setEditingChart}
          isReferenceLinesOpen={isReferenceLinesOpen}
          selectedDataSourceItems={selectedDataSourceItems}
        />
      )}

      <ReferenceLinesSettings 
        editingChart={editingChart} 
        referenceLines={referenceLineConfigs}
        onUpdateReferenceLines={handleUpdateReferenceLines}
        isOpen={isReferenceLinesOpen}
        onOpenChange={setIsReferenceLinesOpen}
        selectedDataSourceItems={selectedDataSourceItems}
      />
    </div>
  )
}