"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronDown, Copy, Edit2, Plus } from "lucide-react"
import { FormulaMaster } from "@/data/formulaMaster"
import { useFormulaMasterStore } from "@/stores/useFormulaMasterStore"
import { FormulaDisplay } from "@/components/formula-master/FormulaDisplay"
import { FormulaDefinition } from "@/types/formula"

interface FormulaParameterRowProps {
  index: number
  parameter: string
  formulaDefinition?: FormulaDefinition
  openComboboxIndex: number | null
  setOpenComboboxIndex: (index: number | null) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleFormulaSelect: (index: number, value: string, mode?: "select" | "edit" | "duplicate") => void
  filterFormulas: (formulas: FormulaMaster[]) => FormulaMaster[]
}

export function FormulaParameterRow({
  index,
  parameter,
  formulaDefinition,
  openComboboxIndex,
  setOpenComboboxIndex,
  searchQuery,
  setSearchQuery,
  handleFormulaSelect,
  filterFormulas,
}: FormulaParameterRowProps) {
  const { formulas } = useFormulaMasterStore()
  
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
                      {parameter || "Select Formula"}
                    </span>
                    {formulaDefinition?.expression && (
                      <div className="text-xs mt-0.5 truncate">
                        <FormulaDisplay expression={formulaDefinition.expression} className="text-xs" />
                      </div>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search formulas..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandEmpty>No formula found.</CommandEmpty>
                  <div className="max-h-[300px] overflow-y-auto">
                    <CommandGroup>
                      {filterFormulas(formulas).map((formula) => (
                        <CommandItem
                          key={formula.id}
                          value={formula.id}
                          onSelect={() => handleFormulaSelect(index, formula.id)}
                          className="flex items-center justify-between group"
                        >
                          <div className="flex flex-col items-start flex-1 min-w-0">
                            <span className="font-medium text-left">{formula.name}</span>
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-muted-foreground">{formula.category} •</span>
                              <div className="truncate flex-1">
                                <FormulaDisplay expression={formula.expression} className="text-xs" />
                              </div>
                            </div>
                            {formula.description && (
                              <span className="text-xs text-muted-foreground text-left italic">
                                {formula.description}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleFormulaSelect(index, formula.id, "edit")
                              }}
                              title="Edit formula"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleFormulaSelect(index, formula.id, "duplicate")
                              }}
                              title="Duplicate formula"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </CommandItem>
                      ))}
                      <CommandItem
                        value="add-new"
                        onSelect={() => handleFormulaSelect(index, "add-new")}
                        className="border-t mt-1 pt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Formula
                      </CommandItem>
                    </CommandGroup>
                  </div>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Select a formula from the library</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}