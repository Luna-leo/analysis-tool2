"use client"

import React, { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { EventInfo, DataSourceStyle } from "@/types"
import { useFileStore } from "@/stores/useFileStore"
import { toast } from "@/components/ui/use-toast"
import { getDefaultColor } from "@/utils/chartColors"

interface DataSourceStyleDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dataSource: EventInfo | null
  dataSourceIndex?: number
  fileId: string
  currentStyle?: DataSourceStyle
}


// Helper function to render different marker shapes
const renderMarkerShape = (x: number, y: number, shape: string, size: number, color: string, opacity: number) => {
  switch (shape) {
    case 'circle':
      return <circle cx={x} cy={y} r={size} fill={color} opacity={opacity} />
    
    case 'square':
      return <rect x={x - size} y={y - size} width={size * 2} height={size * 2} fill={color} opacity={opacity} />
    
    case 'triangle':
      return <polygon 
        points={`${x},${y - size} ${x - size},${y + size} ${x + size},${y + size}`} 
        fill={color} 
        opacity={opacity} 
      />
    
    case 'diamond':
      return <polygon 
        points={`${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`} 
        fill={color} 
        opacity={opacity} 
      />
    
    case 'cross':
      return (
        <g opacity={opacity}>
          <line x1={x - size} y1={y} x2={x + size} y2={y} stroke={color} strokeWidth="2" />
          <line x1={x} y1={y - size} x2={x} y2={y + size} stroke={color} strokeWidth="2" />
        </g>
      )
    
    case 'star':
      const points: string[] = []
      const numSpikes = 5
      const outerRadius = size
      const innerRadius = size * 0.5
      
      for (let i = 0; i < numSpikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius
        const angle = (i * Math.PI) / numSpikes - Math.PI / 2
        const px = x + Math.cos(angle) * radius
        const py = y + Math.sin(angle) * radius
        points.push(`${px},${py}`)
      }
      
      return <polygon points={points.join(' ')} fill={color} opacity={opacity} />
    
    default:
      return <circle cx={x} cy={y} r={size} fill={color} opacity={opacity} />
  }
}

