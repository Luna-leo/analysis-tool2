import { InterlockMaster } from "@/types"

export const mockInterlockMaster: InterlockMaster[] = [
  {
    id: "il-001",
    name: "Temperature-Pressure Safety Interlock",
    category: "Safety",
    definition: {
      id: "def-001",
      name: "Temperature-Pressure Safety Interlock",
      description: "Safety interlock based on temperature and pressure relationship",
      xParameter: "Temperature (°C)",
      yParameter: "Pressure (MPa)",
      thresholds: [
        {
          id: "caution",
          name: "Caution",
          color: "#FFA500",
          points: [
            { x: 0, y: 0.5 },
            { x: 50, y: 1.0 },
            { x: 100, y: 1.8 },
            { x: 150, y: 2.5 },
            { x: 200, y: 3.0 },
          ]
        },
        {
          id: "pre-alarm",
          name: "Pre-alarm",
          color: "#FF6B6B",
          points: [
            { x: 0, y: 0.7 },
            { x: 50, y: 1.3 },
            { x: 100, y: 2.2 },
            { x: 150, y: 3.0 },
            { x: 200, y: 3.5 },
          ]
        },
        {
          id: "alarm",
          name: "Alarm",
          color: "#FF0000",
          points: [
            { x: 0, y: 0.9 },
            { x: 50, y: 1.6 },
            { x: 100, y: 2.6 },
            { x: 150, y: 3.5 },
            { x: 200, y: 4.0 },
          ]
        },
        {
          id: "trip",
          name: "Trip",
          color: "#8B0000",
          points: [
            { x: 0, y: 1.0 },
            { x: 50, y: 1.8 },
            { x: 100, y: 2.8 },
            { x: 150, y: 3.8 },
            { x: 200, y: 4.5 },
          ]
        }
      ]
    },
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "il-002",
    name: "Flow-Velocity Interlock",
    category: "Process",
    definition: {
      id: "def-002",
      name: "Flow-Velocity Interlock",
      description: "Process interlock for flow rate and velocity control",
      xParameter: "Flow Rate (m³/h)",
      yParameter: "Velocity (m/s)",
      thresholds: [
        {
          id: "caution",
          name: "Caution",
          color: "#FFA500",
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 2 },
            { x: 20, y: 3.5 },
            { x: 30, y: 4.5 },
            { x: 40, y: 5.2 },
            { x: 50, y: 5.8 },
          ]
        },
        {
          id: "alarm",
          name: "Alarm",
          color: "#FF0000",
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 2.5 },
            { x: 20, y: 4.2 },
            { x: 30, y: 5.3 },
            { x: 40, y: 6.0 },
            { x: 50, y: 6.5 },
          ]
        },
        {
          id: "trip",
          name: "Trip",
          color: "#8B0000",
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 3 },
            { x: 20, y: 5 },
            { x: 30, y: 6 },
            { x: 40, y: 6.8 },
            { x: 50, y: 7.2 },
          ]
        }
      ]
    },
    createdAt: "2024-01-20T14:30:00Z",
    updatedAt: "2024-01-22T09:15:00Z"
  },
  {
    id: "il-003",
    name: "Power-Current Protection",
    category: "Electrical",
    definition: {
      id: "def-003",
      name: "Power-Current Protection",
      description: "Electrical protection interlock based on power and current",
      xParameter: "Power (kW)",
      yParameter: "Current (A)",
      thresholds: [
        {
          id: "caution",
          name: "Caution",
          color: "#FFA500",
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 150 },
            { x: 200, y: 280 },
            { x: 300, y: 400 },
            { x: 400, y: 500 },
            { x: 500, y: 580 },
          ]
        },
        {
          id: "pre-alarm",
          name: "Pre-alarm",
          color: "#FF6B6B",
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 170 },
            { x: 200, y: 310 },
            { x: 300, y: 440 },
            { x: 400, y: 550 },
            { x: 500, y: 640 },
          ]
        },
        {
          id: "alarm",
          name: "Alarm",
          color: "#FF0000",
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 190 },
            { x: 200, y: 340 },
            { x: 300, y: 480 },
            { x: 400, y: 600 },
            { x: 500, y: 700 },
          ]
        },
        {
          id: "trip",
          name: "Trip",
          color: "#8B0000",
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 200 },
            { x: 200, y: 360 },
            { x: 300, y: 500 },
            { x: 400, y: 630 },
            { x: 500, y: 740 },
          ]
        }
      ]
    },
    createdAt: "2024-02-01T08:00:00Z",
    updatedAt: "2024-02-01T08:00:00Z"
  }
]

// Default colors for new threshold types
export const defaultThresholdColors = [
  "#FFA500", // Orange
  "#FF6B6B", // Light Red  
  "#FF0000", // Red
  "#8B0000", // Dark Red
  "#800080", // Purple
  "#008080", // Teal
  "#808000", // Olive
  "#FF1493", // Deep Pink
]