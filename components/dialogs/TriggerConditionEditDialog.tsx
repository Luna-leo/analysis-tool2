import React, { useEffect } from 'react';
import { useSearchConditions } from '@/hooks/useSearchConditions';
import { useTriggerConditionStore } from '@/stores/useTriggerConditionStore';
import { useUIStore } from '@/stores/useUIStore';
import { ConditionBuilderFullscreen } from './ConditionBuilderFullscreen';
export function TriggerConditionEditDialog() {
  const { searchConditionDialogOpen, editingConditionId, closeSearchConditionDialog } = useUIStore();
  const { getConditionById, addCondition, updateCondition } = useTriggerConditionStore();
  
  const [conditionName, setConditionName] = React.useState('');
  const [conditionDescription, setConditionDescription] = React.useState('');
  
  const searchConditions = useSearchConditions();
  
  const isEditing = !!editingConditionId;
  const existingCondition = editingConditionId ? getConditionById(editingConditionId) : null;
  
  useEffect(() => {
    if (searchConditionDialogOpen) {
      if (existingCondition) {
        setConditionName(existingCondition.name);
        setConditionDescription(existingCondition.description || '');
        searchConditions.setConditionMode('manual');
        
        // Load the existing conditions
        if (existingCondition.conditions) {
          searchConditions.setSearchConditions(existingCondition.conditions);
        }
      } else {
        setConditionName('');
        setConditionDescription('');
        searchConditions.resetToFresh();
      }
    }
  }, [searchConditionDialogOpen, existingCondition]);
  
  const handleSave = () => {
    const expression = searchConditions.getCurrentExpression();
    if (!conditionName || !expression) return;
    
    const conditionData = {
      name: conditionName,
      description: conditionDescription,
      expression: expression,
      conditions: searchConditions.searchConditions
    };
    
    if (isEditing && editingConditionId) {
      updateCondition(editingConditionId, conditionData);
    } else {
      const newCondition = {
        ...conditionData,
        id: `condition_${Date.now()}`
      };
      addCondition(newCondition);
    }
    
    closeSearchConditionDialog();
  };
  
  const handleClose = () => {
    closeSearchConditionDialog();
  };
  
  if (!searchConditionDialogOpen) return null;

  return (
    <ConditionBuilderFullscreen
      conditionMode={searchConditions.conditionMode}
      onConditionModeChange={searchConditions.setConditionMode}
      selectedPredefinedCondition={searchConditions.selectedPredefinedCondition}
      onSelectedPredefinedConditionChange={searchConditions.setSelectedPredefinedCondition}
      loadedFromPredefined={searchConditions.loadedFromPredefined}
      searchConditions={searchConditions.searchConditions}
      onSearchConditionsChange={searchConditions.setSearchConditions}
      savedConditions={searchConditions.savedConditions}
      getCurrentExpressionJSX={searchConditions.getCurrentExpressionJSX}
      onLoadPredefinedCondition={searchConditions.loadPredefinedCondition}
      onResetToFresh={searchConditions.resetToFresh}
      onShowSaveDialog={() => searchConditions.setShowSaveDialog(true)}
      onLoadSavedCondition={searchConditions.loadSavedCondition}
      onDeleteSavedCondition={searchConditions.deleteSavedCondition}
      onSave={handleSave}
      onClose={handleClose}
      canSave={!!conditionName && !!searchConditions.getCurrentExpression()}
      title={isEditing ? `Edit: ${conditionName}` : 'Create New Trigger Condition'}
      isFullscreen={true}
      onToggleFullscreen={() => {}}
      conditionName={conditionName}
      conditionDescription={conditionDescription}
      onConditionNameChange={setConditionName}
      onConditionDescriptionChange={setConditionDescription}
    />
  );
}