import React from 'react';
import { ConditionBuilderFullscreen } from './ConditionBuilderFullscreen';
import { SearchCondition } from '@/types';
import { formatConditionExpression } from '@/lib/conditionUtils';

export interface BaseTriggerConditionDialogProps {
  // Dialog visibility
  open: boolean;
  onClose: () => void;
  
  // Condition data
  conditionName: string;
  conditionDescription: string;
  onConditionNameChange: (name: string) => void;
  onConditionDescriptionChange: (description: string) => void;
  
  // Search conditions hook data
  conditionMode: any;
  onConditionModeChange: (mode: any) => void;
  selectedPredefinedCondition: string;
  onSelectedPredefinedConditionChange: (id: string) => void;
  loadedFromPredefined: string | null;
  searchConditions: SearchCondition[];
  onSearchConditionsChange: (conditions: SearchCondition[]) => void;
  savedConditions: any[];
  getCurrentExpressionJSX: () => React.ReactNode;
  onLoadPredefinedCondition: (id: string) => void;
  onResetToFresh: () => void;
  onShowSaveDialog: () => void;
  onLoadSavedCondition: (condition: any) => void;
  onDeleteSavedCondition: (id: string) => void;
  
  // Dialog customization
  title: string;
  saveButtonText?: string;
  canSave: boolean;
  
  // Save handler
  onSave: () => void;
}

export function BaseTriggerConditionDialog({
  open,
  onClose,
  conditionName,
  conditionDescription,
  onConditionNameChange,
  onConditionDescriptionChange,
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
  title,
  saveButtonText = "Save Condition",
  canSave,
  onSave
}: BaseTriggerConditionDialogProps) {
  if (!open) return null;

  return (
    <ConditionBuilderFullscreen
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
      onSave={onSave}
      onClose={onClose}
      canSave={canSave}
      title={title}
      isFullscreen={true}
      onToggleFullscreen={() => {}}
      conditionName={conditionName}
      conditionDescription={conditionDescription}
      onConditionNameChange={onConditionNameChange}
      onConditionDescriptionChange={onConditionDescriptionChange}
      saveButtonText={saveButtonText}
    />
  );
}

// Utility function to generate condition expression
export function generateConditionExpression(searchConditions: SearchCondition[]): string {
  return formatConditionExpression(searchConditions);
}

// Utility function to validate condition form
export function isConditionFormValid(name: string, searchConditions: SearchCondition[]): boolean {
  return !!(name && searchConditions.length > 0);
}