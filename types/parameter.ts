export type ParameterType = 'numeric' | 'boolean' | 'string'

export interface Parameter {
  id: string
  name: string
  unit: string
  plant: string
  machineNo: string
  source: string
  type?: ParameterType  // Optional for backward compatibility
}

export interface ParameterStore {
  parameters: Parameter[]
  isLoading: boolean
  error: string | null
  loadParameters: () => Promise<void>
  getParametersByPlantAndMachine: (plant: string, machineNo: string) => Parameter[]
  getParameterLabel: (parameter: Parameter) => string
  getUniqueParameters: () => Parameter[]
}