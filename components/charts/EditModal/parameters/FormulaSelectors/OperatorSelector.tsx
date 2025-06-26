"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, ChevronDown } from "lucide-react"
import { formulaOperators } from "@/data/parameterMaster"
import { FormulaElement } from "../FormulaBuilder"

interface OperatorSelectorProps {
  onAddElement: (element: FormulaElement) => void
}

export function OperatorSelector({ onAddElement }: OperatorSelectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="w-full justify-between h-10"
        >
          <span className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Operator
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-2" align="start">
        <div className="grid grid-cols-4 gap-1">
          {formulaOperators.basic.map((op) => (
            <Button
              key={op.symbol}
              variant="outline"
              size="sm"
              className="h-10 px-0 font-mono text-lg"
              onClick={() => {
                onAddElement({
                  id: "",
                  type: "operator",
                  value: op.symbol,
                  displayName: op.symbol
                })
                setOpen(false)
              }}
              title={op.name}
            >
              {op.symbol}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}