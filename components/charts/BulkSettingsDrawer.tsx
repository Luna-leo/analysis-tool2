"use client"

import React, { useState, useRef } from "react"
import { Settings2, Upload, Download, FileText } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { ChartComponent, FileNode, EventInfo } from "@/types"
import { useLayoutStore } from "@/stores/useLayoutStore"
import { useFileStore } from "@/stores/useFileStore"
import { toast } from "@/hooks/use-toast"

interface BulkSettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileNode
}

export function BulkSettingsDrawer({ open, onOpenChange, file }: BulkSettingsDrawerProps) {
  const { layoutSettingsMap, updateLayoutSettings } = useLayoutStore()
  const { updateFileCharts } = useFileStore()
  
  const currentLayoutSettings = layoutSettingsMap[file.id] || {
    showFileName: true,
    showDataSources: true,
    columns: 2,
    rows: 2,
    pagination: true,
  }

  // State for bulk settings
  const [layoutSettings, setLayoutSettings] = useState(currentLayoutSettings)
  const [dataSourceSettings, setDataSourceSettings] = useState<{
    action: "replace" | "add" | "none"
    sources: EventInfo[]
  }>({ action: "none", sources: [] })
  
  // Y軸パラメータごとの設定
  const [yParameterSettings, setYParameterSettings] = useState<{
    [chartIndex: number]: {
      [yParamIndex: number]: {
        parameter?: string
        axisName?: string
        color?: string
        markerType?: string
        lineStyle?: string
      }
    }
  }>({})
  
  // チャートタイトルの設定
  const [chartTitleSettings, setChartTitleSettings] = useState<{
    [chartIndex: number]: string
  }>({})
  
  // CSVインポート用
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [csvPreviewData, setCsvPreviewData] = useState<any[]>([])

  const [plotAppearanceSettings, setPlotAppearanceSettings] = useState<{
    showTitle: boolean
    showLegend: boolean
    showGrid: boolean
  }>({
    showTitle: true,
    showLegend: true,
    showGrid: true,
  })

  // CSV handling functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      parseCSV(text)
    }
    // UTF-8で読み込み
    reader.readAsText(file, 'UTF-8')
  }

  const parseCSV = (text: string) => {
    try {
      const lines = text.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      
      // Validate headers
      const requiredHeaders = ['chart_index', 'y_axis_index', 'parameter']
      const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h))
      
      if (!hasRequiredHeaders) {
        toast({
          title: "エラー",
          description: "CSVファイルに必須のヘッダーが含まれていません",
          variant: "destructive",
        })
        return
      }
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]
        })
        
        // Convert indices to numbers
        row.chart_index = parseInt(row.chart_index)
        row.y_axis_index = parseInt(row.y_axis_index)
        
        return row
      })
      
      setCsvPreviewData(data)
      toast({
        title: "成功",
        description: `${data.length}件の設定を読み込みました`,
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "CSVファイルの解析中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  const handleApplyCSVSettings = () => {
    const newSettings = { ...yParameterSettings }
    const newTitleSettings = { ...chartTitleSettings }
    
    csvPreviewData.forEach(row => {
      const chartIndex = row.chart_index
      const yAxisIndex = row.y_axis_index
      
      // Apply chart title if provided
      if (row.chart_title && row.chart_title.trim() !== '') {
        newTitleSettings[chartIndex] = row.chart_title
      }
      
      if (!newSettings[chartIndex]) newSettings[chartIndex] = {}
      if (!newSettings[chartIndex][yAxisIndex]) newSettings[chartIndex][yAxisIndex] = {}
      
      // Apply each setting if provided
      if (row.parameter) newSettings[chartIndex][yAxisIndex].parameter = row.parameter
      if (row.axis_name) newSettings[chartIndex][yAxisIndex].axisName = row.axis_name
      if (row.color) newSettings[chartIndex][yAxisIndex].color = row.color
      if (row.marker_type) newSettings[chartIndex][yAxisIndex].markerType = row.marker_type
      if (row.line_style) newSettings[chartIndex][yAxisIndex].lineStyle = row.line_style
    })
    
    setYParameterSettings(newSettings)
    setChartTitleSettings(newTitleSettings)
    setCsvPreviewData([])
    toast({
      title: "成功",
      description: "CSV設定を適用しました",
    })
  }

  const handleExportCurrentSettings = () => {
    const csvData: any[] = []
    
    file.charts?.forEach((chart, chartIndex) => {
      chart.yAxisParams?.forEach((yParam, yAxisIndex) => {
        const customSettings = yParameterSettings[chartIndex]?.[yAxisIndex]
        csvData.push({
          chart_index: chartIndex,
          chart_title: chart.title || "",
          y_axis_index: yAxisIndex,
          parameter: customSettings?.parameter ?? yParam.parameter,
          axis_name: customSettings?.axisName ?? yParam.axisName,
          color: customSettings?.color ?? yParam.line?.color ?? "#000000",
          marker_type: customSettings?.markerType ?? yParam.marker?.type ?? "circle",
          line_style: customSettings?.lineStyle ?? yParam.line?.style ?? "solid",
        })
      })
    })
    
    // Convert to CSV
    const headers = ['chart_index', 'chart_title', 'y_axis_index', 'parameter', 'axis_name', 'color', 'marker_type', 'line_style']
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => row[h]).join(','))
    ].join('\n')
    
    // Download with BOM for Excel compatibility
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `parameter_settings_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadTemplate = () => {
    const template = `chart_index,chart_title,y_axis_index,parameter,axis_name,color,marker_type,line_style
