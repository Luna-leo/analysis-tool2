"use client"

import React from 'react'
import { Shield } from 'lucide-react'
import { useInterlockMasterStore } from '@/stores/useInterlockMasterStore'
import { MasterPageTemplate, ColumnConfig } from '@/components/master-page'
import { InterlockEditDialog } from './InterlockEditDialog'
import { InterlockMaster } from '@/types'

// Column configuration
const columns: ColumnConfig<InterlockMaster>[] = [
  {
    key: 'plant_name',
    label: 'Plant',
    width: 170,
    sticky: true,
    stickyPosition: 0
  },
  {
    key: 'machine_no',
    label: 'Machine No',
    width: 120,
    sticky: true,
    stickyPosition: 170
  },
  {
    key: 'name',
    label: 'Name',
    width: 200
  },
  {
    key: 'category',
    label: 'Category',
    width: 150
  },
  {
    key: 'description',
    label: 'Description',
    width: 300
  },
  {
    key: 'x_parameter',
    label: 'X Parameter',
    width: 150
  },
  {
    key: 'y_unit',
    label: 'Y Unit',
    width: 100
  },
  {
    key: 'threshold_count',
    label: 'Thresholds',
    width: 100,
    render: (item) => item.definition?.thresholds?.length || 0
  }
]

// Add [key: string] index signature to make InterlockMaster compatible with MasterItem
type ExtendedInterlockMaster = InterlockMaster & {
  [key: string]: string | number | boolean | Date | null | undefined
}

export function InterlockMasterPageRefactored() {
  const store = useInterlockMasterStore()

  return (
    <MasterPageTemplate<ExtendedInterlockMaster>
      config={{
        title: 'Interlock Master',
        icon: Shield,
        itemName: 'interlock',
        viewType: 'table',
        columns: columns as ColumnConfig<ExtendedInterlockMaster>[],
        DialogComponent: InterlockEditDialog as any,
        enableDuplicate: true,
        enableResize: true,
        searchPlaceholder: 'Search interlocks...'
      }}
      store={{
        items: store.interlocks as ExtendedInterlockMaster[],
        searchQuery: '',
        addItem: store.addInterlock,
        updateItem: store.updateInterlock,
        deleteItem: store.deleteInterlock,
        setSearchQuery: () => {}
      }}
    />
  )
}