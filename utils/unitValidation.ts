import { ChartComponent, UnitValidationResult } from "@/types"
import { parseParameterKey } from "./parameterUtils"
import { useFormulaMasterStore } from "@/stores/useFormulaMasterStore"
import { useUnitConverterFormulaStore } from "@/stores/useUnitConverterFormulaStore"

export function validateAxisUnits(
  axisNo: number,
  paramIndexes: number[],
  chartParams: ChartComponent["yAxisParams"],
  formulas: any[],
  unitConverterFormulas: any[]
): UnitValidationResult {
  if (!chartParams || paramIndexes.length <= 1) {
    return {
      hasUnitMismatch: false,
      units: [],
      canBeConverted: false,
      parameterIndices: paramIndexes,
    }
  }

  // Collect units for all parameters on this axis
  const units = paramIndexes.map(index => {
    const param = chartParams[index]
    if (!param || !param.parameter) return ""

    // If a custom unit is set, use it
    if (param.unit) return param.unit

    // Otherwise, get the default unit based on parameter type
    if (param.parameterType === "Parameter") {
      const parsed = parseParameterKey(param.parameter)
      return parsed?.unit || ""
    } else if (param.parameterType === "Formula") {
      const formula = formulas.find((f: any) => f.id === param.formulaId)
      return formula?.unit || ""
    } else if (param.parameterType === "Interlock") {
      return param.interlockDefinition?.yUnit || ""
    }
    
    return ""
  }).filter(Boolean) // Remove empty strings

  // Check if all units are the same
  const uniqueUnits = [...new Set(units)]
  const hasUnitMismatch = uniqueUnits.length > 1

  if (!hasUnitMismatch) {
    return {
      hasUnitMismatch: false,
      units: uniqueUnits,
      canBeConverted: false,
      parameterIndices: paramIndexes,
    }
  }

  // Check if units can be converted to a common unit
  const canBeConverted = checkUnitsCanBeConverted(uniqueUnits, unitConverterFormulas)
  
  // Find the most common unit or suggest a base unit
  const suggestedUnit = findSuggestedUnit(uniqueUnits, unitConverterFormulas)

  return {
    hasUnitMismatch: true,
    units: uniqueUnits,
    canBeConverted,
    suggestedUnit,
    parameterIndices: paramIndexes,
  }
}

function checkUnitsCanBeConverted(
  units: string[],
  unitConverterFormulas: any[]
): boolean {
  if (units.length < 2) return false

  // For each pair of units, check if there's a conversion formula
  for (let i = 0; i < units.length - 1; i++) {
    for (let j = i + 1; j < units.length; j++) {
      const unit1 = units[i]
      const unit2 = units[j]
      
      // Check if there's a direct conversion between these units
      const hasConversion = unitConverterFormulas.some((formula: any) => {
        const fromUnitMatches = formula.fromUnit.primarySymbol === unit1 || 
                               formula.fromUnit.aliases.includes(unit1)
        const toUnitMatches = formula.toUnit.primarySymbol === unit2 || 
                             formula.toUnit.aliases.includes(unit2)
        
        const reverseFromMatches = formula.fromUnit.primarySymbol === unit2 || 
                                  formula.fromUnit.aliases.includes(unit2)
        const reverseToMatches = formula.toUnit.primarySymbol === unit1 || 
                                formula.toUnit.aliases.includes(unit1)
        
        return (fromUnitMatches && toUnitMatches) || (reverseFromMatches && reverseToMatches)
      })
      
      if (!hasConversion) return false
    }
  }
  
  return true
}

function findSuggestedUnit(
  units: string[],
  unitConverterFormulas: any[]
): string | undefined {
  // Count frequency of each unit
  const unitFrequency = units.reduce((acc, unit) => {
    acc[unit] = (acc[unit] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Return the most frequent unit
  let maxFreq = 0
  let suggestedUnit: string | undefined
  
  for (const [unit, freq] of Object.entries(unitFrequency)) {
    if (freq > maxFreq) {
      maxFreq = freq
      suggestedUnit = unit
    }
  }
  
  // If all units have the same frequency, try to find a common base unit
  if (maxFreq === 1 && units.length > 1) {
    // Check if any unit is a common base unit (e.g., SI units)
    const baseUnits = ["m", "kg", "s", "A", "K", "mol", "cd", "Pa", "N", "J", "W", "Hz"]
    suggestedUnit = units.find(unit => baseUnits.includes(unit)) || units[0]
  }
  
  return suggestedUnit
}