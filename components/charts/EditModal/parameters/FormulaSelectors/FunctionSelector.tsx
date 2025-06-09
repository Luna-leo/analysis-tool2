"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, ChevronDown } from "lucide-react"
import { formulaOperators } from "@/data/parameterMaster"
import { FormulaElement } from "../FormulaBuilder"

interface FunctionSelectorProps {
  onAddElement: (element: FormulaElement) => void
}

export function FunctionSelector({ onAddElement }: FunctionSelectorProps) {
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
            Function
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-3" align="start">
        <div className="space-y-1">
          {formulaOperators.functions.map((func) => (
            <Button
              key={func.symbol}
              variant="ghost"
              className="w-full justify-start h-auto py-2 px-3"
              onClick={() => {
                onAddElement({
                  id: "",
                  type: "operator",
                  value: func.symbol,
                  displayName: func.symbol
                })
                setOpen(false)
              }}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-mono font-medium">{func.symbol}</span>
                <span className="text-xs text-muted-foreground">{func.name}</span>
              </div>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}