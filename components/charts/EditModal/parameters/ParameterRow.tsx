"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { X, Plus, ChevronDown, Copy, Edit2 } from "lucide-react"
import { ChartComponent } from "@/types"
import { mockInterlockMaster } from "@/data/interlockMaster"

interface ParameterRowProps {
  index: number
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  parameterInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>
  parameterTypeSelectRefs: React.MutableRefObject<(HTMLSelectElement | null)[]>
  openComboboxIndex: number | null
  setOpenComboboxIndex: (index: number | null) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleParameterTypeChange: (index: number, newType: "Parameter" | "Formula" | "Interlock") => void
  handleInterlockSelect: (index: number, value: string, mode?: "select" | "edit" | "duplicate") => void
  filterInterlocks: (interlocks: typeof mockInterlockMaster) => typeof mockInterlockMaster
  handleThresholdRemove: (paramIndex: number, thresholdId: string) => void
  handleThresholdAdd: (paramIndex: number, thresholdId: string) => void
}

export function ParameterRow({
  index,
  editingChart,
  setEditingChart,
  parameterInputRefs,
  parameterTypeSelectRefs,
  openComboboxIndex,
  setOpenComboboxIndex,
  searchQuery,
  setSearchQuery,
  handleParameterTypeChange,
  handleInterlockSelect,
  filterInterlocks,
  handleThresholdRemove,
  handleThresholdAdd,
}: ParameterRowProps) {
  const param = editingChart.yAxisParams![index]

  return (
    <div className="flex gap-2 items-center">
      <div className="w-24">
        <select
          ref={(el) => {
            parameterTypeSelectRefs.current[index] = el
          }}
          value={param.parameterType || "Parameter"}
          onChange={(e) =>
            handleParameterTypeChange(index, e.target.value as "Parameter" | "Formula" | "Interlock")
          }
          className="w-full h-7 px-2 py-1 border rounded-md text-xs"
        >
          <option value="Parameter">Parameter</option>
          <option value="Formula">Formula</option>
          <option value="Interlock">Interlock</option>
        </select>
      </div>

      <div className="flex-1">
        <div className="space-y-1">
          {param.parameterType === "Interlock" ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full">
                    <Popover
                      open={openComboboxIndex === index}
                      onOpenChange={(open) => {
                        setOpenComboboxIndex(open ? index : null)
                        setSearchQuery("")
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="h-7 w-full justify-start text-sm font-normal min-w-0">
                          <span className="truncate text-left mr-auto">
                            {param.parameter || "Select Interlock"}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Search by name, plant, machine..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandEmpty>No interlock found.</CommandEmpty>
                          <CommandGroup>
                            {filterInterlocks(mockInterlockMaster).map((master) => (
                              <CommandItem
                                key={master.id}
                                value={master.id}
                                onSelect={() => handleInterlockSelect(index, master.id, "select")}
                                className="flex items-center justify-between group"
                              >
                                <div className="flex flex-col items-start flex-1">
                                  <span className="font-medium text-left">{master.name}</span>
                                  <span className="text-xs text-muted-foreground text-left">
                                    {master.plant_name} • {master.machine_no}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleInterlockSelect(index, master.id, "edit")
                                    }}
                                    title="Edit interlock"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleInterlockSelect(index, master.id, "duplicate")
                                    }}
                                    title="Duplicate interlock"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </CommandItem>
                            ))}
                            <CommandItem
                              value="add-new"
                              onSelect={() => handleInterlockSelect(index, "add-new")}
                              className="border-t"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              <span>Add new interlock...</span>
                            </CommandItem>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    {param.parameter || "Select Interlock"}
                    {param.selectedThresholds && param.selectedThresholds.length > 0 && (
                      <>
                        <br />
                        <span className="text-xs">
                          Thresholds:{" "}
                          {param.selectedThresholds
                            .map((thresholdId) => {
                              const threshold = param.interlockDefinition?.thresholds.find(
                                (t) => t.id === thresholdId
                              )
                              return threshold?.name
                            })
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </>
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Input
              ref={(el) => {
                parameterInputRefs.current[index] = el
              }}
              value={param.parameter}
              onChange={(e) => {
                const newParams = [...(editingChart.yAxisParams || [])]
                newParams[index] = { ...newParams[index], parameter: e.target.value }
                setEditingChart({ ...editingChart, yAxisParams: newParams })
              }}
              placeholder="Parameter"
              className="h-7 text-sm"
            />
          )}

          {param.parameterType === "Interlock" &&
            ((param.selectedThresholds && param.selectedThresholds.length > 0) || param.interlockDefinition) && (
              <div className="flex gap-1 flex-wrap items-center mt-1">
                {param.selectedThresholds?.map((thresholdId) => {
                  const threshold = param.interlockDefinition?.thresholds.find((t) => t.id === thresholdId)
                  return threshold ? (
                    <Badge
                      key={thresholdId}
                      variant="secondary"
                      className="text-xs px-1.5 py-0 h-5 flex items-center gap-1"
                      style={{
                        backgroundColor: threshold.color + "20",
                        borderColor: threshold.color,
                        color: threshold.color,
                      }}
                    >
                      <span>{threshold.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleThresholdRemove(index, thresholdId)
                        }}
                        className="hover:bg-black/10 rounded-full p-0.5"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </Badge>
                  ) : null
                })}
                {param.interlockDefinition && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 border border-dashed border-gray-400 hover:border-gray-600"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1">
                      <div className="space-y-1">
                        {param.interlockDefinition.thresholds
                          .filter((threshold) => !param.selectedThresholds?.includes(threshold.id))
                          .map((threshold) => (
                            <button
                              key={threshold.id}
                              onClick={() => handleThresholdAdd(index, threshold.id)}
                              className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded flex items-center gap-2"
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: threshold.color }} />
                              {threshold.name}
                            </button>
                          ))}
                        {param.interlockDefinition.thresholds.every((threshold) =>
                          param.selectedThresholds?.includes(threshold.id)
                        ) && (
                          <div className="px-2 py-1 text-xs text-muted-foreground">All thresholds selected</div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}
        </div>
      </div>

      <div className="w-7">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => {
            const newParams = editingChart.yAxisParams?.filter((_, i) => i !== index) || []
            setEditingChart({ ...editingChart, yAxisParams: newParams })
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
