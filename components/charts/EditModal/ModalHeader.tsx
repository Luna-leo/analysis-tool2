"use client"

import React from "react"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ModalHeaderProps {
  title: string
  onCancel: () => void
  onSave: () => void
}

export function ModalHeader({ title, onCancel, onSave }: ModalHeaderProps) {
  return (
    <DialogHeader className="flex-shrink-0">
      <div className="flex justify-between items-center">
        <DialogTitle>Edit Chart: {title}</DialogTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Changes</Button>
        </div>
      </div>
    </DialogHeader>
  )
}