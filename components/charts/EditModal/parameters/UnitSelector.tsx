"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown, Plus, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChartComponent } from "@/types"
import { parseParameterKey } from "@/utils/parameterUtils"
import { useFormulaMasterStore } from "@/stores/useFormulaMasterStore"
import { useUnitConverterFormulaStore } from "@/stores/useUnitConverterFormulaStore"
import { UnitConverterFormulaDialog } from "@/components/unit-converter-formula/UnitConverterFormulaDialog"

interface UnitSelectorProps {
  index: number
  param: ChartComponent["yAxisParams"][0]
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function UnitSelector({
  index,
  param,
  editingChart,
  setEditingChart,
}: UnitSelectorProps) {
  const { formulas } = useFormulaMasterStore()
  const { formulas: unitConverterFormulas, openDialog: openUnitConverterDialog } = useUnitConverterFormulaStore()
  
  const [openUnitCombobox, setOpenUnitCombobox] = useState(false)
  const [lastFormulaCount, setLastFormulaCount] = useState(unitConverterFormulas.length)

  // Extract default unit information based on parameter type
  const defaultUnit = useMemo(() => {
    if (!param.parameter) return ""
    
    if (param.parameterType === "Parameter") {
      const parsed = parseParameterKey(param.parameter)
      return parsed?.unit || ""
    } else if (param.parameterType === "Formula") {
      if (param.formulaId) {
        const formula = formulas.find(f => f.id === param.formulaId)
        return formula?.unit || ""
      }
      return ""
    } else if (param.parameterType === "Interlock") {
      return param.interlockDefinition?.yUnit || ""
    }
    
    return ""
  }, [param, formulas])
  
  // Get the current unit (either selected or default)
  const currentUnit = param.unit || defaultUnit
  
  // Get available unit conversions for the current unit
  const availableUnitConversions = useMemo(() => {
    if (!defaultUnit) return []
    
    const conversions = unitConverterFormulas.filter(formula => {
      const fromUnitMatches = formula.fromUnit.primarySymbol === defaultUnit || 
                             formula.fromUnit.aliases.includes(defaultUnit)
      const toUnitMatches = formula.toUnit.primarySymbol === defaultUnit || 
                           formula.toUnit.aliases.includes(defaultUnit)
      return fromUnitMatches || toUnitMatches
    })
    
    const unitSet = new Set<string>()
    unitSet.add(defaultUnit)
    
    conversions.forEach(formula => {
      if (formula.fromUnit.primarySymbol === defaultUnit || formula.fromUnit.aliases.includes(defaultUnit)) {
        unitSet.add(formula.toUnit.primarySymbol)
      } else {
        unitSet.add(formula.fromUnit.primarySymbol)
      }
    })
    
    return Array.from(unitSet)
  }, [defaultUnit, unitConverterFormulas])

  const handleUnitChange = useCallback((newUnit: string) => {
    const newParams = [...(editingChart.yAxisParams || [])]
    newParams[index] = {
      ...newParams[index],
      unit: newUnit,
      unitConversionId: newUnit !== defaultUnit 
        ? unitConverterFormulas.find(f => 
            ((f.fromUnit.primarySymbol === defaultUnit || f.fromUnit.aliases.includes(defaultUnit)) && 
             f.toUnit.primarySymbol === newUnit) ||
            ((f.toUnit.primarySymbol === defaultUnit || f.toUnit.aliases.includes(defaultUnit)) && 
             f.fromUnit.primarySymbol === newUnit)
          )?.id
        : undefined
    }
    setEditingChart({ ...editingChart, yAxisParams: newParams })
    setOpenUnitCombobox(false)
  }, [editingChart, setEditingChart, index, defaultUnit, unitConverterFormulas])

  // Handle when a new unit converter formula is created
  useEffect(() => {
    if (unitConverterFormulas.length > lastFormulaCount) {
      const newFormula = unitConverterFormulas[unitConverterFormulas.length - 1]
      setLastFormulaCount(unitConverterFormulas.length)
      
      if (defaultUnit && 
          ((newFormula.fromUnit.primarySymbol === defaultUnit || newFormula.fromUnit.aliases.includes(defaultUnit)) || 
           (newFormula.toUnit.primarySymbol === defaultUnit || newFormula.toUnit.aliases.includes(defaultUnit)))) {
        const targetUnit = (newFormula.fromUnit.primarySymbol === defaultUnit || newFormula.fromUnit.aliases.includes(defaultUnit))
          ? newFormula.toUnit.primarySymbol
          : newFormula.fromUnit.primarySymbol
        
        handleUnitChange(targetUnit)
        setOpenUnitCombobox(false)
      }
    }
  }, [unitConverterFormulas, lastFormulaCount, defaultUnit, handleUnitChange])

  const handleCreateNewConversion = useCallback(() => {
    setOpenUnitCombobox(false)
    openUnitConverterDialog('create')
  }, [openUnitConverterDialog])

  return (
    <div className="w-20">
      <Popover open={openUnitCombobox} onOpenChange={setOpenUnitCombobox}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openUnitCombobox}
            className="w-full h-7 px-1 py-1 text-xs justify-between group"
            disabled={!param.parameter}
            title={currentUnit !== defaultUnit && defaultUnit ? `Converted from ${defaultUnit}` : undefined}
          >
            <span className="flex items-center gap-1 truncate">
              {currentUnit !== defaultUnit && defaultUnit && (
                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
              <span className="truncate">{currentUnit || "Select unit"}</span>
            </span>
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search unit..." className="h-8 text-xs" />
            <CommandEmpty>No unit found.</CommandEmpty>
            <CommandGroup>
              {availableUnitConversions.map((unit) => (
                <CommandItem
                  key={unit}
                  value={unit}
                  onSelect={() => handleUnitChange(unit)}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      currentUnit === unit ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {unit}
                  {unit === defaultUnit && (
                    <span className="ml-2 text-muted-foreground">(default)</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {defaultUnit && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="create-new-conversion"
                    onSelect={handleCreateNewConversion}
                    className="text-xs"
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Create new conversion...
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      
      <UnitConverterFormulaDialog />
    </div>
  )
}