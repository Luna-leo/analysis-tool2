"use client"

import React, { useState } from "react"
import { Zap, Scale, Search, Settings } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSettingsStore } from "@/stores/useSettingsStore"
import { PERFORMANCE_PRESETS, detectCurrentPreset as detectPreset } from "@/constants/performancePresets"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface PerformancePresetPopoverProps {
  size?: "default" | "sm"
}

export function PerformancePresetPopover({ size = "sm" }: PerformancePresetPopoverProps) {
  const { settings, updatePerformanceSettings } = useSettingsStore()
  const [customPopoverOpen, setCustomPopoverOpen] = useState(false)
  
  const performanceSettings = settings?.performanceSettings
  
  const detectCurrentPreset = () => {
    // Handle case where performanceSettings might be undefined or null
    if (!performanceSettings) return "high-performance"
    
    return detectPreset(performanceSettings)
  }
  
  const currentPreset = detectCurrentPreset()
  
  const handlePresetChange = (presetId: string | undefined) => {
    if (!presetId) return
    
    if (presetId === "custom") {
      setCustomPopoverOpen(true)
      return
    }
    
    const preset = PERFORMANCE_PRESETS.find(p => p.id === presetId)
    if (preset && preset.settings) {
      updatePerformanceSettings(preset.settings)
      setCustomPopoverOpen(false)
    }
  }
  
  const handleCustomSettingChange = (key: string, value: any) => {
    if (!performanceSettings) return
    
    // Build a partial update object
    const keys = key.split('.')
    const update: any = {}
    let current = update
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = {}
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
    updatePerformanceSettings(update)
  }
  
  return (
    <TooltipProvider>
      <div className="flex items-center">
        <ToggleGroup 
          type="single" 
          value={currentPreset} 
          onValueChange={handlePresetChange} 
          className="h-8 flex items-center gap-0 border border-gray-300 rounded-md bg-gray-100"
        >
          <ToggleGroupItem 
            value="full-detail" 
            aria-label="Full Detail"
            className="h-8 px-2 gap-1 text-xs rounded-none rounded-l-md border-0 data-[state=on]:bg-gray-700 data-[state=on]:text-white hover:bg-gray-200 transition-all duration-200"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Full</span>
          </ToggleGroupItem>
          
          <div className="w-px h-5 bg-gray-300" />
          
          <ToggleGroupItem 
            value="balanced" 
            aria-label="Balanced"
            className="h-8 px-2 gap-1 text-xs rounded-none border-0 data-[state=on]:bg-gray-700 data-[state=on]:text-white hover:bg-gray-200 transition-all duration-200"
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Bal</span>
          </ToggleGroupItem>
          
          <div className="w-px h-5 bg-gray-300" />
          
          <ToggleGroupItem 
            value="high-performance" 
            aria-label="High Performance"
            className="h-8 px-2 gap-1 text-xs rounded-none border-0 data-[state=on]:bg-gray-700 data-[state=on]:text-white hover:bg-gray-200 transition-all duration-200"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>High</span>
          </ToggleGroupItem>
          
          <div className="w-px h-5 bg-gray-300" />
          
          <Popover open={customPopoverOpen} onOpenChange={setCustomPopoverOpen}>
            <PopoverTrigger asChild>
              <ToggleGroupItem 
                value="custom" 
                aria-label="Custom Settings"
                className="h-8 px-2 rounded-none rounded-r-md border-0 data-[state=on]:bg-gray-700 data-[state=on]:text-white hover:bg-gray-200 transition-all duration-200"
                data-state={currentPreset === 'custom' ? 'on' : 'off'}
              >
                <Settings className="h-3.5 w-3.5" />
              </ToggleGroupItem>
            </PopoverTrigger>
            
            <PopoverContent align="end" className="w-80">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Custom Performance Settings</h4>
                  <p className="text-xs text-muted-foreground">
                    Fine-tune performance settings
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* Data Sampling Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-sampling" className="text-sm">
                      Enable Data Sampling
                    </Label>
                    <Switch
                      id="enable-sampling"
                      checked={performanceSettings?.dataProcessing?.enableSampling ?? true}
                      onCheckedChange={(checked) => 
                        handleCustomSettingChange('dataProcessing.enableSampling', checked)
                      }
                    />
                  </div>
                  
                  {/* Sampling Points */}
                  {performanceSettings?.dataProcessing?.enableSampling && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sampling-points" className="text-sm">
                          Max Data Points
                        </Label>
                        <Input
                          id="sampling-points"
                          type="number"
                          className="w-20 h-8 text-xs"
                          value={performanceSettings?.dataProcessing?.defaultSamplingPoints || 1000}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1000
                            handleCustomSettingChange('dataProcessing.defaultSamplingPoints', value)
                          }}
                        />
                      </div>
                      <Slider
                        value={[performanceSettings?.dataProcessing?.defaultSamplingPoints || 1000]}
                        onValueChange={([value]) => 
                          handleCustomSettingChange('dataProcessing.defaultSamplingPoints', value)
                        }
                        min={100}
                        max={10000}
                        step={100}
                        className="w-full"
                      />
                      
                      {/* Sampling Method */}
                      <div className="space-y-2">
                        <Label htmlFor="sampling-method" className="text-sm">
                          Sampling Method
                        </Label>
                        <Select
                          value={performanceSettings?.dataProcessing?.samplingMethod || 'auto'}
                          onValueChange={(value) => 
                            handleCustomSettingChange('dataProcessing.samplingMethod', value)
                          }
                        >
                          <SelectTrigger id="sampling-method" className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="lttb">LTTB (Largest Triangle Three Buckets)</SelectItem>
                            <SelectItem value="nth">Nth Point</SelectItem>
                            <SelectItem value="douglas-peucker">Douglas-Peucker</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="pt-2 border-t">
                  <Link 
                    href="/settings" 
                    className="text-xs text-primary hover:underline inline-block"
                    onClick={() => setCustomPopoverOpen(false)}
                  >
                    Advanced settings →
                  </Link>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </ToggleGroup>
      </div>
    </TooltipProvider>
  )
}