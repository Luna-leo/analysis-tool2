"use client"

import React from 'react'
import { Gauge } from 'lucide-react'
import { useInterlockMasterStore } from '@/stores/useInterlockMasterStore'
import { MasterPageTemplate, ColumnConfig, DialogProps } from '@/components/master-page'
import { ComponentType } from 'react'
import { InterlockEditDialog } from './InterlockEditDialog'
import { InterlockMaster } from '@/types'


// Column configuration
const columns: ColumnConfig<ExtendedInterlockMaster>[] = [
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
    width: 250,
    render: (item) => (
      <div className="flex flex-col">
        <span className="font-medium">{item.name}</span>
        <span className="text-xs text-gray-500">X: {item.definition?.xParameter || '-'}</span>
      </div>
    )
  },
  {
    key: 'threshold_count',
    label: 'Threshold',
    width: 300,
    render: (item) => {
      const thresholds = item.definition?.thresholds || []
      return (
        <div className="flex gap-1 overflow-hidden">
          {thresholds.map((threshold) => (
            <span
              key={threshold.id}
              className="inline-flex items-center px-2 py-1 text-xs font-medium border rounded-full whitespace-nowrap"
              style={{ 
                backgroundColor: `${threshold.color}20`,
                borderColor: threshold.color,
                color: threshold.color
              }}
            >
              {threshold.name}
            </span>
          ))}
        </div>
      )
    }
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
        description: '登録済み管理値、プラント・号機毎',
        icon: Gauge,
        itemName: 'interlock',
        viewType: 'table',
        columns: columns as ColumnConfig<ExtendedInterlockMaster>[],
        DialogComponent: InterlockEditDialog as unknown as ComponentType<DialogProps<ExtendedInterlockMaster>>,
        enableDuplicate: true,
        enableResize: true,
        searchPlaceholder: 'Search interlocks...'
      }}
      store={{
        items: store.interlocks as ExtendedInterlockMaster[],
        searchQuery: '',
        addItem: (item: ExtendedInterlockMaster) => store.addInterlock(item as InterlockMaster),
        updateItem: (item: ExtendedInterlockMaster) => store.updateInterlock(item as InterlockMaster),
        deleteItem: store.deleteInterlock,
        setSearchQuery: () => {}
      }}
    />
  )
}