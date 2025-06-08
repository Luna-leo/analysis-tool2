"use client"

import React, { useState } from "react"
import { ChartComponent } from "@/types"
import { XParameterSettings } from "./XParameterSettings"
import { YParametersSettings } from "./YParametersSettings"
import { ReferenceLinesSettings, ReferenceLineConfig } from "./ReferenceLinesSettings"

interface ParametersTabProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function ParametersTab({ editingChart, setEditingChart }: ParametersTabProps) {
  const [referenceLines, setReferenceLines] = useState<ReferenceLineConfig[]>([])

  return (
    <div className="flex flex-col space-y-4 h-full">
      <XParameterSettings editingChart={editingChart} setEditingChart={setEditingChart} />
      <YParametersSettings editingChart={editingChart} setEditingChart={setEditingChart} />
      <ReferenceLinesSettings
        editingChart={editingChart}
        referenceLines={referenceLines}
        onUpdateReferenceLines={setReferenceLines}
      />
    </div>
  )
}

