export interface ManualEntryInput {
  legend?: string
  label?: string
  labelDescription?: string
  [key: string]: string | number | boolean | Date | undefined
}

export interface ManualEntryOutput extends ManualEntryInput {
  label: string
  labelDescription: string
}