0,温度変化グラフ,0,Temperature,温度(°C),#FF0000,circle,solid
0,温度変化グラフ,1,Pressure,圧力(MPa),#0000FF,square,dashed
1,流量監視グラフ,0,Flow_Rate,流量(L/min),#00FF00,triangle,solid
1,流量監視グラフ,1,Flow_Speed,流速(m/s),#FFA500,diamond,dotted`
    
    // Download with BOM for Excel compatibility
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + template], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'parameter_settings_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleApplySettings = () => {
    // Apply layout settings
    updateLayoutSettings(file.id, layoutSettings)

    // Apply chart-specific settings
    if (file.charts) {
      const updatedCharts = file.charts.map((chart, chartIndex) => {
        const updatedChart: ChartComponent = { ...chart }
        
        // Apply chart title if set
        if (chartTitleSettings[chartIndex]) {
          updatedChart.title = chartTitleSettings[chartIndex]
        }

        // Apply data source settings
        if (dataSourceSettings.action !== "none" && dataSourceSettings.sources.length > 0) {
          if (dataSourceSettings.action === "replace") {
            updatedChart.selectedDataSources = dataSourceSettings.sources
          } else if (dataSourceSettings.action === "add") {
            const existingSources = updatedChart.selectedDataSources || []
            const newSources = dataSourceSettings.sources.filter(
              newSource => !existingSources.some(existing => existing.id === newSource.id)
            )
            updatedChart.selectedDataSources = [...existingSources, ...newSources]
          }
        }

        // Apply Y parameter settings
        if (updatedChart.yAxisParams && yParameterSettings[chartIndex]) {
          updatedChart.yAxisParams = updatedChart.yAxisParams.map((param, yParamIndex) => {
            const customSettings = yParameterSettings[chartIndex]?.[yParamIndex]
            if (!customSettings) return param
            
            const updatedParam = { ...param }
            
            // Update parameter name
            if (customSettings.parameter !== undefined) {
              updatedParam.parameter = customSettings.parameter
            }
            
            // Update axis name
            if (customSettings.axisName !== undefined) {
              updatedParam.axisName = customSettings.axisName
            }
            
            // Update color (for both marker and line)
            if (customSettings.color !== undefined) {
              if (updatedParam.marker) {
                updatedParam.marker = {
                  ...updatedParam.marker,
                  borderColor: customSettings.color,
                  fillColor: customSettings.color,
                }
              }
              if (updatedParam.line) {
                updatedParam.line = {
                  ...updatedParam.line,
                  color: customSettings.color,
                }
              }
            }
            
            // Update marker type
            if (customSettings.markerType !== undefined && updatedParam.marker) {
              updatedParam.marker = {
                ...updatedParam.marker,
                type: customSettings.markerType as any,
              }
            }
            
            // Update line style
            if (customSettings.lineStyle !== undefined && updatedParam.line) {
              updatedParam.line = {
                ...updatedParam.line,
                style: customSettings.lineStyle as any,
              }
            }
            
            return updatedParam
          })
        }

        // Apply plot appearance settings
        updatedChart.showTitle = plotAppearanceSettings.showTitle
        updatedChart.legend = plotAppearanceSettings.showLegend
        // Note: showGrid would need to be added to ChartComponent type

        return updatedChart
      })

      updateFileCharts(file.id, updatedCharts)
    }

    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[66.67%]">
        <SheetHeader>
          <SheetTitle>一括設定</SheetTitle>
          <SheetDescription>
            {file.name} のすべてのグラフに設定を一括適用します
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs defaultValue="layout" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="layout">レイアウト</TabsTrigger>
              <TabsTrigger value="datasource">データソース</TabsTrigger>
              <TabsTrigger value="parameters">パラメータ</TabsTrigger>
              <TabsTrigger value="appearance">表示</TabsTrigger>
            </TabsList>

            <TabsContent value="layout" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-filename">ファイル名を表示</Label>
                  <Switch
                    id="show-filename"
                    checked={layoutSettings.showFileName}
                    onCheckedChange={(checked) => 
                      setLayoutSettings({ ...layoutSettings, showFileName: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-datasources">データソースを表示</Label>
                  <Switch
                    id="show-datasources"
                    checked={layoutSettings.showDataSources}
                    onCheckedChange={(checked) => 
                      setLayoutSettings({ ...layoutSettings, showDataSources: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="columns">列数</Label>
                  <Select
                    value={String(layoutSettings.columns)}
                    onValueChange={(value) => 
                      setLayoutSettings({ ...layoutSettings, columns: Number(value) })
                    }
                  >
                    <SelectTrigger id="columns">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <SelectItem key={num} value={String(num)}>
                          {num}列
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rows">行数</Label>
                  <Select
                    value={String(layoutSettings.rows)}
                    onValueChange={(value) => 
                      setLayoutSettings({ ...layoutSettings, rows: Number(value) })
                    }
                  >
                    <SelectTrigger id="rows">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <SelectItem key={num} value={String(num)}>
                          {num}行
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="datasource" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>データソース操作</Label>
                  <Select
                    value={dataSourceSettings.action}
                    onValueChange={(value: "replace" | "add" | "none") => 
                      setDataSourceSettings({ ...dataSourceSettings, action: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">変更しない</SelectItem>
                      <SelectItem value="replace">置き換え</SelectItem>
                      <SelectItem value="add">追加</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {dataSourceSettings.action !== "none" && (
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      データソース選択機能は別途実装予定
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="parameters" className="space-y-4">
              {/* CSV Import Section */}
              <div className="space-y-4 p-4 border-2 border-dashed rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">CSVから一括設定</h4>
                    <p className="text-sm text-muted-foreground">
                      CSVファイルを使用してYパラメータを一括設定できます
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCurrentSettings}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      現在の設定をエクスポート
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadTemplate}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      テンプレート
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    CSVファイルを選択
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  {csvPreviewData.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {csvPreviewData.length}件の設定を読み込みました
                    </span>
                  )}
                </div>
                
                {/* CSV Preview Table */}
                {csvPreviewData.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium mb-2">プレビュー</h5>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-2 py-1 text-left">グラフ</th>
                            <th className="px-2 py-1 text-left">Y軸</th>
                            <th className="px-2 py-1 text-left">パラメータ</th>
                            <th className="px-2 py-1 text-left">軸名</th>
                            <th className="px-2 py-1 text-left">色</th>
                            <th className="px-2 py-1 text-left">マーカー</th>
                            <th className="px-2 py-1 text-left">ライン</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreviewData.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-2 py-1">{row.chart_title || `グラフ ${row.chart_index + 1}`}</td>
                              <td className="px-2 py-1">{row.y_axis_index + 1}</td>
                              <td className="px-2 py-1">{row.parameter}</td>
                              <td className="px-2 py-1">{row.axis_name}</td>
                              <td className="px-2 py-1">
                                <div className="flex items-center gap-1">
                                  <div 
                                    className="w-4 h-4 rounded border"
                                    style={{ backgroundColor: row.color }}
                                  />
                                  <span className="text-xs">{row.color}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1">{row.marker_type}</td>
                              <td className="px-2 py-1">{row.line_style}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {csvPreviewData.length > 5 && (
                        <div className="px-2 py-1 text-sm text-muted-foreground border-t">
                          他 {csvPreviewData.length - 5} 件
                        </div>
                      )}
                    </div>
                    <Button
                      className="mt-3"
                      onClick={handleApplyCSVSettings}
                      variant="default"
                      size="sm"
                    >
                      CSV設定を適用
                    </Button>
                  </div>
                )}
              </div>

              <Separator />
              
              {/* Manual Settings */}
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {file.charts?.map((chart, chartIndex) => (
                    <div key={chart.id} className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-medium text-sm">
                          グラフ {chartIndex + 1}:
                        </h4>
                        <Input
                          value={chartTitleSettings[chartIndex] ?? chart.title ?? ""}
                          onChange={(e) => {
                            const newSettings = { ...chartTitleSettings }
                            newSettings[chartIndex] = e.target.value
                            setChartTitleSettings(newSettings)
                          }}
                          placeholder="グラフタイトル"
                          className="flex-1"
                        />
                      </div>
                      
                      {chart.yAxisParams?.map((yParam, yParamIndex) => (
                        <div key={yParamIndex} className="pl-4 border-l-2">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium text-muted-foreground min-w-[60px]">
                              Y軸 {yParamIndex + 1}
                            </div>
                            
                            <Input
                              value={yParameterSettings[chartIndex]?.[yParamIndex]?.parameter ?? yParam.parameter}
                              onChange={(e) => {
                                const newSettings = { ...yParameterSettings }
                                if (!newSettings[chartIndex]) newSettings[chartIndex] = {}
                                if (!newSettings[chartIndex][yParamIndex]) newSettings[chartIndex][yParamIndex] = {}
                                newSettings[chartIndex][yParamIndex].parameter = e.target.value
                                setYParameterSettings(newSettings)
                              }}
                              placeholder="パラメータ名"
                              className="flex-1"
                            />
                            
                            <Input
                              value={yParameterSettings[chartIndex]?.[yParamIndex]?.axisName ?? yParam.axisName}
                              onChange={(e) => {
                                const newSettings = { ...yParameterSettings }
                                if (!newSettings[chartIndex]) newSettings[chartIndex] = {}
                                if (!newSettings[chartIndex][yParamIndex]) newSettings[chartIndex][yParamIndex] = {}
                                newSettings[chartIndex][yParamIndex].axisName = e.target.value
                                setYParameterSettings(newSettings)
                              }}
                              placeholder="軸名"
                              className="flex-1"
                            />
                            
                            <Input
                              type="color"
                              value={yParameterSettings[chartIndex]?.[yParamIndex]?.color ?? yParam.line?.color ?? "#000000"}
                              onChange={(e) => {
                                const newSettings = { ...yParameterSettings }
                                if (!newSettings[chartIndex]) newSettings[chartIndex] = {}
                                if (!newSettings[chartIndex][yParamIndex]) newSettings[chartIndex][yParamIndex] = {}
                                newSettings[chartIndex][yParamIndex].color = e.target.value
                                setYParameterSettings(newSettings)
                              }}
                              className="w-16 h-9 p-1"
                            />
                            
                            <Select
                              value={yParameterSettings[chartIndex]?.[yParamIndex]?.markerType ?? yParam.marker?.type ?? "circle"}
                              onValueChange={(value) => {
                                const newSettings = { ...yParameterSettings }
                                if (!newSettings[chartIndex]) newSettings[chartIndex] = {}
                                if (!newSettings[chartIndex][yParamIndex]) newSettings[chartIndex][yParamIndex] = {}
                                newSettings[chartIndex][yParamIndex].markerType = value
                                setYParameterSettings(newSettings)
                              }}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="circle">●丸</SelectItem>
                                <SelectItem value="square">■四角</SelectItem>
                                <SelectItem value="triangle">▲三角</SelectItem>
                                <SelectItem value="diamond">◆ダイヤ</SelectItem>
                                <SelectItem value="star">★星</SelectItem>
                                <SelectItem value="cross">✕クロス</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Select
                              value={yParameterSettings[chartIndex]?.[yParamIndex]?.lineStyle ?? yParam.line?.style ?? "solid"}
                              onValueChange={(value) => {
                                const newSettings = { ...yParameterSettings }
                                if (!newSettings[chartIndex]) newSettings[chartIndex] = {}
                                if (!newSettings[chartIndex][yParamIndex]) newSettings[chartIndex][yParamIndex] = {}
                                newSettings[chartIndex][yParamIndex].lineStyle = value
                                setYParameterSettings(newSettings)
                              }}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="solid">実線</SelectItem>
                                <SelectItem value="dashed">破線</SelectItem>
                                <SelectItem value="dotted">点線</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )) || (
                        <div className="text-sm text-muted-foreground pl-4">
                          Yパラメータが設定されていません
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-title">タイトルを表示</Label>
                  <Switch
                    id="show-title"
                    checked={plotAppearanceSettings.showTitle}
                    onCheckedChange={(checked) => 
                      setPlotAppearanceSettings({ 
                        ...plotAppearanceSettings, 
                        showTitle: checked 
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-legend">凡例を表示</Label>
                  <Switch
                    id="show-legend"
                    checked={plotAppearanceSettings.showLegend}
                    onCheckedChange={(checked) => 
                      setPlotAppearanceSettings({ 
                        ...plotAppearanceSettings, 
                        showLegend: checked 
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-grid">グリッドを表示</Label>
                  <Switch
                    id="show-grid"
                    checked={plotAppearanceSettings.showGrid}
                    onCheckedChange={(checked) => 
                      setPlotAppearanceSettings({ 
                        ...plotAppearanceSettings, 
                        showGrid: checked 
                      })
                    }
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleApplySettings}>
            設定を適用
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}