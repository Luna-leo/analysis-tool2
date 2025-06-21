"use client"

import React, { useState, useEffect } from "react"
import { Zap, Scale, Search, Loader2, Check } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useSettingsStore } from "@/stores/useSettingsStore"
import { PERFORMANCE_PRESETS, detectCurrentPreset as detectPreset } from "@/constants/performancePresets"
import { useChartLoadingStore } from "@/stores/useChartLoadingStore"

interface PerformancePresetPopoverProps {
  size?: "default" | "sm"
}

export function PerformancePresetPopover({}: PerformancePresetPopoverProps) {
  const { settings, updatePerformanceSettings } = useSettingsStore()
  const { isAnyChartBusy } = useChartLoadingStore()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [appliedPreset, setAppliedPreset] = useState<string | null>(null)
  const [transitioningPreset, setTransitioningPreset] = useState<string | null>(null)
  
  const performanceSettings = settings?.performanceSettings
  
  const detectCurrentPreset = () => {
    // Handle case where performanceSettings might be undefined or null
    if (!performanceSettings) return "high-performance"
    
    return detectPreset(performanceSettings)
  }
  
  const currentPreset = detectCurrentPreset()
  
  const handlePresetChange = (presetId: string | undefined) => {
    if (!presetId || isTransitioning) return
    
    const preset = PERFORMANCE_PRESETS.find(p => p.id === presetId)
    if (preset && preset.settings) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PerformancePresetPopover] Changing preset to: ${presetId}`)
      }
      
      setIsTransitioning(true)
      setTransitioningPreset(presetId)
      setAppliedPreset(null)
      updatePerformanceSettings(preset.settings)
    }
  }
  
  // Monitor loading state with additional delay
  useEffect(() => {
    if (isTransitioning) {
      // Check if all charts are done
      const checkComplete = () => {
        if (!isAnyChartBusy()) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[PerformancePresetPopover] All charts idle, waiting for paint...')
          }
          
          // Add a small delay to ensure paint has completed
          setTimeout(() => {
            // Double check that no chart started loading/rendering in the meantime
            if (!isAnyChartBusy()) {
              if (process.env.NODE_ENV === 'development') {
                console.log('[PerformancePresetPopover] Transition complete')
              }
              
              setIsTransitioning(false)
              setAppliedPreset(transitioningPreset)
              setTransitioningPreset(null)
              
              // Clear success indicator after 2 seconds
              setTimeout(() => {
                setAppliedPreset(null)
              }, 2000)
            }
          }, 150) // 150ms delay after all charts report complete
        }
      }
      
      // Start checking after a short delay
      const checkTimer = setTimeout(checkComplete, 100)
      
      // Also set up interval to keep checking
      const intervalId = setInterval(checkComplete, 200)
      
      return () => {
        clearTimeout(checkTimer)
        clearInterval(intervalId)
      }
    }
  }, [isTransitioning, isAnyChartBusy, transitioningPreset])
  
  // Handle case where settings change triggers immediate loading
  useEffect(() => {
    if (isTransitioning && isAnyChartBusy()) {
      // Charts have started loading or rendering, good
      return
    }
    
    // If we're transitioning but no charts are busy after a short delay,
    // it might mean the data was cached or no charts are present
    if (isTransitioning) {
      const timer = setTimeout(() => {
        if (!isAnyChartBusy()) {
          setIsTransitioning(false)
          setAppliedPreset(transitioningPreset)
          setTransitioningPreset(null)
          
          // Clear success indicator after 2 seconds
          setTimeout(() => {
            setAppliedPreset(null)
          }, 2000)
        }
      }, 500) // Wait 500ms to see if loading/rendering starts
      
      return () => clearTimeout(timer)
    }
  }, [isTransitioning, isAnyChartBusy, transitioningPreset])
  
  
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
            disabled={isTransitioning}
          >
            {transitioningPreset === 'full-detail' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Full</span>
              </>
            ) : appliedPreset === 'full-detail' ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>Full</span>
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" />
                <span>Full</span>
              </>
            )}
          </ToggleGroupItem>
          
          <div className="w-px h-5 bg-gray-300" />
          
          <ToggleGroupItem 
            value="balanced" 
            aria-label="Balanced"
            className="h-8 px-2 gap-1 text-xs rounded-none border-0 data-[state=on]:bg-gray-700 data-[state=on]:text-white hover:bg-gray-200 transition-all duration-200"
            disabled={isTransitioning}
          >
            {transitioningPreset === 'balanced' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Bal</span>
              </>
            ) : appliedPreset === 'balanced' ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>Bal</span>
              </>
            ) : (
              <>
                <Scale className="h-3.5 w-3.5" />
                <span>Bal</span>
              </>
            )}
          </ToggleGroupItem>
          
          <div className="w-px h-5 bg-gray-300" />
          
          <ToggleGroupItem 
            value="high-performance" 
            aria-label="High Performance"
            className="h-8 px-2 gap-1 text-xs rounded-none rounded-r-md border-0 data-[state=on]:bg-gray-700 data-[state=on]:text-white hover:bg-gray-200 transition-all duration-200"
            disabled={isTransitioning}
          >
            {transitioningPreset === 'high-performance' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>High</span>
              </>
            ) : appliedPreset === 'high-performance' ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>High</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                <span>High</span>
              </>
            )}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </TooltipProvider>
  )
}