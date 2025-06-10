"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Copy } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { InterlockMaster } from "@/types"
import { InterlockEditDialog } from "./InterlockEditDialog"
import { useInterlockMasterStore } from "@/stores/useInterlockMasterStore"

export function InterlockMasterPage() {
  const { interlocks, setInterlocks, addInterlock, updateInterlock, deleteInterlock } = useInterlockMasterStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [editingInterlock, setEditingInterlock] = useState<InterlockMaster | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Column widths state
  const [columnWidths, setColumnWidths] = useState({
    plant: 170,
    machineNo: 120,
    name: 250,
    threshold: 300,
    actions: 120
  })
  
  // Refs for resize
  const tableRef = useRef<HTMLTableElement>(null)
  const [resizing, setResizing] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  const filteredInterlocks = useMemo(() => {
    if (!searchTerm) return interlocks

    const lowerSearch = searchTerm.toLowerCase()
    return interlocks.filter((interlock) => {
      const searchableFields = [
        interlock.plant_name,
        interlock.machine_no,
        interlock.name,
        ...interlock.definition.thresholds.map(t => t.name)
      ]
      return searchableFields.some((value) =>
        String(value).toLowerCase().includes(lowerSearch)
      )
    })
  }, [interlocks, searchTerm])

  const handleAddInterlock = () => {
    const newInterlock: InterlockMaster = {
      id: "",
      name: "",
      category: "Safety",
      plant_name: "",
      machine_no: "",
      definition: {
        id: Date.now().toString(),
        name: "",
        description: "",
        xParameter: "",
        xUnit: "",
        yUnit: "",
        thresholds: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setEditingInterlock(newInterlock)
    setIsDialogOpen(true)
  }

  const handleEditInterlock = (interlock: InterlockMaster) => {
    setEditingInterlock(interlock)
    setIsDialogOpen(true)
  }

  const handleDeleteInterlock = (interlockId: string) => {
    if (confirm("Are you sure you want to delete this interlock?")) {
      deleteInterlock(interlockId)
    }
  }

  const handleDuplicateInterlock = (interlock: InterlockMaster) => {
    const duplicatedInterlock: InterlockMaster = {
      ...interlock,
      id: Date.now().toString(),
      name: `${interlock.name} (Copy)`,
      definition: {
        ...interlock.definition,
        id: Date.now().toString() + "-def",
        name: `${interlock.definition.name} (Copy)`,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    // Add to table
    addInterlock(duplicatedInterlock)
    // Open edit dialog with duplicated data
    setEditingInterlock(duplicatedInterlock)
    setIsDialogOpen(true)
  }

  const handleSaveInterlock = (interlock: InterlockMaster) => {
    if (interlock.id && interlocks.find(i => i.id === interlock.id)) {
      // Update existing interlock
      updateInterlock(interlock)
    } else {
      // Add new interlock
      const newInterlock = {
        ...interlock,
        id: interlock.id || Date.now().toString(),
        updatedAt: new Date().toISOString(),
      }
      addInterlock(newInterlock)
    }
    setIsDialogOpen(false)
    setEditingInterlock(null)
  }

  const renderThresholdBadges = (interlock: InterlockMaster) => {
    return (
      <div className="flex flex-wrap gap-1">
        {interlock.definition.thresholds.map((threshold) => (
          <span
            key={threshold.id}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
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

  // Handle column resize
  const handleMouseDown = (column: string, e: React.MouseEvent) => {
    setResizing(column)
    setStartX(e.clientX)
    setStartWidth(columnWidths[column as keyof typeof columnWidths])
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return
      
      const diff = e.clientX - startX
      const newWidth = Math.max(50, startWidth + diff)
      
      setColumnWidths(prev => ({
        ...prev,
        [resizing]: newWidth
      }))
    }

    const handleMouseUp = () => {
      setResizing(null)
    }

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [resizing, startX, startWidth])

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Interlock Master</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search interlocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
          <div className="overflow-auto flex-1 relative">
            <table ref={tableRef} className="text-base w-full border-collapse" style={{ minWidth: '800px' }}>
              <thead className="sticky top-0 z-40">
                <tr className="border-b border-gray-200">
                  <th className="bg-gray-50 px-3 py-3 text-left font-bold text-sm text-gray-700 border-r border-gray-200 sticky left-0 z-30 relative" style={{ width: `${columnWidths.plant}px`, minWidth: `${columnWidths.plant}px` }}>
                    Plant
                    <div
                      className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400"
                      onMouseDown={(e) => handleMouseDown('plant', e)}
                    />
                  </th>
                  <th className="bg-gray-50 px-3 py-3 text-left font-bold text-sm text-gray-700 border-r-2 border-gray-300 sticky z-30 relative" style={{ left: `${columnWidths.plant}px`, width: `${columnWidths.machineNo}px`, minWidth: `${columnWidths.machineNo}px` }}>
                    Machine no
                    <div
                      className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400"
                      onMouseDown={(e) => handleMouseDown('machineNo', e)}
                    />
                  </th>
                  <th className="bg-gray-50 px-3 py-3 text-left font-bold text-sm text-gray-700 border-r border-gray-200 relative" style={{ width: `${columnWidths.name}px`, minWidth: `${columnWidths.name}px` }}>
                    Name
                    <div
                      className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400"
                      onMouseDown={(e) => handleMouseDown('name', e)}
                    />
                  </th>
                  <th className="bg-gray-50 px-3 py-3 text-left font-bold text-sm text-gray-700 border-r border-gray-200 relative" style={{ width: `${columnWidths.threshold}px`, minWidth: `${columnWidths.threshold}px` }}>
                    Threshold
                    <div
                      className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400"
                      onMouseDown={(e) => handleMouseDown('threshold', e)}
                    />
                  </th>
                  <th className="bg-gray-50 px-2 py-3 text-center font-bold text-sm text-gray-700 sticky right-0 z-30 border-l-2 border-gray-300" style={{ width: `${columnWidths.actions}px`, minWidth: `${columnWidths.actions}px` }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInterlocks.map((interlock) => (
                  <tr key={interlock.id} className="group hover:bg-blue-50 transition-colors border-b border-gray-100" style={{ height: '56px' }}>
                    <td className="px-3 py-2 text-sm bg-white group-hover:bg-blue-50 sticky left-0 z-20 border-r border-gray-200 align-top transition-colors" style={{ width: `${columnWidths.plant}px`, minWidth: `${columnWidths.plant}px`, height: '56px' }}>
                      <div className="line-clamp-2">{interlock.plant_name}</div>
                    </td>
                    <td className="px-3 py-2 text-sm bg-white group-hover:bg-blue-50 sticky z-20 border-r-2 border-gray-300 align-top transition-colors" style={{ left: `${columnWidths.plant}px`, width: `${columnWidths.machineNo}px`, minWidth: `${columnWidths.machineNo}px`, height: '56px' }}>
                      <div className="line-clamp-2">{interlock.machine_no}</div>
                    </td>
                    <td className="px-3 py-2 text-sm align-top" style={{ width: `${columnWidths.name}px`, minWidth: `${columnWidths.name}px`, height: '56px' }}>
                      <div className="leading-tight">
                        <div className="font-medium line-clamp-1">
                          {interlock.name}
                          {interlock.definition.yUnit && ` (${interlock.definition.yUnit})`}
                        </div>
                        <div className="text-xs text-gray-500">
                          X: {interlock.definition.xParameter}
                          {interlock.definition.xUnit && ` (${interlock.definition.xUnit})`}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm align-top" style={{ width: `${columnWidths.threshold}px`, minWidth: `${columnWidths.threshold}px`, height: '56px' }}>
                      {renderThresholdBadges(interlock)}
                    </td>
                    <td className="px-2 py-1 text-center bg-white group-hover:bg-blue-50 sticky right-0 z-20 border-l-2 border-gray-300 align-middle transition-colors" style={{ width: `${columnWidths.actions}px`, minWidth: `${columnWidths.actions}px`, height: '56px' }}>
                      <div className="flex gap-1 justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateInterlock(interlock)}
                          className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
                          title="Duplicate"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditInterlock(interlock)}
                          className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInterlock(interlock.id)}
                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 bg-gray-50 px-2 py-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddInterlock}
              className="h-8 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
          </div>
        </div>
      </div>

      {editingInterlock && (
        <InterlockEditDialog
          interlock={editingInterlock}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSaveInterlock}
        />
      )}
    </div>
  )
}