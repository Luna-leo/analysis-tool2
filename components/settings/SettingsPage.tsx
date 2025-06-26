"use client"

import React from "react"
import { useSettingsStore } from "@/stores/useSettingsStore"
import { PlotDefaultsSettings } from "./PlotDefaultsSettings"
import { PerformancePresetsUI } from "./PerformancePresetsUI"

export function SettingsPage() {
  const { 
    settings, 
    updatePlotDefaults, 
    resetPlotDefaults,
    updateSeriesDefaults,
    resetSeriesDefaults,
    updatePerformanceSettings,
    resetPerformanceSettings
  } = useSettingsStore()

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application preferences and default settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Display Preferences with Plot and Series Defaults */}
        <PlotDefaultsSettings
          plotDefaults={settings.displaySettings.plotDefaults}
          seriesDefaults={settings.displaySettings.seriesDefaults}
          onUpdatePlot={updatePlotDefaults}
          onResetPlot={resetPlotDefaults}
          onUpdateSeries={updateSeriesDefaults}
          onResetSeries={resetSeriesDefaults}
        />

        {/* Performance Settings */}
        <PerformancePresetsUI
          performanceSettings={settings.performanceSettings}
          onUpdate={updatePerformanceSettings}
          onReset={resetPerformanceSettings}
        />
      </div>
    </div>
  )
}