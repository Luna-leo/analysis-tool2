"use client"

import React from "react"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useSettingsStore } from "@/stores/useSettingsStore"
import { PERFORMANCE_PRESETS, detectCurrentPreset, getPresetById, PerformancePreset } from "@/constants/performancePresets"
import { useCSVDataStore } from "@/stores/useCSVDataStore"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PerformancePresetPopoverProps {
  size?: "default" | "sm"
  align?: "start" | "center" | "end"
}

export function PerformancePresetPopover({ 
  size = "sm",
  align = "end" 
}: PerformancePresetPopoverProps) {
  const { settings, updatePerformanceSettings } = useSettingsStore()
  const performanceSettings = settings.performanceSettings
  
  const [selectedPreset, setSelectedPreset] = React.useState<PerformancePreset>(
    detectCurrentPreset(performanceSettings)
  )
  const [open, setOpen] = React.useState(false)
  
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
  const currentPreset = getPresetById(selectedPreset)

  const handlePresetChange = (preset: PerformancePreset) => {
    setSelectedPreset(preset)
    
    if (preset === 'custom') {
      // Close popover and navigate to settings
      setOpen(false)
      return
    }
    
    const presetConfig = getPresetById(preset)
    if (presetConfig?.settings) {
      updatePerformanceSettings(presetConfig.settings)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size={size}
          className={cn(
            "flex items-center justify-center gap-1.5",
            size === "sm" ? "h-8 px-3 text-xs" : "h-9"
          )}
        >
          <Zap className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
          <span className={size === "sm" ? "" : "text-sm font-medium"}>
            {currentPreset?.icon} {currentPreset?.name}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-80">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Performance Preset</h4>
            <Link 
              href="/settings" 
              className="text-xs text-muted-foreground hover:text-primary"
              onClick={() => setOpen(false)}
            >
              Advanced settings
            </Link>
          </div>

          <Separator />

          {/* Preset Selection */}
          <RadioGroup value={selectedPreset} onValueChange={handlePresetChange}>
            <div className="space-y-2">
              {PERFORMANCE_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className={cn(
                    "relative flex cursor-pointer rounded-md border p-3 hover:bg-muted/50 transition-colors",
                    selectedPreset === preset.id && "border-primary bg-primary/5"
                  )}
                >
                  <RadioGroupItem
                    value={preset.id}
                    id={`preset-${preset.id}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`preset-${preset.id}`}
                    className="flex cursor-pointer flex-1 items-start gap-2"
                  >
                    <span className="text-lg" role="img" aria-label={preset.name}>
                      {preset.icon}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{preset.name}</span>
                        {preset.id === 'high-performance' && (
                          <Badge variant="secondary" className="text-xs h-5">Recommended</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {preset.description}
                      </p>
                      {preset.id !== 'custom' && preset.settings.dataProcessing && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {preset.settings.dataProcessing.enableSampling 
                            ? `Max ${preset.settings.dataProcessing.defaultSamplingPoints} points`
                            : 'All data points'}
                        </p>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          <Separator />

          {/* Performance Impact */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Performance Impact</span>
              <span className={cn("font-medium", performanceImpact.color)}>
                {performanceImpact.level.charAt(0).toUpperCase() + performanceImpact.level.slice(1)}
              </span>
            </div>
            <Progress value={performanceImpact.percentage} className="h-1.5" />
            
            {totalDataPoints > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{totalDataPoints.toLocaleString()} total points</span>
                <span>
                  {performanceSettings.dataProcessing.enableSampling
                    ? `~${Math.min(totalDataPoints, performanceSettings.dataProcessing.defaultSamplingPoints * datasets.size).toLocaleString()} displayed`
                    : 'All displayed'}
                </span>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}