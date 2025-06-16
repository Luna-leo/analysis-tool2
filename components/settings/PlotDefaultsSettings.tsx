"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarkerType, LineStyle } from "@/types"
import { PlotDefaults } from "@/types/settings"
import { defaultChartColors } from "@/utils/chartColors"
import { DEFAULT_PLOT_SETTINGS } from "@/constants/settings"

interface PlotDefaultsSettingsProps {
  plotDefaults: PlotDefaults
  onUpdate: (plotDefaults: Partial<PlotDefaults>) => void
  onReset: () => void
}

export function PlotDefaultsSettings({ plotDefaults, onUpdate, onReset }: PlotDefaultsSettingsProps) {
  const handleMarkerTypeChange = (type: MarkerType) => {
    onUpdate({
      marker: { ...plotDefaults.marker, type }
    })
  }

  const handleMarkerSizeChange = (size: number[]) => {
    onUpdate({
      marker: { ...plotDefaults.marker, size: size[0] }
    })
  }

  const handleMarkerBorderColorChange = (color: string) => {
    onUpdate({
      marker: { ...plotDefaults.marker, borderColor: color }
    })
  }

  const handleMarkerFillColorChange = (color: string) => {
    onUpdate({
      marker: { ...plotDefaults.marker, fillColor: color }
    })
  }

  const handleLineStyleChange = (style: LineStyle) => {
    onUpdate({
      line: { ...plotDefaults.line, style }
    })
  }

  const handleLineWidthChange = (width: number[]) => {
    onUpdate({
      line: { ...plotDefaults.line, width: width[0] }
    })
  }

  const handleLineColorChange = (color: string) => {
    onUpdate({
      line: { ...plotDefaults.line, color }
    })
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
          </TabsList>
          
          <TabsContent value="plot-defaults" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left side: Settings */}
              <div className="space-y-6">
                {/* Plot Type Settings */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Plot Type</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-markers" className="cursor-pointer">
                        Show Markers
                      </Label>
                      <Switch
                        id="show-markers"
                        checked={plotDefaults.showMarkers}
                        onCheckedChange={(checked) => onUpdate({ showMarkers: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-lines" className="cursor-pointer">
                        Show Lines
                      </Label>
                      <Switch
                        id="show-lines"
                        checked={plotDefaults.showLines}
                        onCheckedChange={(checked) => onUpdate({ showLines: checked })}
                      />
                    </div>
                  </div>
                </div>

                {/* Marker Settings */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Marker Defaults</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="marker-type">Type</Label>
                      <Select
                        value={plotDefaults.marker.type}
                        onValueChange={(value) => handleMarkerTypeChange(value as MarkerType)}
                      >
                        <SelectTrigger id="marker-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="circle">Circle</SelectItem>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="triangle">Triangle</SelectItem>
                          <SelectItem value="diamond">Diamond</SelectItem>
                          <SelectItem value="star">Star</SelectItem>
                          <SelectItem value="cross">Cross</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="marker-size">Size: {plotDefaults.marker.size}</Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          id="marker-size"
                          min={1}
                          max={20}
                          step={1}
                          value={[plotDefaults.marker.size]}
                          onValueChange={handleMarkerSizeChange}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          value={plotDefaults.marker.size}
                          onChange={(e) => handleMarkerSizeChange([parseInt(e.target.value) || 6])}
                          className="w-16"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="marker-border-color">Border Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="marker-border-color"
                            type="color"
                            value={plotDefaults.marker.borderColor}
                            onChange={(e) => handleMarkerBorderColorChange(e.target.value)}
                            className="h-9 w-16"
                          />
                          <div className="flex gap-1">
                            {defaultChartColors.slice(0, 4).map((color) => (
                              <button
                                key={color}
                                onClick={() => handleMarkerBorderColorChange(color)}
                                className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                                aria-label={`Select ${color} color`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="marker-fill-color">Fill Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="marker-fill-color"
                            type="color"
                            value={plotDefaults.marker.fillColor}
                            onChange={(e) => handleMarkerFillColorChange(e.target.value)}
                            className="h-9 w-16"
                          />
                          <div className="flex gap-1">
                            {defaultChartColors.slice(0, 4).map((color) => (
                              <button
                                key={color}
                                onClick={() => handleMarkerFillColorChange(color)}
                                className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                                aria-label={`Select ${color} color`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Line Settings */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Line Defaults</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="line-style">Style</Label>
                      <Select
                        value={plotDefaults.line.style}
                        onValueChange={(value) => handleLineStyleChange(value as LineStyle)}
                      >
                        <SelectTrigger id="line-style">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Solid</SelectItem>
                          <SelectItem value="dashed">Dashed</SelectItem>
                          <SelectItem value="dotted">Dotted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="line-width">Width: {plotDefaults.line.width}</Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          id="line-width"
                          min={1}
                          max={10}
                          step={1}
                          value={[plotDefaults.line.width]}
                          onValueChange={handleLineWidthChange}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={plotDefaults.line.width}
                          onChange={(e) => handleLineWidthChange([parseInt(e.target.value) || 2])}
                          className="w-16"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="line-color">Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="line-color"
                          type="color"
                          value={plotDefaults.line.color}
                          onChange={(e) => handleLineColorChange(e.target.value)}
                          className="h-9 w-16"
                        />
                        <div className="flex gap-1">
                          {defaultChartColors.map((color) => (
                            <button
                              key={color}
                              onClick={() => handleLineColorChange(color)}
                              className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              aria-label={`Select ${color} color`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                <Button variant="outline" onClick={onReset} className="w-full">
                  Reset to Defaults
                </Button>
              </div>

              {/* Right side: Preview */}
              <div className="border rounded-lg p-6 bg-muted/10">
                <h4 className="text-sm font-medium mb-4">Preview</h4>
                <PlotPreview plotDefaults={plotDefaults} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Preview component
function PlotPreview({ plotDefaults }: { plotDefaults: PlotDefaults }) {
  const { showMarkers, showLines, marker, line } = plotDefaults
  
  // Sample data points for preview
  const sampleData = [
    { x: 10, y: 20 },
    { x: 30, y: 45 },
    { x: 50, y: 35 },
    { x: 70, y: 60 },
    { x: 90, y: 40 },
  ]

  const svgWidth = 320
  const svgHeight = 200
  const margin = 20

  // Scale functions
  const xScale = (x: number) => (x / 100) * (svgWidth - 2 * margin) + margin
  const yScale = (y: number) => svgHeight - margin - (y / 100) * (svgHeight - 2 * margin)

  return (
    <svg width={svgWidth} height={svgHeight} className="w-full border rounded bg-background">
      {/* Grid lines */}
      <g className="opacity-10">
        {[0, 25, 50, 75, 100].map((val) => (
          <React.Fragment key={val}>
            <line
              x1={xScale(val)}
              y1={margin}
              x2={xScale(val)}
              y2={svgHeight - margin}
              stroke="currentColor"
              strokeWidth="1"
            />
            <line
              x1={margin}
              y1={yScale(val)}
              x2={svgWidth - margin}
              y2={yScale(val)}
              stroke="currentColor"
              strokeWidth="1"
            />
          </React.Fragment>
        ))}
      </g>

      {/* Axes */}
      <g>
        <line
          x1={margin}
          y1={svgHeight - margin}
          x2={svgWidth - margin}
          y2={svgHeight - margin}
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1={margin}
          y1={margin}
          x2={margin}
          y2={svgHeight - margin}
          stroke="currentColor"
          strokeWidth="2"
        />
      </g>

      {/* Sample plots with different colors */}
      {[0, 1, 2].map((seriesIndex) => {
        const offsetY = seriesIndex * 15
        const color = defaultChartColors[seriesIndex]
        
        return (
          <g key={seriesIndex}>
            {/* Lines */}
            {showLines && (
              <polyline
                points={sampleData.map(d => `${xScale(d.x)},${yScale(d.y + offsetY)}`).join(' ')}
                fill="none"
                stroke={seriesIndex === 0 ? line.color : color}
                strokeWidth={line.width}
                strokeDasharray={
                  line.style === 'dashed' ? '6,3' : 
                  line.style === 'dotted' ? '2,2' : 
                  'none'
                }
              />
            )}

            {/* Markers */}
            {showMarkers && sampleData.map((point, i) => {
              const x = xScale(point.x)
              const y = yScale(point.y + offsetY)
              const markerColor = seriesIndex === 0 ? marker.borderColor : color
              const fillColor = seriesIndex === 0 ? marker.fillColor : color

              return (
                <g key={i}>
                  {marker.type === 'circle' && (
                    <circle
                      cx={x}
                      cy={y}
                      r={marker.size / 2}
                      fill={fillColor}
                      stroke={markerColor}
                      strokeWidth="1"
                    />
                  )}
                  {marker.type === 'square' && (
                    <rect
                      x={x - marker.size / 2}
                      y={y - marker.size / 2}
                      width={marker.size}
                      height={marker.size}
                      fill={fillColor}
                      stroke={markerColor}
                      strokeWidth="1"
                    />
                  )}
                  {marker.type === 'triangle' && (
                    <polygon
                      points={`${x},${y - marker.size / 2} ${x - marker.size / 2},${y + marker.size / 2} ${x + marker.size / 2},${y + marker.size / 2}`}
                      fill={fillColor}
                      stroke={markerColor}
                      strokeWidth="1"
                    />
                  )}
                  {marker.type === 'diamond' && (
                    <polygon
                      points={`${x},${y - marker.size / 2} ${x + marker.size / 2},${y} ${x},${y + marker.size / 2} ${x - marker.size / 2},${y}`}
                      fill={fillColor}
                      stroke={markerColor}
                      strokeWidth="1"
                    />
                  )}
                  {marker.type === 'star' && (
                    <polygon
                      points={generateStarPoints(x, y, marker.size / 2)}
                      fill={fillColor}
                      stroke={markerColor}
                      strokeWidth="1"
                    />
                  )}
                  {marker.type === 'cross' && (
                    <g>
                      <line
                        x1={x - marker.size / 2}
                        y1={y}
                        x2={x + marker.size / 2}
                        y2={y}
                        stroke={markerColor}
                        strokeWidth="2"
                      />
                      <line
                        x1={x}
                        y1={y - marker.size / 2}
                        x2={x}
                        y2={y + marker.size / 2}
                        stroke={markerColor}
                        strokeWidth="2"
                      />
                    </g>
                  )}
                </g>
              )
            })}
          </g>
        )
      })}

      {/* Legend */}
      <g transform={`translate(${svgWidth - 80}, ${margin})`}>
        <text x="0" y="0" fontSize="10" className="fill-muted-foreground">
          Sample Data
        </text>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(0, ${15 + i * 15})`}>
            <line
              x1="0"
              y1="0"
              x2="20"
              y2="0"
              stroke={i === 0 ? line.color : defaultChartColors[i]}
              strokeWidth="2"
            />
            <text x="25" y="3" fontSize="10" className="fill-muted-foreground">
              Series {i + 1}
            </text>
          </g>
        ))}
      </g>
    </svg>
  )
}

function generateStarPoints(cx: number, cy: number, radius: number): string {
  const points = []
  const innerRadius = radius * 0.4
  
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const r = i % 2 === 0 ? radius : innerRadius
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    points.push(`${x},${y}`)
  }
  
  return points.join(' ')
}