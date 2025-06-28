"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, FileText, ArrowLeft } from "lucide-react"

interface AddDataWizardDialogProps {
  isOpen: boolean
  onClose: () => void
  onManualEntry: () => void
  onFromEvents: () => void
  onImportCSV: () => void
}

type DataSourceType = 'existing' | 'import' | null

export const AddDataWizardDialog: React.FC<AddDataWizardDialogProps> = ({
  isOpen,
  onClose,
  onManualEntry,
  onFromEvents,
  onImportCSV,
}) => {
  const [selectedDataSource, setSelectedDataSource] = useState<DataSourceType>(null)
  const [step, setStep] = useState<'select-source' | 'configure'>('select-source')

  // Reset state when dialog opens to ensure it always starts from the first step
  React.useEffect(() => {
    if (isOpen) {
      setStep('select-source')
      setSelectedDataSource(null)
    }
  }, [isOpen])

  const handleDataSourceSelect = (type: DataSourceType) => {
    setSelectedDataSource(type)
    if (type === 'import') {
      // For CSV import, directly proceed to the existing CSV import dialog
      onClose()
      onImportCSV()
    } else {
      setStep('configure')
    }
  }

  const handleExistingDataOption = (option: 'manual' | 'events') => {
    onClose()
    if (option === 'manual') {
      onManualEntry()
    } else {
      onFromEvents()
    }
  }

  const handleBack = () => {
    if (step === 'configure') {
      setStep('select-source')
      setSelectedDataSource(null)
    }
  }

  const handleClose = () => {
    setStep('select-source')
    setSelectedDataSource(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'configure' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-1 h-auto"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            Add Data to Analysis
          </DialogTitle>
          <DialogDescription>
            {step === 'select-source' 
              ? "Choose how you want to add data to your analysis"
              : "Configure your data source"
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'select-source' && (
          <div className="space-y-4">
            <div className="grid gap-4">
              <Card 
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => handleDataSourceSelect('existing')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Database className="h-5 w-5 text-blue-600" />
                    Existing Data
                  </CardTitle>
                  <CardDescription>
                    Use data already stored in your database by specifying a time period
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card 
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => handleDataSourceSelect('import')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5 text-green-600" />
                    Import New CSV
                  </CardTitle>
                  <CardDescription>
                    Upload new CSV files to import fresh data into your analysis
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        )}

        {step === 'configure' && selectedDataSource === 'existing' && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              How would you like to specify the time period?
            </div>
            
            <div className="grid gap-3">
              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => handleExistingDataOption('events')}
              >
                <div className="text-left">
                  <div className="font-medium">From Events</div>
                  <div className="text-sm text-muted-foreground">
                    Select from registered events in your event master
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => handleExistingDataOption('manual')}
              >
                <div className="text-left">
                  <div className="font-medium">Manual Entry</div>
                  <div className="text-sm text-muted-foreground">
                    Manually specify plant, machine, and time period
                  </div>
                </div>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}