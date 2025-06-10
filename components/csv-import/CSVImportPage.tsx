"use client"

import { CSVImportContent } from "./CSVImportContent"

interface CSVImportPageProps {
  fileId: string
}

export function CSVImportPage({ fileId }: CSVImportPageProps) {
  return <CSVImportContent mode="page" />
}