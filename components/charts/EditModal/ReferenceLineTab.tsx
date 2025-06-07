"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Plus } from "lucide-react"
import { ChartComponent, ReferenceLineType } from "@/types"
import { InterlockSection } from "./InterlockSection"

interface ReferenceLineTabProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function ReferenceLineTab({ editingChart, setEditingChart }: ReferenceLineTabProps) {
  const handleAddReferenceLine = (type: "vertical" | "horizontal") => {
    const newReferenceLine = {
      id: Date.now().toString(),
      type,
      value: 0,
      label: type === "vertical" ? "Vertical Line" : "Horizontal Line",
      color: type === "vertical" ? "#0000ff" : "#00ff00",
      style: "solid" as const,
    }
    
    setEditingChart({
      ...editingChart,
      referenceLines: [...(editingChart.referenceLines || []), newReferenceLine],
    })
  }

  const handleUpdateReferenceLine = (id: string, field: string, value: any) => {
    setEditingChart({
      ...editingChart,
      referenceLines: editingChart.referenceLines?.map((line) =>
        line.id === id ? { ...line, [field]: value } : line
      ),
    })
  }

  const handleRemoveReferenceLine = (id: string) => {
    setEditingChart({
      ...editingChart,
      referenceLines: editingChart.referenceLines?.filter((line) => line.id !== id),
    })
  }

  const renderLineSection = (type: "vertical" | "horizontal", title: string, description: string) => {
    const lines = editingChart.referenceLines?.filter(line => line.type === type) || []
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddReferenceLine(type)}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        <div className="space-y-3">
          {lines.map((line) => (
            <div key={line.id} className="border rounded-lg p-3 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`label-${line.id}`}>Label</Label>
                      <Input
                        id={`label-${line.id}`}
                        value={line.label}
                        onChange={(e) => handleUpdateReferenceLine(line.id, "label", e.target.value)}
                        placeholder="Line label"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`value-${line.id}`}>
                        {type === "vertical" ? "X Value" : "Y Value"}
                      </Label>
                      <Input
                        id={`value-${line.id}`}
                        type="number"
                        value={line.value}
                        onChange={(e) => handleUpdateReferenceLine(line.id, "value", parseFloat(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`color-${line.id}`}>Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`color-${line.id}`}
                          type="color"
                          value={line.color}
                          onChange={(e) => handleUpdateReferenceLine(line.id, "color", e.target.value)}
                          className="w-12 h-9 p-1 cursor-pointer"
                        />
                        <Input
                          value={line.color}
                          onChange={(e) => handleUpdateReferenceLine(line.id, "color", e.target.value)}
                          placeholder="#ff0000"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`style-${line.id}`}>Line Style</Label>
                      <Select
                        value={line.style}
                        onValueChange={(value) => handleUpdateReferenceLine(line.id, "style", value)}
                      >
                        <SelectTrigger id={`style-${line.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Solid</SelectItem>
                          <SelectItem value="dashed">Dashed</SelectItem>
                          <SelectItem value="dotted">Dotted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveReferenceLine(line.id)}
                  className="ml-2 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {lines.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <p className="text-sm">No {title.toLowerCase()} added yet.</p>
            <p className="text-sm">Click "Add" to create a reference line.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="vertical" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vertical">Vertical Lines</TabsTrigger>
          <TabsTrigger value="horizontal">Horizontal Lines</TabsTrigger>
          <TabsTrigger value="interlock">Interlock Thresholds</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vertical" className="mt-4">
          {renderLineSection(
            "vertical",
            "Vertical Lines",
            "Add vertical reference lines at specific X-axis values"
          )}
        </TabsContent>
        
        <TabsContent value="horizontal" className="mt-4">
          {renderLineSection(
            "horizontal",
            "Horizontal Lines",
            "Add horizontal reference lines at specific Y-axis values"
          )}
        </TabsContent>
        
        <TabsContent value="interlock" className="mt-4">
          <InterlockSection
            editingChart={editingChart}
            setEditingChart={setEditingChart}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}