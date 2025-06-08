"use client"

import React, { useState } from "react"
import { ChartComponent } from "@/types"
import { XParameterSettings } from "./XParameterSettings"
import { YParametersSettings } from "./YParametersSettings"
import { ReferenceLinesSettings } from "./ReferenceLinesSettings"

interface ParametersTabProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function ParametersTab({ editingChart, setEditingChart }: ParametersTabProps) {

  interface ReferenceLineConfig {
    id: string
    type: "vertical" | "horizontal"
    label: string
    xValue?: string
    yValue?: string
    yRangeMin?: string
    yRangeMax?: string
    xRangeMin?: string
    xRangeMax?: string
  }

  const [referenceLines, setReferenceLines] = useState<ReferenceLineConfig[]>([])

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex-shrink-0">
        <XParameterSettings
          editingChart={editingChart}
          setEditingChart={setEditingChart}
        />
      </div>

      <div className="flex-1 min-h-[8rem] overflow-hidden">
        <YParametersSettings
          editingChart={editingChart}
          setEditingChart={setEditingChart}
        />
      </div>

      <div className="flex-1 min-h-[8rem] overflow-hidden">
        <ReferenceLinesSettings
          editingChart={editingChart}
          referenceLines={referenceLines}
          onUpdateReferenceLines={setReferenceLines}
        />
      </div>
    </div>
  )
}