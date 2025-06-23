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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (process.env.NODE_ENV === 'development') {
      console.log('[LegendInput] Value changed:', { from: value, to: newValue })
    }
    onChange(newValue)
  }
  
  return (
    <Input
      type="text"
      value={value}
      onChange={handleChange}
      className="h-7 text-xs"
      placeholder={placeholder}
      disabled={disabled}
    />
  )
})

LegendInput.displayName = "LegendInput"