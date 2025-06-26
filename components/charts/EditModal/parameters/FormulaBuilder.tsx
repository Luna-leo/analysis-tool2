"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { FormulaElements } from "./FormulaElements"
import { ParameterSelector, OperatorSelector, FunctionSelector, ConstantSelector, NumberInput } from "./FormulaSelectors"
import { EventInfo } from "@/types"

export interface FormulaElement {
  id: string
  type: "parameter" | "operator" | "constant" | "number"
  value: string
  displayName?: string
}

interface FormulaBuilderProps {
  elements: FormulaElement[]
  onElementsChange: (elements: FormulaElement[]) => void
  selectedDataSourceItems?: EventInfo[]
}

export function FormulaBuilder({ elements, onElementsChange, selectedDataSourceItems }: FormulaBuilderProps) {
  const addElement = (element: FormulaElement) => {
    onElementsChange([...elements, { ...element, id: `elem_${Date.now()}` }])
  }

  const removeElement = (id: string) => {
    onElementsChange(elements.filter(elem => elem.id !== id))
  }

  const moveElement = (fromIndex: number, toIndex: number) => {
    const newElements = [...elements]
    const [movedElement] = newElements.splice(fromIndex, 1)
    newElements.splice(toIndex, 0, movedElement)
    onElementsChange(newElements)
  }

  return (
    <div className="space-y-4">
      <div>
        <FormulaElements
          elements={elements}
          onRemoveElement={removeElement}
          onMoveElement={moveElement}
        />

        {/* Control buttons */}
        <div className="space-y-4">
          {/* Quick Add Section */}
          <div className="grid grid-cols-5 gap-2">
            <ParameterSelector onAddElement={addElement} selectedDataSourceItems={selectedDataSourceItems} />
            <NumberInput onAddElement={addElement} />
            <OperatorSelector onAddElement={addElement} />
            <FunctionSelector onAddElement={addElement} />
            <ConstantSelector onAddElement={addElement} />
          </div>

          {/* Clear button */}
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="default"
              className="w-full h-10"
              onClick={() => onElementsChange([])}
              disabled={elements.length === 0}
            >
              <X className="h-4 w-4 mr-2" />
              Clear Formula
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}