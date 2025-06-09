"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, ChevronDown } from "lucide-react"
import { mockParameterMaster } from "@/data/parameterMaster"
import { FormulaElement } from "../FormulaBuilder"

interface ParameterSelectorProps {
  onAddElement: (element: FormulaElement) => void
}

export function ParameterSelector({ onAddElement }: ParameterSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filteredParameters = mockParameterMaster.filter(param => {
    const searchLower = search.toLowerCase()
    return param.name.toLowerCase().includes(searchLower) ||
           param.description.toLowerCase().includes(searchLower) ||
           param.category.toLowerCase().includes(searchLower)
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
    <Popover open={open} onOpenChange={setOpen}>
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
            value={search}
            onValueChange={setSearch}
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
                      onAddElement({
                        id: "",
                        type: "parameter",
                        value: param.name,
                        displayName: param.name
                      })
                      setOpen(false)
                      setSearch("")
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
  )
}