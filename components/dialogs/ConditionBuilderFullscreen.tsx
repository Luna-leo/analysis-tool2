import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Save, Maximize2, Minimize2, ChevronDown } from 'lucide-react';
import { SearchConditionsSection } from '@/components/search';
import { cn } from '@/lib/utils';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ConditionBuilderFullscreenProps {
  conditionMode: any;
  onConditionModeChange: (mode: any) => void;
  selectedPredefinedCondition: string;
  onSelectedPredefinedConditionChange: (id: string) => void;
  loadedFromPredefined: string | null;
  searchConditions: any[];
  onSearchConditionsChange: (conditions: any[]) => void;
  savedConditions: any[];
  getCurrentExpressionJSX: () => React.ReactNode;
  onLoadPredefinedCondition: (id: string) => void;
  onResetToFresh: () => void;
  onShowSaveDialog: () => void;
  onLoadSavedCondition: (condition: any) => void;
  onDeleteSavedCondition: (id: string) => void;
  onSave: () => void;
  onClose: () => void;
  canSave: boolean;
  title: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  conditionName?: string;
  conditionDescription?: string;
  onConditionNameChange?: (name: string) => void;
  onConditionDescriptionChange?: (description: string) => void;
  saveButtonText?: string;
}

export function ConditionBuilderFullscreen({
  conditionMode,
  onConditionModeChange,
  selectedPredefinedCondition,
  onSelectedPredefinedConditionChange,
  loadedFromPredefined,
  searchConditions,
  onSearchConditionsChange,
  savedConditions,
  getCurrentExpressionJSX,
  onLoadPredefinedCondition,
  onResetToFresh,
  onShowSaveDialog,
  onLoadSavedCondition,
  onDeleteSavedCondition,
  onSave,
  onClose,
  canSave,
  title,
  isFullscreen,
  onToggleFullscreen,
  conditionName,
  conditionDescription,
  onConditionNameChange,
  onConditionDescriptionChange,
  saveButtonText = "Save Condition"
}: ConditionBuilderFullscreenProps) {
  const [isExpressionOpen, setIsExpressionOpen] = useState(true);
  
  return (
    <div className={cn(
      "flex flex-col h-full bg-background",
      isFullscreen ? "fixed inset-0 z-50" : "relative"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Preview (Previously Right) */}
        <div className="w-[320px] border-r flex flex-col bg-muted/30">
          <div className="px-4 py-4">
            <h3 className="text-lg font-semibold">Condition Preview</h3>
          </div>
          <ScrollArea className="flex-1 px-4 pb-4">
            <div className="space-y-4">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="condition-name">Condition Name *</Label>
                    <Input
                      id="condition-name"
                      value={conditionName || ''}
                      onChange={(e) => onConditionNameChange?.(e.target.value)}
                      placeholder="Enter condition name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="condition-description">Description</Label>
                    <Textarea
                      id="condition-description"
                      value={conditionDescription || ''}
                      onChange={(e) => onConditionDescriptionChange?.(e.target.value)}
                      placeholder="Enter condition description (optional)"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• Use AND to require all conditions to be met</p>
                  <p>• Use OR when any condition can be met</p>
                  <p>• Group conditions with parentheses for complex logic</p>
                  <p>• Save frequently used conditions for reuse</p>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Condition Builder (Previously Left) */}
        <div className="flex-1 flex flex-col px-6 py-4">
          <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
            {/* Current Expression - sticky */}
            <div className="sticky top-0 z-10 bg-background pb-4">
              <Collapsible open={isExpressionOpen} onOpenChange={setIsExpressionOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-0 hover:bg-transparent">
                    <ChevronDown className={cn(
                      "h-4 w-4 mr-2 transition-transform",
                      isExpressionOpen && "rotate-180"
                    )} />
                    <h3 className="text-lg font-semibold">Current Expression</h3>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="p-3 bg-background rounded-md border">
                    <div className="font-mono text-sm">
                      {getCurrentExpressionJSX()}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Scrollable Condition Builder */}
            <ScrollArea className="flex-1">
              <SearchConditionsSection
                conditionMode={conditionMode}
                onConditionModeChange={onConditionModeChange}
                selectedPredefinedCondition={selectedPredefinedCondition}
                onSelectedPredefinedConditionChange={onSelectedPredefinedConditionChange}
                loadedFromPredefined={loadedFromPredefined}
                searchConditions={searchConditions}
                onSearchConditionsChange={onSearchConditionsChange}
                savedConditions={savedConditions}
                getCurrentExpressionJSX={getCurrentExpressionJSX}
                onLoadPredefinedCondition={onLoadPredefinedCondition}
                onResetToFresh={onResetToFresh}
                onShowSaveDialog={onShowSaveDialog}
                onLoadSavedCondition={onLoadSavedCondition}
                onDeleteSavedCondition={onDeleteSavedCondition}
                defaultOpen={true}
                useImprovedLayout={true}
                hideExpressionPreview={true}
                headerText="Build Filter Conditions"
              />
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 p-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={!canSave}>
          <Save className="h-4 w-4 mr-2" />
          {saveButtonText}
        </Button>
      </div>
    </div>
  );
}