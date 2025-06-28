import React, { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { EventInfo } from "@/types"
import { useTimeAdjustment } from "@/hooks/useTimeAdjustment"
import { ManualEntryData } from "@/hooks/useManualEntry"
import { TimeAdjustmentSection } from "./TimeAdjustmentSection"
import { PlantMachineFields } from "@/components/charts/EditModal/parameters/PlantMachineFields"
import { useInputHistoryStore } from "@/stores/useInputHistoryStore"
import { checkDataAvailability, DataAvailability, getSuggestedPeriods, calculatePeriodCoverage } from "@/utils/dataAvailabilityUtils"
import { getDataForManualEntry } from "@/utils/dataRetrievalUtils"
import { Database, Calendar } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ManualEntryDialogProps {
  isOpen: boolean
  editingItemId: string | null
  data: ManualEntryData
  onClose: () => void
  onUpdateData: (updates: Partial<ManualEntryData>) => void
  onSave: (data: ManualEntryData, editingItemId: string | null) => void
  isValid: boolean
}

export const ManualEntryDialog: React.FC<ManualEntryDialogProps> = ({
  isOpen,
  editingItemId,
  data,
  onClose,
  onUpdateData,
  onSave,
  isValid
}) => {
  const { target, setTarget, unit, setUnit, adjustTime } = useTimeAdjustment()
  const { addPlantHistory, addMachineHistory } = useInputHistoryStore()
  const [dataAvailability, setDataAvailability] = useState<DataAvailability | null>(null)
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const [useExistingData, setUseExistingData] = useState(false)
  const [existingDataInfo, setExistingDataInfo] = useState<{
    parameters: string[]
    recordCount: number
  } | null>(null)
  const [suggestedPeriods, setSuggestedPeriods] = useState<Array<{ start: string; end: string; coverage: number; dataPoints: number }>>([])  
  const [periodCoverage, setPeriodCoverage] = useState<{ coveragePercentage: number; gaps: Array<{ start: string; end: string }> } | null>(null)

  // Check data availability when plant/machine changes
  useEffect(() => {
    if (data.plant && data.machineNo && !editingItemId) {
      checkAvailability()
    } else {
      setDataAvailability(null)
      setSuggestedPeriods([])
    }
  }, [data.plant, data.machineNo, editingItemId])
  
  // Check period coverage when dates change
  useEffect(() => {
    if (data.plant && data.machineNo && data.start && data.end && dataAvailability?.hasData) {
      checkPeriodCoverage()
    } else {
      setPeriodCoverage(null)
    }
  }, [data.start, data.end, dataAvailability])

  const checkAvailability = async () => {
    setIsCheckingAvailability(true)
    try {
      const availability = await checkDataAvailability(data.plant, data.machineNo)
      setDataAvailability(availability)
      
      // Get suggested periods if data exists
      if (availability.hasData) {
        const suggestions = await getSuggestedPeriods(data.plant, data.machineNo, 3)
        setSuggestedPeriods(suggestions)
      }
    } catch (error) {
      console.error('Error checking data availability:', error)
      setDataAvailability(null)
    } finally {
      setIsCheckingAvailability(false)
    }
  }
  
  const checkPeriodCoverage = async () => {
    try {
      const coverage = await calculatePeriodCoverage(
        data.plant,
        data.machineNo,
        data.start,
        data.end
      )
      setPeriodCoverage({
        coveragePercentage: coverage.coveragePercentage,
        gaps: coverage.gaps
      })
    } catch (error) {
      console.error('Error calculating period coverage:', error)
    }
  }

  const handleTimeAdjustment = (amount: number) => {
    adjustTime(
      { start: data.start, end: data.end },
      amount,
      (timeData) => onUpdateData(timeData)
    )
  }

  const handleSave = async () => {
    // Save to history only for new entries
    if (!editingItemId) {
      addPlantHistory(data.plant)
      addMachineHistory(data.machineNo)
    }
    
    // Check if we should load existing data
    if (useExistingData && data.start && data.end) {
      const existingData = await getDataForManualEntry(
        data.plant,
        data.machineNo,
        data.start,
        data.end
      )
      
      if (existingData.hasData) {
        // Pass the data info along with the manual entry
        const dataWithExisting = {
          ...data,
          useExistingData: true,
          existingDataInfo: {
            recordCount: existingData.data.length,
            parameters: existingData.parameters,
            data: existingData.data // Pass the actual data
          }
        }
        onSave(dataWithExisting as any, editingItemId)
        return
      }
    }
    
    onSave(data, editingItemId)
  }
  
  const handleUseExistingData = async () => {
    if (!data.plant || !data.machineNo || !data.start || !data.end) {
      return
    }
    
    setUseExistingData(true)
    const result = await getDataForManualEntry(
      data.plant,
      data.machineNo,
      data.start,
      data.end
    )
    
    if (result.hasData) {
      setExistingDataInfo({
        parameters: result.parameters,
        recordCount: result.data.length
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {editingItemId ? "Edit Data Entry" : "Add Manual Data Entry"}
          </DialogTitle>
          <DialogDescription>
            {editingItemId ? "Edit the data entry details" : "Enter the details for manual data entry"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-y-auto p-2">
          {/* Required Fields */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-muted-foreground">Required Fields</h5>
            
            <PlantMachineFields
              plant={data.plant}
              onPlantChange={(plant) => onUpdateData({ plant })}
              machineNo={data.machineNo}
              onMachineNoChange={(machineNo) => onUpdateData({ machineNo })}
              disabled={!!editingItemId}
            />
            
            {/* Data Availability Indicator */}
            {!editingItemId && data.plant && data.machineNo && (
              <div>
                {isCheckingAvailability ? (
                  <Alert className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse text-gray-400">Checking data availability...</div>
                    </div>
                  </Alert>
                ) : dataAvailability?.hasData ? (
                  <div className="space-y-2">
                    <Alert className="py-2 border-green-200 bg-green-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-sm text-green-800">
                            Data is available for this Plant/Machine combination
                          </AlertDescription>
                        </div>
                        {data.start && data.end && !useExistingData && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleUseExistingData}
                            className="text-green-700 hover:text-green-800"
                          >
                            Use Existing Data
                          </Button>
                        )}
                      </div>
                    </Alert>
                    
                    {/* Suggested Periods */}
                    {suggestedPeriods.length > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Suggested Periods:</span>
                        </div>
                        <div className="space-y-1">
                          {suggestedPeriods.map((period, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                onUpdateData({
                                  start: period.start,
                                  end: period.end
                                })
                              }}
                              className="w-full text-left p-2 text-xs bg-white hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <span>
                                  {new Date(period.start).toLocaleString()} - {new Date(period.end).toLocaleString()}
                                </span>
                                <span className="text-blue-600 font-medium">
                                  {Math.round(period.coverage)}% coverage
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert className="py-2 border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-gray-400" />
                      <AlertDescription className="text-sm text-gray-600">
                        No existing data found for this Plant/Machine combination
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
              </div>
            )}
            
            {/* Show existing data info if using existing data */}
            {useExistingData && existingDataInfo && (
              <Alert className="py-2 border-blue-200 bg-blue-50">
                <div className="space-y-1">
                  <AlertDescription className="text-sm font-medium text-blue-800">
                    Using existing data
                  </AlertDescription>
                  <AlertDescription className="text-xs text-blue-700">
                    {existingDataInfo.recordCount} records with {existingDataInfo.parameters.length} parameters
                  </AlertDescription>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setUseExistingData(false)
                      setExistingDataInfo(null)
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 p-0 h-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </Alert>
            )}
            
            {/* Period Coverage Alert */}
            {periodCoverage && data.start && data.end && (
              <Alert className={`py-2 ${
                periodCoverage.coveragePercentage < 50 
                  ? 'border-red-200 bg-red-50' 
                  : periodCoverage.coveragePercentage < 80 
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-green-200 bg-green-50'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertDescription className={`text-sm ${
                    periodCoverage.coveragePercentage < 50 
                      ? 'text-red-800' 
                      : periodCoverage.coveragePercentage < 80 
                      ? 'text-yellow-800'
                      : 'text-green-800'
                  }`}>
                    Period coverage: {Math.round(periodCoverage.coveragePercentage)}%
                    {periodCoverage.gaps.length > 0 && (
                      <span className="ml-2">
                        ({periodCoverage.gaps.length} gap{periodCoverage.gaps.length > 1 ? 's' : ''} detected)
                      </span>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}
            
            {/* Legend Field */}
            <div>
              <Label htmlFor="manual-legend" className="text-sm">
                Legend <span className="text-red-500">*</span>
              </Label>
              <Input
                id="manual-legend"
                value={editingItemId ? data.legend : data.label}
                onChange={(e) => {
                  if (editingItemId) {
                    onUpdateData({ legend: e.target.value })
                  } else {
                    onUpdateData({ label: e.target.value })
                  }
                }}
                className="mt-1"
                placeholder="Enter legend"
              />
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manual-start" className="text-sm">
                    Start <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="manual-start"
                    type="datetime-local"
                    step="1"
                    value={data.start}
                    onChange={(e) => onUpdateData({ start: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-end" className="text-sm">
                    End <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="manual-end"
                    type="datetime-local"
                    step="1"
                    value={data.end}
                    onChange={(e) => onUpdateData({ end: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              {/* Time Adjustment */}
              {data.start && data.end && (
                <TimeAdjustmentSection
                  target={target}
                  unit={unit}
                  onTargetChange={setTarget}
                  onUnitChange={setUnit}
                  onAdjust={handleTimeAdjustment}
                />
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end items-center mt-4 flex-shrink-0 border-t pt-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!isValid}
            >
              {editingItemId ? "Update Entry" : "Add Entry"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}