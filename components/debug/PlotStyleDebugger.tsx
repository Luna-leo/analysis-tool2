// Temporary debug component for plot style real-time update testing
// This component can be added to ChartEditModal to monitor plotStyles changes

import React from 'react'

interface PlotStyleDebuggerProps {
  plotStyles: any
  chartId: string
}

export function PlotStyleDebugger({ plotStyles, chartId }: PlotStyleDebuggerProps) {
  const [updateCount, setUpdateCount] = React.useState(0)
  const [lastUpdate, setLastUpdate] = React.useState<string>('')

  React.useEffect(() => {
    setUpdateCount(prev => prev + 1)
    setLastUpdate(new Date().toISOString())
    console.log(`[PlotStyleDebugger] Chart ${chartId} plotStyles updated:`, plotStyles)
  }, [plotStyles, chartId])

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg max-w-md text-xs font-mono z-50">
      <div className="font-bold mb-2">Plot Style Debugger</div>
      <div>Chart ID: {chartId}</div>
      <div>Update Count: {updateCount}</div>
      <div>Last Update: {lastUpdate}</div>
      <div className="mt-2">
        <div>Mode: {plotStyles?.mode || 'undefined'}</div>
        <div>Has byDataSource: {plotStyles?.byDataSource ? 'Yes' : 'No'}</div>
        <div>Has byParameter: {plotStyles?.byParameter ? 'Yes' : 'No'}</div>
        <div>Has byBoth: {plotStyles?.byBoth ? 'Yes' : 'No'}</div>
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer">Full plotStyles JSON</summary>
        <pre className="mt-1 text-[10px] max-h-40 overflow-auto">
          {JSON.stringify(plotStyles, null, 2)}
        </pre>
      </details>
    </div>
  )
}