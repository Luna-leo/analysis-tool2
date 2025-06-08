"use client"

import React, { useState } from "react"
import { ChartComponent } from "@/types"
import { ReferenceLinesSettings } from "../parameters/ReferenceLinesSettings"

interface ReferenceLineTabProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

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

export function ReferenceLineTab({ editingChart, setEditingChart }: ReferenceLineTabProps) {
  const [referenceLines, setReferenceLines] = useState<ReferenceLineConfig[]>([])

  return (
    <div className="space-y-4">
      <ReferenceLinesSettings 
        editingChart={editingChart} 
        referenceLines={referenceLines}
        onUpdateReferenceLines={setReferenceLines}
      />
    </div>
  )
}