"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Search, Plus, Edit2, Copy, Trash2, FunctionSquare } from "lucide-react"
import { useFormulaMasterStore } from "@/stores/useFormulaMasterStore"
import { FormulaRegistrationDialog } from "@/components/charts/EditModal/parameters/FormulaRegistrationDialog"
import { FormulaMaster } from "@/data/formulaMaster"
import { useToast } from "@/hooks/use-toast"
import { FormulaDisplay } from "./FormulaDisplay"

export function FormulaMasterPage() {
  const { toast } = useToast()
  const {
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    getFilteredFormulas,
    getCategories,
    updateFormula,
    deleteFormula,
    duplicateFormula,
    addFormula
  } = useFormulaMasterStore()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFormula, setSelectedFormula] = useState<FormulaMaster | null>(null)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'duplicate'>('add')

  const filteredFormulas = getFilteredFormulas()
  const categories = getCategories()

  const handleAddNew = () => {
    setSelectedFormula(null)
    setDialogMode('add')
    setIsDialogOpen(true)
  }

  const handleEdit = (formula: FormulaMaster) => {
    setSelectedFormula(formula)
    setDialogMode('edit')
    setIsDialogOpen(true)
  }

  const handleDuplicate = (formula: FormulaMaster) => {
    setSelectedFormula(formula)
    setDialogMode('duplicate')
    setIsDialogOpen(true)
  }

  const handleDelete = (formula: FormulaMaster) => {
    if (confirm(`Are you sure you want to delete "${formula.name}"?`)) {
      deleteFormula(formula.id)
      toast({
        title: "Formula deleted",
        description: `"${formula.name}" has been deleted successfully.`,
      })
    }
  }

  const handleSaveFormula = (formula: FormulaMaster) => {
    if (dialogMode === 'edit' && selectedFormula) {
      updateFormula(selectedFormula.id, formula)
      toast({
        title: "Formula updated",
        description: `"${formula.name}" has been updated successfully.`,
      })
    } else if (dialogMode === 'duplicate' && selectedFormula) {
      duplicateFormula(selectedFormula.id, formula.name)
      toast({
        title: "Formula duplicated",
        description: `"${formula.name}" has been created successfully.`,
      })
    } else {
      addFormula(formula)
      toast({
        title: "Formula added",
        description: `"${formula.name}" has been added successfully.`,
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
            <FunctionSquare className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Formula Master</h1>
            <span className="text-sm text-muted-foreground">({filteredFormulas.length} formulas)</span>
          </div>
          <Button onClick={handleAddNew} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Formula
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search formulas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Formula Cards Grid */}
      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredFormulas.map((formula) => (
            <Card key={formula.id} className="hover:shadow-md transition-shadow relative group">
              <div className="p-4 space-y-3">
                {/* Header with Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm">{formula.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {formula.category}
                      </Badge>
                      {formula.unit && (
                        <span className="text-xs text-muted-foreground">
                          [{formula.unit}]
                        </span>
                      )}
                    </div>
                    {formula.description && (
                      <p className="text-xs text-muted-foreground">
                        {formula.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEdit(formula)}
                      title="Edit formula"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDuplicate(formula)}
                      title="Duplicate formula"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(formula)}
                      title="Delete formula"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Formula Expression */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-muted rounded overflow-hidden px-3 py-2">
                        <div className="truncate">
                          <FormulaDisplay expression={formula.expression} />
                        </div>
                      </div>
                    </TooltipTrigger>
                    {formula.expression.length > 50 && (
                      <TooltipContent side="bottom" className="max-w-[600px] p-3 bg-muted">
                        <FormulaDisplay expression={formula.expression} className="text-base" />
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                
                {/* Parameters */}
                {formula.parameters.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground flex-shrink-0">Parameters:</span>
                    <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                      {formula.parameters.slice(0, 3).map((param) => (
                        <Badge key={param} variant="outline" className="text-xs flex-shrink-0">
                          {param}
                        </Badge>
                      ))}
                      {formula.parameters.length > 3 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-xs flex-shrink-0 cursor-help">
                                +{formula.parameters.length - 3} more
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <div className="space-y-1">
                                <p className="text-xs font-medium">All parameters:</p>
                                <div className="flex flex-wrap gap-1 max-w-[300px]">
                                  {formula.parameters.map((param) => (
                                    <Badge key={param} variant="outline" className="text-xs">
                                      {param}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredFormulas.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <FunctionSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No formulas found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== 'all'
                ? "Try adjusting your search or filter criteria"
                : "Get started by creating your first formula"}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-1" />
                Add Formula
              </Button>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Formula Registration Dialog */}
      {isDialogOpen && (
        <FormulaRegistrationDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSave={handleSaveFormula}
          formula={selectedFormula || undefined}
          mode={dialogMode}
        />
      )}
    </div>
  )
}