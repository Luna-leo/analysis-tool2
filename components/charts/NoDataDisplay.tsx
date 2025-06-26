import React from "react"
import { CheckCircle2, XCircle, AlertCircle, Database, GitBranch, Clock, Filter } from "lucide-react"
import { ChartComponent, EventInfo } from "@/types"

interface NoDataDisplayProps {
  editingChart: ChartComponent
  selectedDataSourceItems: EventInfo[]
  width?: number
  height?: number
}

interface ConfigStatus {
  label: string
  status: "ok" | "warning" | "error"
  message: string
  icon: React.ReactNode
}

export const NoDataDisplay: React.FC<NoDataDisplayProps> = ({
  editingChart,
  selectedDataSourceItems,
  width = 400,
  height = 300
}) => {
  // Check configuration status
  const configStatuses: ConfigStatus[] = []

  // 1. Data sources
  const hasDataSources = selectedDataSourceItems.length > 0
  configStatuses.push({
    label: "Data Sources",
    status: hasDataSources ? "ok" : "error",
    message: hasDataSources 
      ? `${selectedDataSourceItems.length} source${selectedDataSourceItems.length > 1 ? 's' : ''} selected`
      : "No data sources selected",
    icon: hasDataSources ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />
  })

  // 2. X-axis parameter
  const hasXParameter = !!editingChart.xParameter || editingChart.xAxisType === "datetime" || editingChart.xAxisType === "time"
  configStatuses.push({
    label: "X-axis",
    status: hasXParameter ? "ok" : "warning",
    message: hasXParameter
      ? editingChart.xAxisType === "datetime" 
        ? "Datetime"
        : editingChart.xAxisType === "time"
        ? "Time (elapsed)"
        : editingChart.xParameter || "Parameter selected"
      : "No parameter selected",
    icon: hasXParameter ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />
  })

  // 3. Y-axis parameters
  const yAxisParams = editingChart.yAxisParams || []
  const hasYParameters = yAxisParams.length > 0 && yAxisParams.some(p => p.parameter)
  configStatuses.push({
    label: "Y-axis",
    status: hasYParameters ? "ok" : "error",
    message: hasYParameters
      ? `${yAxisParams.filter(p => p.parameter).length} parameter${yAxisParams.length > 1 ? 's' : ''} configured`
      : "No parameters configured",
    icon: hasYParameters ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />
  })

  // 4. Additional info (if applicable)
  if (editingChart.referenceLines && editingChart.referenceLines.length > 0) {
    configStatuses.push({
      label: "Reference Lines",
      status: "ok",
      message: `${editingChart.referenceLines.length} reference line${editingChart.referenceLines.length > 1 ? 's' : ''}`,
      icon: <GitBranch className="w-4 h-4" />
    })
  }

  // Determine primary issue
  let primaryHint = ""
  if (!hasDataSources) {
    primaryHint = "Select data sources from the toolbar to display data"
  } else if (!hasYParameters) {
    primaryHint = "Configure Y-axis parameters in the chart settings"
  } else {
    primaryHint = "Check if the selected data sources contain data for the configured parameters"
  }

  // Calculate positioning
  const centerX = width / 2
  const centerY = height / 2
  const startY = centerY - 80

  return (
    <g className="no-data-display">
      {/* Background */}
      <rect
        x={width * 0.15}
        y={startY - 20}
        width={width * 0.7}
        height={160}
        rx={8}
        fill="#f9fafb"
        stroke="#e5e7eb"
        strokeWidth={1}
      />

      {/* Title */}
      <text
        x={centerX}
        y={startY}
        textAnchor="middle"
        className="fill-gray-700 text-sm font-medium"
      >
        No Data Available
      </text>

      {/* Configuration Status */}
      <g transform={`translate(${width * 0.2}, ${startY + 20})`}>
        {configStatuses.map((config, index) => {
          const yPos = index * 22
          const statusColor = config.status === "ok" ? "#10b981" : config.status === "warning" ? "#f59e0b" : "#ef4444"
          
          return (
            <g key={config.label} transform={`translate(0, ${yPos})`}>
              {/* Icon */}
              <g transform="translate(0, -8)" className={`fill-current`} style={{ color: statusColor }}>
                {config.icon}
              </g>
              
              {/* Label */}
              <text
                x={25}
                y={0}
                className="fill-gray-600 text-xs"
                dominantBaseline="middle"
              >
                {config.label}:
              </text>
              
              {/* Status */}
              <text
                x={90}
                y={0}
                className="fill-gray-800 text-xs"
                dominantBaseline="middle"
              >
                {config.message}
              </text>
            </g>
          )
        })}
      </g>

      {/* Primary Hint */}
      <text
        x={centerX}
        y={startY + 120}
        textAnchor="middle"
        className="fill-gray-600 text-xs"
      >
        {primaryHint}
      </text>

      {/* Icon */}
      <g transform={`translate(${centerX - 12}, ${startY - 50})`} className="fill-gray-400">
        <Database className="w-6 h-6" />
      </g>
    </g>
  )
}