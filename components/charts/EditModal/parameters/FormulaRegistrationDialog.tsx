"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FormulaMaster } from "@/data/formulaMaster"
import { FormulaBuilder, FormulaElement } from "./FormulaBuilder"
import { FormulaPreview } from "./FormulaPreview"

interface FormulaRegistrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (formula: FormulaMaster) => void
  initialFormula?: FormulaMaster
  mode?: "create" | "edit" | "duplicate"
}

const categories = [
  "Temperature",
  "Pressure",
  "Flow",
  "Power",
  "Vibration",
  "Production",
  "Efficiency",
  "Thermal",
  "Other"
]

export function FormulaRegistrationDialog({
  open,
  onOpenChange,
  onSave,
  initialFormula,
  mode = "create"
}: FormulaRegistrationDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [unit, setUnit] = useState("")
  const [elements, setElements] = useState<FormulaElement[]>([])

  useEffect(() => {
    if (open) {
      if (initialFormula) {
        setName(mode === "duplicate" ? `${initialFormula.name} (Copy)` : initialFormula.name)
        setDescription(initialFormula.description || "")
        setCategory(initialFormula.category)
        setUnit(initialFormula.unit || "")
        
        // Parse the expression back to elements
        // This is a simplified parser - in a real app, you'd want a proper expression parser
        const parseExpression = (expr: string): FormulaElement[] => {
          const tokens = expr.match(/[A-Z_]+[A-Z0-9_]*|\d+\.?\d*|[+\-*/^()]|PI|E|G/g) || []
          return tokens.map((token, index) => {
            let type: FormulaElement["type"] = "operator"
            let displayName = token
            
            // Check if it's a number
            if (/^\d+\.?\d*$/.test(token)) {
              type = "number"
            } 
            // Check if it's a constant
            else if (["PI", "E", "G"].includes(token)) {
              type = "constant"
            }
            // Check if it's a parameter (uppercase with underscores)
            else if (/^[A-Z_]+[A-Z0-9_]*$/.test(token) && !["SQRT", "ABS", "SIN", "COS", "TAN", "LOG", "LN", "EXP", "MIN", "MAX", "AVG", "ROUND"].includes(token)) {
              type = "parameter"
            }
            
            return {
              id: `elem_${Date.now()}_${index}`,
              type,
              value: token,
              displayName: displayName
            }
          })
        }
        
        setElements(parseExpression(initialFormula.expression))
      } else {
        // Reset for new formula
        setName("")
        setDescription("")
        setCategory("")
        setUnit("")
        setElements([])
      }
    }
  }, [open, initialFormula, mode])

  const handleSave = () => {
    const expression = elements.map(elem => elem.value).join(" ")
    const parameters = elements
      .filter(elem => elem.type === "parameter")
      .map(elem => elem.value)
      .filter((value, index, self) => self.indexOf(value) === index)

    const formula: FormulaMaster = {
      id: initialFormula?.id || `formula_${Date.now()}`,
      name,
      description,
      expression,
      parameters,
      category,
      unit,
      createdAt: initialFormula?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    onSave(formula)
    onOpenChange(false)
  }

  const isValid = name.trim() && category && elements.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Formula" : 
             mode === "duplicate" ? "Duplicate Formula" : 
             "Create New Formula"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Left Panel - Form */}
          <div className="w-1/2 overflow-y-auto space-y-4 pr-2">
            {/* Basic Information */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="formula-name">Formula Name</Label>
                <Input
                  id="formula-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Temperature Difference"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="formula-description">Description</Label>
                <Textarea
                  id="formula-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this formula calculates..."
                  className="mt-1 h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="formula-category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="formula-category" className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="formula-unit">Unit</Label>
                  <Input
                    id="formula-unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g., °C, %, kW"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Formula Builder */}
            <FormulaBuilder
              elements={elements}
              onElementsChange={setElements}
            />
          </div>

          {/* Right Panel - Preview */}
          <div className="w-1/2 overflow-y-auto pl-2">
            <FormulaPreview
              elements={elements}
              formulaName={name}
              unit={unit}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {mode === "edit" ? "Update" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}