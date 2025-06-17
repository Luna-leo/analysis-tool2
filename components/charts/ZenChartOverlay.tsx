"use client"

import React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ChartComponent, EventInfo } from "@/types"
import { ChartPreview } from "./ChartPreview"

interface ZenChartOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chart: ChartComponent
  dataSources: EventInfo[]
}

export function ZenChartOverlay({ open, onOpenChange, chart, dataSources }: ZenChartOverlayProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-screen p-0 flex flex-col">
        <div className="flex-1 min-h-0">
          <ChartPreview editingChart={chart} selectedDataSourceItems={dataSources} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
