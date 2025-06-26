import React from 'react'
import { SearchCondition } from '@/types'

// Boolean operators that don't require a value
export const booleanOperators = ['isOn', 'isOff', 'switchedOn', 'switchedOff']

// Check if an operator is a boolean type
export const isBooleanOperator = (operator?: string): boolean => {
  return booleanOperators.includes(operator || '')
}

export const operatorLabels = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  eq: '=',
  ne: '!=',
  crossAbove: 'crosses above',
  crossBelow: 'crosses below',
  isOn: 'is ON',
  isOff: 'is OFF',
  switchedOn: 'switched ON',
  switchedOff: 'switched OFF'
}

// Function to convert conditions to readable expression string
export const formatConditionExpression = (conditions: SearchCondition[]): string => {
  if (conditions.length === 0) return 'No conditions set'
  
  const formatCondition = (condition: SearchCondition): string => {
    if (condition.type === 'condition') {
      const param = condition.parameter || '[parameter]'
      const op = operatorLabels[condition.operator || 'gt']
      if (isBooleanOperator(condition.operator)) {
        return `${param} ${op}`
      } else {
        const value = condition.value || '[value]'
        return `${param} ${op} ${value}`
      }
    } else if (condition.type === 'group' && condition.conditions) {
      const inner = condition.conditions
        .map((cond, index) => {
          const condStr = formatCondition(cond)
          if (index === 0) return condStr
          const logicalOp = cond.logicalOperator || 'AND'
          return `${logicalOp} ${condStr}`
        })
        .join(' ')
      return `(${inner})`
    }
    return ''
  }
  
  return conditions
    .map((condition, index) => {
      const condStr = formatCondition(condition)
      if (index === 0) return condStr
      const logicalOp = condition.logicalOperator || 'AND'
      return `${logicalOp} ${condStr}`
    })
    .join(' ')
}

// Function to convert conditions to colored JSX expression
export const formatConditionExpressionToJSX = (conditions: SearchCondition[]): React.ReactNode => {
  if (conditions.length === 0) return <span className="text-muted-foreground">No conditions set</span>
  
  const formatCondition = (condition: SearchCondition, key: string): React.ReactNode[] => {
    if (condition.type === 'condition') {
      const param = condition.parameter || '[parameter]'
      const op = operatorLabels[condition.operator || 'gt']
      if (isBooleanOperator(condition.operator)) {
        return [
          <span key={`${key}-param`} className="text-slate-700 font-medium">{param}</span>,
          <span key={`${key}-space1`}> </span>,
          <span key={`${key}-op`} className="text-teal-600 font-semibold">{op}</span>
        ]
      } else {
        const value = condition.value || '[value]'
        return [
          <span key={`${key}-param`} className="text-slate-700 font-medium">{param}</span>,
          <span key={`${key}-space1`}> </span>,
          <span key={`${key}-op`} className="text-teal-600 font-semibold">{op}</span>,
          <span key={`${key}-space2`}> </span>,
          <span key={`${key}-value`} className="text-indigo-600 font-medium">{value}</span>
        ]
      }
    } else if (condition.type === 'group' && condition.conditions) {
      const inner: React.ReactNode[] = []
      condition.conditions.forEach((cond, index) => {
        if (index > 0) {
          const logicalOp = cond.logicalOperator || 'AND'
          inner.push(
            <span key={`${key}-space-before-${index}`}> </span>,
            <span key={`${key}-logical-${index}`} className="text-rose-600 font-semibold">{logicalOp}</span>,
            <span key={`${key}-space-after-${index}`}> </span>
          )
        }
        inner.push(...formatCondition(cond, `${key}-${index}`))
      })
      
      return [
        <span key={`${key}-open`} className="text-amber-600 font-semibold">(</span>,
        ...inner,
        <span key={`${key}-close`} className="text-amber-600 font-semibold">)</span>
      ]
    }
    return []
  }
  
  const result: React.ReactNode[] = []
  conditions.forEach((condition, index) => {
    if (index > 0) {
      const logicalOp = condition.logicalOperator || 'AND'
      result.push(
        <span key={`space-before-${index}`}> </span>,
        <span key={`logical-${index}`} className="text-rose-600 font-semibold">{logicalOp}</span>,
        <span key={`space-after-${index}`}> </span>
      )
    }
    result.push(...formatCondition(condition, `cond-${index}`))
  })
  
  return <>{result}</>
}

// Function to color code expression strings (for saved conditions)
export const colorCodeExpressionString = (expression: string): React.ReactNode => {
  // First, ensure proper spacing around operators
  const spacedExpression = expression
    .replace(/\s*(\bAND\b|\bOR\b)\s*/g, ' $1 ')
    .replace(/\s*(>=|<=|>|<|!=|=|crosses above|crosses below|is ON|is OFF|switched ON|switched OFF)\s*/g, ' $1 ')
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)\s*/g, ') ')
    .trim()
  
  return spacedExpression
    .split(/(\bAND\b|\bOR\b|\(|\)|>=|<=|>|<|!=|=|crosses above|crosses below|is ON|is OFF|switched ON|switched OFF)/)
    .map((part, index) => {
      const trimmed = part.trim()
      if (trimmed === 'AND' || trimmed === 'OR') {
        return <span key={index} className="text-rose-600 font-semibold">{part}</span>
      } else if (trimmed === '(' || trimmed === ')') {
        return <span key={index} className="text-amber-600 font-semibold">{part}</span>
      } else if (['>=', '<=', '>', '<', '!=', '=', 'crosses above', 'crosses below', 'is ON', 'is OFF', 'switched ON', 'switched OFF'].includes(trimmed)) {
        return <span key={index} className="text-teal-600 font-semibold">{part}</span>
      } else if (trimmed && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
        // Parameter names
        return <span key={index} className="text-slate-700 font-medium">{part}</span>
      } else if (trimmed && /^\d+(\.\d+)?$/.test(trimmed)) {
        // Numeric values
        return <span key={index} className="text-indigo-600 font-medium">{part}</span>
      }
      return <span key={index}>{part}</span>
    })
}

// Utility function to validate conditions
export const validateConditions = (conditions: SearchCondition[]): boolean => {
  return conditions.some(condition => {
    if (condition.type === 'condition') {
      // For boolean operators, only parameter is required
      if (isBooleanOperator(condition.operator)) {
        return !!condition.parameter
      }
      // For other operators, both parameter and value are required
      return condition.parameter && condition.value
    } else if (condition.type === 'group' && condition.conditions) {
      return validateConditions(condition.conditions)
    }
    return false
  })
}

// Utility function to generate unique IDs
export const generateConditionId = () => `cond_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`