"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus } from "lucide-react"
import { FormulaElement } from "../FormulaBuilder"

interface NumberInputProps {
  onAddElement: (element: FormulaElement) => void
}

export function NumberInput({ onAddElement }: NumberInputProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  const handleInsert = () => {
    if (value && !isNaN(parseFloat(value))) {
      onAddElement({
        id: "",
        type: "number",
        value: value,
        displayName: value
      })
      setValue("")
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="w-full h-10"
        >
          <Plus className="h-4 w-4 mr-2" />
          Number
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div>
            <Label htmlFor="number-input" className="text-sm">Enter a number</Label>
            <Input
              id="number-input"
              type="number"
              placeholder="e.g., 3.14, 100, -5"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleInsert()
                }
              }}
              className="mt-1"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setValue("")
                setOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleInsert}
              disabled={!value || isNaN(parseFloat(value))}
            >
              Add
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}