export function DataSourceStyleDrawer({ 
  open, 
  onOpenChange, 
  dataSource, 
  dataSourceIndex = 0,
  fileId,
  currentStyle 
}: DataSourceStyleDrawerProps) {
  const { updateDataSourceStyle } = useFileStore()
  
  const [style, setStyle] = useState<DataSourceStyle>({
    lineEnabled: currentStyle?.lineEnabled || false,
    lineColor: currentStyle?.lineColor || getDefaultColor(dataSourceIndex),
    lineWidth: currentStyle?.lineWidth || 2,
    lineStyle: currentStyle?.lineStyle || 'solid',
    lineOpacity: currentStyle?.lineOpacity || 1,
    markerEnabled: currentStyle?.markerEnabled !== undefined ? currentStyle.markerEnabled : true,
    markerShape: currentStyle?.markerShape || 'circle',
    markerSize: currentStyle?.markerSize || 6,
    markerColor: currentStyle?.markerColor || currentStyle?.lineColor || getDefaultColor(dataSourceIndex),
    markerOpacity: currentStyle?.markerOpacity || 1,
    showDataLabels: currentStyle?.showDataLabels || false,
    interpolation: currentStyle?.interpolation || 'linear'
  })

  useEffect(() => {
    if (dataSource && open) {
      setStyle({
        lineEnabled: currentStyle?.lineEnabled || false,
        lineColor: currentStyle?.lineColor || getDefaultColor(dataSourceIndex),
        lineWidth: currentStyle?.lineWidth || 2,
        lineStyle: currentStyle?.lineStyle || 'solid',
        lineOpacity: currentStyle?.lineOpacity || 1,
        markerEnabled: currentStyle?.markerEnabled !== undefined ? currentStyle.markerEnabled : true,
        markerShape: currentStyle?.markerShape || 'circle',
        markerSize: currentStyle?.markerSize || 6,
        markerColor: currentStyle?.markerColor || currentStyle?.lineColor || getDefaultColor(dataSourceIndex),
        markerOpacity: currentStyle?.markerOpacity || 1,
        showDataLabels: currentStyle?.showDataLabels || false,
        interpolation: currentStyle?.interpolation || 'linear'
      })
    }
  }, [dataSource, currentStyle, open])

  const handleSave = () => {
    if (dataSource) {
      updateDataSourceStyle(fileId, dataSource.id, style)
      onOpenChange(false)
    }
  }

  const handleReset = () => {
    if (dataSource) {
      const defaultStyle: DataSourceStyle = {
        lineEnabled: false,
        lineColor: getDefaultColor(dataSourceIndex),
        lineWidth: 2,
        lineStyle: 'solid',
        lineOpacity: 1,
        markerEnabled: true,
        markerShape: 'circle',
        markerSize: 6,
        markerColor: getDefaultColor(dataSourceIndex),
        markerOpacity: 1,
        showDataLabels: false,
        interpolation: 'linear'
      }
      setStyle(defaultStyle)
    }
  }

  if (!dataSource) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{dataSource.label}</Badge>
              <span>Style Settings</span>
            </div>
          </SheetTitle>
          <SheetDescription>
            Customize the appearance of this data source in charts
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* Preview */}
          <div className="border rounded-lg p-4 bg-muted/30 h-24 flex items-center justify-center">
            <svg width="300" height="60">
              {/* Show line if enabled */}
              {style.lineEnabled && (
                <line
                  x1="50"
                  y1="30"
                  x2="250"
                  y2="30"
                  stroke={style.lineColor}
                  strokeWidth={style.lineWidth}
                  strokeDasharray={
                    style.lineStyle === 'dashed' ? '5,5' :
                    style.lineStyle === 'dotted' ? '2,2' :
                    style.lineStyle === 'dashdot' ? '5,2,2,2' :
                    'none'
                  }
                  opacity={style.lineOpacity}
                />
              )}
              {/* Show markers if enabled */}
              {style.markerEnabled && [50, 100, 150, 200, 250].map(x => (
                <g key={x}>
                  {renderMarkerShape(x, 30, style.markerShape || 'circle', style.markerSize || 4, style.markerColor || style.lineColor || '#3b82f6', style.markerOpacity || 1)}
                </g>
              ))}
              {!style.markerEnabled && !style.lineEnabled && (
                <text x="150" y="35" textAnchor="middle" className="text-sm fill-muted-foreground">
                  No visible elements
                </text>
              )}
            </svg>
          </div>
          
          {/* Line Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Line</Label>
              <Switch
                checked={style.lineEnabled}
                onCheckedChange={(checked) => {
                  if (!checked && !style.markerEnabled) {
                    toast({
                      title: "Cannot disable line",
                      description: "At least one visual element (line or marker) must be enabled.",
                      variant: "destructive",
                    })
                    return
                  }
                  setStyle({ ...style, lineEnabled: checked })
                }}
              />
            </div>
            
            {style.lineEnabled && (
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                <h3 className="font-medium text-sm">Line Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={style.lineColor}
                    onChange={(e) => setStyle({ ...style, lineColor: e.target.value })}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={style.lineColor}
                    onChange={(e) => setStyle({ ...style, lineColor: e.target.value })}
                    className="flex-1 h-9"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Width</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    min={0.5}
                    max={5}
                    step={0.5}
                    value={[style.lineWidth || 2]}
                    onValueChange={([value]) => setStyle({ ...style, lineWidth: value })}
                    className="flex-1"
                  />
                  <span className="text-xs w-8 text-right">{style.lineWidth}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Style</Label>
              <Select
                value={style.lineStyle}
                onValueChange={(value: any) => setStyle({ ...style, lineStyle: value })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid ―――</SelectItem>
                  <SelectItem value="dashed">Dashed - - -</SelectItem>
                  <SelectItem value="dotted">Dotted · · ·</SelectItem>
                  <SelectItem value="dashdot">Dash-Dot -·-·</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Opacity</Label>
              <div className="flex items-center gap-2">
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={[style.lineOpacity || 1]}
                  onValueChange={([value]) => setStyle({ ...style, lineOpacity: value })}
                  className="flex-1"
                />
                <span className="text-xs w-8 text-right">{Math.round((style.lineOpacity || 1) * 100)}%</span>
              </div>
            </div>
              </div>
            )}
          </div>
          
          {/* Marker Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Marker</Label>
              <Switch
                checked={style.markerEnabled}
                onCheckedChange={(checked) => {
                  if (!checked && !style.lineEnabled) {
                    toast({
                      title: "Cannot disable marker",
                      description: "At least one visual element (line or marker) must be enabled.",
                      variant: "destructive",
                    })
                    return
                  }
                  setStyle({ ...style, markerEnabled: checked })
                }}
              />
            </div>
            
            {style.markerEnabled && (
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                <h3 className="font-medium text-sm">Marker Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Shape</Label>
                    <Select
                      value={style.markerShape}
                      onValueChange={(value: any) => setStyle({ ...style, markerShape: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="circle">● Circle</SelectItem>
                        <SelectItem value="square">■ Square</SelectItem>
                        <SelectItem value="triangle">▲ Triangle</SelectItem>
                        <SelectItem value="diamond">◆ Diamond</SelectItem>
                        <SelectItem value="cross">✕ Cross</SelectItem>
                        <SelectItem value="star">★ Star</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Size</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        min={2}
                        max={12}
                        step={1}
                        value={[style.markerSize || 6]}
                        onValueChange={([value]) => setStyle({ ...style, markerSize: value })}
                        className="flex-1"
                      />
                      <span className="text-xs w-8 text-right">{style.markerSize}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Marker Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={style.markerColor}
                      onChange={(e) => setStyle({ ...style, markerColor: e.target.value })}
                      className="w-12 h-9 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={style.markerColor}
                      onChange={(e) => setStyle({ ...style, markerColor: e.target.value })}
                      className="flex-1 h-9"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Other Settings - Show when lines are enabled */}
          {style.lineEnabled && (
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Other Settings</h3>
            
            <div className="space-y-2">
              <Label className="text-xs">Interpolation</Label>
              <Select
                value={style.interpolation}
                onValueChange={(value: any) => setStyle({ ...style, interpolation: value })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="smooth">Smooth</SelectItem>
                  <SelectItem value="step">Step</SelectItem>
                  <SelectItem value="stepAfter">Step After</SelectItem>
                  <SelectItem value="stepBefore">Step Before</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-xs">Show Data Labels</Label>
              <Switch
                checked={style.showDataLabels}
                onCheckedChange={(checked) => setStyle({ ...style, showDataLabels: checked })}
              />
            </div>
          </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              Apply
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset to Default
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}