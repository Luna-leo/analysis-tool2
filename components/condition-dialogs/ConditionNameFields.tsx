"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ConditionNameFieldsProps {
  name: string
  description: string
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
  nameLabel?: string
  descriptionLabel?: string
  namePlaceholder?: string
  descriptionPlaceholder?: string
}

export function ConditionNameFields({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  nameLabel = "Condition Name *",
  descriptionLabel = "Description",
  namePlaceholder = "e.g., High Temperature Alert",
  descriptionPlaceholder = "Describe when this condition should trigger..."
}: ConditionNameFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="condition-name">{nameLabel}</Label>
          <Input
            id="condition-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={namePlaceholder}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="condition-description">{descriptionLabel}</Label>
          <Textarea
            id="condition-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={descriptionPlaceholder}
            className="mt-1 min-h-[80px] resize-y"
          />
        </div>
      </CardContent>
    </Card>
  )
}