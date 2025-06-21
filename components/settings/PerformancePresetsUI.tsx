"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Info } from "lucide-react"
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PerformanceSettings as PerformanceSettingsType } from "@/types/settings"
import { PerformanceSettings } from "./PerformanceSettings"
import { PERFORMANCE_PRESETS, detectCurrentPreset, getPresetById, PerformancePreset } from "@/constants/performancePresets"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useCSVDataStore } from "@/stores/useCSVDataStore"

interface PerformancePresetsUIProps {
  performanceSettings: PerformanceSettingsType
  onUpdate: (settings: Partial<PerformanceSettingsType>) => void
  onReset: () => void
}

export function PerformancePresetsUI({ 
  performanceSettings, 
  onUpdate, 
  onReset 
}: PerformancePresetsUIProps) {
  const detectedPreset = detectCurrentPreset(performanceSettings)
  const [selectedPreset, setSelectedPreset] = React.useState<PerformancePreset | 'custom'>(detectedPreset)
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false)
  
  // Get current data info from store
  const datasets = useCSVDataStore((state) => state.datasets)
  const totalDataPoints = React.useMemo(() => {
    let total = 0
    datasets.forEach(dataset => {
      total += dataset.data?.length || 0
    })
    return total
  }, [datasets])

  // Calculate performance impact
  const calculatePerformanceImpact = React.useCallback(() => {
    if (!performanceSettings.dataProcessing.enableSampling) {
      return { level: 'high', percentage: 90, color: 'text-red-500' }
    }
    
    const points = performanceSettings.dataProcessing.defaultSamplingPoints
    if (points <= 500) {
      return { level: 'low', percentage: 20, color: 'text-green-500' }
    } else if (points <= 1000) {
      return { level: 'medium', percentage: 50, color: 'text-yellow-500' }
    } else {
      return { level: 'high', percentage: 80, color: 'text-orange-500' }
    }
  }, [performanceSettings])

  const performanceImpact = calculatePerformanceImpact()

  const handlePresetChange = (preset: PerformancePreset | 'custom') => {
    setSelectedPreset(preset)
    
    if (preset === 'custom') {
      setIsAdvancedOpen(true)
      return
    }
    
    const presetConfig = getPresetById(preset)
    if (presetConfig?.settings) {
      onUpdate(presetConfig.settings)
    }
    setIsAdvancedOpen(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Performance Settings</CardTitle>
            <CardDescription>
              Choose how to balance performance and data detail
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>These settings control how much data is displayed in charts. 
                   Lower settings improve performance but may hide some data points.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Selection */}
        <div className="space-y-4">
          <RadioGroup value={selectedPreset} onValueChange={handlePresetChange}>
            {PERFORMANCE_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className={`relative flex cursor-pointer rounded-lg border p-4 hover:bg-muted/50 transition-colors ${
                  selectedPreset === preset.id ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <RadioGroupItem
                  value={preset.id}
                  id={preset.id}
                  className="sr-only"
                />
                <Label
                  htmlFor={preset.id}
                  className="flex cursor-pointer flex-1 items-start gap-3"
                >
                  <span className="text-2xl" role="img" aria-label={preset.name}>
                    {preset.icon}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{preset.name}</span>
                      {preset.id === 'high-performance' && (
                        <Badge variant="secondary" className="text-xs">Recommended</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {preset.description}
                    </p>
                    {preset.settings.dataProcessing && (
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          {preset.settings.dataProcessing.enableSampling 
                            ? `Max ${preset.settings.dataProcessing.defaultSamplingPoints} points`
                            : 'All data points'}
                        </span>
                        <span>•</span>
                        <span>
                          {preset.settings.dataProcessing.samplingMethod === 'auto' 
                            ? 'Smart sampling'
                            : preset.settings.dataProcessing.samplingMethod === 'lttb'
                            ? 'Visual preservation'
                            : preset.settings.dataProcessing.samplingMethod === 'none'
                            ? 'No sampling'
                            : preset.settings.dataProcessing.samplingMethod}
                        </span>
                      </div>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Performance Impact Indicator */}
        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Performance Impact</span>
            <span className={`font-medium ${performanceImpact.color}`}>
              {performanceImpact.level.charAt(0).toUpperCase() + performanceImpact.level.slice(1)}
            </span>
          </div>
          <Progress value={performanceImpact.percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {performanceSettings.dataProcessing.enableSampling
              ? `Charts will display up to ${performanceSettings.dataProcessing.defaultSamplingPoints} points per series`
              : 'All data points will be displayed (may cause slow performance)'}
          </p>
        </div>

        {/* Data Preview */}
        {totalDataPoints > 0 && (
          <div className="space-y-2 p-4 border rounded-lg">
            <h4 className="text-sm font-medium">Current Data Impact</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total data points:</span>
                <p className="font-medium">{totalDataPoints.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Points after sampling:</span>
                <p className="font-medium">
                  {performanceSettings.dataProcessing.enableSampling
                    ? `~${Math.min(totalDataPoints, performanceSettings.dataProcessing.defaultSamplingPoints * datasets.size).toLocaleString()}`
                    : totalDataPoints.toLocaleString()}
                </p>
              </div>
            </div>
            {performanceSettings.dataProcessing.enableSampling && totalDataPoints > performanceSettings.dataProcessing.defaultSamplingPoints && (
              <p className="text-xs text-muted-foreground mt-2">
                Data will be intelligently sampled to preserve visual accuracy while improving performance.
              </p>
            )}
          </div>
        )}

        {/* Advanced Settings */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              disabled={selectedPreset !== 'custom'}
            >
              <span>Advanced Settings</span>
              {isAdvancedOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <PerformanceSettings
              performanceSettings={performanceSettings}
              onUpdate={onUpdate}
              onReset={onReset}
            />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}