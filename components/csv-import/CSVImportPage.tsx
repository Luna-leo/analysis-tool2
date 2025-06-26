"use client"

import { CSVImportContent } from "./CSVImportContent"

interface CSVImportPageProps {
  fileId: string
}

export function CSVImportPage(_props: CSVImportPageProps) {
  return (
    <div className="p-4 h-full">
      <CSVImportContent mode="page" />
    </div>
  )
}