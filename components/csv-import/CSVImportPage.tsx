"use client"

import { CSVImportContentRefactored } from "./CSVImportContentRefactored"

interface CSVImportPageProps {
  fileId: string
}

export function CSVImportPage(_props: CSVImportPageProps) {
  return (
    <div className="p-4 h-full">
      <CSVImportContentRefactored mode="page" />
    </div>
  )
}