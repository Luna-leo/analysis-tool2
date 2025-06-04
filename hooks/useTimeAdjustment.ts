import { useState } from 'react'
import { adjustDate } from '@/lib/dateUtils'

export type TimeUnit = 'd' | 'h' | 'm' | 's'
export type TimeTarget = 'start' | 'end'

export const useTimeAdjustment = () => {
  const [target, setTarget] = useState<TimeTarget>('start')
  const [unit, setUnit] = useState<TimeUnit>('s')

  const adjustTime = (
    currentData: { start: string; end: string },
    amount: number,
    updateData: (data: { start: string; end: string }) => void
  ) => {
    const newValue = adjustDate(
      target === 'start' ? currentData.start : currentData.end,
      amount,
      unit
    )
    
    updateData({
      ...currentData,
      [target]: newValue
    })
  }

  return {
    target,
    setTarget,
    unit,
    setUnit,
    adjustTime
  }
}