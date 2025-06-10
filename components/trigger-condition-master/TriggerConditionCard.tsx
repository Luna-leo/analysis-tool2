"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit2, Copy, Trash2, Zap } from 'lucide-react'
import { PredefinedCondition } from '@/data/predefinedConditions'
import { formatConditionExpressionToJSX } from '@/lib/conditionUtils'

interface TriggerConditionCardProps {
  condition: PredefinedCondition
  onEdit: (condition: PredefinedCondition) => void
  onDuplicate: (condition: PredefinedCondition) => void
  onDelete: (condition: PredefinedCondition) => void
}

// Helper function to determine complexity level
function getComplexityLevel(conditions: any[]): string {
  const countConditions = (conds: any[]): number => {
    let count = 0
    for (const cond of conds) {
      if (cond.type === 'group' && cond.conditions) {
        count += countConditions(cond.conditions)
      } else {
        count += 1
      }
    }
    return count
  }

  const count = countConditions(conditions)
  if (count <= 2) return 'Simple'
  if (count <= 5) return 'Moderate'
  return 'Complex'
}

const complexityColors = {
  Simple: 'bg-green-100 text-green-800',
  Moderate: 'bg-yellow-100 text-yellow-800',
  Complex: 'bg-red-100 text-red-800'
}

export function TriggerConditionCard({ 
  condition, 
  onEdit, 
  onDuplicate, 
  onDelete 
}: TriggerConditionCardProps) {
  const complexity = getComplexityLevel(condition.conditions)

  return (
    <Card className="group hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              {condition.name}
            </CardTitle>
            {condition.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {condition.description}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate(condition)
              }}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(condition)
              }}
              className="h-8 w-8 p-0"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(condition)
              }}
              className="h-8 w-8 p-0 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Condition Expression</p>
            <div className="bg-muted/50 rounded-md p-3 text-sm">
              <div className="font-mono break-words">
                {formatConditionExpressionToJSX(condition.conditions)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Badge 
              variant="secondary" 
              className={`text-xs ${complexityColors[complexity as keyof typeof complexityColors]}`}
            >
              {complexity}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {condition.conditions.length} condition{condition.conditions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}