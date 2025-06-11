"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Props for the InputCombobox component
 */
interface InputComboboxProps {
  /** Current value of the input */
  value: string
  /** Callback when value changes */
  onChange: (value: string) => void
  /** List of suggestions to display */
  suggestions: string[]
  /** Placeholder text */
  placeholder?: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Additional CSS classes for the container */
  className?: string
  /** Additional CSS classes for the input element */
  inputClassName?: string
  /** Whether to allow custom values not in suggestions */
  allowCustomValue?: boolean
}

/**
 * Input component with dropdown suggestions
 * Combines free text input with selectable suggestions
 */
export function InputCombobox({
  value,
  onChange,
  suggestions,
  placeholder = "Select or type...",
  disabled = false,
  className,
  inputClassName,
  allowCustomValue = true
}: InputComboboxProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [isClosing, setIsClosing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync internal state with external value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Filter suggestions based on current input
  const filteredSuggestions = useMemo(() => 
    suggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase())
    ),
    [suggestions, inputValue]
  )

  /**
   * Handle selection from dropdown
   */
  const handleSelect = useCallback((selectedValue: string) => {
    onChange(selectedValue)
    setInputValue(selectedValue)
    
    // Temporarily prevent reopening
    setIsClosing(true)
    setOpen(false)
    
    // Restore focus after selection
    setTimeout(() => {
      setIsClosing(false)
      inputRef.current?.focus()
    }, 100)
  }, [onChange])

  /**
   * Handle input value changes
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    
    // Open dropdown when typing if suggestions exist
    if (!open && suggestions.length > 0 && !isClosing) {
      setOpen(true)
    }
  }, [onChange, open, suggestions.length, isClosing])

  /**
   * Handle input click
   */
  const handleInputClick = useCallback(() => {
    if (!open && suggestions.length > 0 && filteredSuggestions.length > 0 && !isClosing) {
      setOpen(true)
    }
  }, [open, suggestions.length, filteredSuggestions.length, isClosing])

  /**
   * Handle popover open state changes
   */
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!isClosing) {
      setOpen(newOpen)
    }
  }, [isClosing])

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onClick={handleInputClick}
              placeholder={placeholder}
              disabled={disabled}
              className={cn("pr-8", inputClassName)}
            />
            {suggestions.length > 0 && (
              <ChevronDown 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" 
              />
            )}
          </div>
        </PopoverTrigger>
        {suggestions.length > 0 && (
          <PopoverContent 
            className="w-[var(--radix-popover-trigger-width)] p-0" 
            align="start" 
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command shouldFilter={false}>
              <CommandGroup>
                <div className="max-h-[200px] overflow-y-auto">
                  {filteredSuggestions.length === 0 ? (
                    <CommandEmpty>No suggestions found.</CommandEmpty>
                  ) : (
                    filteredSuggestions.map((suggestion, idx) => (
                      <CommandItem
                        key={`${suggestion}-${idx}`}
                        value={suggestion}
                        onSelect={handleSelect}
                      >
                        {suggestion}
                      </CommandItem>
                    ))
                  )}
                </div>
              </CommandGroup>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  )
}