"use client"

import React, { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileNode, LegendStyle, ChartComponent } from "@/types"
import { useFileStore } from "@/stores/useFileStore"
import { Info } from "lucide-react"

interface BulkSettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileNode
}

interface BulkLegendSettings {
  showLegend?: boolean
  legendStyle?: LegendStyle
}

export function BulkSettingsDrawer({ open, onOpenChange, file }: BulkSettingsDrawerProps) {
  const { updateFileCharts } = useFileStore()
  
  // Initialize settings with default values
  const [legendSettings, setLegendSettings] = useState<BulkLegendSettings>({
    showLegend: true,
    legendStyle: {
      position: 'right',
      layout: 'vertical',
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      fontSize: 12,
      fontColor: '#374151',
      padding: 8,
      itemSpacing: 4
    }
  })

  const handleApplySettings = () => {
    if (!file.charts) return

    // Apply settings to all charts
    const updatedCharts = file.charts.map((chart: ChartComponent) => ({
      ...chart,
      legend: legendSettings.showLegend,
      legendStyle: legendSettings.showLegend ? legendSettings.legendStyle : undefined
    }))

    // Update the file node with new charts
    updateFileCharts(file.id, updatedCharts)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[66.67%] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>一括設定</SheetTitle>
          <SheetDescription>
            {file.name} のすべてのグラフに設定を一括適用します
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Tabs defaultValue="legend" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="legend">凡例</TabsTrigger>
              <TabsTrigger value="axis" disabled>軸設定</TabsTrigger>
              <TabsTrigger value="style" disabled>スタイル</TabsTrigger>
            </TabsList>
            
            <TabsContent value="legend" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>凡例の表示設定</CardTitle>
                  <CardDescription>
                    すべてのグラフに共通の凡例設定を適用します
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Show Legend Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-legend" className="flex items-center gap-2">
                      凡例を表示
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Label>
                    <Switch
                      id="show-legend"
                      checked={legendSettings.showLegend}
                      onCheckedChange={(checked) => 
                        setLegendSettings({ ...legendSettings, showLegend: checked })
                      }
                    />
                  </div>

                  <Separator />

                  {/* Legend Style Settings */}
                  {legendSettings.showLegend && (
                    <div className="space-y-4">
                      {/* Position */}
                      <div className="space-y-2">
                        <Label htmlFor="legend-position">位置</Label>
                        <Select
                          value={legendSettings.legendStyle?.position || 'right'}
                          onValueChange={(value) => setLegendSettings({
                            ...legendSettings,
                            legendStyle: { ...legendSettings.legendStyle, position: value as any }
                          })}
                        >
                          <SelectTrigger id="legend-position">
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

                      {/* Layout */}
                      <div className="space-y-2">
                        <Label htmlFor="legend-layout">レイアウト</Label>
                        <Select
                          value={legendSettings.legendStyle?.layout || 'vertical'}
                          onValueChange={(value) => setLegendSettings({
                            ...legendSettings,
                            legendStyle: { ...legendSettings.legendStyle, layout: value as any }
                          })}
                        >
                          <SelectTrigger id="legend-layout">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="horizontal">横並び</SelectItem>
                            <SelectItem value="vertical">縦並び</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Background Color */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bg-color">背景色</Label>
                          <div className="flex gap-2">
                            <div
                              className="w-10 h-10 rounded border cursor-pointer"
                              style={{ backgroundColor: legendSettings.legendStyle?.backgroundColor }}
                              onClick={() => document.getElementById('bg-color-input')?.click()}
                            />
                            <Input
                              id="bg-color-input"
                              type="color"
                              value={legendSettings.legendStyle?.backgroundColor || '#ffffff'}
                              onChange={(e) => setLegendSettings({
                                ...legendSettings,
                                legendStyle: { ...legendSettings.legendStyle, backgroundColor: e.target.value }
                              })}
                              className="sr-only"
                            />
                            <Input
                              id="bg-color"
                              value={legendSettings.legendStyle?.backgroundColor || '#ffffff'}
                              onChange={(e) => setLegendSettings({
                                ...legendSettings,
                                legendStyle: { ...legendSettings.legendStyle, backgroundColor: e.target.value }
                              })}
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>

                        {/* Font Color */}
                        <div className="space-y-2">
                          <Label htmlFor="font-color">文字色</Label>
                          <div className="flex gap-2">
                            <div
                              className="w-10 h-10 rounded border cursor-pointer"
                              style={{ backgroundColor: legendSettings.legendStyle?.fontColor }}
                              onClick={() => document.getElementById('font-color-input')?.click()}
                            />
                            <Input
                              id="font-color-input"
                              type="color"
                              value={legendSettings.legendStyle?.fontColor || '#374151'}
                              onChange={(e) => setLegendSettings({
                                ...legendSettings,
                                legendStyle: { ...legendSettings.legendStyle, fontColor: e.target.value }
                              })}
                              className="sr-only"
                            />
                            <Input
                              id="font-color"
                              value={legendSettings.legendStyle?.fontColor || '#374151'}
                              onChange={(e) => setLegendSettings({
                                ...legendSettings,
                                legendStyle: { ...legendSettings.legendStyle, fontColor: e.target.value }
                              })}
                              placeholder="#374151"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Border Settings */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="border-color">枠線の色</Label>
                          <div className="flex gap-2">
                            <div
                              className="w-10 h-10 rounded border cursor-pointer"
                              style={{ backgroundColor: legendSettings.legendStyle?.borderColor }}
                              onClick={() => document.getElementById('border-color-input')?.click()}
                            />
                            <Input
                              id="border-color-input"
                              type="color"
                              value={legendSettings.legendStyle?.borderColor || '#e5e7eb'}
                              onChange={(e) => setLegendSettings({
                                ...legendSettings,
                                legendStyle: { ...legendSettings.legendStyle, borderColor: e.target.value }
                              })}
                              className="sr-only"
                            />
                            <Input
                              id="border-color"
                              value={legendSettings.legendStyle?.borderColor || '#e5e7eb'}
                              onChange={(e) => setLegendSettings({
                                ...legendSettings,
                                legendStyle: { ...legendSettings.legendStyle, borderColor: e.target.value }
                              })}
                              placeholder="#e5e7eb"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="border-width">枠線の太さ</Label>
                          <Input
                            id="border-width"
                            type="number"
                            min="0"
                            max="10"
                            value={legendSettings.legendStyle?.borderWidth || 1}
                            onChange={(e) => setLegendSettings({
                              ...legendSettings,
                              legendStyle: { ...legendSettings.legendStyle, borderWidth: parseInt(e.target.value) || 0 }
                            })}
                          />
                        </div>
                      </div>

                      {/* Font Size */}
                      <div className="space-y-2">
                        <Label htmlFor="font-size">文字サイズ</Label>
                        <Input
                          id="font-size"
                          type="number"
                          min="8"
                          max="24"
                          value={legendSettings.legendStyle?.fontSize || 12}
                          onChange={(e) => setLegendSettings({
                            ...legendSettings,
                            legendStyle: { ...legendSettings.legendStyle, fontSize: parseInt(e.target.value) || 12 }
                          })}
                        />
                      </div>

                      {/* Spacing Settings */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="padding">内側の余白</Label>
                          <Input
                            id="padding"
                            type="number"
                            min="0"
                            max="20"
                            value={legendSettings.legendStyle?.padding || 8}
                            onChange={(e) => setLegendSettings({
                              ...legendSettings,
                              legendStyle: { ...legendSettings.legendStyle, padding: parseInt(e.target.value) || 8 }
                            })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="item-spacing">項目間の間隔</Label>
                          <Input
                            id="item-spacing"
                            type="number"
                            min="0"
                            max="20"
                            value={legendSettings.legendStyle?.itemSpacing || 4}
                            onChange={(e) => setLegendSettings({
                              ...legendSettings,
                              legendStyle: { ...legendSettings.legendStyle, itemSpacing: parseInt(e.target.value) || 4 }
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Apply Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button onClick={handleApplySettings}>
              すべてのグラフに適用
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}