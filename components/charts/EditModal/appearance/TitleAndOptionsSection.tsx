"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight } from "lucide-react"
import { ChartComponent } from "@/types"

interface TitleAndOptionsSectionProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function TitleAndOptionsSection({ editingChart, setEditingChart }: TitleAndOptionsSectionProps) {
  const [legendExpanded, setLegendExpanded] = useState(false)

  return (
    <div className="space-y-4">
      <Label htmlFor="chart-title" className="text-sm">Title</Label>
      <div className="flex items-center gap-2">
        <Input
          id="chart-title"
          value={editingChart.title}
          onChange={(e) => {
            setEditingChart({
              ...editingChart,
              title: e.target.value,
            })
          }}
          className="h-8 text-sm flex-1"
        />
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-title"
              checked={editingChart.showTitle ?? true}
              onChange={(e) => {
                setEditingChart({
                  ...editingChart,
                  showTitle: e.target.checked,
                })
              }}
              className="rounded"
            />
            <Label htmlFor="show-title" className="text-sm whitespace-nowrap">Show Title</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-legend"
              checked={editingChart.legend ?? true}
              onChange={(e) => {
                setEditingChart({
                  ...editingChart,
                  legend: e.target.checked,
                })
              }}
              className="rounded"
            />
            <Label htmlFor="show-legend" className="text-sm whitespace-nowrap">Show Legend</Label>
          </div>
        </div>
      </div>

      {/* Legend Style Settings */}
      {editingChart.legend && (
        <Collapsible open={legendExpanded} onOpenChange={setLegendExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2 h-auto">
              <span className="text-sm font-medium">凡例の詳細設定</span>
              {legendExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 p-4 border rounded-md mt-2">
            {/* Position and Layout */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legend-position" className="text-sm">位置</Label>
                <Select
                  value={editingChart.legendStyle?.position || 'right'}
                  onValueChange={(value) => setEditingChart({
                    ...editingChart,
                    legendStyle: { ...editingChart.legendStyle, position: value as any }
                  })}
                >
                  <SelectTrigger id="legend-position" className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">上</SelectItem>
                    <SelectItem value="right">右</SelectItem>
                    <SelectItem value="bottom">下</SelectItem>
                    <SelectItem value="left">左</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="legend-layout" className="text-sm">レイアウト</Label>
                <Select
                  value={editingChart.legendStyle?.layout || 'vertical'}
                  onValueChange={(value) => setEditingChart({
                    ...editingChart,
                    legendStyle: { ...editingChart.legendStyle, layout: value as any }
                  })}
                >
                  <SelectTrigger id="legend-layout" className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">横並び</SelectItem>
                    <SelectItem value="vertical">縦並び</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bg-color" className="text-sm">背景色</Label>
                <div className="flex gap-2">
                  <div
                    className="w-8 h-8 rounded border cursor-pointer flex-shrink-0"
                    style={{ backgroundColor: editingChart.legendStyle?.backgroundColor || '#ffffff' }}
                    onClick={() => document.getElementById('bg-color-input')?.click()}
                  />
                  <Input
                    id="bg-color-input"
                    type="color"
                    value={editingChart.legendStyle?.backgroundColor || '#ffffff'}
                    onChange={(e) => setEditingChart({
                      ...editingChart,
                      legendStyle: { ...editingChart.legendStyle, backgroundColor: e.target.value }
                    })}
                    className="sr-only"
                  />
                  <Input
                    id="bg-color"
                    value={editingChart.legendStyle?.backgroundColor || '#ffffff'}
                    onChange={(e) => setEditingChart({
                      ...editingChart,
                      legendStyle: { ...editingChart.legendStyle, backgroundColor: e.target.value }
                    })}
                    placeholder="#ffffff"
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-color" className="text-sm">文字色</Label>
                <div className="flex gap-2">
                  <div
                    className="w-8 h-8 rounded border cursor-pointer flex-shrink-0"
                    style={{ backgroundColor: editingChart.legendStyle?.fontColor || '#374151' }}
                    onClick={() => document.getElementById('font-color-input')?.click()}
                  />
                  <Input
                    id="font-color-input"
                    type="color"
                    value={editingChart.legendStyle?.fontColor || '#374151'}
                    onChange={(e) => setEditingChart({
                      ...editingChart,
                      legendStyle: { ...editingChart.legendStyle, fontColor: e.target.value }
                    })}
                    className="sr-only"
                  />
                  <Input
                    id="font-color"
                    value={editingChart.legendStyle?.fontColor || '#374151'}
                    onChange={(e) => setEditingChart({
                      ...editingChart,
                      legendStyle: { ...editingChart.legendStyle, fontColor: e.target.value }
                    })}
                    placeholder="#374151"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Border */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="border-color" className="text-sm">枠線の色</Label>
                <div className="flex gap-2">
                  <div
                    className="w-8 h-8 rounded border cursor-pointer flex-shrink-0"
                    style={{ backgroundColor: editingChart.legendStyle?.borderColor || '#e5e7eb' }}
                    onClick={() => document.getElementById('border-color-input')?.click()}
                  />
                  <Input
                    id="border-color-input"
                    type="color"
                    value={editingChart.legendStyle?.borderColor || '#e5e7eb'}
                    onChange={(e) => setEditingChart({
                      ...editingChart,
                      legendStyle: { ...editingChart.legendStyle, borderColor: e.target.value }
                    })}
                    className="sr-only"
                  />
                  <Input
                    id="border-color"
                    value={editingChart.legendStyle?.borderColor || '#e5e7eb'}
                    onChange={(e) => setEditingChart({
                      ...editingChart,
                      legendStyle: { ...editingChart.legendStyle, borderColor: e.target.value }
                    })}
                    placeholder="#e5e7eb"
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="border-width" className="text-sm">枠線の太さ</Label>
                <Input
                  id="border-width"
                  type="number"
                  min="0"
                  max="10"
                  value={editingChart.legendStyle?.borderWidth || 1}
                  onChange={(e) => setEditingChart({
                    ...editingChart,
                    legendStyle: { ...editingChart.legendStyle, borderWidth: parseInt(e.target.value) || 0 }
                  })}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Font Size and Spacing */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="font-size" className="text-sm">文字サイズ</Label>
                <Input
                  id="font-size"
                  type="number"
                  min="8"
                  max="24"
                  value={editingChart.legendStyle?.fontSize || 12}
                  onChange={(e) => setEditingChart({
                    ...editingChart,
                    legendStyle: { ...editingChart.legendStyle, fontSize: parseInt(e.target.value) || 12 }
                  })}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="padding" className="text-sm">余白</Label>
                <Input
                  id="padding"
                  type="number"
                  min="0"
                  max="20"
                  value={editingChart.legendStyle?.padding || 8}
                  onChange={(e) => setEditingChart({
                    ...editingChart,
                    legendStyle: { ...editingChart.legendStyle, padding: parseInt(e.target.value) || 8 }
                  })}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-spacing" className="text-sm">項目間隔</Label>
                <Input
                  id="item-spacing"
                  type="number"
                  min="0"
                  max="20"
                  value={editingChart.legendStyle?.itemSpacing || 4}
                  onChange={(e) => setEditingChart({
                    ...editingChart,
                    legendStyle: { ...editingChart.legendStyle, itemSpacing: parseInt(e.target.value) || 4 }
                  })}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}