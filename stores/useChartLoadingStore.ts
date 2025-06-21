import { create } from 'zustand'

interface ChartLoadingState {
  loadingCharts: Set<string>     // Charts loading data
  renderingCharts: Set<string>   // Charts rendering
  registerLoading: (chartId: string) => void
  unregisterLoading: (chartId: string) => void
  registerRendering: (chartId: string) => void
  unregisterRendering: (chartId: string) => void
  isAnyChartLoading: () => boolean
  isAnyChartRendering: () => boolean
  isAnyChartBusy: () => boolean  // Loading OR rendering
  getLoadingCount: () => number
  getRenderingCount: () => number
}

export const useChartLoadingStore = create<ChartLoadingState>((set, get) => ({
  loadingCharts: new Set(),
  renderingCharts: new Set(),
  
  registerLoading: (chartId: string) => {
    set((state) => {
      const newSet = new Set(state.loadingCharts)
      newSet.add(chartId)
      return { loadingCharts: newSet }
    })
  },
  
  unregisterLoading: (chartId: string) => {
    set((state) => {
      const newSet = new Set(state.loadingCharts)
      newSet.delete(chartId)
      return { loadingCharts: newSet }
    })
  },
  
  registerRendering: (chartId: string) => {
    set((state) => {
      const newSet = new Set(state.renderingCharts)
      newSet.add(chartId)
      return { renderingCharts: newSet }
    })
  },
  
  unregisterRendering: (chartId: string) => {
    set((state) => {
      const newSet = new Set(state.renderingCharts)
      newSet.delete(chartId)
      return { renderingCharts: newSet }
    })
  },
  
  isAnyChartLoading: () => {
    return get().loadingCharts.size > 0
  },
  
  isAnyChartRendering: () => {
    return get().renderingCharts.size > 0
  },
  
  isAnyChartBusy: () => {
    const state = get()
    return state.loadingCharts.size > 0 || state.renderingCharts.size > 0
  },
  
  getLoadingCount: () => {
    return get().loadingCharts.size
  },
  
  getRenderingCount: () => {
    return get().renderingCharts.size
  }
}))