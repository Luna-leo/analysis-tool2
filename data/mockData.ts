import { FileNode, ChartComponent } from "@/types"

// Gas turbine sensor parameters
const turbineSensors = {
  temperature: [
    "Exhaust Gas Temperature TC1", "Exhaust Gas Temperature TC2", "Exhaust Gas Temperature TC3",
    "Exhaust Gas Temperature TC4", "Exhaust Gas Temperature TC5", "Exhaust Gas Temperature TC6",
    "Compressor Inlet Temperature", "Compressor Discharge Temperature", "Turbine Inlet Temperature",
    "Bearing Metal Temperature #1", "Bearing Metal Temperature #2", "Bearing Metal Temperature #3",
    "Lube Oil Supply Temperature", "Lube Oil Return Temperature", "Generator Winding Temperature A",
    "Generator Winding Temperature B", "Generator Winding Temperature C", "Ambient Temperature",
    "Cooling Air Temperature", "Fuel Gas Temperature", "Atomizing Air Temperature"
  ],
  pressure: [
    "Compressor Discharge Pressure", "Compressor Inlet Pressure", "Fuel Gas Supply Pressure",
    "Fuel Gas Control Valve Inlet Pressure", "Atomizing Air Pressure", "Lube Oil Header Pressure",
    "Control Oil Pressure", "Seal Air Pressure", "Cooling Water Pressure", "Barometric Pressure",
    "Combustor Shell Pressure", "Exhaust Duct Pressure", "Steam Injection Pressure"
  ],
  vibration: [
    "Bearing #1 Vibration X", "Bearing #1 Vibration Y", "Bearing #2 Vibration X", "Bearing #2 Vibration Y",
    "Bearing #3 Vibration X", "Bearing #3 Vibration Y", "Generator DE Vibration", "Generator NDE Vibration",
    "Gearbox Input Vibration", "Gearbox Output Vibration", "Shaft Displacement", "Axial Displacement"
  ],
  flow: [
    "Fuel Gas Flow Rate", "Liquid Fuel Flow Rate", "Atomizing Air Flow", "Compressor Air Flow",
    "Cooling Air Flow", "Steam Injection Flow", "Water Injection Flow", "Lube Oil Flow Rate",
    "Seal Air Flow", "Ventilation Air Flow"
  ],
  electrical: [
    "Generator Output Power (MW)", "Generator Terminal Voltage", "Generator Current Phase A",
    "Generator Current Phase B", "Generator Current Phase C", "Power Factor", "Frequency",
    "Exciter Voltage", "Exciter Current", "Grid Voltage", "Reactive Power (MVAR)"
  ],
  speed: [
    "Gas Turbine Speed (RPM)", "Generator Speed (RPM)", "Starter Motor Speed", "Exciter Speed",
    "Accessory Gearbox Speed", "Fuel Pump Speed", "Lube Oil Pump Speed"
  ],
  emissions: [
    "NOx Emissions (ppm)", "CO Emissions (ppm)", "O2 Content (%)", "CO2 Emissions (%)",
    "Unburned Hydrocarbons", "Stack Temperature", "Opacity (%)"
  ],
  control: [
    "Fuel Control Valve Position (%)", "IGV Position (%)", "Bleed Valve Position (%)",
    "Steam Injection Valve Position", "Water Injection Valve Position", "Bypass Valve Position",
    "Load Setpoint (%)", "Speed Setpoint (%)", "Temperature Control Mode"
  ],
  misc: [
    "Flame Detector UV Scanner", "Flame Detector IR Scanner", "Lube Oil Level", "Hydraulic Oil Level",
    "Fire Protection System Status", "Enclosure Temperature", "Control Room Temperature",
    "Battery Voltage", "UPS Status", "Emergency Stop Status"
  ]
}

