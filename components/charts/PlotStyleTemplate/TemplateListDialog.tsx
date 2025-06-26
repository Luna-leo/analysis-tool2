"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, Copy, Check, ChevronRight } from "lucide-react"
import { PlotStyleTemplate } from "@/types/plot-style-template"
import { usePlotStyleTemplateStore } from "@/stores/usePlotStyleTemplateStore"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface TemplateListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: PlotStyleTemplate) => void
  hasMultipleCharts?: boolean
}

export function TemplateListDialog({ 
  open, 
  onOpenChange, 
  onSelectTemplate,
  hasMultipleCharts = false
}: TemplateListDialogProps) {
  const { templates, deleteTemplate, duplicateTemplate } = usePlotStyleTemplateStore()
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<PlotStyleTemplate | null>(null)

  const handleDelete = (id: string) => {
    deleteTemplate(id)
    toast.success("Template deleted")
    setDeleteConfirmId(null)
  }

  const handleDuplicate = (template: PlotStyleTemplate) => {
    const newName = `${template.name} (Copy)`
    duplicateTemplate(template.id, newName)
    toast.success(`Template duplicated as "${newName}"`)
  }

  const handleSelect = (template: PlotStyleTemplate) => {
    setSelectedTemplate(template)
  }

  const handleApply = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate)
      onOpenChange(false)
      setSelectedTemplate(null)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Apply Template</DialogTitle>
            <DialogDescription>
              Select a template to apply to your chart(s).
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] pr-4">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No templates saved yet. Save your current plot style as a template to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id ? 'bg-accent border-primary' : ''
                    }`}
                    onClick={() => handleSelect(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium flex items-center gap-2">
                          {template.name}
                          {selectedTemplate?.id === template.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </h4>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Created: {format(new Date(template.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-4" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleDuplicate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteConfirmId(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs space-y-1">
                      <div className="flex flex-wrap gap-2">
                        {template.displaySettings.showMarkers && (
                          <span className="px-2 py-1 bg-secondary rounded">Markers</span>
                        )}
                        {template.displaySettings.showLines && (
                          <span className="px-2 py-1 bg-secondary rounded">Lines</span>
                        )}
                        {template.displaySettings.showGrid && (
                          <span className="px-2 py-1 bg-secondary rounded">Grid</span>
                        )}
                        {template.displaySettings.showLegend && (
                          <span className="px-2 py-1 bg-secondary rounded">Legend</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <DialogFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedTemplate && hasMultipleCharts && (
                <span>Tip: You can apply to multiple charts after selecting</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleApply}
                disabled={!selectedTemplate}
              >
                {selectedTemplate && hasMultipleCharts ? (
                  <>
                    Continue
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  'Apply to Current Chart'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}