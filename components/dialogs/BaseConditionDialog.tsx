"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface BaseConditionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  size?: "default" | "large" | "full"
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function BaseConditionDialog({
  open,
  onOpenChange,
  title,
  description,
  size = "large",
  children,
  footer,
  className
}: BaseConditionDialogProps) {
  const sizeClasses = {
    default: "max-w-2xl",
    large: "max-w-4xl",
    full: "max-w-6xl w-[90vw]"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        sizeClasses[size],
        "max-h-[90vh] h-[85vh] flex flex-col",
        className
      )}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={description ? "" : "sr-only"}>
            {description || `${title} dialog`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
        
        {footer && (
          <DialogFooter className="pt-4 border-t">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}