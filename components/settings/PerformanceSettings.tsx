"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RotateCcw, Zap, HardDrive, Database, MousePointer } from "lucide-react"
import { PerformanceSettings as PerformanceSettingsType } from "@/types/settings"
import { DEFAULT_PERFORMANCE_SETTINGS } from "@/constants/settings"

interface PerformanceSettingsProps {
  performanceSettings: PerformanceSettingsType
  onUpdate: (settings: Partial<PerformanceSettingsType>) => void
  onReset: () => void
}

export function PerformanceSettings({ 
  performanceSettings, 
  onUpdate, 
  onReset 
}: PerformanceSettingsProps) {
  
  const updateRenderingSettings = (key: keyof PerformanceSettingsType['rendering'], value: number) => {
    onUpdate({
      rendering: {
        ...performanceSettings.rendering,
        [key]: value
      }
    })
  }

  const updateMemorySettings = (key: keyof PerformanceSettingsType['memory'], value: number) => {
    onUpdate({
      memory: {
        ...performanceSettings.memory,
        [key]: value
      }
    })
  }

  const updateDataProcessingSettings = (key: keyof PerformanceSettingsType['dataProcessing'], value: number | string | boolean) => {
    onUpdate({
      dataProcessing: {
        ...performanceSettings.dataProcessing,
        [key]: value
      }
    })
  }

  const updateInteractionSettings = (key: keyof PerformanceSettingsType['interaction'], value: number | boolean) => {
    onUpdate({
      interaction: {
        ...performanceSettings.interaction,
        [key]: value
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Settings</CardTitle>
        <CardDescription>
          Optimize chart rendering performance based on your hardware and needs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rendering" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="rendering" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Rendering
            </TabsTrigger>
            <TabsTrigger value="memory" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Memory
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
            <TabsTrigger value="interaction" className="flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Interaction
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rendering" className="space-y-6 mt-6">
            <div className="space-y-4">
              {/* Canvas Threshold */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="canvas-threshold">
                    Canvas Rendering Threshold
                    <span className="text-xs text-muted-foreground ml-2">
                      Switch to canvas when data points exceed this value
                    </span>
                  </Label>
                  <span className="text-sm font-medium">{performanceSettings.rendering.canvasThreshold} points</span>
                </div>
                <Slider
                  id="canvas-threshold"
                  min={100}
                  max={1000}
                  step={50}
                  value={[performanceSettings.rendering.canvasThreshold]}
                  onValueChange={([value]) => updateRenderingSettings('canvasThreshold', value)}
                />
              </div>

              {/* LOD Thresholds */}
              <div className="space-y-2">
                <Label>Level of Detail (LOD) Thresholds</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="lod-high" className="text-xs">High Detail</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="lod-high"
                        type="number"
                        min={500}
                        max={5000}
                        step={100}
                        value={performanceSettings.rendering.lodHighThreshold}
                        onChange={(e) => updateRenderingSettings('lodHighThreshold', parseInt(e.target.value) || 1000)}
                        className="h-8"
                      />
                      <span className="text-xs text-muted-foreground">points</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lod-medium" className="text-xs">Medium Detail</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="lod-medium"
                        type="number"
                        min={100}
                        max={1000}
                        step={50}
                        value={performanceSettings.rendering.lodMediumThreshold}
                        onChange={(e) => updateRenderingSettings('lodMediumThreshold', parseInt(e.target.value) || 500)}
                        className="h-8"
                      />
                      <span className="text-xs text-muted-foreground">points</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Max SVG Points */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="max-svg">
                    Maximum SVG Points
                    <span className="text-xs text-muted-foreground ml-2">
                      Force canvas rendering above this limit
                    </span>
                  </Label>
                  <span className="text-sm font-medium">{performanceSettings.rendering.maxSvgPoints} points</span>
                </div>
                <Slider
                  id="max-svg"
                  min={1000}
                  max={10000}
                  step={500}
                  value={[performanceSettings.rendering.maxSvgPoints]}
                  onValueChange={([value]) => updateRenderingSettings('maxSvgPoints', value)}
                />
              </div>

              {/* Target FPS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="target-fps">
                    Target Frame Rate
                  </Label>
                  <span className="text-sm font-medium">{performanceSettings.rendering.targetFPS} FPS</span>
                </div>
                <Slider
                  id="target-fps"
                  min={15}
                  max={60}
                  step={5}
                  value={[performanceSettings.rendering.targetFPS]}
                  onValueChange={([value]) => updateRenderingSettings('targetFPS', value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="memory" className="space-y-6 mt-6">
            <div className="space-y-4">
              {/* Memory Warning Threshold */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="memory-warning">
                    Memory Warning Threshold
                  </Label>
                  <span className="text-sm font-medium">{performanceSettings.memory.warningThreshold}%</span>
                </div>
                <Slider
                  id="memory-warning"
                  min={50}
                  max={95}
                  step={5}
                  value={[performanceSettings.memory.warningThreshold]}
                  onValueChange={([value]) => updateMemorySettings('warningThreshold', value)}
                />
              </div>

              {/* Cache Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cache-size">
                    Maximum Cache Size
                  </Label>
                  <span className="text-sm font-medium">{performanceSettings.memory.cacheMaxSize} MB</span>
                </div>
                <Slider
                  id="cache-size"
                  min={10}
                  max={500}
                  step={10}
                  value={[performanceSettings.memory.cacheMaxSize]}
                  onValueChange={([value]) => updateMemorySettings('cacheMaxSize', value)}
                />
              </div>

              {/* Cache TTL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cache-ttl">
                    Cache Time-to-Live (TTL)
                  </Label>
                  <span className="text-sm font-medium">{performanceSettings.memory.cacheTTL} minutes</span>
                </div>
                <Slider
                  id="cache-ttl"
                  min={1}
                  max={60}
                  step={1}
                  value={[performanceSettings.memory.cacheTTL]}
                  onValueChange={([value]) => updateMemorySettings('cacheTTL', value)}
                />
              </div>

              {/* Auto Cleanup Interval */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cleanup-interval">
                    Auto Cleanup Interval
                  </Label>
                  <span className="text-sm font-medium">{performanceSettings.memory.autoCleanupInterval} seconds</span>
                </div>
                <Slider
                  id="cleanup-interval"
                  min={30}
                  max={600}
                  step={30}
                  value={[performanceSettings.memory.autoCleanupInterval]}
                  onValueChange={([value]) => updateMemorySettings('autoCleanupInterval', value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-6 mt-6">
            <div className="space-y-4">
              {/* Enable Sampling */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <Label htmlFor="enable-sampling" className="cursor-pointer">
                  <div>
                    Enable Data Sampling
                    <span className="text-xs text-muted-foreground block">
                      Disable to plot all data points (may impact performance)
                    </span>
                  </div>
                </Label>
                <Switch
                  id="enable-sampling"
                  checked={performanceSettings.dataProcessing.enableSampling}
                  onCheckedChange={(checked) => updateDataProcessingSettings('enableSampling', checked)}
                />
              </div>

              {/* Default Sampling Points */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sampling-points">
                    Default Sampling Points
                    <span className="text-xs text-muted-foreground ml-2">
                      Target points per series after sampling
                    </span>
                  </Label>
                  <span className="text-sm font-medium">{performanceSettings.dataProcessing.defaultSamplingPoints} points</span>
                </div>
                <Slider
                  id="sampling-points"
                  min={100}
                  max={2000}
                  step={100}
                  value={[performanceSettings.dataProcessing.defaultSamplingPoints]}
                  onValueChange={([value]) => updateDataProcessingSettings('defaultSamplingPoints', value)}
                  disabled={!performanceSettings.dataProcessing.enableSampling}
                />
              </div>

              {/* Sampling Method */}
              <div className="space-y-2">
                <Label htmlFor="sampling-method">Sampling Method</Label>
                <Select
                  value={performanceSettings.dataProcessing.samplingMethod}
                  onValueChange={(value) => updateDataProcessingSettings('samplingMethod', value)}
                  disabled={!performanceSettings.dataProcessing.enableSampling}
                >
                  <SelectTrigger id="sampling-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      <div className="flex flex-col">
                        <span>Auto</span>
                        <span className="text-xs text-muted-foreground">Choose based on data characteristics</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="lttb">
                      <div className="flex flex-col">
                        <span>LTTB</span>
                        <span className="text-xs text-muted-foreground">Best for time series data</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="nth-point">
                      <div className="flex flex-col">
                        <span>Nth Point</span>
                        <span className="text-xs text-muted-foreground">Fast, even distribution</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="douglas-peucker">
                      <div className="flex flex-col">
                        <span>Douglas-Peucker</span>
                        <span className="text-xs text-muted-foreground">Preserves line shape</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="none">
                      <div className="flex flex-col">
                        <span>None</span>
                        <span className="text-xs text-muted-foreground">No sampling (use all points)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Batch Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="batch-size">
                    DOM Update Batch Size
                  </Label>
                  <span className="text-sm font-medium">{performanceSettings.dataProcessing.batchSize} items</span>
                </div>
                <Slider
                  id="batch-size"
                  min={5}
                  max={50}
                  step={5}
                  value={[performanceSettings.dataProcessing.batchSize]}
                  onValueChange={([value]) => updateDataProcessingSettings('batchSize', value)}
                />
              </div>

              {/* Virtualization Buffer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="virt-buffer">
                    Virtualization Buffer
                    <span className="text-xs text-muted-foreground ml-2">
                      Extra rows to render outside viewport
                    </span>
                  </Label>
                  <span className="text-sm font-medium">{performanceSettings.dataProcessing.virtualizationBuffer} rows</span>
                </div>
                <Slider
                  id="virt-buffer"
                  min={1}
                  max={5}
                  step={1}
                  value={[performanceSettings.dataProcessing.virtualizationBuffer]}
                  onValueChange={([value]) => updateDataProcessingSettings('virtualizationBuffer', value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="interaction" className="space-y-6 mt-6">
            <div className="space-y-4">
              {/* Enable Animations */}
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-animations" className="cursor-pointer">
                  <div>
                    Enable Animations
                    <span className="text-xs text-muted-foreground block">
                      Smooth transitions and hover effects
                    </span>
                  </div>
                </Label>
                <Switch
                  id="enable-animations"
                  checked={performanceSettings.interaction.enableAnimations}
                  onCheckedChange={(checked) => updateInteractionSettings('enableAnimations', checked)}
                />
              </div>

              {/* Tooltip Delay */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tooltip-delay">
                    Tooltip Delay
                  </Label>
                  <span className="text-sm font-medium">{performanceSettings.interaction.tooltipDelay} ms</span>
                </div>
                <Slider
                  id="tooltip-delay"
                  min={0}
                  max={1000}
                  step={50}
                  value={[performanceSettings.interaction.tooltipDelay]}
                  onValueChange={([value]) => updateInteractionSettings('tooltipDelay', value)}
                />
              </div>

              {/* Transition Duration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="transition-duration">
                    Transition Duration
                  </Label>
                  <span className="text-sm font-medium">{performanceSettings.interaction.transitionDuration} ms</span>
                </div>
                <Slider
                  id="transition-duration"
                  min={0}
                  max={1000}
                  step={50}
                  value={[performanceSettings.interaction.transitionDuration]}
                  onValueChange={([value]) => updateInteractionSettings('transitionDuration', value)}
                  disabled={!performanceSettings.interaction.enableAnimations}
                />
              </div>

              {/* Resize Debounce */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="resize-debounce">
                    Resize Debounce
                    <span className="text-xs text-muted-foreground ml-2">
                      Delay before re-rendering on window resize
                    </span>
                  </Label>
                  <span className="text-sm font-medium">{performanceSettings.interaction.resizeDebounce} ms</span>
                </div>
                <Slider
                  id="resize-debounce"
                  min={50}
                  max={500}
                  step={25}
                  value={[performanceSettings.interaction.resizeDebounce]}
                  onValueChange={([value]) => updateInteractionSettings('resizeDebounce', value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Reset Button */}
        <div className="mt-6">
          <Button variant="outline" onClick={onReset} className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}