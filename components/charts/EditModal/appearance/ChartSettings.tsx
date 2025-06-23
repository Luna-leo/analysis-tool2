"use client"

import { useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RotateCcw } from "lucide-react"
import { ChartComponent } from "@/types"
import { parseParameterKey } from "@/utils/parameterUtils"

interface ChartSettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function ChartSettings({ editingChart, setEditingChart }: ChartSettingsProps) {
  // Generate auto title from first Y parameter (without unit)
  const getAutoTitleForChart = () => {
    const yParams = editingChart.yAxisParams?.filter(p => p.parameter) || []
    if (yParams.length === 0) return ""
    
    // Use first Y parameter name (without unit)
    const firstParam = yParams[0]
    if (firstParam.parameterType === "Formula" || firstParam.parameterType === "Interlock") {
      return firstParam.parameter
    }
    
    const parsed = parseParameterKey(firstParam.parameter)
    return parsed ? parsed.name : firstParam.parameter  // No unit for title
  }

  // Auto-update title when Y parameters change
  useEffect(() => {
    if (editingChart.autoUpdateTitle ?? true) {
      const autoTitle = getAutoTitleForChart()
      if (autoTitle && autoTitle !== editingChart.title) {
        setEditingChart({
          ...editingChart,
          title: autoTitle
        })
      }
    }
  }, [
    // Watch for changes in Y parameters
    editingChart.yAxisParams?.map(p => p.parameter).join(','),
    editingChart.autoUpdateTitle
  ])

  return (
    <div className="space-y-4 px-4">
      {/* Title with Auto/Manual toggle */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium w-20">Title</Label>
          <Input
            id="chart-title"
            value={editingChart.title}
            onChange={(e) => {
              setEditingChart({
                ...editingChart,
                title: e.target.value,
              })
            }}
            placeholder={editingChart.title ? "Chart title" : `Auto: ${getAutoTitleForChart() || "Add Y parameters first"}`}
            disabled={editingChart.autoUpdateTitle ?? true}
            className="h-8 text-sm flex-1"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Checkbox
                    id="auto-update-title"
                    checked={editingChart.autoUpdateTitle ?? true}
                    onCheckedChange={(checked) => {
                      setEditingChart({
                        ...editingChart,
                        autoUpdateTitle: checked === true,
                      })
                    }}
                    className="h-4 w-4"
                  />
                  <Label
                    htmlFor="auto-update-title"
                    className="text-xs font-normal cursor-pointer ml-1.5"
                  >
                    Auto
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Auto-update title from first Y parameter</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const autoTitle = getAutoTitleForChart()
                    if (autoTitle) {
                      setEditingChart({
                        ...editingChart,
                        title: autoTitle
                      })
                    }
                  }}
                  className="h-7 w-7 p-0"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset to auto-generated title</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Chart Display Options */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium w-20">Display</Label>
        <div className="flex items-center gap-6 flex-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-title"
              checked={editingChart.showTitle ?? true}
              onCheckedChange={(checked) => {
                setEditingChart({
                  ...editingChart,
                  showTitle: checked === true,
                })
              }}
            />
            <Label htmlFor="show-title" className="text-sm cursor-pointer">Title</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-legend"
              checked={editingChart.showLegend ?? true}
              onCheckedChange={(checked) => {
                setEditingChart({
                  ...editingChart,
                  showLegend: checked === true,
                })
              }}
            />
            <Label htmlFor="show-legend" className="text-sm cursor-pointer">Legend</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-grid"
              checked={editingChart.showGrid ?? false}
              onCheckedChange={(checked) => {
                setEditingChart({
                  ...editingChart,
                  showGrid: checked === true,
                })
              }}
            />
            <Label htmlFor="show-grid" className="text-sm cursor-pointer">Grid</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-x-label"
              checked={editingChart.showXLabel ?? true}
              onCheckedChange={(checked) => {
                setEditingChart({
                  ...editingChart,
                  showXLabel: checked === true,
                })
              }}
            />
            <Label htmlFor="show-x-label" className="text-sm cursor-pointer">X Label</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-y-label"
              checked={editingChart.showYLabel ?? true}
              onCheckedChange={(checked) => {
                setEditingChart({
                  ...editingChart,
                  showYLabel: checked === true,
                })
              }}
            />
            <Label htmlFor="show-y-label" className="text-sm cursor-pointer">Y Label</Label>
          </div>
        </div>
      </div>
    </div>
  )
}