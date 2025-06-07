import React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useTimeAdjustment, TimeUnit, TimeTarget } from '@/hooks/useTimeAdjustment'

interface TimeAdjustmentSectionProps {
  target: TimeTarget
  unit: TimeUnit
  onTargetChange: (target: TimeTarget) => void
  onUnitChange: (unit: TimeUnit) => void
  onAdjust: (amount: number) => void
}

export const TimeAdjustmentSection: React.FC<TimeAdjustmentSectionProps> = ({
  target,
  unit,
  onTargetChange,
  onUnitChange,
  onAdjust
}) => {
  return (
    <div className="border rounded-lg bg-muted/30 p-3 space-y-3">
      <h6 className="text-xs font-medium">Time Adjustment</h6>
      
      {/* Target and Unit Selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Adjust Target</Label>
          <div className="flex gap-1 mt-1">
            <Button
              variant={target === 'start' ? "default" : "outline"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => onTargetChange('start')}
            >
              Start
            </Button>
            <Button
              variant={target === 'end' ? "default" : "outline"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => onTargetChange('end')}
            >
              End
            </Button>
          </div>
        </div>
        
        <div>
          <Label className="text-xs">Unit</Label>
          <div className="flex gap-1 mt-1">
            <Button
              variant={unit === 's' ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onUnitChange('s')}
            >
              Sec
            </Button>
            <Button
              variant={unit === 'm' ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onUnitChange('m')}
            >
              Min
            </Button>
            <Button
              variant={unit === 'h' ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onUnitChange('h')}
            >
              Hour
            </Button>
            <Button
              variant={unit === 'd' ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onUnitChange('d')}
            >
              Day
            </Button>
          </div>
        </div>
      </div>
      
      {/* Adjustment Buttons */}
      <div>
        <Label className="text-xs">Adjustment</Label>
        <div className="flex gap-1 mt-1">
          {/* Negative buttons */}
          <div className="grid grid-cols-4 gap-1 flex-1">
            {[-30, -10, -5, -1].map(step => (
              <Button
                key={step}
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={() => onAdjust(step)}
              >
                {step}{unit}
              </Button>
            ))}
          </div>
          
          {/* Divider */}
          <div className="w-px bg-border"></div>
          
          {/* Positive buttons */}
          <div className="grid grid-cols-4 gap-1 flex-1">
            {[1, 5, 10, 30].map(step => (
              <Button
                key={step}
                variant="default"
                size="sm"
                className="h-6 text-xs"
                onClick={() => onAdjust(step)}
              >
                +{step}{unit}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}