"use client"

import React from 'react'
import { ChartGrid } from '@/components/layout/ChartGrid'
import { TabBar } from '@/components/layout/TabBar'
import { useFileStore } from '@/stores/useFileStore'
import { useLayoutStore } from '@/stores/useLayoutStore'
import { ChartComponent } from '@/types'

export default function TestChartTitlePage() {
  const { openTabs, updateFileCharts } = useFileStore()
  const { chartSettingsMap, updateChartSettings } = useLayoutStore()
  
  // Create test file with charts that have titles
  React.useEffect(() => {
    const testFileId = 'test-chart-title'
    const testCharts: ChartComponent[] = [
      {
        id: '1',
        title: 'Chart 1 - Temperature',
        data: [],
        showTitle: true,
      },
      {
        id: '2', 
        title: 'Chart 2 - Pressure',
        data: [],
        showTitle: true,
      },
      {
        id: '3',
        title: 'Chart 3 - Flow Rate',
        data: [],
        showTitle: false, // Individual setting is false
      },
      {
        id: '4',
        title: 'Chart 4 - Humidity',
        data: [],
        // showTitle is undefined, should default to true
      }
    ]
    
    if (!openTabs.find(tab => tab.id === testFileId)) {
      const testFile = {
        id: testFileId,
        name: 'Test Chart Titles',
        type: 'file' as const,
        charts: testCharts,
      }
      useFileStore.getState().setOpenTabs([testFile])
      useFileStore.getState().setActiveTab(testFileId)
    }
  }, [])
  
  const activeTab = openTabs[0]
  const chartSettings = activeTab ? chartSettingsMap[activeTab.id] : undefined
  
  return (
    <div className="flex flex-col h-full">
      <TabBar 
        showActionButtons={true}
        activeTabProp={activeTab?.id || ''}
      />
      
      <div className="p-4 bg-gray-100">
        <h2 className="text-lg font-semibold mb-2">Chart Title Toggle Test</h2>
        <div className="space-y-2 text-sm">
          <p>Current showChartTitle setting: <strong>{chartSettings?.showChartTitle !== undefined ? String(chartSettings.showChartTitle) : 'undefined (defaults to true)'}</strong></p>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              if (activeTab) {
                updateChartSettings(activeTab.id, {
                  showChartTitle: chartSettings?.showChartTitle === false
                })
              }
            }}
          >
            Toggle Chart Titles
          </button>
          <div className="mt-2">
            <p className="font-medium">Expected behavior:</p>
            <ul className="list-disc list-inside ml-4">
              <li>Chart 1 & 2: Should follow global toggle</li>
              <li>Chart 3: Has showTitle=false individually, should follow global when toggled</li>
              <li>Chart 4: No individual setting, should follow global toggle</li>
            </ul>
          </div>
        </div>
      </div>
      
      {activeTab && (
        <div className="flex-1">
          <ChartGrid file={activeTab} />
        </div>
      )}
    </div>
  )
}