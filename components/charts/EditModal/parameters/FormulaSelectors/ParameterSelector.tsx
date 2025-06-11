"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, ChevronDown } from "lucide-react"
import { FormulaElement } from "../FormulaBuilder"
import { createParameterKey } from "@/utils/parameterUtils"
import { cn } from "@/lib/utils"
import { useParameterSelection } from "@/hooks/useParameterSelection"
import { EventInfo } from "@/types"

interface ParameterSelectorProps {
  onAddElement: (element: FormulaElement) => void
  selectedDataSourceItems?: EventInfo[]
}

export function ParameterSelector({ onAddElement, selectedDataSourceItems }: ParameterSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  
  const { searchFilteredParameters } = useParameterSelection({
    selectedDataSourceItems,
    searchQuery: search
  })

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
          <CommandGroup>
            <div 
              className="max-h-[350px] overflow-y-auto overflow-x-hidden" 
              onWheel={(e) => e.stopPropagation()}
            >
              {searchFilteredParameters.map((param, idx) => {
                const paramKey = createParameterKey(param.name, param.unit)
                const isDataSourceRelated = param.isFromDataSource || param.matchesDataSource
                
                return (
                  <CommandItem
                    key={`${paramKey}-${idx}`}
                    value={paramKey}
                    onSelect={() => {
                      onAddElement({
                        id: "",
                        type: "parameter",
                        value: paramKey,
                        displayName: `${param.name} (${param.unit})`
                      })
                      setOpen(false)
                      setSearch("")
                    }}
                    className={cn(
                      "cursor-pointer px-2 py-3 flex flex-col items-start relative",
                      isDataSourceRelated && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className={cn(
                        "font-medium",
                        isDataSourceRelated && "text-primary"
                      )}>
                        {param.name}
                      </span>
                      {param.isFromDataSource && (
                        <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                          DS
                        </span>
                      )}
                      {param.matchesDataSource && !param.isFromDataSource && (
                        <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs",
                      isDataSourceRelated ? "text-primary/70" : "text-muted-foreground"
                    )}>
                      {param.unit}
                    </span>
                  </CommandItem>
                )
              })}
            </div>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}