"use client"

import React, { useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit2, Copy, Trash2 } from 'lucide-react'
import { FormulaMaster } from '@/data/formulaMaster'
import { FormulaDisplay } from './FormulaDisplay'
import { formatDateToLocalDateString } from '@/utils/dateUtils'

interface FormulaCardProps {
  formula: FormulaMaster
  onEdit: (formula: FormulaMaster) => void
  onDuplicate: (formula: FormulaMaster) => void
  onDelete: (formula: FormulaMaster) => void
}

export const FormulaCard = React.memo(({ formula, onEdit, onDuplicate, onDelete }: FormulaCardProps) => {
  const handleDuplicate = useCallback(() => onDuplicate(formula), [onDuplicate, formula])
  const handleEdit = useCallback(() => onEdit(formula), [onEdit, formula])
  const handleDelete = useCallback(() => onDelete(formula), [onDelete, formula])
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {formula.name}
              {formula.unit && (
                <Badge variant="secondary" className="text-xs">
                  {formula.unit}
                </Badge>
              )}
            </CardTitle>
            {formula.description && (
              <CardDescription className="mt-1">
                {formula.description}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDuplicate}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
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
            <p className="text-sm text-muted-foreground mb-1">Expression</p>
            <div className="bg-muted/50 rounded-md p-2">
              <FormulaDisplay expression={formula.expression} />
            </div>
          </div>
          
          {formula.parameters && formula.parameters.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Parameters</p>
              <div className="flex flex-wrap gap-1">
                {formula.parameters.map((param, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {param}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Badge variant="outline">{formula.category}</Badge>
            <span>
              Updated: {formatDateToLocalDateString(formula.updatedAt)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})