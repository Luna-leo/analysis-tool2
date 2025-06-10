export interface FormulaVariable {
  name: string
  parameter: string
}

export interface FormulaDefinition {
  id: string
  name: string
  expression: string
  variables: FormulaVariable[]
  description?: string
  category?: string
  createdAt?: string
  updatedAt?: string
}