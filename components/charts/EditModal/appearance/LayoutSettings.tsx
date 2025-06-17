"use client"

import { ChartComponent } from "@/types"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LayoutSettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function LayoutSettings({ editingChart, setEditingChart }: LayoutSettingsProps) {
  const margins = editingChart.margins || { top: 20, right: 40, bottom: 60, left: 60 }
  const xAxisTicks = editingChart.xAxisTicks ?? 5
  const yAxisTicks = editingChart.yAxisTicks ?? 5
  const xAxisTickPrecision = editingChart.xAxisTickPrecision ?? 2
  const yAxisTickPrecision = editingChart.yAxisTickPrecision ?? 2
  const xLabelOffset = editingChart.xLabelOffset ?? 40
  const yLabelOffset = editingChart.yLabelOffset ?? 40

  const handleMarginChange = (side: 'top' | 'right' | 'bottom' | 'left', value: string) => {
    const numValue = parseInt(value) || 0
    setEditingChart({
      ...editingChart,
      margins: {
        ...margins,
        [side]: Math.max(0, numValue)
      }
    })
  }

  const handleTicksChange = (axis: 'x' | 'y', value: string) => {
    const numValue = parseInt(value) || 5
    const key = axis === 'x' ? 'xAxisTicks' : 'yAxisTicks'
    setEditingChart({
      ...editingChart,
      [key]: Math.max(1, Math.min(20, numValue))
    })
  }

  const handlePrecisionChange = (axis: 'x' | 'y', value: string) => {
    const numValue = parseInt(value) || 0
    const key = axis === 'x' ? 'xAxisTickPrecision' : 'yAxisTickPrecision'
    setEditingChart({
      ...editingChart,
      [key]: Math.max(0, Math.min(10, numValue))
    })
  }

  const handleLabelOffsetChange = (axis: 'x' | 'y', value: string) => {
    const numValue = parseInt(value) || 0
    const key = axis === 'x' ? 'xLabelOffset' : 'yLabelOffset'
    setEditingChart({
      ...editingChart,
      [key]: Math.max(0, Math.min(100, numValue))
    })
  }

  return (
    <div className="space-y-4 px-4">
      {/* Margins - 1行で表示 */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium w-20">Margins</Label>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-muted-foreground">Top</span>
          <Input
            type="number"
            value={margins.top}
            onChange={(e) => handleMarginChange('top', e.target.value)}
            className="h-8 w-16"
            min="0"
          />
          <span className="text-xs text-muted-foreground">Right</span>
          <Input
            type="number"
            value={margins.right}
            onChange={(e) => handleMarginChange('right', e.target.value)}
            className="h-8 w-16"
            min="0"
          />
          <span className="text-xs text-muted-foreground">Bottom</span>
          <Input
            type="number"
            value={margins.bottom}
            onChange={(e) => handleMarginChange('bottom', e.target.value)}
            className="h-8 w-16"
            min="0"
          />
          <span className="text-xs text-muted-foreground">Left</span>
          <Input
            type="number"
            value={margins.left}
            onChange={(e) => handleMarginChange('left', e.target.value)}
            className="h-8 w-16"
            min="0"
          />
        </div>
      </div>


      {/* X-axis ticks - 1行で表示 */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium w-20">X-Axis</Label>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-muted-foreground">Ticks</span>
          <Input
            type="number"
            value={xAxisTicks}
            onChange={(e) => handleTicksChange('x', e.target.value)}
            className="h-8 w-16"
            min="1"
            max="20"
          />
          <span className="text-xs text-muted-foreground ml-4">Precision</span>
          <Select
            value={xAxisTickPrecision.toString()}
            onValueChange={(value) => handlePrecisionChange('x', value)}
          >
            <SelectTrigger className="h-8 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0 (整数)</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Y-axis ticks - 1行で表示 */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium w-20">Y-Axis</Label>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-muted-foreground">Ticks</span>
          <Input
            type="number"
            value={yAxisTicks}
            onChange={(e) => handleTicksChange('y', e.target.value)}
            className="h-8 w-16"
            min="1"
            max="20"
          />
          <span className="text-xs text-muted-foreground ml-4">Precision</span>
          <Select
            value={yAxisTickPrecision.toString()}
            onValueChange={(value) => handlePrecisionChange('y', value)}
          >
            <SelectTrigger className="h-8 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0 (整数)</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Axis Label Offsets - 1行で表示 */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium w-20">Label Offset</Label>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-muted-foreground">X</span>
          <Input
            type="number"
            value={xLabelOffset}
            onChange={(e) => handleLabelOffsetChange('x', e.target.value)}
            className="h-8 w-16"
            min="0"
            max="100"
          />
          <span className="text-xs text-muted-foreground ml-4">Y</span>
          <Input
            type="number"
            value={yLabelOffset}
            onChange={(e) => handleLabelOffsetChange('y', e.target.value)}
            className="h-8 w-16"
            min="0"
            max="100"
          />
        </div>
      </div>
    </div>
  )
}