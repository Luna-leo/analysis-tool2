"use client"

import React from 'react';
import { Calculator } from 'lucide-react';
import { MasterPageTemplate } from '@/components/master-page/MasterPageTemplate';
import { useUnitConverterFormulaStore } from '@/stores/useUnitConverterFormulaStore';
import { UnitConverterFormulaCard } from './UnitConverterFormulaCard';
import { UnitConverterFormulaDialog } from './UnitConverterFormulaDialog';
import { UnitConverterFormula, UNIT_CATEGORIES } from '@/types/unit-converter';

// Add [key: string] index signature to make UnitConverterFormula compatible with MasterItem
type ExtendedUnitConverterFormula = UnitConverterFormula & {
  [key: string]: any
}

export const UnitConverterFormulaMasterPage: React.FC = () => {
  const store = useUnitConverterFormulaStore();

  // Card renderer for formula display
  const renderFormulaCard = (formula: ExtendedUnitConverterFormula) => (
    <UnitConverterFormulaCard
      formula={formula as UnitConverterFormula}
    />
  );

  return (
    <>
      <MasterPageTemplate<ExtendedUnitConverterFormula>
        config={{
          title: 'Unit Conversion Formula Master',
          description: '単位換算式',
          icon: Calculator,
          itemName: 'formula',
          viewType: 'cards',
          cardRenderer: renderFormulaCard,
          cardColumns: 3,
          DialogComponent: UnitConverterFormulaDialog as any,
          enableDuplicate: true,
          enableCategories: true,
          searchPlaceholder: 'Search by name, description, unit symbols, or aliases...',
          searchFields: ['name', 'description', 'fromUnit', 'toUnit', 'aliases']
        }}
        store={{
          items: store.formulas as ExtendedUnitConverterFormula[],
          searchQuery: store.searchQuery || '',
          selectedCategory: store.selectedCategory,
          addItem: (item: ExtendedUnitConverterFormula) => {
            const { id, createdAt, updatedAt, ...formulaData } = item;
            store.addFormula(formulaData);
          },
          updateItem: (item: ExtendedUnitConverterFormula) => store.updateFormula(item.id, item),
          deleteItem: store.deleteFormula,
          setSearchQuery: store.setSearchQuery || (() => {}),
          setSelectedCategory: (category: string) => store.setSelectedCategory(category as any),
          getCategories: () => store.categories
        }}
      />
      <UnitConverterFormulaDialog />
    </>
  );
};