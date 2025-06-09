"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { FormulaElement } from "./FormulaBuilder"

interface FormulaPreviewProps {
  elements: FormulaElement[]
  formulaName: string
  unit?: string
}

export function FormulaValidation({ elements, formulaName, unit }: FormulaPreviewProps) {
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({})
  const [calculationResult, setCalculationResult] = useState<{ steps: string[], result: string | null } | null>(null)
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

  // Initialize sample values when parameters change
  useEffect(() => {
    const newSampleValues: Record<string, string> = {}
    usedParameters.forEach((param, index) => {
      // Keep existing value if already set, otherwise generate new one
      newSampleValues[param] = sampleValues[param] || ((index + 1) * 10).toString()
    })
    setSampleValues(newSampleValues)
  }, [usedParameters.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  // Generate random sample values
  const generateRandomValues = () => {
    const newSampleValues: Record<string, string> = {}
    usedParameters.forEach((param, index) => {
      newSampleValues[param] = ((index + 1) * 10 + Math.floor(Math.random() * 50)).toString()
    })
    setSampleValues(newSampleValues)
    calculateWithValues(newSampleValues)
  }

  // Calculate with current sample values
  const calculateWithValues = (values: Record<string, string> = sampleValues) => {
    if (elements.length === 0 || !validation.valid) {
      setCalculationResult(null)
      return
    }
    
    // Build sample expression with values
    let sampleExpression = expression
    let calculationSteps: string[] = []
    
    // Replace parameters with sample values
    usedParameters.forEach(param => {
      const value = values[param]
      if (value && !isNaN(parseFloat(value))) {
        sampleExpression = sampleExpression.replace(new RegExp(`\\b${param}\\b`, 'g'), value)
      }
    })
    
    calculationSteps.push(`Formula: ${expression}`)
    calculationSteps.push(`Sample values: ${usedParameters.map(p => `${p} = ${values[p]}`).join(', ')}`)
    calculationSteps.push(`Expression: ${sampleExpression}`)
    
    // Simple evaluation
    try {
      // Replace constants
      let evalExpression = sampleExpression
        .replace(/PI/g, Math.PI.toString())
        .replace(/E/g, Math.E.toString())
        .replace(/G/g, '9.80665')
      
      // Handle basic functions
      evalExpression = evalExpression
        .replace(/SQRT\s*\((.*?)\)/g, 'Math.sqrt($1)')
        .replace(/ABS\s*\((.*?)\)/g, 'Math.abs($1)')
        .replace(/SIN\s*\((.*?)\)/g, 'Math.sin($1)')
        .replace(/COS\s*\((.*?)\)/g, 'Math.cos($1)')
        .replace(/TAN\s*\((.*?)\)/g, 'Math.tan($1)')
        .replace(/LOG\s*\((.*?)\)/g, 'Math.log10($1)')
        .replace(/LN\s*\((.*?)\)/g, 'Math.log($1)')
        .replace(/EXP\s*\((.*?)\)/g, 'Math.exp($1)')
        .replace(/ROUND\s*\((.*?)\)/g, 'Math.round($1)')
        .replace(/\^/g, '**')
      
      // Evaluate the expression (Note: In production, use a safe expression evaluator)
      const result = Function('"use strict"; return (' + evalExpression + ')')();
      const formattedResult = typeof result === 'number' ? result.toFixed(2) : result
      
      calculationSteps.push(`Result: ${formattedResult}${unit ? ` ${unit}` : ''}`)
      setCalculationResult({ steps: calculationSteps, result: formattedResult })
    } catch (error) {
      calculationSteps.push(`Error: Unable to calculate`)
      setCalculationResult({ steps: calculationSteps, result: null })
    }
  }

  // Update sample value
  const updateSampleValue = (param: string, value: string) => {
    const newValues = { ...sampleValues, [param]: value }
    setSampleValues(newValues)
  }

  // Calculate on first load if valid
  useEffect(() => {
    if (validation.valid && usedParameters.length > 0) {
      calculateWithValues()
    }
  }, [validation.valid]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {/* Validation Card */}
      <Card className="overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b">
          <h4 className="font-medium text-sm">Formula Validation</h4>
        </div>
        <div className="p-4">
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            validation.valid 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {validation.valid ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{validation.message}</span>
          </div>
        </div>
      </Card>

      {/* Sample Values Input */}
      {validation.valid && usedParameters.length > 0 && (
        <Card className="overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 border-b flex items-center justify-between">
            <h4 className="font-medium text-sm">Sample Values</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateRandomValues}
              className="h-8 px-2"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Random Values
            </Button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {usedParameters.map((param) => (
                <div key={param} className="flex items-center gap-2">
                  <Label htmlFor={`sample-${param}`} className="text-sm min-w-[100px]">
                    {param}:
                  </Label>
                  <Input
                    id={`sample-${param}`}
                    type="number"
                    value={sampleValues[param] || ''}
                    onChange={(e) => updateSampleValue(param, e.target.value)}
                    onBlur={() => calculateWithValues()}
                    className="h-8"
                    placeholder="Enter value"
                  />
                </div>
              ))}
            </div>
            <Button
              onClick={() => calculateWithValues()}
              className="mt-3 w-full"
              variant="secondary"
              size="sm"
            >
              Calculate
            </Button>
          </div>
        </Card>
      )}

      {/* Calculation Result */}
      {validation.valid && calculationResult && (
        <Card className="overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 border-b">
            <h4 className="font-medium text-sm">Calculation Result</h4>
          </div>
          <div className="p-4">
            <div className="space-y-2 font-mono text-sm">
              {calculationResult.steps.map((step, index) => (
                <div 
                  key={index} 
                  className={
                    index === calculationResult.steps.length - 1 
                      ? "font-semibold text-base" 
                      : "text-muted-foreground"
                  }
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Parameters Summary */}
      {usedParameters.length > 0 && (
        <Card>
          <div className="px-4 py-3">
            <h4 className="font-medium text-sm mb-2">Used Parameters ({usedParameters.length})</h4>
            <div className="flex flex-wrap gap-2">
              {usedParameters.map((param) => (
                <Badge key={param} variant="secondary">
                  {param}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      )}

    </div>
  )
}

// Add missing Badge import to the imports at the top
import { Badge } from "@/components/ui/badge"