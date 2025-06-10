"use client"

import React from 'react'
import { FunctionSquare } from 'lucide-react'
import { useFormulaMasterStore } from '@/stores/useFormulaMasterStore'
import { MasterPageTemplate } from '@/components/master-page'
import { FormulaRegistrationDialog } from '@/components/charts/EditModal/parameters/FormulaRegistrationDialog'
import { FormulaMaster } from '@/data/formulaMaster'
import { FormulaCard } from './FormulaCard'

// Add [key: string] index signature to make FormulaMaster compatible with MasterItem
type ExtendedFormulaMaster = FormulaMaster & {
  [key: string]: string | number | boolean | Date | null | undefined
}

export function FormulaMasterPageRefactored() {
  const store = useFormulaMasterStore()

  // Card renderer for formula display
  const renderFormulaCard = (formula: ExtendedFormulaMaster) => (
    <FormulaCard
      formula={formula as FormulaMaster}
      onEdit={() => {}} // Will be handled by MasterPageTemplate
      onDuplicate={() => {}} // Will be handled by MasterPageTemplate
      onDelete={() => {}} // Will be handled by MasterPageTemplate
    />
  )

  return (
    <MasterPageTemplate<ExtendedFormulaMaster>
      config={{
        title: 'Formula Master',
        icon: FunctionSquare,
        itemName: 'formula',
        viewType: 'cards',
        cardRenderer: renderFormulaCard,
        DialogComponent: FormulaRegistrationDialog as any,
        enableDuplicate: true,
        enableCategories: true,
        searchPlaceholder: 'Search formulas...',
        searchFields: ['name', 'description', 'expression', 'category']
      }}
      store={{
        items: store.formulas as ExtendedFormulaMaster[],
        searchQuery: store.searchQuery || '',
        selectedCategory: store.selectedCategory,
        addItem: store.addFormula,
        updateItem: (item: ExtendedFormulaMaster) => store.updateFormula(item.id, item),
        deleteItem: store.deleteFormula,
        setSearchQuery: store.setSearchQuery || (() => {}),
        setSelectedCategory: store.setSelectedCategory,
        getCategories: store.getCategories
      }}
    />
  )
}