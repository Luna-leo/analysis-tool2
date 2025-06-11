"use client"

import React from "react"
import { ChartComponent } from "@/types"
import { ChartPreviewGraph } from "@/components/charts/ChartPreviewGraph"
import { Card } from "@/components/ui/card"

export default function TestReferenceLines() {
  // Create a test chart with reference lines
  const testChart: ChartComponent = {
    id: "test-chart",
    title: "Test Reference Lines",
    type: "scatter",
    xAxisType: "parameter",
    xParameter: "param1",
    xLabel: "X Parameter",
    yAxisParams: [
      {
        parameter: "param2",
        color: "#0000ff",
        marker: { type: "circle", size: 4, fillColor: "#0000ff", borderColor: "#0000ff" }
      }
    ],
    yLabel: "Y Parameter",
    referenceLines: [
      {
        id: "ref1",
        type: "horizontal",
        value: 50,
        label: "Target: 50",
        color: "#ff0000",
        style: "dashed"
      },
      {
        id: "ref2",
        type: "horizontal",
        value: 25,
        label: "Lower: 25",
        color: "#00ff00",
        style: "solid"
      },
      {
        id: "ref3",
        type: "horizontal",
        value: 75,
        label: "Upper: 75",
        color: "#ff00ff",
        style: "dotted"
      }
    ],
    selectedDataSources: []
  }

  const [editingChart, setEditingChart] = React.useState(testChart)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Reference Line Position Test</h1>
      
      <div className="grid grid-cols-2 gap-8">
        {/* Simulate Chart Preview (Modal) */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Chart Preview (Modal Context)</h2>
          <div className="h-[400px] w-full border rounded">
            <ChartPreviewGraph
              editingChart={editingChart}
              selectedDataSourceItems={[]}
              setEditingChart={setEditingChart} // This makes it interactive (modal context)
            />
          </div>
        </Card>

        {/* Simulate Chart Card (Grid) */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Chart Card (Grid Context)</h2>
          <div className="h-[400px] w-full border rounded">
            <ChartPreviewGraph
              editingChart={editingChart}
              selectedDataSourceItems={[]}
              // No setEditingChart prop (grid context)
            />
          </div>
        </Card>
      </div>

      {/* Show different sizes */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-md font-semibold mb-2">Small Chart Card</h3>
          <div className="h-[200px] w-full border rounded">
            <ChartPreviewGraph
              editingChart={editingChart}
              selectedDataSourceItems={[]}
            />
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-md font-semibold mb-2">Medium Chart Card</h3>
          <div className="h-[300px] w-full border rounded">
            <ChartPreviewGraph
              editingChart={editingChart}
              selectedDataSourceItems={[]}
            />
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-md font-semibold mb-2">Large Chart Card</h3>
          <div className="h-[500px] w-full border rounded">
            <ChartPreviewGraph
              editingChart={editingChart}
              selectedDataSourceItems={[]}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}