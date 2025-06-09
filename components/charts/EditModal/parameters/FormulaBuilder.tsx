"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { X, Plus, ChevronDown, GripVertical } from "lucide-react"
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
  const [operatorSearchOpen, setOperatorSearchOpen] = useState(false)
  const [functionSearchOpen, setFunctionSearchOpen] = useState(false)
  const [constantSearchOpen, setConstantSearchOpen] = useState(false)
  const [showNumberInput, setShowNumberInput] = useState(false)
  const [numberValue, setNumberValue] = useState("")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const addElement = (element: FormulaElement) => {
    onElementsChange([...elements, { ...element, id: `elem_${Date.now()}` }])
  }

  const removeElement = (id: string) => {
    onElementsChange(elements.filter(elem => elem.id !== id))
  }

  const moveElement = (fromIndex: number, toIndex: number) => {
    const newElements = [...elements]
    const [movedElement] = newElements.splice(fromIndex, 1)
    newElements.splice(toIndex, 0, movedElement)
    onElementsChange(newElements)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      moveElement(draggedIndex, index)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const insertNumber = () => {
    if (numberValue && !isNaN(parseFloat(numberValue))) {
      addElement({
        id: "",
        type: "number",
        value: numberValue,
        displayName: numberValue
      })
      setNumberValue("")
      setShowNumberInput(false)
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
        {/* Current formula display */}
        <div className="border-2 border-dashed rounded-lg p-4 min-h-[80px] bg-muted/10 mb-4">
          <Label className="text-xs text-muted-foreground mb-2 block">Current Formula</Label>
          <div className="flex flex-wrap gap-1.5 items-center min-h-[40px]">
            {elements.length === 0 ? (
              <span className="text-sm text-muted-foreground italic">Start building your formula by clicking the buttons below...</span>
            ) : (
              elements.map((element, index) => (
                <Badge
                  key={element.id}
                  variant={element.type === "parameter" ? "default" : 
                          element.type === "number" ? "outline" : 
                          element.type === "constant" ? "secondary" : "secondary"}
                  className={`px-3 py-1.5 flex items-center gap-1 text-sm cursor-move transition-all ${
                    draggedIndex === index ? 'opacity-50 scale-95' : ''
                  } ${
                    dragOverIndex === index ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                  <span>{element.displayName || element.value}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeElement(element.id)
                    }}
                    className="ml-1 hover:text-destructive transition-colors"
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        </div>

        {/* Formula Preview */}
        {elements.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <Label className="text-xs text-muted-foreground mb-1 block">Formula Expression</Label>
            <div className="font-mono text-sm bg-white border rounded px-3 py-2">
              {elements.map(elem => elem.value).join(" ")}
            </div>
          </div>
        )}

        {/* Control buttons */}
        <div className="space-y-4">
          {/* Quick Add Section */}
          <div className="grid grid-cols-5 gap-2">
            {/* Parameters */}
            <div>
              <Popover open={parameterSearchOpen} onOpenChange={setParameterSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="w-full justify-between h-10"
                  >
                    <span className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Parameter
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[450px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search parameters by name, description, or category..."
                      value={parameterSearch}
                      onValueChange={setParameterSearch}
                      className="h-12"
                    />
                    <CommandEmpty className="py-6 text-center text-muted-foreground">
                      No parameters found.
                    </CommandEmpty>
                    <div className="max-h-[350px] overflow-y-auto">
                      {Object.entries(groupedParameters).map(([category, params]) => (
                        <CommandGroup key={category} heading={category} className="px-2">
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
                              className="cursor-pointer px-2 py-3"
                            >
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{param.name}</span>
                                  {param.unit && (
                                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                      {param.unit}
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {param.description}
                                </span>
                                {param.min !== undefined && param.max !== undefined && (
                                  <span className="text-xs text-muted-foreground">
                                    Range: {param.min} - {param.max}
                                  </span>
                                )}
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

            {/* Number Input */}
            <div>
              <Popover open={showNumberInput} onOpenChange={setShowNumberInput}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="w-full h-10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Number
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="number-input" className="text-sm">Enter a number</Label>
                      <Input
                        id="number-input"
                        type="number"
                        placeholder="e.g., 3.14, 100, -5"
                        value={numberValue}
                        onChange={(e) => setNumberValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            insertNumber()
                          }
                        }}
                        className="mt-1"
                        autoFocus
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNumberValue("")
                          setShowNumberInput(false)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={insertNumber}
                        disabled={!numberValue || isNaN(parseFloat(numberValue))}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Basic Operators */}
            <div>
              <Popover open={operatorSearchOpen} onOpenChange={setOperatorSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="w-full justify-between h-10"
                  >
                    <span className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Operator
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-2" align="start">
                  <div className="grid grid-cols-4 gap-1">
                    {formulaOperators.basic.map((op) => (
                      <Button
                        key={op.symbol}
                        variant="outline"
                        size="sm"
                        className="h-10 px-0 font-mono text-lg"
                        onClick={() => {
                          addElement({
                            id: "",
                            type: "operator",
                            value: op.symbol,
                            displayName: op.symbol
                          })
                          setOperatorSearchOpen(false)
                        }}
                        title={op.name}
                      >
                        {op.symbol}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Functions */}
            <div>
              <Popover open={functionSearchOpen} onOpenChange={setFunctionSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="w-full justify-between h-10"
                  >
                    <span className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Function
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-3" align="start">
                  <div className="space-y-1">
                    {formulaOperators.functions.map((func) => (
                      <Button
                        key={func.symbol}
                        variant="ghost"
                        className="w-full justify-start h-auto py-2 px-3"
                        onClick={() => {
                          addElement({
                            id: "",
                            type: "operator",
                            value: func.symbol,
                            displayName: func.symbol
                          })
                          setFunctionSearchOpen(false)
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono font-medium">{func.symbol}</span>
                          <span className="text-xs text-muted-foreground">{func.name}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Constants */}
            <div>
              <Popover open={constantSearchOpen} onOpenChange={setConstantSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="w-full justify-between h-10"
                  >
                    <span className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Constant
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-3" align="start">
                  <div className="space-y-1">
                    {formulaOperators.constants.map((constant) => (
                      <Button
                        key={constant.symbol}
                        variant="ghost"
                        className="w-full justify-start h-auto py-2 px-3"
                        onClick={() => {
                          addElement({
                            id: "",
                            type: "constant",
                            value: constant.symbol,
                            displayName: constant.symbol
                          })
                          setConstantSearchOpen(false)
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono font-medium">{constant.symbol}</span>
                          <span className="text-xs text-muted-foreground">
                            {constant.value}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Clear button */}
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="default"
              className="w-full h-10"
              onClick={() => onElementsChange([])}
              disabled={elements.length === 0}
            >
              <X className="h-4 w-4 mr-2" />
              Clear Formula
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}