function generateTurbineCharts(prefix: string, count: number): ChartComponent[] {
  const charts: ChartComponent[] = []
  const allSensors = [
    ...turbineSensors.temperature,
    ...turbineSensors.pressure,
    ...turbineSensors.vibration,
    ...turbineSensors.flow,
    ...turbineSensors.electrical,
    ...turbineSensors.speed,
    ...turbineSensors.emissions,
    ...turbineSensors.control,
    ...turbineSensors.misc
  ]

  // Shuffle sensors for variety
  const shuffled = [...allSensors].sort(() => Math.random() - 0.5)
  
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const sensorName = shuffled[i]
    const chartTypes: Array<"line" | "bar" | "pie"> = ["line", "bar", "pie"]
    const chartType = i % 10 < 7 ? "line" : i % 10 < 9 ? "bar" : "pie"
    
    // Generate appropriate data based on sensor type
    let data = []
    
    if (chartType === "line") {
      // Time series data
      const timePoints = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]
      data = timePoints.map(time => ({
        name: time,
        value: generateSensorValue(sensorName)
      }))
    } else if (chartType === "bar") {
      // Comparative data
      const units = ["Unit 1", "Unit 2", "Unit 3", "Unit 4"]
      data = units.map(unit => ({
        name: unit,
        value: generateSensorValue(sensorName)
      }))
    } else {
      // Status distribution
      data = [
        { name: "Normal", value: 70 + Math.random() * 20 },
        { name: "Warning", value: 5 + Math.random() * 15 },
        { name: "Alert", value: Math.random() * 10 }
      ]
    }

    charts.push({
      id: `${prefix}-chart-${i + 1}`,
      title: sensorName,
      chartType,
      data,
      dataSource: {
        name: getDataSourceForSensor(sensorName),
        table: sensorName.toLowerCase().replace(/\s+/g, "_"),
        columns: ["timestamp", "value", "unit_id", "status"],
        lastUpdated: "2024-01-15 14:30:00"
      }
    })
  }
  
  return charts
}

function generateSensorValue(sensorName: string): number {
  // Generate realistic values based on sensor type
  if (sensorName.includes("Temperature")) {
    if (sensorName.includes("Exhaust")) return 450 + Math.random() * 100
    if (sensorName.includes("Ambient")) return 15 + Math.random() * 20
    if (sensorName.includes("Oil")) return 40 + Math.random() * 30
    return 50 + Math.random() * 200
  }
  if (sensorName.includes("Pressure")) {
    if (sensorName.includes("Compressor")) return 10 + Math.random() * 10
    if (sensorName.includes("Oil")) return 2 + Math.random() * 3
    return 1 + Math.random() * 5
  }
  if (sensorName.includes("Vibration")) return Math.random() * 10
  if (sensorName.includes("Flow")) return 10 + Math.random() * 90
  if (sensorName.includes("Power")) return 50 + Math.random() * 150
  if (sensorName.includes("Voltage")) return 10000 + Math.random() * 5000
  if (sensorName.includes("Current")) return 1000 + Math.random() * 2000
  if (sensorName.includes("Speed")) return 3000 + Math.random() * 600
  if (sensorName.includes("Emissions")) return Math.random() * 50
  if (sensorName.includes("Position")) return Math.random() * 100
  return Math.random() * 100
}

function getDataSourceForSensor(sensorName: string): string {
  if (sensorName.includes("Temperature") || sensorName.includes("Pressure")) return "DCS"
  if (sensorName.includes("Vibration")) return "Vibration Monitoring System"
  if (sensorName.includes("Emissions")) return "CEMS"
  if (sensorName.includes("Power") || sensorName.includes("Voltage") || sensorName.includes("Current")) return "SCADA"
  return "Plant Historian"
}

export const mockFileTree: FileNode[] = [
  {
    id: "1",
    name: "Plant A",
    type: "folder",
    children: [
      {
        id: "2",
        name: "Speed Up",
        type: "file",
        dataSources: ["Turbine Control System", "SCADA", "Vibration Monitor"],
        charts: generateTurbineCharts("speedup", 60),
      },
      {
        id: "3",
        name: "Load Up",
        type: "file",
        dataSources: ["DCS", "Historian", "Performance Monitor"],
        charts: generateTurbineCharts("loadup", 75),
      },
    ],
  },
  {
    id: "4",
    name: "Plant B",
    type: "folder",
    children: [
      {
        id: "5",
        name: "Kick Signal",
        type: "file",
        dataSources: ["2025:Fuel Change", "2024 Fuel Change"],
        charts: generateTurbineCharts("kicksignal", 50),
      },
    ],
  },
]