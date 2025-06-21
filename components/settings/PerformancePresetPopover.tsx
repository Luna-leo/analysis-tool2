"use client"

import React from "react"
import { Zap, Scale, Search } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useSettingsStore } from "@/stores/useSettingsStore"
import { PERFORMANCE_PRESETS, detectCurrentPreset as detectPreset } from "@/constants/performancePresets"

interface PerformancePresetPopoverProps {
  size?: "default" | "sm"
}

export function PerformancePresetPopover({}: PerformancePresetPopoverProps) {
  const { settings, updatePerformanceSettings } = useSettingsStore()
  
  const performanceSettings = settings?.performanceSettings
  
  const detectCurrentPreset = () => {
    // Handle case where performanceSettings might be undefined or null
    if (!performanceSettings) return "high-performance"
    
    return detectPreset(performanceSettings)
  }
  
  const currentPreset = detectCurrentPreset()
  
  const handlePresetChange = (presetId: string | undefined) => {
    if (!presetId) return
    
    const preset = PERFORMANCE_PRESETS.find(p => p.id === presetId)
    if (preset && preset.settings) {
      updatePerformanceSettings(preset.settings)
    }
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
            className="h-8 px-2 gap-1 text-xs rounded-none rounded-r-md border-0 data-[state=on]:bg-gray-700 data-[state=on]:text-white hover:bg-gray-200 transition-all duration-200"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>High</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </TooltipProvider>
  )
}