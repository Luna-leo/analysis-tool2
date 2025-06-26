"use client"

import React from "react"
import { tokenizeFormula, convertToMathSymbols } from "@/utils/formulaDisplay"
import { cn } from "@/lib/utils"

interface FormulaDisplayProps {
  expression: string
  className?: string
  useMathSymbols?: boolean
}

export function FormulaDisplay({ expression, className, useMathSymbols = true }: FormulaDisplayProps) {
  const displayExpression = useMathSymbols ? convertToMathSymbols(expression) : expression
  const tokens = tokenizeFormula(displayExpression)
  
  return (
    <code className={cn("font-mono text-sm", className)}>
      {tokens.map((token, index) => (
        <span key={index} className={token.className}>
          {token.value}
        </span>
      ))}
    </code>
  )
}