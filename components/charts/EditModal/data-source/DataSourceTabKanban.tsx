"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { 
  Plus, 
  Calendar, 
  Filter, 
  Clock, 
  Factory,
  MoreVertical,
  Sparkles,
  Database,
  Zap,
  CheckCircle,
  Circle,
  ArrowUpRight,
  Activity
} from "lucide-react"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { EventInfo } from "@/types"

interface DataSourceTabKanbanProps {
  selectedDataSourceItems: EventInfo[]
  setSelectedDataSourceItems: React.Dispatch<React.SetStateAction<EventInfo[]>>
}

// カンバンカード
function KanbanCard({ 
  period, 
  status = "available",
  onMove,
  onAction
}: {
  period: EventInfo
  status?: "available" | "filtered" | "selected"
  onMove?: (to: string) => void
  onAction?: (action: string) => void
}) {
  const statusConfig = {
    available: {
      icon: Circle,
      color: "text-slate-500",
      bgColor: "bg-slate-50"
    },
    filtered: {
      icon: Activity,
      color: "text-orange-500", 
      bgColor: "bg-orange-50"
    },
    selected: {
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-50"
    }
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <Card className="p-3 cursor-pointer transition-all hover:shadow-md group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded", config.bgColor)}>
            <StatusIcon className={cn("h-3.5 w-3.5", config.color)} />
          </div>
          <div>
            <h4 className="font-medium text-sm line-clamp-1">{period.label}</h4>
            <p className="text-xs text-muted-foreground">{period.machineNo}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Factory className="h-3 w-3" />
            <span>{period.plant}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{new Date(period.start).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            <Avatar className="h-6 w-6 border-2 border-background">
              <AvatarFallback className="text-xs bg-primary/10">
                {period.event?.charAt(0) || 'E'}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {status !== "selected" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100"
                    onClick={() => onMove?.(status === "available" ? "filtered" : "selected")}
                  >
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    Move
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Move to {status === "available" ? "Filter" : "Selected"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </Card>
  )
}

// カンバンコラム
function KanbanColumn({
  title,
  icon: Icon,
  iconColor,
  items,
  emptyMessage,
  onAddItem,
  onMoveItem,
  showAddButton = false,
  showFilterButton = false,
  onFilter
}: {
  title: string
  icon: React.ElementType
  iconColor: string
  items: EventInfo[]
  emptyMessage: string
  onAddItem?: () => void
  onMoveItem?: (item: EventInfo, to: string) => void
  showAddButton?: boolean
  showFilterButton?: boolean
  onFilter?: () => void
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", iconColor)} />
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="h-5 text-xs">
            {items.length}
          </Badge>
        </div>
        <div className="flex gap-1">
          {showAddButton && (
            <Button size="sm" variant="ghost" onClick={onAddItem} className="h-7 px-2">
              <Plus className="h-3 w-3" />
            </Button>
          )}
          {showFilterButton && (
            <Button size="sm" variant="ghost" onClick={onFilter} className="h-7 px-2">
              <Filter className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[450px]">
        <div className="space-y-2 px-1">
          {items.length > 0 ? (
            items.map((item) => (
              <KanbanCard
                key={item.id}
                period={item}
                status={
                  title === "Available" ? "available" : 
                  title === "Filtered" ? "filtered" : 
                  "selected"
                }
                onMove={(to) => onMoveItem?.(item, to)}
              />
            ))
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// 統計カード
function StatsCard({ 
  label, 
  value, 
  icon: Icon, 
  trend 
}: { 
  label: string
  value: string | number
  icon: React.ElementType
  trend?: number
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
          {trend !== undefined && (
            <p className={cn(
              "text-xs",
              trend > 0 ? "text-green-600" : "text-red-600"
            )}>
              {trend > 0 ? "+" : ""}{trend}%
            </p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Card>
  )
}

export function DataSourceTabKanban({
  selectedDataSourceItems,
  setSelectedDataSourceItems,
}: DataSourceTabKanbanProps) {
  const [availableItems, setAvailableItems] = useState<EventInfo[]>([
    {
      id: "1",
      plant: "Plant A",
      machineNo: "M001",
      label: "Maintenance Window",
      labelDescription: "Regular check",
      event: "Scheduled Stop",
      eventDetail: "Monthly maintenance",
      start: "2024-01-15T10:00:00",
      end: "2024-01-15T12:00:00",
    },
    {
      id: "2",
      plant: "Plant B",
      machineNo: "M002",
      label: "Production Cycle",
      labelDescription: "Normal run",
      event: "Normal Operation", 
      eventDetail: "Batch processing",
      start: "2024-01-15T08:00:00",
      end: "2024-01-15T16:00:00",
    },
    {
      id: "3",
      plant: "Plant A",
      machineNo: "M003",
      label: "Alert Period",
      labelDescription: "Warning state",
      event: "Temperature Warning",
      eventDetail: "Above threshold",
      start: "2024-01-15T14:30:00",
      end: "2024-01-15T14:45:00",
    }
  ])
  const [filteredItems, setFilteredItems] = useState<EventInfo[]>([])

  const handleMoveItem = (item: EventInfo, to: string) => {
    if (to === "filtered") {
      setAvailableItems(availableItems.filter(i => i.id !== item.id))
      setFilteredItems([...filteredItems, item])
    } else if (to === "selected") {
      if (filteredItems.find(i => i.id === item.id)) {
        setFilteredItems(filteredItems.filter(i => i.id !== item.id))
      }
      setSelectedDataSourceItems([...selectedDataSourceItems, item])
    }
  }

  const totalDuration = selectedDataSourceItems.reduce((acc, item) => {
    const start = new Date(item.start).getTime()
    const end = new Date(item.end).getTime()
    return acc + (end - start)
  }, 0)
  const avgDuration = selectedDataSourceItems.length > 0 
    ? Math.round(totalDuration / selectedDataSourceItems.length / 1000 / 60) 
    : 0

  return (
    <div className="h-full flex flex-col gap-4">
      {/* ヘッダー統計 */}
      <div className="grid grid-cols-4 gap-3">
        <StatsCard
          label="Total Periods"
          value={availableItems.length + filteredItems.length + selectedDataSourceItems.length}
          icon={Database}
        />
        <StatsCard
          label="Selected"
          value={selectedDataSourceItems.length}
          icon={CheckCircle}
          trend={selectedDataSourceItems.length > 0 ? 100 : 0}
        />
        <StatsCard
          label="Filtered"
          value={filteredItems.length}
          icon={Zap}
        />
        <StatsCard
          label="Avg Duration"
          value={`${avgDuration}m`}
          icon={Clock}
        />
      </div>

      {/* プログレスバー */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Workflow Progress</span>
          <span>{Math.round((selectedDataSourceItems.length / (availableItems.length + filteredItems.length + selectedDataSourceItems.length)) * 100)}%</span>
        </div>
        <Progress 
          value={(selectedDataSourceItems.length / (availableItems.length + filteredItems.length + selectedDataSourceItems.length)) * 100} 
          className="h-2"
        />
      </div>

      {/* カンバンボード */}
      <div className="flex-1 flex gap-4 min-h-0">
        <KanbanColumn
          title="Available"
          icon={Database}
          iconColor="text-slate-500"
          items={availableItems}
          emptyMessage="No periods available. Add manual entries or import from events."
          showAddButton
          onAddItem={() => console.log("Add item")}
          onMoveItem={handleMoveItem}
        />
        
        <div className="w-px bg-border" />
        
        <KanbanColumn
          title="Filtered"
          icon={Sparkles}
          iconColor="text-orange-500"
          items={filteredItems}
          emptyMessage="Apply filters to detect signal patterns"
          showFilterButton
          onFilter={() => console.log("Apply filter")}
          onMoveItem={handleMoveItem}
        />
        
        <div className="w-px bg-border" />
        
        <KanbanColumn
          title="Selected"
          icon={CheckCircle}
          iconColor="text-green-500"
          items={selectedDataSourceItems}
          emptyMessage="Move items here to use as data sources"
          onMoveItem={handleMoveItem}
        />
      </div>
    </div>
  )
}