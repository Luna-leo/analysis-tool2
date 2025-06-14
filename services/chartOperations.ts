import type { ChartComponent } from '@/types'

export class ChartOperations {
  static duplicate(chart: ChartComponent): ChartComponent {
    return {
      ...chart,
      id: `chart_${Date.now()}`,
      title: `${chart.title} (コピー)`,
      type: chart.type || "scatter"
    }
  }
  
  static insertAfter(
    charts: ChartComponent[], 
    chartId: string, 
    newChart: ChartComponent
  ): ChartComponent[] {
    const index = charts.findIndex(c => c.id === chartId)
    if (index === -1) return charts
    
    const newCharts = [...charts]
    newCharts.splice(index + 1, 0, newChart)
    return newCharts
  }
  
  static remove(charts: ChartComponent[], chartId: string): ChartComponent[] {
    return charts.filter(c => c.id !== chartId)
  }
  
  static update(
    charts: ChartComponent[], 
    chartId: string, 
    updater: (chart: ChartComponent) => ChartComponent
  ): ChartComponent[] {
    return charts.map(chart => 
      chart.id === chartId ? updater(chart) : chart
    )
  }
  
  static findById(
    charts: ChartComponent[], 
    chartId: string
  ): ChartComponent | undefined {
    return charts.find(c => c.id === chartId)
  }
  
  static findIndex(charts: ChartComponent[], chartId: string): number {
    return charts.findIndex(c => c.id === chartId)
  }
  
  static reorder(
    charts: ChartComponent[], 
    fromIndex: number, 
    toIndex: number
  ): ChartComponent[] {
    if (fromIndex < 0 || fromIndex >= charts.length || 
        toIndex < 0 || toIndex >= charts.length) {
      return charts
    }
    
    const newCharts = [...charts]
    const [removed] = newCharts.splice(fromIndex, 1)
    newCharts.splice(toIndex, 0, removed)
    return newCharts
  }
}