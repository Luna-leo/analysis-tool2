"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Trash2, Plus, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { InterlockThreshold } from "@/types"
import { defaultThresholdColors } from "@/data/interlockMaster"

interface ThresholdColorSectionProps {
  thresholds: InterlockThreshold[]
  onUpdateThresholds: (thresholds: InterlockThreshold[]) => void
}

export function ThresholdColorSection({
  thresholds,
  onUpdateThresholds
}: ThresholdColorSectionProps) {
  const [openThresholdNameIndex, setOpenThresholdNameIndex] = useState<string | null>(null)
  const [thresholdNameInputs, setThresholdNameInputs] = useState<{ [key: string]: string }>({})

  // Predefined threshold names
  const predefinedThresholdNames = ["Caution", "Pre-alarm", "Alarm", "Trip", "Warning", "Normal", "Emergency"]

  const getNextColor = (existingThresholds: InterlockThreshold[]) => {
    const usedColors = existingThresholds.map(t => t.color)
    return defaultThresholdColors.find(color => !usedColors.includes(color)) || defaultThresholdColors[0]
  }

  // Get unique X values from all thresholds
  const xValues = new Set<number>()
  thresholds.forEach(threshold => {
    threshold.points.forEach(point => xValues.add(point.x))
  })
  const sortedXValues = Array.from(xValues).sort((a, b) => a - b)

  const handleUpdateThresholdColor = (thresholdId: string, newColor: string) => {
    const updatedThresholds = thresholds.map(threshold =>
      threshold.id === thresholdId ? { ...threshold, color: newColor } : threshold
    )
    onUpdateThresholds(updatedThresholds)
  }

  const handleAddThreshold = () => {
    const newThresholdId = `threshold_${Date.now()}`
    const newThreshold: InterlockThreshold = {
      id: newThresholdId,
      name: "",
      color: getNextColor(thresholds),
      points: sortedXValues.map(x => ({ x, y: 0 }))
    }
    onUpdateThresholds([...thresholds, newThreshold])
    // Open the combobox for the new threshold
    setOpenThresholdNameIndex(newThresholdId)
    setThresholdNameInputs({ ...thresholdNameInputs, [newThresholdId]: "" })
  }

  const handleRemoveThreshold = (thresholdId: string) => {
    const updatedThresholds = thresholds.filter(threshold => threshold.id !== thresholdId)
    onUpdateThresholds(updatedThresholds)
  }

  const handleUpdateThresholdName = (thresholdId: string, name: string) => {
    // Check if name is already used by another threshold
    const isNameUsed = thresholds.some(t => t.id !== thresholdId && t.name === name)
    if (isNameUsed) {
      // Don't update if name is already in use
      return
    }
    
    const updatedThresholds = thresholds.map(threshold =>
      threshold.id === thresholdId ? { ...threshold, name } : threshold
    )
    onUpdateThresholds(updatedThresholds)
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Threshold Colors & Name</h4>
      <div className="flex flex-wrap gap-4">
        {thresholds.map((threshold, index) => (
          <div key={threshold.id} className="flex items-center gap-2">
            <label className="relative">
              <input
                type="color"
                value={threshold.color}
                onChange={(e) => handleUpdateThresholdColor(threshold.id, e.target.value)}
                className="sr-only"
              />
              <div 
                className="w-6 h-6 rounded-full cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: threshold.color }}
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement
                  input?.click()
                }}
              />
            </label>
            <div className="flex items-center gap-1">
              <Popover
                open={openThresholdNameIndex === threshold.id}
                onOpenChange={(open) => {
                  setOpenThresholdNameIndex(open ? threshold.id : null)
                  if (open) {
                    setThresholdNameInputs({ ...thresholdNameInputs, [threshold.id]: "" })
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openThresholdNameIndex === threshold.id}
                    className="w-28 h-6 justify-between text-xs px-2"
                  >
                    <span className="truncate">{threshold.name}</span>
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search or add new..."
                      value={thresholdNameInputs[threshold.id] || ""}
                      onValueChange={(value) => {
                        setThresholdNameInputs({ ...thresholdNameInputs, [threshold.id]: value })
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && thresholdNameInputs[threshold.id]?.trim()) {
                          e.preventDefault()
                          const inputName = thresholdNameInputs[threshold.id].trim()
                          const isNameUsed = thresholds.some(t => t.id !== threshold.id && t.name === inputName)
                          if (!isNameUsed) {
                            handleUpdateThresholdName(threshold.id, inputName)
                            setOpenThresholdNameIndex(null)
                          }
                        }
                      }}
                    />
                    <CommandEmpty>
                      {(() => {
                        const inputName = thresholdNameInputs[threshold.id]?.trim()
                        const isNameUsed = inputName && thresholds.some(t => t.id !== threshold.id && t.name === inputName)
                        return (
                          <button
                            onClick={() => {
                              if (inputName && !isNameUsed) {
                                handleUpdateThresholdName(threshold.id, inputName)
                                setOpenThresholdNameIndex(null)
                              }
                            }}
                            className={cn(
                              "w-full text-left px-2 py-1.5 text-sm",
                              isNameUsed 
                                ? "opacity-50 cursor-not-allowed" 
                                : "hover:bg-accent hover:text-accent-foreground"
                            )}
                            disabled={isNameUsed}
                          >
                            Add "{thresholdNameInputs[threshold.id]}"
                            {isNameUsed && <span className="text-xs text-red-500 ml-1">(already used)</span>}
                          </button>
                        )
                      })()}
                    </CommandEmpty>
                    <CommandGroup>
                      {predefinedThresholdNames.map((name) => {
                        const isNameUsed = thresholds.some(t => t.id !== threshold.id && t.name === name)
                        return (
                          <CommandItem
                            key={name}
                            value={name}
                            onSelect={() => {
                              if (!isNameUsed) {
                                handleUpdateThresholdName(threshold.id, name)
                                setOpenThresholdNameIndex(null)
                              }
                            }}
                            disabled={isNameUsed}
                            className={cn(
                              isNameUsed && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3 w-3",
                                threshold.name === name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className={cn(isNameUsed && "line-through")}>
                              {name}
                            </span>
                            {isNameUsed && (
                              <span className="ml-auto text-xs text-gray-500">(used)</span>
                            )}
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {thresholds.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveThreshold(threshold.id)}
                className="h-6 w-6 p-0 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
            {index === thresholds.length - 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddThreshold}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}