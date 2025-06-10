"use client"

import React from 'react'
import { Calendar } from 'lucide-react'
import { useEventMasterStore } from '@/stores/useEventMasterStore'
import { MasterPageTemplate, ColumnConfig } from '@/components/master-page'
import { EventEditDialog } from './EventEditDialog'
import { EventMaster } from '@/types'

// Helper function to format date/time
const formatDateTime = (dateTimeStr: string) => {
  try {
    const date = new Date(dateTimeStr)
    const dateStr = date.toLocaleDateString()
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    return { dateStr, timeStr }
  } catch {
    return { dateStr: '', timeStr: '' }
  }
}

// Column configuration
const columns: ColumnConfig<EventMaster>[] = [
  {
    key: 'plant',
    label: 'Plant',
    width: 170,
    sticky: true,
    stickyPosition: 0
  },
  {
    key: 'machineNo',
    label: 'Machine No',
    width: 100,
    sticky: true,
    stickyPosition: 170
  },
  {
    key: 'start',
    label: 'Start',
    width: 110,
    render: (item) => {
      const { dateStr, timeStr } = formatDateTime(String(item.start))
      return (
        <div>
          <div>{dateStr}</div>
          <div>{timeStr}</div>
        </div>
      )
    }
  },
  {
    key: 'end',
    label: 'End',
    width: 110,
    render: (item) => {
      const { dateStr, timeStr } = formatDateTime(String(item.end))
      return (
        <div>
          <div>{dateStr}</div>
          <div>{timeStr}</div>
        </div>
      )
    }
  },
  {
    key: 'label',
    label: 'Label',
    width: 100,
    render: (item) => <span className="font-medium">{item.label}</span>
  },
  {
    key: 'labelDescription',
    label: 'Label description',
    width: 150
  },
  {
    key: 'event',
    label: 'Event',
    width: 150
  },
  {
    key: 'eventDetail',
    label: 'Event detail',
    width: 200
  }
]

export function EventMasterPageRefactored() {
  const store = useEventMasterStore()

  return (
    <MasterPageTemplate<EventMaster>
      config={{
        title: 'Event Master',
        icon: Calendar,
        itemName: 'event',
        viewType: 'table',
        columns: columns as ColumnConfig<EventMaster>[],
        DialogComponent: EventEditDialog,
        enableDuplicate: true,
        enableResize: true,
        searchPlaceholder: 'Search events...'
      }}
      store={{
        items: store.events,
        searchQuery: store.searchQuery || '',
        addItem: store.addEvent,
        updateItem: store.updateEvent,
        deleteItem: store.deleteEvent,
        setSearchQuery: store.setSearchQuery || (() => {})
      }}
    />
  )
}