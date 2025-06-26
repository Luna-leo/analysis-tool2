import { useState } from "react"

export function useTimeOffset() {
  const [startOffset, setStartOffset] = useState(0)
  const [startOffsetUnit, setStartOffsetUnit] = useState<'min' | 'sec'>('min')
  const [endOffset, setEndOffset] = useState(0)
  const [endOffsetUnit, setEndOffsetUnit] = useState<'min' | 'sec'>('min')
  const [offsetSectionOpen, setOffsetSectionOpen] = useState(false)

  return {
    startOffset,
    setStartOffset,
    startOffsetUnit,
    setStartOffsetUnit,
    endOffset,
    setEndOffset,
    endOffsetUnit,
    setEndOffsetUnit,
    offsetSectionOpen,
    setOffsetSectionOpen,
  }
}