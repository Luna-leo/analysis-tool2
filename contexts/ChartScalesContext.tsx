"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

export interface ChartScales {
  xDomain: [any, any] | null
  yDomain: [number, number] | null
  xAxisType: string
}

interface ChartScalesContextValue {
  scales: ChartScales
  updateScales: (newScales: ChartScales) => void
}

export const ChartScalesContext = createContext<ChartScalesContextValue | null>(null)

export function ChartScalesProvider({ children }: { children: React.ReactNode }) {
  const [scales, setScales] = useState<ChartScales>({
    xDomain: null,
    yDomain: null,
    xAxisType: 'datetime'
  })

  const updateScales = useCallback((newScales: ChartScales) => {
    setScales(prevScales => {
      // Only update if scales actually changed
      const hasChanged = 
        JSON.stringify(prevScales.xDomain) !== JSON.stringify(newScales.xDomain) ||
        JSON.stringify(prevScales.yDomain) !== JSON.stringify(newScales.yDomain) ||
        prevScales.xAxisType !== newScales.xAxisType
      
      if (hasChanged) {
        return newScales
      }
      return prevScales
    })
  }, [])

  return (
    <ChartScalesContext.Provider value={{ scales, updateScales }}>
      {children}
    </ChartScalesContext.Provider>
  )
}

export function useChartScales() {
  const context = useContext(ChartScalesContext)
  if (!context) {
    throw new Error('useChartScales must be used within ChartScalesProvider')
  }
  return context
}