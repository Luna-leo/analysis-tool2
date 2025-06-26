export interface FormulaMaster {
  id: string
  name: string
  description?: string
  expression: string
  parameters: string[]
  category: string
  unit?: string
  createdAt: string
  updatedAt: string
}

export const mockFormulaMaster: FormulaMaster[] = [
  {
    id: "formula_001",
    name: "Temperature Difference",
    description: "Calculates temperature difference between two sensors",
    expression: "TEMP_IN - TEMP_OUT",
    parameters: ["TEMP_IN", "TEMP_OUT"],
    category: "Temperature",
    unit: "°C",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },
  {
    id: "formula_002",
    name: "Pressure Ratio",
    description: "Calculates pressure ratio between input and output",
    expression: "PRESS_IN / PRESS_OUT",
    parameters: ["PRESS_IN", "PRESS_OUT"],
    category: "Pressure",
    unit: "ratio",
    createdAt: "2024-01-16T10:30:00Z",
    updatedAt: "2024-01-16T10:30:00Z"
  },
  {
    id: "formula_003",
    name: "Flow Rate Efficiency",
    description: "Calculates flow efficiency as percentage",
    expression: "(FLOW_ACTUAL / FLOW_TARGET) * 100",
    parameters: ["FLOW_ACTUAL", "FLOW_TARGET"],
    category: "Flow",
    unit: "%",
    createdAt: "2024-01-17T14:15:00Z",
    updatedAt: "2024-01-17T14:15:00Z"
  },
  {
    id: "formula_004",
    name: "Power Consumption",
    description: "Calculates total power consumption",
    expression: "VOLTAGE * CURRENT * COS_PHI",
    parameters: ["VOLTAGE", "CURRENT", "COS_PHI"],
    category: "Power",
    unit: "kW",
    createdAt: "2024-01-18T11:45:00Z",
    updatedAt: "2024-01-18T11:45:00Z"
  },
  {
    id: "formula_005",
    name: "Vibration Index",
    description: "Calculates vibration severity index",
    expression: "SQRT(VIB_X^2 + VIB_Y^2 + VIB_Z^2)",
    parameters: ["VIB_X", "VIB_Y", "VIB_Z"],
    category: "Vibration",
    unit: "mm/s",
    createdAt: "2024-01-19T16:20:00Z",
    updatedAt: "2024-01-19T16:20:00Z"
  },
  {
    id: "formula_006",
    name: "Heat Transfer Rate",
    description: "Calculates heat transfer rate",
    expression: "FLOW_RATE * DENSITY * HEAT_CAPACITY * (TEMP_OUT - TEMP_IN)",
    parameters: ["FLOW_RATE", "DENSITY", "HEAT_CAPACITY", "TEMP_OUT", "TEMP_IN"],
    category: "Thermal",
    unit: "kJ/s",
    createdAt: "2024-01-20T08:30:00Z",
    updatedAt: "2024-01-20T08:30:00Z"
  },
  {
    id: "formula_007",
    name: "Pump Efficiency",
    description: "Calculates pump hydraulic efficiency",
    expression: "(FLOW_RATE * HEAD * DENSITY * 9.81) / (POWER_INPUT * 1000)",
    parameters: ["FLOW_RATE", "HEAD", "DENSITY", "POWER_INPUT"],
    category: "Efficiency",
    unit: "%",
    createdAt: "2024-01-21T13:10:00Z",
    updatedAt: "2024-01-21T13:10:00Z"
  },
  {
    id: "formula_008",
    name: "OEE Calculation",
    description: "Overall Equipment Effectiveness calculation",
    expression: "AVAILABILITY * PERFORMANCE * QUALITY",
    parameters: ["AVAILABILITY", "PERFORMANCE", "QUALITY"],
    category: "Production",
    unit: "%",
    createdAt: "2024-01-22T09:45:00Z",
    updatedAt: "2024-01-22T09:45:00Z"
  },
  {
    id: "formula_009",
    name: "Heat Transfer Rate",
    description: "Calculate heat transfer rate using flow and temperature",
    expression: "FLOW_RATE * HEAT_CAPACITY * (TEMP_IN - TEMP_OUT) / 1000",
    parameters: ["FLOW_RATE", "HEAT_CAPACITY", "TEMP_IN", "TEMP_OUT"],
    category: "Thermal",
    unit: "kW",
    createdAt: "2024-01-23T10:00:00Z",
    updatedAt: "2024-01-23T10:00:00Z"
  },
  {
    id: "formula_010",
    name: "Reynolds Number",
    description: "Dimensionless number for flow characterization",
    expression: "(DENSITY * VELOCITY * DIAMETER) / VISCOSITY",
    parameters: ["DENSITY", "VELOCITY", "DIAMETER", "VISCOSITY"],
    category: "Flow",
    unit: "-",
    createdAt: "2024-01-23T11:00:00Z",
    updatedAt: "2024-01-23T11:00:00Z"
  },
  {
    id: "formula_011",
    name: "RMS Vibration",
    description: "Root mean square of vibration signal",
    expression: "sqrt((VIB_X^2 + VIB_Y^2 + VIB_Z^2) / 3)",
    parameters: ["VIB_X", "VIB_Y", "VIB_Z"],
    category: "Vibration",
    unit: "mm/s",
    createdAt: "2024-01-23T12:00:00Z",
    updatedAt: "2024-01-23T12:00:00Z"
  },
  {
    id: "formula_012",
    name: "Thermal Efficiency",
    description: "Calculate thermal efficiency with heat losses",
    expression: "(HEAT_OUTPUT / HEAT_INPUT) * 100",
    parameters: ["HEAT_OUTPUT", "HEAT_INPUT"],
    category: "Thermal",
    unit: "%",
    createdAt: "2024-01-23T13:00:00Z",
    updatedAt: "2024-01-23T13:00:00Z"
  },
  {
    id: "formula_013",
    name: "Pressure Drop",
    description: "Pressure drop calculation with correction factor",
    expression: "DELTA_P * sqrt(TEMP_ACTUAL / TEMP_DESIGN) * (FLOW_ACTUAL / FLOW_DESIGN)^2",
    parameters: ["DELTA_P", "TEMP_ACTUAL", "TEMP_DESIGN", "FLOW_ACTUAL", "FLOW_DESIGN"],
    category: "Pressure",
    unit: "kPa",
    createdAt: "2024-01-23T14:00:00Z",
    updatedAt: "2024-01-23T14:00:00Z"
  }
]