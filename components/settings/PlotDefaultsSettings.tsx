"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GripVertical, RotateCcw } from "lucide-react"
import { MarkerType, LineStyle } from "@/types"
import { PlotDefaults, SeriesDefaults } from "@/types/settings"
import { defaultChartColors } from "@/utils/chartColors"
import { DEFAULT_PLOT_SETTINGS } from "@/constants/settings"

interface PlotDefaultsSettingsProps {
  plotDefaults: PlotDefaults
  seriesDefaults: SeriesDefaults
  onUpdatePlot: (plotDefaults: Partial<PlotDefaults>) => void
  onResetPlot: () => void
  onUpdateSeries: (seriesDefaults: Partial<SeriesDefaults>) => void
  onResetSeries: () => void
}

export function PlotDefaultsSettings({ 
  plotDefaults, 
  seriesDefaults,
  onUpdatePlot, 
  onResetPlot,
  onUpdateSeries,
  onResetSeries
}: PlotDefaultsSettingsProps) {
  const [draggedColorIndex, setDraggedColorIndex] = useState<number | null>(null)
  const [draggedMarkerIndex, setDraggedMarkerIndex] = useState<number | null>(null)
  // Color sequence handlers
  const handleColorDragStart = (index: number) => {
    setDraggedColorIndex(index)
  }

  const handleColorDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleColorDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedColorIndex === null || draggedColorIndex === dropIndex) return

    const newColors = [...seriesDefaults.colorSequence]
    const draggedColor = newColors[draggedColorIndex]
    
    newColors.splice(draggedColorIndex, 1)
    const insertIndex = draggedColorIndex < dropIndex ? dropIndex - 1 : dropIndex
    newColors.splice(insertIndex, 0, draggedColor)
    
    onUpdateSeries({ colorSequence: newColors })
    setDraggedColorIndex(null)
  }

  // Marker sequence handlers
  const handleMarkerDragStart = (index: number) => {
    setDraggedMarkerIndex(index)
  }

  const handleMarkerDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleMarkerDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedMarkerIndex === null || draggedMarkerIndex === dropIndex) return

    const newMarkers = [...seriesDefaults.markerSequence]
    const draggedMarker = newMarkers[draggedMarkerIndex]
    
    newMarkers.splice(draggedMarkerIndex, 1)
    const insertIndex = draggedMarkerIndex < dropIndex ? dropIndex - 1 : dropIndex
    newMarkers.splice(insertIndex, 0, draggedMarker)
    
    onUpdateSeries({ markerSequence: newMarkers })
    setDraggedMarkerIndex(null)
  }

  const renderMarker = (type: MarkerType, size: number = 20) => {
    const cx = size / 2
    const cy = size / 2
    const r = size / 3

    switch (type) {
      case 'circle':
        return <circle cx={cx} cy={cy} r={r} fill="currentColor" />
      case 'square':
        return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill="currentColor" />
      case 'triangle':
        return <polygon points={`${cx},${cy - r} ${cx - r},${cy + r} ${cx + r},${cy + r}`} fill="currentColor" />
      case 'diamond':
        return <polygon points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`} fill="currentColor" />
      case 'star':
        const starPoints = []
        for (let i = 0; i < 10; i++) {
          const angle = (Math.PI / 5) * i - Math.PI / 2
          const radius = i % 2 === 0 ? r : r * 0.5
          const x = cx + radius * Math.cos(angle)
          const y = cy + radius * Math.sin(angle)
          starPoints.push(`${x},${y}`)
        }
        return <polygon points={starPoints.join(' ')} fill="currentColor" />
      case 'cross':
        return (
          <g>
            <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="currentColor" strokeWidth="2" />
            <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="currentColor" strokeWidth="2" />
          </g>
        )
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display Preferences</CardTitle>
        <CardDescription>
          Customize default appearance for charts and plots
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="plot-defaults" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="plot-defaults">Plot Defaults</TabsTrigger>
            <TabsTrigger value="series-order">Series Order</TabsTrigger>
          </TabsList>
          
          <TabsContent value="plot-defaults" className="space-y-6">
            <div className="space-y-6">
                {/* Display Options */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Display Options</h4>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="show-markers"
                        checked={plotDefaults.showMarkers}
                        onCheckedChange={(checked) => onUpdatePlot({ showMarkers: checked })}
                      />
                      <Label htmlFor="show-markers" className="cursor-pointer">
                        Show Markers
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="show-lines"
                        checked={plotDefaults.showLines}
                        onCheckedChange={(checked) => onUpdatePlot({ showLines: checked })}
                      />
                      <Label htmlFor="show-lines" className="cursor-pointer">
                        Show Lines
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                <Button variant="outline" onClick={onResetPlot} className="w-full">
                  Reset to Defaults
                </Button>
            </div>
          </TabsContent>

          <TabsContent value="series-order" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Color Sequence */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Color Sequence</h4>
                  <Label className="text-xs text-muted-foreground">Drag to reorder or click to edit</Label>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {seriesDefaults.colorSequence.map((color, index) => (
                    <div
                      key={`${color}-${index}`}
                      draggable
                      onDragStart={() => handleColorDragStart(index)}
                      onDragOver={handleColorDragOver}
                      onDrop={(e) => handleColorDrop(e, index)}
                      className={`flex items-center gap-2 p-2 rounded-lg border bg-card cursor-move transition-opacity ${
                        draggedColorIndex === index ? 'opacity-50' : ''
                      } hover:bg-muted/50`}
                    >
                      <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Input
                            type="color"
                            value={color}
                            onChange={(e) => {
                              const newColors = [...seriesDefaults.colorSequence]
                              newColors[index] = e.target.value
                              onUpdateSeries({ colorSequence: newColors })
                            }}
                            className="w-8 h-8 p-1 cursor-pointer border-2 rounded"
                            style={{ backgroundColor: color }}
                          />
                        </div>
                        <div
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="flex-1"
                        >
                          <Input
                            type="text"
                            value={color}
                            onChange={(e) => {
                              const newColors = [...seriesDefaults.colorSequence]
                              newColors[index] = e.target.value
                              onUpdateSeries({ colorSequence: newColors })
                            }}
                            className="text-xs font-mono h-8"
                            pattern="^#[0-9A-Fa-f]{6}$"
                            placeholder="#000000"
                          />
                        </div>
                        <div
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newColors = seriesDefaults.colorSequence.filter((_, i) => i !== index)
                              onUpdateSeries({ colorSequence: newColors })
                            }}
                            className="h-8 w-8 p-0"
                            disabled={seriesDefaults.colorSequence.length <= 1}
                          >
                            ×
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      </div>
                    </div>
                  ))}
                  {/* Add new color button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newColors = [...seriesDefaults.colorSequence, '#000000']
                      onUpdateSeries({ colorSequence: newColors })
                    }}
                    className="w-full"
                  >
                    Add Color
                  </Button>
                </div>
              </div>

              {/* Marker Sequence */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Marker Sequence</h4>
                  <Label className="text-xs text-muted-foreground">Drag to reorder</Label>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {seriesDefaults.markerSequence.map((marker, index) => (
                    <div
                      key={`${marker}-${index}`}
                      draggable
                      onDragStart={() => handleMarkerDragStart(index)}
                      onDragOver={handleMarkerDragOver}
                      onDrop={(e) => handleMarkerDrop(e, index)}
                      className={`flex items-center gap-2 p-2 rounded-lg border bg-card cursor-move transition-opacity ${
                        draggedMarkerIndex === index ? 'opacity-50' : ''
                      } hover:bg-muted/50`}
                    >
                      <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <svg width="20" height="20" className="text-foreground flex-shrink-0">
                          {renderMarker(marker, 20)}
                        </svg>
                        <span className="text-xs capitalize truncate">{marker}</span>
                        <span className="text-xs text-muted-foreground ml-auto">#{index + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <Button variant="outline" onClick={onResetSeries} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}