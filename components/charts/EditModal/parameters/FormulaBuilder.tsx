"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { X, Plus, ChevronDown } from "lucide-react"
import { mockParameterMaster, formulaOperators } from "@/data/parameterMaster"

export interface FormulaElement {
  id: string
  type: "parameter" | "operator" | "constant" | "number"
  value: string
  displayName?: string
}

interface FormulaBuilderProps {
  elements: FormulaElement[]
  onElementsChange: (elements: FormulaElement[]) => void
}

export function FormulaBuilder({ elements, onElementsChange }: FormulaBuilderProps) {
  const [parameterSearchOpen, setParameterSearchOpen] = useState(false)
  const [parameterSearch, setParameterSearch] = useState("")

  const addElement = (element: FormulaElement) => {
    onElementsChange([...elements, { ...element, id: `elem_${Date.now()}` }])
  }

  const removeElement = (id: string) => {
    onElementsChange(elements.filter(elem => elem.id !== id))
  }

  const insertNumber = () => {
    const value = prompt("Enter a number:")
    if (value && !isNaN(parseFloat(value))) {
      addElement({
        id: "",
        type: "number",
        value: value,
        displayName: value
      })
    }
  }

  const filteredParameters = mockParameterMaster.filter(param => {
    const search = parameterSearch.toLowerCase()
    return param.name.toLowerCase().includes(search) ||
           param.description.toLowerCase().includes(search) ||
           param.category.toLowerCase().includes(search)
  })

  // Group parameters by category
  const groupedParameters = filteredParameters.reduce((acc, param) => {
    if (!acc[param.category]) {
      acc[param.category] = []
    }
    acc[param.category].push(param)
    return acc
  }, {} as Record<string, typeof mockParameterMaster>)

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-2">Formula Builder</Label>
        
        {/* Current formula display */}
        <div className="border rounded-lg p-3 min-h-[60px] bg-muted/30 mb-3">
          <div className="flex flex-wrap gap-1 items-center">
            {elements.length === 0 ? (
              <span className="text-sm text-muted-foreground">Click buttons below to build your formula</span>
            ) : (
              elements.map((element) => (
                <Badge
                  key={element.id}
                  variant={element.type === "parameter" ? "default" : "secondary"}
                  className="px-2 py-1 flex items-center gap-1"
                >
                  <span className="text-xs">{element.displayName || element.value}</span>
                  <button
                    onClick={() => removeElement(element.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        </div>

        {/* Control buttons */}
        <div className="space-y-3">
          {/* Parameters */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1">Parameters</Label>
            <Popover open={parameterSearchOpen} onOpenChange={setParameterSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Parameter
                  <ChevronDown className="h-3 w-3 ml-auto" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search parameters..."
                    value={parameterSearch}
                    onValueChange={setParameterSearch}
                  />
                  <CommandEmpty>No parameters found.</CommandEmpty>
                  <div className="max-h-[300px] overflow-y-auto">
                    {Object.entries(groupedParameters).map(([category, params]) => (
                      <CommandGroup key={category} heading={category}>
                        {params.map((param) => (
                          <CommandItem
                            key={param.id}
                            value={param.id}
                            onSelect={() => {
                              addElement({
                                id: "",
                                type: "parameter",
                                value: param.name,
                                displayName: param.name
                              })
                              setParameterSearchOpen(false)
                              setParameterSearch("")
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{param.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {param.description} {param.unit && `(${param.unit})`}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </div>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Basic Operators */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1">Basic Operators</Label>
            <div className="grid grid-cols-7 gap-1">
              {formulaOperators.basic.map((op) => (
                <Button
                  key={op.symbol}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => addElement({
                    id: "",
                    type: "operator",
                    value: op.symbol,
                    displayName: op.symbol
                  })}
                  title={op.name}
                >
                  {op.symbol}
                </Button>
              ))}
            </div>
          </div>

          {/* Functions */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1">Functions</Label>
            <div className="grid grid-cols-4 gap-1">
              {formulaOperators.functions.map((func) => (
                <Button
                  key={func.symbol}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => addElement({
                    id: "",
                    type: "operator",
                    value: func.symbol,
                    displayName: func.symbol
                  })}
                  title={func.name}
                >
                  {func.symbol}
                </Button>
              ))}
            </div>
          </div>

          {/* Constants and Numbers */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1">Constants & Numbers</Label>
            <div className="grid grid-cols-4 gap-1">
              {formulaOperators.constants.map((constant) => (
                <Button
                  key={constant.symbol}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => addElement({
                    id: "",
                    type: "constant",
                    value: constant.symbol,
                    displayName: constant.symbol
                  })}
                  title={`${constant.name} = ${constant.value}`}
                >
                  {constant.symbol}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={insertNumber}
              >
                Number
              </Button>
            </div>
          </div>

          {/* Clear button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onElementsChange([])}
            disabled={elements.length === 0}
          >
            Clear Formula
          </Button>
        </div>
      </div>
    </div>
  )
}