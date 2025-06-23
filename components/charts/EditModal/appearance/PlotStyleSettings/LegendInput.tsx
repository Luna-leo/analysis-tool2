"use client"

import React from "react"
import { Input } from "@/components/ui/input"

interface LegendInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export const LegendInput = React.memo(({ value, onChange, placeholder = "Enter legend text", disabled }: LegendInputProps) => {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 text-xs"
      placeholder={placeholder}
      disabled={disabled}
    />
  )
})

LegendInput.displayName = "LegendInput"