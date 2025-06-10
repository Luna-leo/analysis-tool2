"use client"

import { CSVImportContent } from "./CSVImportContent"

interface CSVImportPageProps {
  fileId: string
}

export function CSVImportPage(_props: CSVImportPageProps) {
  return <CSVImportContent mode="page" />
}