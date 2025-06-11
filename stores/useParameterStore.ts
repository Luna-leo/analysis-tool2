import { create } from 'zustand'
import { Parameter, ParameterStore } from '@/types/parameter'
import { loadParametersFromCSV } from '@/utils/parameterUtils'

export const useParameterStore = create<ParameterStore>((set, get) => ({
  parameters: [],
  isLoading: false,
  error: null,

  loadParameters: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const parameters = await loadParametersFromCSV()
      set({ parameters, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load parameters',
        isLoading: false 
      })
    }
  },

  getParametersByPlantAndMachine: (plant: string, machineNo: string) => {
    const { parameters } = get()
    return parameters.filter(
      p => p.plant === plant && p.machineNo === machineNo
    )
  },

  getParameterLabel: (parameter: Parameter) => {
    return `${parameter.name}\n${parameter.unit} / ${parameter.id}`
  },

  getUniqueParameters: () => {
    const { parameters } = get()
    const uniqueMap = new Map<string, Parameter>()
    
    // Use parameter name and unit as the unique key
    parameters.forEach(param => {
      const key = `${param.name}|${param.unit}`
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, param)
      }
    })
    
    // Sort by parameter name for better UX
    return Array.from(uniqueMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    )
  }
}))