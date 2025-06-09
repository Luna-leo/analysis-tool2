"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { X, Plus, ChevronDown, Copy, Edit2 } from "lucide-react"
import { mockInterlockMaster } from "@/data/interlockMaster"

interface InterlockParameterRowProps {
  index: number
  parameter: string
  interlockDefinition?: any
  selectedThresholds?: string[]
  openComboboxIndex: number | null
  setOpenComboboxIndex: (index: number | null) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleInterlockSelect: (index: number, value: string, mode?: "select" | "edit" | "duplicate") => void
  filterInterlocks: (interlocks: typeof mockInterlockMaster) => typeof mockInterlockMaster
  handleThresholdRemove: (paramIndex: number, thresholdId: string) => void
  handleThresholdAdd: (paramIndex: number, thresholdId: string) => void
}

export function InterlockParameterRow({
  index,
  parameter,
  interlockDefinition,
  selectedThresholds,
  openComboboxIndex,
  setOpenComboboxIndex,
  searchQuery,
  setSearchQuery,
  handleInterlockSelect,
  filterInterlocks,
  handleThresholdRemove,
  handleThresholdAdd,
}: InterlockParameterRowProps) {
  return (
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
                <Button variant="outline" role="combobox" className="h-auto w-full justify-start text-sm font-normal min-w-0 py-2">
                  <div className="flex flex-col items-start text-left mr-auto min-w-0 flex-1">
                    <span className="truncate font-medium">
                      {parameter || "Select Interlock"}
                    </span>
                    {selectedThresholds && selectedThresholds.length > 0 && interlockDefinition && (
                      <div className="flex gap-1 flex-wrap items-center mt-1">
                        {selectedThresholds.map((thresholdId) => {
                          const threshold = interlockDefinition?.thresholds.find((t: any) => t.id === thresholdId)
                          return threshold ? (
                            <Badge
                              key={thresholdId}
                              variant="secondary"
                              className="text-xs pl-1.5 pr-0.5 py-0 h-4 flex items-center gap-1 group"
                              style={{
                                backgroundColor: threshold.color + "20",
                                borderColor: threshold.color,
                                color: threshold.color,
                              }}
                            >
                              <span>{threshold.name}</span>
                              <div
                                className="h-3.5 w-3.5 p-0 flex items-center justify-center rounded-sm hover:bg-black/10 transition-all cursor-pointer opacity-40 hover:opacity-100"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleThresholdRemove(index, thresholdId)
                                }}
                              >
                                <X className="h-2 w-2" />
                              </div>
                            </Badge>
                          ) : null
                        })}
                        {interlockDefinition && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <div
                                className="h-4 w-4 p-0 border border-dashed border-gray-400 hover:border-gray-600 rounded cursor-pointer inline-flex items-center justify-center bg-transparent hover:bg-muted/50 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Plus className="h-2.5 w-2.5" />
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-1">
                              <div className="space-y-1">
                                {interlockDefinition.thresholds
                                  .filter((threshold: any) => !selectedThresholds?.includes(threshold.id))
                                  .map((threshold: any) => (
                                    <button
                                      key={threshold.id}
                                      onClick={() => handleThresholdAdd(index, threshold.id)}
                                      className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded flex items-center gap-2"
                                    >
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: threshold.color }} />
                                      {threshold.name}
                                    </button>
                                  ))}
                                {interlockDefinition.thresholds.every((threshold: any) =>
                                  selectedThresholds?.includes(threshold.id)
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
                  <div className="max-h-[300px] overflow-y-auto">
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
                  </div>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">
            {parameter || "Select Interlock"}
            {selectedThresholds && selectedThresholds.length > 0 && (
              <>
                <br />
                <span className="text-xs">
                  Thresholds:{" "}
                  {selectedThresholds
                    .map((thresholdId) => {
                      const threshold = interlockDefinition?.thresholds.find(
                        (t: any) => t.id === thresholdId
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
  )
}