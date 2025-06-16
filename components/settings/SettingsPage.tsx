"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useSettingsStore } from "@/stores/useSettingsStore"
import { ParameterSource } from "@/types/settings"
import { PlotDefaultsSettings } from "./PlotDefaultsSettings"

export function SettingsPage() {
  const { 
    settings, 
    updateParameterSource, 
    updatePlotDefaults, 
    resetPlotDefaults,
    updateSeriesDefaults,
    resetSeriesDefaults
  } = useSettingsStore()

  const handleParameterSourceChange = (value: string) => {
    updateParameterSource(value as ParameterSource)
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application preferences and default settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Tool Defaults Section */}
        <Card>
          <CardHeader>
            <CardTitle>Tool Defaults</CardTitle>
            <CardDescription>
              Configure default behavior for the analysis tool
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Parameter Source Setting */}
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-medium mb-1">Parameter Source</h3>
                <p className="text-sm text-muted-foreground">
                  Choose where to load available parameters from when editing charts
                </p>
              </div>
              
              <RadioGroup
                value={settings.toolDefaults.parameterSource}
                onValueChange={handleParameterSourceChange}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="master" id="master" className="mt-1" />
                  <Label htmlFor="master" className="cursor-pointer flex-1">
                    <div className="font-medium mb-1">Parameter Master</div>
                    <div className="text-sm text-muted-foreground">
                      Load parameters from the pre-defined parameter master file (sample_parameters.csv).
                      This provides a consistent set of parameters across all data sources.
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="datasource" id="datasource" className="mt-1" />
                  <Label htmlFor="datasource" className="cursor-pointer flex-1">
                    <div className="font-medium mb-1">Data Source</div>
                    <div className="text-sm text-muted-foreground">
                      Load parameters dynamically from the selected data source.
                      Parameters will vary based on the data source you're working with.
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Display Preferences with Plot and Series Defaults */}
        <PlotDefaultsSettings
          plotDefaults={settings.displaySettings.plotDefaults}
          seriesDefaults={settings.displaySettings.seriesDefaults}
          onUpdatePlot={updatePlotDefaults}
          onResetPlot={resetPlotDefaults}
          onUpdateSeries={updateSeriesDefaults}
          onResetSeries={resetSeriesDefaults}
        />

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>
              Optimize application performance based on your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Performance settings will be available in a future update.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}