export interface ParameterMaster {
  id: string
  name: string
  description: string
  unit: string
  category: string
  dataType: "numeric" | "boolean" | "string"
  min?: number
  max?: number
}

export const mockParameterMaster: ParameterMaster[] = [
  // Temperature Parameters
  {
    id: "param_001",
    name: "TEMP_IN",
    description: "Input Temperature",
    unit: "°C",
    category: "Temperature",
    dataType: "numeric",
    min: -50,
    max: 500
  },
  {
    id: "param_002",
    name: "TEMP_OUT",
    description: "Output Temperature",
    unit: "°C",
    category: "Temperature",
    dataType: "numeric",
    min: -50,
    max: 500
  },
  {
    id: "param_003",
    name: "TEMP_AMB",
    description: "Ambient Temperature",
    unit: "°C",
    category: "Temperature",
    dataType: "numeric",
    min: -50,
    max: 100
  },
  // Pressure Parameters
  {
    id: "param_004",
    name: "PRESS_IN",
    description: "Input Pressure",
    unit: "MPa",
    category: "Pressure",
    dataType: "numeric",
    min: 0,
    max: 50
  },
  {
    id: "param_005",
    name: "PRESS_OUT",
    description: "Output Pressure",
    unit: "MPa",
    category: "Pressure",
    dataType: "numeric",
    min: 0,
    max: 50
  },
  {
    id: "param_006",
    name: "PRESS_DIFF",
    description: "Differential Pressure",
    unit: "MPa",
    category: "Pressure",
    dataType: "numeric",
    min: -10,
    max: 10
  },
  // Flow Parameters
  {
    id: "param_007",
    name: "FLOW_RATE",
    description: "Flow Rate",
    unit: "m³/h",
    category: "Flow",
    dataType: "numeric",
    min: 0,
    max: 1000
  },
  {
    id: "param_008",
    name: "FLOW_ACTUAL",
    description: "Actual Flow",
    unit: "m³/h",
    category: "Flow",
    dataType: "numeric",
    min: 0,
    max: 1000
  },
  {
    id: "param_009",
    name: "FLOW_TARGET",
    description: "Target Flow",
    unit: "m³/h",
    category: "Flow",
    dataType: "numeric",
    min: 0,
    max: 1000
  },
  // Power Parameters
  {
    id: "param_010",
    name: "VOLTAGE",
    description: "Voltage",
    unit: "V",
    category: "Power",
    dataType: "numeric",
    min: 0,
    max: 1000
  },
  {
    id: "param_011",
    name: "CURRENT",
    description: "Current",
    unit: "A",
    category: "Power",
    dataType: "numeric",
    min: 0,
    max: 1000
  },
  {
    id: "param_012",
    name: "POWER_INPUT",
    description: "Input Power",
    unit: "kW",
    category: "Power",
    dataType: "numeric",
    min: 0,
    max: 10000
  },
  {
    id: "param_013",
    name: "COS_PHI",
    description: "Power Factor",
    unit: "",
    category: "Power",
    dataType: "numeric",
    min: 0,
    max: 1
  },
  // Vibration Parameters
  {
    id: "param_014",
    name: "VIB_X",
    description: "Vibration X-axis",
    unit: "mm/s",
    category: "Vibration",
    dataType: "numeric",
    min: 0,
    max: 100
  },
  {
    id: "param_015",
    name: "VIB_Y",
    description: "Vibration Y-axis",
    unit: "mm/s",
    category: "Vibration",
    dataType: "numeric",
    min: 0,
    max: 100
  },
  {
    id: "param_016",
    name: "VIB_Z",
    description: "Vibration Z-axis",
    unit: "mm/s",
    category: "Vibration",
    dataType: "numeric",
    min: 0,
    max: 100
  },
  // Production Parameters
  {
    id: "param_017",
    name: "AVAILABILITY",
    description: "Equipment Availability",
    unit: "%",
    category: "Production",
    dataType: "numeric",
    min: 0,
    max: 100
  },
  {
    id: "param_018",
    name: "PERFORMANCE",
    description: "Performance Rate",
    unit: "%",
    category: "Production",
    dataType: "numeric",
    min: 0,
    max: 100
  },
  {
    id: "param_019",
    name: "QUALITY",
    description: "Quality Rate",
    unit: "%",
    category: "Production",
    dataType: "numeric",
    min: 0,
    max: 100
  },
  // Physical Properties
  {
    id: "param_020",
    name: "DENSITY",
    description: "Fluid Density",
    unit: "kg/m³",
    category: "Physical",
    dataType: "numeric",
    min: 0,
    max: 2000
  },
  {
    id: "param_021",
    name: "HEAT_CAPACITY",
    description: "Specific Heat Capacity",
    unit: "kJ/kg·K",
    category: "Physical",
    dataType: "numeric",
    min: 0,
    max: 10
  },
  {
    id: "param_022",
    name: "HEAD",
    description: "Pump Head",
    unit: "m",
    category: "Physical",
    dataType: "numeric",
    min: 0,
    max: 1000
  }
]

// Define available operators for formula building
export const formulaOperators = {
  basic: [
    { symbol: "+", name: "Add", type: "binary" },
    { symbol: "-", name: "Subtract", type: "binary" },
    { symbol: "*", name: "Multiply", type: "binary" },
    { symbol: "/", name: "Divide", type: "binary" },
    { symbol: "^", name: "Power", type: "binary" },
    { symbol: "(", name: "Left Parenthesis", type: "group" },
    { symbol: ")", name: "Right Parenthesis", type: "group" }
  ],
  functions: [
    { symbol: "SQRT", name: "Square Root", type: "function", args: 1 },
    { symbol: "ABS", name: "Absolute Value", type: "function", args: 1 },
    { symbol: "SIN", name: "Sine", type: "function", args: 1 },
    { symbol: "COS", name: "Cosine", type: "function", args: 1 },
    { symbol: "TAN", name: "Tangent", type: "function", args: 1 },
    { symbol: "LOG", name: "Logarithm (base 10)", type: "function", args: 1 },
    { symbol: "LN", name: "Natural Logarithm", type: "function", args: 1 },
    { symbol: "EXP", name: "Exponential", type: "function", args: 1 },
    { symbol: "MIN", name: "Minimum", type: "function", args: 2 },
    { symbol: "MAX", name: "Maximum", type: "function", args: 2 },
    { symbol: "AVG", name: "Average", type: "function", args: -1 }, // Variable args
    { symbol: "ROUND", name: "Round", type: "function", args: 1 }
  ],
  constants: [
    { symbol: "PI", name: "Pi (π)", value: 3.14159265359 },
    { symbol: "E", name: "Euler's Number", value: 2.71828182846 },
    { symbol: "G", name: "Gravity", value: 9.81 }
  ]
}