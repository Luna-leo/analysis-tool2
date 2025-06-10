import { FormulaMaster } from '@/data/formulaMaster'
import { FormulaDefinition } from '@/types/formula'

/**
 * Convert FormulaDefinition to FormulaMaster
 */
export function formulaDefinitionToMaster(definition: FormulaDefinition): FormulaMaster {
  return {
    id: definition.id,
    name: definition.name,
    description: definition.description,
    expression: definition.expression,
    parameters: definition.variables.map(v => v.parameter),
    category: definition.category || 'Other',
    unit: undefined,
    createdAt: definition.createdAt || new Date().toISOString(),
    updatedAt: definition.updatedAt || new Date().toISOString()
  }
}

/**
 * Convert FormulaMaster to FormulaDefinition
 */
export function formulaMasterToDefinition(master: FormulaMaster): FormulaDefinition {
  return {
    id: master.id,
    name: master.name,
    description: master.description,
    expression: master.expression,
    variables: master.parameters.map((param, index) => ({
      name: `var${index + 1}`,
      parameter: param
    })),
    category: master.category,
    createdAt: master.createdAt,
    updatedAt: master.updatedAt
  }
}