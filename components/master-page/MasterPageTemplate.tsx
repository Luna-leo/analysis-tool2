"use client"

import React from 'react'
import { MasterPageHeader } from './MasterPageHeader'
import { MasterPageTable } from './MasterPageTable'
import { MasterPageVirtualTable } from './MasterPageVirtualTable'
import { MasterPageCardGrid } from './MasterPageCardGrid'
import { MasterPageEmptyState } from './MasterPageEmptyState'
import { useMasterPage } from './useMasterPage'
import { MasterItem, MasterPageConfig, MasterPageStore } from './types'

interface MasterPageTemplateProps<T extends MasterItem> {
  config: MasterPageConfig<T>
  store: MasterPageStore<T>
}

export function MasterPageTemplate<T extends MasterItem>({
  config,
  store
}: MasterPageTemplateProps<T>) {
  const {
    filteredItems,
    editingItem,
    dialogOpen,
    dialogMode,
    handleAdd,
    handleEdit,
    handleDuplicate,
    handleDelete,
    handleSave,
    handleDialogClose,
    setSearchQuery,
    setSelectedCategory
  } = useMasterPage({
    store,
    searchFields: config.searchFields,
    enableDuplicate: config.enableDuplicate
  })

  const { DialogComponent } = config

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <MasterPageHeader
        title={config.title}
        icon={config.icon}
        searchQuery={store.searchQuery}
        onSearchChange={setSearchQuery}
        onAdd={handleAdd}
        searchPlaceholder={config.searchPlaceholder}
        categories={config.enableCategories ? store.getCategories?.() : undefined}
        selectedCategory={store.selectedCategory}
        onCategoryChange={config.enableCategories ? setSelectedCategory : undefined}
      />

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4 md:p-6">
        {filteredItems.length === 0 ? (
          config.customEmptyState || (
            <MasterPageEmptyState
              itemName={config.itemName}
              searchQuery={store.searchQuery}
            />
          )
        ) : config.viewType === 'table' && config.columns ? (
          filteredItems.length > 100 ? (
            <MasterPageVirtualTable
              items={filteredItems}
              columns={config.columns}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={config.enableDuplicate ? handleDuplicate : undefined}
              onAdd={handleAdd}
              enableResize={config.enableResize}
              enableDuplicate={config.enableDuplicate}
            />
          ) : (
            <MasterPageTable
              items={filteredItems}
              columns={config.columns}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={config.enableDuplicate ? handleDuplicate : undefined}
              onAdd={handleAdd}
              enableResize={config.enableResize}
              enableDuplicate={config.enableDuplicate}
            />
          )
        ) : config.viewType === 'cards' && config.cardRenderer ? (
          <MasterPageCardGrid
            items={filteredItems}
            cardRenderer={config.cardRenderer}
            emptyState={
              <MasterPageEmptyState
                itemName={config.itemName}
                searchQuery={store.searchQuery}
              />
            }
          />
        ) : null}
      </div>

      {/* Dialog */}
      {editingItem && (
        <DialogComponent
          item={editingItem}
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          onSave={handleSave}
          mode={dialogMode}
        />
      )}
    </div>
  )
}