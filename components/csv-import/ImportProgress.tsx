"use client"

import React from 'react'
import { Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface ImportProgressProps {
  isImporting: boolean
  progress: number
  status: string
}

export function ImportProgress({ isImporting, progress, status }: ImportProgressProps) {
  if (!isImporting) return null

  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-lg z-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Download className="h-4 w-4 animate-pulse" />
          Importing CSV Files...
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground truncate">{status}</p>
      </CardContent>
    </Card>
  )
}