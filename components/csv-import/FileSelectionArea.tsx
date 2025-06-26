"use client"

import React, { useRef } from 'react'
import { FolderOpen, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Extend HTMLInputElement to include webkitdirectory
declare module 'react' {
  interface InputHTMLAttributes<T> extends React.HTMLAttributes<T> {
    webkitdirectory?: string
  }
}

interface FileSelectionAreaProps {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function FileSelectionArea({ onFileSelect }: FileSelectionAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileText className="mr-2 h-4 w-4" />
          Select CSV Files
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.CSV"
          onChange={onFileSelect}
          className="hidden"
        />
      </div>
      
      <div className="flex-1 space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => folderInputRef.current?.click()}
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          Select Folder
        </Button>
        <Input
          ref={folderInputRef}
          type="file"
          webkitdirectory=""
          onChange={onFileSelect}
          className="hidden"
        />
      </div>
    </div>
  )
}