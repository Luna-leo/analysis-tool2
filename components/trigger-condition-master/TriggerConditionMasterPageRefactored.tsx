"use client"

import React from 'react'
import { Zap } from 'lucide-react'
import { useTriggerConditionStore } from '@/stores/useTriggerConditionStore'
import { MasterPageTemplate } from '@/components/master-page'
import { TriggerConditionDialog } from './TriggerConditionDialog'
import { PredefinedCondition } from '@/data/predefinedConditions'
import { TriggerConditionCard } from './TriggerConditionCard'

// Add [key: string] index signature to make PredefinedCondition compatible with MasterItem
type ExtendedPredefinedCondition = PredefinedCondition & {
  [key: string]: string | number | boolean | Date | null | undefined
}

export function TriggerConditionMasterPageRefactored() {
  const store = useTriggerConditionStore()

  // Card renderer for trigger condition display
  const renderConditionCard = (condition: ExtendedPredefinedCondition) => (
    <TriggerConditionCard
      condition={condition as PredefinedCondition}
    />
  )

  return (
    <>
      <MasterPageTemplate<ExtendedPredefinedCondition>
        config={{
          title: 'Trigger Condition Master',
          description: '登録済みキック信号コンディション',
          icon: Zap,
          itemName: 'trigger condition',
          viewType: 'cards',
          cardRenderer: renderConditionCard,
          DialogComponent: TriggerConditionDialog as any,
          enableDuplicate: true,
          searchPlaceholder: 'Search trigger conditions...',
          searchFields: ['name', 'description', 'expression']
        }}
        store={{
          items: store.getFilteredConditions() as ExtendedPredefinedCondition[],
          searchQuery: store.searchQuery,
          addItem: store.addCondition,
          updateItem: (item: ExtendedPredefinedCondition) => store.updateCondition(item.id, item),
          deleteItem: store.deleteCondition,
          setSearchQuery: store.setSearchQuery
        }}
      />
      <TriggerConditionDialog
        open={store.isDialogOpen}
        onOpenChange={store.closeDialog}
        onSave={(condition) => {
          if (store.dialogMode === 'edit') {
            store.updateCondition(condition.id, condition)
          } else {
            store.addCondition(condition)
          }
          store.closeDialog()
        }}
        initialCondition={store.selectedCondition || undefined}
        mode={store.dialogMode}
      />
    </>
  )
}