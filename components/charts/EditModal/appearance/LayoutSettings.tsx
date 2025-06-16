"use client"

import { ChartComponent } from "@/types"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LayoutSettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function LayoutSettings({ editingChart, setEditingChart }: LayoutSettingsProps) {
  const margins = editingChart.margins || { top: 20, right: 40, bottom: 60, left: 60 }
  const xAxisTicks = editingChart.xAxisTicks || 5
  const yAxisTicks = editingChart.yAxisTicks || 5
  const xAxisTickPrecision = editingChart.xAxisTickPrecision || 2
  const yAxisTickPrecision = editingChart.yAxisTickPrecision || 2
  const showGrid = editingChart.showGrid ?? false

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">チャートレイアウト</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Margins */}
          <div>
            <Label className="text-sm font-medium mb-2 block">マージン</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="margin-top" className="text-xs text-muted-foreground">
                  上
                </Label>
                <Input
                  id="margin-top"
                  type="number"
                  value={margins.top}
                  onChange={(e) => handleMarginChange('top', e.target.value)}
                  className="h-8"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="margin-right" className="text-xs text-muted-foreground">
                  右
                </Label>
                <Input
                  id="margin-right"
                  type="number"
                  value={margins.right}
                  onChange={(e) => handleMarginChange('right', e.target.value)}
                  className="h-8"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="margin-bottom" className="text-xs text-muted-foreground">
                  下
                </Label>
                <Input
                  id="margin-bottom"
                  type="number"
                  value={margins.bottom}
                  onChange={(e) => handleMarginChange('bottom', e.target.value)}
                  className="h-8"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="margin-left" className="text-xs text-muted-foreground">
                  左
                </Label>
                <Input
                  id="margin-left"
                  type="number"
                  value={margins.left}
                  onChange={(e) => handleMarginChange('left', e.target.value)}
                  className="h-8"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="flex items-center justify-between">
            <Label htmlFor="show-grid" className="text-sm">
              グリッド線を表示
            </Label>
            <Switch
              id="show-grid"
              checked={showGrid}
              onCheckedChange={(checked) => 
                setEditingChart({ ...editingChart, showGrid: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">軸目盛の設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* X-axis ticks */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">X軸</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="x-ticks" className="text-xs text-muted-foreground">
                  目盛の数
                </Label>
                <Input
                  id="x-ticks"
                  type="number"
                  value={xAxisTicks}
                  onChange={(e) => handleTicksChange('x', e.target.value)}
                  className="h-8"
                  min="1"
                  max="20"
                />
              </div>
              <div>
                <Label htmlFor="x-precision" className="text-xs text-muted-foreground">
                  小数点桁数
                </Label>
                <Input
                  id="x-precision"
                  type="number"
                  value={xAxisTickPrecision}
                  onChange={(e) => handlePrecisionChange('x', e.target.value)}
                  className="h-8"
                  min="0"
                  max="10"
                />
              </div>
            </div>
          </div>

          {/* Y-axis ticks */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Y軸</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="y-ticks" className="text-xs text-muted-foreground">
                  目盛の数
                </Label>
                <Input
                  id="y-ticks"
                  type="number"
                  value={yAxisTicks}
                  onChange={(e) => handleTicksChange('y', e.target.value)}
                  className="h-8"
                  min="1"
                  max="20"
                />
              </div>
              <div>
                <Label htmlFor="y-precision" className="text-xs text-muted-foreground">
                  小数点桁数
                </Label>
                <Input
                  id="y-precision"
                  type="number"
                  value={yAxisTickPrecision}
                  onChange={(e) => handlePrecisionChange('y', e.target.value)}
                  className="h-8"
                  min="0"
                  max="10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}