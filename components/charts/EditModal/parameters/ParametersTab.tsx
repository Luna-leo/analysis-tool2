"use client"

import React from "react"
import { ChartComponent } from "@/types"
import { XParameterSettings } from "./XParameterSettings"
import { YParametersSettings } from "./YParametersSettings"

interface ParametersTabProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function ParametersTab({ editingChart, setEditingChart }: ParametersTabProps) {
  return (
    <div className="flex flex-col space-y-4 h-full">
      <XParameterSettings 
        editingChart={editingChart} 
        setEditingChart={setEditingChart} 
      />
      
      <YParametersSettings 
        editingChart={editingChart} 
        setEditingChart={setEditingChart} 
      />
      
    </div>
  )
}