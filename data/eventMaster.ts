import { EventMaster } from "@/types"

export const mockEventMasterData: EventMaster[] = [
  {
    id: "1",
    plant: "Plant A",
    machineNo: "GT-01",
    label: "TRIP",
    labelDescription: "Emergency shutdown of turbine",
    event: "Over Temperature",
    eventDetail: "Exhaust gas temperature exceeded limit",
    start: "2024-01-15T08:30:00",
    end: "2024-01-15T09:45:00"
  },
  {
    id: "2",
    plant: "Plant A",
    machineNo: "GT-01",
    label: "ALARM",
    labelDescription: "Warning condition detected",
    event: "High Vibration",
    eventDetail: "Bearing #2 vibration exceeded warning threshold",
    start: "2024-01-20T14:15:00",
    end: "2024-01-20T14:30:00"
  },
  {
    id: "3",
    plant: "Plant A",
    machineNo: "GT-02",
    label: "MAINTENANCE",
    labelDescription: "Scheduled maintenance period",
    event: "Combustor Inspection",
    eventDetail: "Annual combustor inspection and cleaning",
    start: "2024-02-01T06:00:00",
    end: "2024-02-03T18:00:00"
  },
  {
    id: "4",
    plant: "Plant B",
    machineNo: "GT-03",
    label: "TRIP",
    labelDescription: "Emergency shutdown of turbine",
    event: "Loss of Flame",
    eventDetail: "Flame detector UV/IR signal lost",
    start: "2024-01-18T11:20:00",
    end: "2024-01-18T12:00:00"
  },
  {
    id: "5",
    plant: "Plant B",
    machineNo: "GT-03",
    label: "STARTUP",
    labelDescription: "Turbine startup sequence",
    event: "Cold Start",
    eventDetail: "Startup after 72+ hours offline",
    start: "2024-01-19T05:00:00",
    end: "2024-01-19T07:30:00"
  },
  {
    id: "6",
    plant: "Plant A",
    machineNo: "GT-01",
    label: "LOAD_CHANGE",
    labelDescription: "Significant load adjustment",
    event: "Load Reduction",
    eventDetail: "Load reduced from 100MW to 50MW",
    start: "2024-01-25T16:00:00",
    end: "2024-01-25T16:15:00"
  },
  {
    id: "7",
    plant: "Plant B",
    machineNo: "GT-04",
    label: "FUEL_CHANGE",
    labelDescription: "Fuel type changeover",
    event: "Gas to Oil Transfer",
    eventDetail: "Switched from natural gas to diesel fuel",
    start: "2024-01-22T10:00:00",
    end: "2024-01-22T10:30:00"
  },
  {
    id: "8",
    plant: "Plant A",
    machineNo: "GT-02",
    label: "ALARM",
    labelDescription: "Warning condition detected",
    event: "Low Lube Oil Pressure",
    eventDetail: "Lube oil header pressure below normal",
    start: "2024-01-28T09:45:00",
    end: "2024-01-28T10:00:00"
  },
  {
    id: "9",
    plant: "Plant B",
    machineNo: "GT-03",
    label: "SHUTDOWN",
    labelDescription: "Normal shutdown sequence",
    event: "Planned Shutdown",
    eventDetail: "Normal shutdown for weekend",
    start: "2024-01-26T18:00:00",
    end: "2024-01-26T18:30:00"
  },
  {
    id: "10",
    plant: "Plant A",
    machineNo: "GT-01",
    label: "WASH",
    labelDescription: "Compressor washing",
    event: "Online Water Wash",
    eventDetail: "Online compressor water wash performed",
    start: "2024-01-30T06:00:00",
    end: "2024-01-30T06:45:00"
  },
  {
    id: "11",
    plant: "Plant C",
    machineNo: "GT-05",
    label: "TRIP",
    labelDescription: "Emergency shutdown of turbine",
    event: "Generator Fault",
    eventDetail: "Generator protection relay activated",
    start: "2024-02-05T13:22:00",
    end: "2024-02-05T14:00:00"
  },
  {
    id: "12",
    plant: "Plant C",
    machineNo: "GT-05",
    label: "STARTUP",
    labelDescription: "Turbine startup sequence",
    event: "Hot Start",
    eventDetail: "Startup within 8 hours of shutdown",
    start: "2024-02-05T16:00:00",
    end: "2024-02-05T16:45:00"
  },
  {
    id: "13",
    plant: "Plant A",
    machineNo: "GT-02",
    label: "INSPECTION",
    labelDescription: "Borescope inspection",
    event: "Hot Gas Path Inspection",
    eventDetail: "Routine borescope inspection of hot gas path",
    start: "2024-02-10T08:00:00",
    end: "2024-02-10T16:00:00"
  },
  {
    id: "14",
    plant: "Plant B",
    machineNo: "GT-04",
    label: "ALARM",
    labelDescription: "Warning condition detected",
    event: "High Exhaust Spread",
    eventDetail: "Exhaust temperature spread exceeded limit",
    start: "2024-02-08T11:30:00",
    end: "2024-02-08T11:45:00"
  },
  {
    id: "15",
    plant: "Plant C",
    machineNo: "GT-06",
    label: "MAINTENANCE",
    labelDescription: "Scheduled maintenance period",
    event: "Filter Replacement",
    eventDetail: "Air intake filter replacement",
    start: "2024-02-12T07:00:00",
    end: "2024-02-12T12:00:00"
  }
]