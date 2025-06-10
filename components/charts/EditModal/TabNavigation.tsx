"use client"

import React from "react"
import { Button } from "@/components/ui/button"

export type TabType = "datasource" | "parameters" | "appearance"

interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs: { value: TabType; label: string }[] = [
  { value: "datasource", label: "DataSource" },
  { value: "parameters", label: "Parameters" },
  { value: "appearance", label: "Appearance" }
]

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-2 mb-4">
      {tabs.map((tab) => (
        <Button
          key={tab.value}
          variant={activeTab === tab.value ? "default" : "secondary"}
          size="sm"
          onClick={() => onTabChange(tab.value)}
          className="transition-colors"
        >
          {tab.label}
        </Button>
      ))}
    </div>
  )
}