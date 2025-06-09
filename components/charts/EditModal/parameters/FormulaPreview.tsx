"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle } from "lucide-react"
import { FormulaElement } from "./FormulaBuilder"

interface FormulaPreviewProps {
  elements: FormulaElement[]
  formulaName: string
  unit?: string
}

export function FormulaPreview({ elements, formulaName, unit }: FormulaPreviewProps) {
  // Generate formula expression from elements
  const generateExpression = () => {
    if (elements.length === 0) return ""
    return elements.map(elem => elem.value).join(" ")
  }

  // Basic validation
  const validateFormula = () => {
    if (elements.length === 0) return { valid: false, message: "Formula is empty" }
    
    let openParens = 0
    let lastWasOperator = true // Start as true to handle first element
    
    for (let i = 0; i < elements.length; i++) {
      const elem = elements[i]
      
      if (elem.value === "(") {
        openParens++
        lastWasOperator = true
      } else if (elem.value === ")") {
        openParens--
        if (openParens < 0) {
          return { valid: false, message: "Mismatched parentheses" }
        }
        lastWasOperator = false
      } else if (elem.type === "operator" && !["+", "-", "*", "/", "^"].includes(elem.value)) {
        // Function operators
        lastWasOperator = true
      } else if (elem.type === "operator") {
        // Binary operators
        if (lastWasOperator && elem.value !== "-") {
          return { valid: false, message: `Unexpected operator: ${elem.value}` }
        }
        lastWasOperator = true
      } else {
        // Parameters, constants, numbers
        if (!lastWasOperator && i > 0) {
          return { valid: false, message: "Missing operator between values" }
        }
        lastWasOperator = false
      }
    }
    
    if (openParens !== 0) {
      return { valid: false, message: "Unclosed parentheses" }
    }
    
    if (lastWasOperator) {
      return { valid: false, message: "Formula ends with an operator" }
    }
    
    return { valid: true, message: "Formula is valid" }
  }

  const expression = generateExpression()
  const validation = validateFormula()

  // Extract used parameters
  const usedParameters = elements
    .filter(elem => elem.type === "parameter")
    .map(elem => elem.value)
    .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-2">Formula Preview</Label>
        <Card className="p-4">
          <div className="space-y-3">
            {/* Formula Display */}
            <div>
              <Label className="text-xs text-muted-foreground">Expression</Label>
              <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm">
                {expression || <span className="text-muted-foreground">No formula defined</span>}
              </div>
            </div>

            {/* Formula Name and Unit */}
            {formulaName && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="text-sm font-medium">{formulaName}</p>
                </div>
                {unit && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Unit</Label>
                    <p className="text-sm font-medium">{unit}</p>
                  </div>
                )}
              </div>
            )}

            {/* Used Parameters */}
            {usedParameters.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Parameters Used</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {usedParameters.map((param) => (
                    <Badge key={param} variant="outline" className="text-xs">
                      {param}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Status */}
            <div className={`flex items-center gap-2 pt-2 border-t ${validation.valid ? 'text-green-600' : 'text-red-600'}`}>
              {validation.valid ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm">{validation.message}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Example Calculation (optional) */}
      {validation.valid && usedParameters.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-2">Example Calculation</Label>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-2">With sample values:</p>
            <div className="space-y-1 text-xs">
              {usedParameters.map((param) => (
                <div key={param} className="flex justify-between">
                  <span>{param}:</span>
                  <span className="font-mono">100</span>
                </div>
              ))}
              <div className="border-t pt-1 mt-1 flex justify-between font-medium">
                <span>Result:</span>
                <span className="font-mono">
                  {/* This is a placeholder - actual calculation would require an expression evaluator */}
                  [Calculated Value] {unit}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Add missing Badge import to the imports at the top
import { Badge } from "@/components/ui/badge"