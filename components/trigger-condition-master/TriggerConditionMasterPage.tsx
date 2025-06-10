"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Search, Plus, Edit2, Copy, Trash2, Zap } from "lucide-react"
import { useTriggerConditionStore } from "@/stores/useTriggerConditionStore"
import { PredefinedCondition } from "@/data/predefinedConditions"
import { SearchCondition } from "@/types"
import { TriggerConditionDialog } from "./TriggerConditionDialog"
import { useToast } from "@/hooks/use-toast"
import { formatConditionExpressionToJSX } from "@/lib/conditionUtils"

export const TriggerConditionMasterPage = React.memo(function TriggerConditionMasterPage() {
  const { toast } = useToast()
  const {
    searchQuery,
    setSearchQuery,
    getFilteredConditions,
    updateCondition,
    deleteCondition,
    duplicateCondition,
    addCondition
  } = useTriggerConditionStore()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCondition, setSelectedCondition] = useState<PredefinedCondition | null>(null)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'duplicate'>('add')

  const filteredConditions = getFilteredConditions()

  const handleAddNew = () => {
    setSelectedCondition(null)
    setDialogMode('add')
    setIsDialogOpen(true)
  }

  const handleEdit = (condition: PredefinedCondition) => {
    setSelectedCondition(condition)
    setDialogMode('edit')
    setIsDialogOpen(true)
  }

  const handleDuplicate = (condition: PredefinedCondition) => {
    setSelectedCondition(condition)
    setDialogMode('duplicate')
    setIsDialogOpen(true)
  }

  const handleDelete = (condition: PredefinedCondition) => {
    if (confirm(`Are you sure you want to delete "${condition.name}"?`)) {
      deleteCondition(condition.id)
      toast({
        title: "Condition deleted",
        description: `"${condition.name}" has been deleted successfully.`,
      })
    }
  }

  const handleSaveCondition = (condition: PredefinedCondition) => {
    if (dialogMode === 'edit' && selectedCondition) {
      updateCondition(selectedCondition.id, condition)
      toast({
        title: "Condition updated",
        description: `"${condition.name}" has been updated successfully.`,
      })
    } else {
      // For both 'add' and 'duplicate' modes, we add a new condition
      addCondition(condition)
      toast({
        title: dialogMode === 'duplicate' ? "Condition duplicated" : "Condition added",
        description: `"${condition.name}" has been ${dialogMode === 'duplicate' ? 'created' : 'added'} successfully.`,
      })
    }
    setIsDialogOpen(false)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Trigger Condition Master</h1>
            <span className="text-sm text-muted-foreground">({filteredConditions.length} conditions)</span>
          </div>
          <Button onClick={handleAddNew} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Condition
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conditions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Condition Cards Grid */}
      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredConditions.map((condition, index) => (
            <Card key={`${condition.id}_${index}`} className="hover:shadow-md transition-shadow relative group">
              <div className="p-4 space-y-3">
                {/* Header with Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{condition.name}</h3>
                    {condition.description && (
                      <p className="text-xs text-muted-foreground">
                        {condition.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEdit(condition)}
                      title="Edit condition"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDuplicate(condition)}
                      title="Duplicate condition"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(condition)}
                      title="Delete condition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Condition Expression */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-muted rounded overflow-hidden px-3 py-2">
                        <div className="truncate font-mono text-sm">
                          {formatConditionExpressionToJSX(condition.conditions)}
                        </div>
                      </div>
                    </TooltipTrigger>
                    {condition.expression.length > 50 && (
                      <TooltipContent side="bottom" className="max-w-[600px] p-3 bg-muted">
                        <div className="font-mono text-sm">
                          {formatConditionExpressionToJSX(condition.conditions)}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                
                {/* Condition Details */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Type: {condition.conditions[0]?.type || 'condition'}</span>
                  <span>Complexity: {getComplexityLevel(condition.conditions)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredConditions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No conditions found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Get started by creating your first trigger condition"}
            </p>
            {!searchQuery && (
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-1" />
                Add Condition
              </Button>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Trigger Condition Dialog */}
      <TriggerConditionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveCondition}
        initialCondition={selectedCondition || undefined}
        mode={dialogMode === 'add' ? 'create' : dialogMode}
      />
    </div>
  )
})

// Helper function to determine complexity level
function getComplexityLevel(conditions: SearchCondition[]): string {
  const countConditions = (conds: SearchCondition[]): number => {
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
  if (count === 1) return 'Simple'
  if (count <= 3) return 'Moderate'
  return 'Complex'
}