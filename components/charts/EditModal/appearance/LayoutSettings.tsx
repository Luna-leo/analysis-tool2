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
    <div className="px-4">
      <div className="grid grid-cols-2 gap-6">
        {/* Top Row */}
        <div className="space-y-3">
          {/* Top-left: Margins */}
          <Label className="text-sm font-semibold">Chart Margins</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-12">Top</span>
              <Input
                type="number"
                value={margins.top}
                onChange={(e) => handleMarginChange('top', e.target.value)}
                className="h-8 flex-1"
                min="0"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-12">Right</span>
              <Input
                type="number"
                value={margins.right}
                onChange={(e) => handleMarginChange('right', e.target.value)}
                className="h-8 flex-1"
                min="0"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-12">Bottom</span>
              <Input
                type="number"
                value={margins.bottom}
                onChange={(e) => handleMarginChange('bottom', e.target.value)}
                className="h-8 flex-1"
                min="0"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-12">Left</span>
              <Input
                type="number"
                value={margins.left}
                onChange={(e) => handleMarginChange('left', e.target.value)}
                className="h-8 flex-1"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Top-right: Tips */}
        <div className="p-3 bg-muted/30 rounded-md h-fit">
          <p className="text-xs text-muted-foreground">
            <strong>Tips:</strong><br/>
            • Margins: チャート周囲の余白を設定<br/>
            • Ticks: 軸上の目盛り数を調整<br/>
            • Precision: 小数点以下の表示桁数（0で整数表示）<br/>
            • Label Offset: 軸ラベルの位置調整
          </p>
        </div>

        {/* Bottom Row */}
        {/* Bottom-left: X-Axis Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">X-Axis Settings</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Ticks</span>
              <Input
                type="number"
                value={xAxisTicks}
                onChange={(e) => handleTicksChange('x', e.target.value)}
                className="h-8 flex-1"
                min="1"
                max="20"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Precision</span>
              <Select
                value={xAxisTickPrecision.toString()}
                onValueChange={(value) => handlePrecisionChange('x', value)}
              >
                <SelectTrigger className="h-8 flex-1">
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
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Label Offset</span>
              <Input
                type="number"
                value={xLabelOffset}
                onChange={(e) => handleLabelOffsetChange('x', e.target.value)}
                className="h-8 flex-1"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        {/* Bottom-right: Y-Axis Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Y-Axis Settings</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Ticks</span>
              <Input
                type="number"
                value={yAxisTicks}
                onChange={(e) => handleTicksChange('y', e.target.value)}
                className="h-8 flex-1"
                min="1"
                max="20"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Precision</span>
              <Select
                value={yAxisTickPrecision.toString()}
                onValueChange={(value) => handlePrecisionChange('y', value)}
              >
                <SelectTrigger className="h-8 flex-1">
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
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Label Offset</span>
              <Input
                type="number"
                value={yLabelOffset}
                onChange={(e) => handleLabelOffsetChange('y', e.target.value)}
                className="h-8 flex-1"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}