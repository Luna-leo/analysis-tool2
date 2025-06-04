import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EventInfo } from "@/types"
import { Search, Plus, Minus, ChevronDown, ChevronRight, Edit2 } from "lucide-react"

interface TriggerSignalDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddToDataSource: (results: EventInfo[]) => void
  availableEvents: EventInfo[]
}

interface SearchCondition {
  id: string
  type: 'condition' | 'group'
  // For simple conditions
  parameter?: string
  operator?: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne'
  value?: string
  // For groups
  logicalOperator?: 'AND' | 'OR'
  conditions?: SearchCondition[]
}

interface SearchResult {
  id: string
  timestamp: string
  parameters: Record<string, number>
  matchedConditions: string[]
}

const operatorLabels = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  eq: '=',
  ne: '!='
}

// Function to convert conditions to readable expression string
const formatConditionExpression = (conditions: SearchCondition[]): string => {
  if (conditions.length === 0) return 'No conditions set'
  
  const formatCondition = (condition: SearchCondition): string => {
    if (condition.type === 'condition') {
      const param = condition.parameter || '[parameter]'
      const op = operatorLabels[condition.operator || 'gt']
      const value = condition.value || '[value]'
      return `${param} ${op} ${value}`
    } else if (condition.type === 'group' && condition.conditions) {
      const inner = condition.conditions
        .map((cond, index) => {
          const condStr = formatCondition(cond)
          if (index === 0) return condStr
          const logicalOp = cond.logicalOperator || 'AND'
          return `${logicalOp} ${condStr}`
        })
        .join(' ')
      return `(${inner})`
    }
    return ''
  }
  
  return conditions
    .map((condition, index) => {
      const condStr = formatCondition(condition)
      if (index === 0) return condStr
      const logicalOp = condition.logicalOperator || 'AND'
      return `${logicalOp} ${condStr}`
    })
    .join(' ')
}

// Predefined conditions
const predefinedConditions = [
  {
    id: 'high_temp',
    name: 'High Temperature Alert',
    description: 'Temperature exceeds safe operating range',
    expression: 'temperature > 80',
    conditions: [
      { id: 'cond_temp', type: 'condition' as const, parameter: 'temperature', operator: 'gt' as const, value: '80' }
    ]
  },
  {
    id: 'pressure_anomaly',
    name: 'Pressure Anomaly',
    description: 'Pressure outside normal operating range',
    expression: 'pressure > 15 OR pressure < 5',
    conditions: [
      { 
        id: 'cond_pressure_group', 
        type: 'group' as const, 
        logicalOperator: 'OR' as const,
        conditions: [
          { id: 'cond_pressure_high', type: 'condition' as const, parameter: 'pressure', operator: 'gt' as const, value: '15' },
          { id: 'cond_pressure_low', type: 'condition' as const, parameter: 'pressure', operator: 'lt' as const, value: '5', logicalOperator: 'OR' as const }
        ]
      }
    ]
  },
  {
    id: 'critical_combination',
    name: 'Critical Operating Condition',
    description: 'High temperature with abnormal pressure or flow',
    expression: 'temperature > 85 AND (pressure > 12 OR flow < 30)',
    conditions: [
      { id: 'cond_temp_critical', type: 'condition' as const, parameter: 'temperature', operator: 'gt' as const, value: '85' },
      { 
        id: 'cond_critical_group', 
        type: 'group' as const, 
        logicalOperator: 'OR' as const,
        conditions: [
          { id: 'cond_pressure_critical', type: 'condition' as const, parameter: 'pressure', operator: 'gt' as const, value: '12' },
          { id: 'cond_flow_critical', type: 'condition' as const, parameter: 'flow', operator: 'lt' as const, value: '30', logicalOperator: 'OR' as const }
        ],
        logicalOperator: 'AND' as const
      }
    ]
  },
  {
    id: 'efficiency_drop',
    name: 'Efficiency Drop Detection',
    description: 'Low flow with normal or high speed indicates efficiency issues',
    expression: 'flow < 40 AND speed >= 50',
    conditions: [
      { id: 'cond_flow_low', type: 'condition' as const, parameter: 'flow', operator: 'lt' as const, value: '40' },
      { id: 'cond_speed_normal', type: 'condition' as const, parameter: 'speed', operator: 'gte' as const, value: '50', logicalOperator: 'AND' as const }
    ]
  },
  {
    id: 'startup_sequence',
    name: 'Startup Sequence Detection',
    description: 'Conditions indicating machine startup phase',
    expression: 'temperature < 50 AND pressure < 8 AND speed > 0',
    conditions: [
      { id: 'cond_temp_startup', type: 'condition' as const, parameter: 'temperature', operator: 'lt' as const, value: '50' },
      { id: 'cond_pressure_startup', type: 'condition' as const, parameter: 'pressure', operator: 'lt' as const, value: '8', logicalOperator: 'AND' as const },
      { id: 'cond_speed_startup', type: 'condition' as const, parameter: 'speed', operator: 'gt' as const, value: '0', logicalOperator: 'AND' as const }
    ]
  }
]

interface ConditionBuilderProps {
  conditions: SearchCondition[]
  onChange: (conditions: SearchCondition[]) => void
  level?: number
}

const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ conditions, onChange, level = 0 }) => {
  const generateId = () => `cond_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const addCondition = (index?: number) => {
    const newCondition: SearchCondition = {
      id: generateId(),
      type: 'condition',
      parameter: '',
      operator: 'gt',
      value: ''
    }
    
    if (typeof index === 'number') {
      const newConditions = [...conditions]
      newConditions.splice(index + 1, 0, newCondition)
      onChange(newConditions)
    } else {
      onChange([...conditions, newCondition])
    }
  }

  const addGroup = (index?: number) => {
    const newGroup: SearchCondition = {
      id: generateId(),
      type: 'group',
      logicalOperator: 'AND',
      conditions: [
        { id: generateId(), type: 'condition', parameter: '', operator: 'gt', value: '' }
      ]
    }
    
    if (typeof index === 'number') {
      const newConditions = [...conditions]
      newConditions.splice(index + 1, 0, newGroup)
      onChange(newConditions)
    } else {
      onChange([...conditions, newGroup])
    }
  }

  const updateCondition = (id: string, updates: Partial<SearchCondition>) => {
    const updateRecursive = (items: SearchCondition[]): SearchCondition[] => {
      return items.map(item => {
        if (item.id === id) {
          return { ...item, ...updates }
        } else if (item.type === 'group' && item.conditions) {
          return { ...item, conditions: updateRecursive(item.conditions) }
        }
        return item
      })
    }
    onChange(updateRecursive(conditions))
  }

  const removeCondition = (id: string) => {
    const removeRecursive = (items: SearchCondition[]): SearchCondition[] => {
      return items.filter(item => {
        if (item.id === id) return false
        if (item.type === 'group' && item.conditions) {
          item.conditions = removeRecursive(item.conditions)
        }
        return true
      })
    }
    onChange(removeRecursive(conditions))
  }

  const updateGroupConditions = (groupId: string, newConditions: SearchCondition[]) => {
    updateCondition(groupId, { conditions: newConditions })
  }

  return (
    <div className={`space-y-2 ${level > 0 ? 'ml-4 pl-4 border-l-2 border-muted' : ''}`}>
      {conditions.map((condition, index) => (
        <div key={condition.id}>
          {/* Logical operator for non-first items */}
          {index > 0 && (
            <div className="flex items-center mb-2">
              <select
                value={condition.logicalOperator || 'AND'}
                onChange={(e) => updateCondition(condition.id, { 
                  logicalOperator: e.target.value as 'AND' | 'OR' 
                })}
                className="w-16 h-6 px-1 border rounded text-xs mr-2"
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            </div>
          )}

          {condition.type === 'condition' ? (
            // Simple condition
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-background">
              <Input
                placeholder="Parameter"
                value={condition.parameter || ''}
                onChange={(e) => updateCondition(condition.id, { parameter: e.target.value })}
                className="flex-1 h-8 text-sm"
              />
              
              <select
                value={condition.operator || 'gt'}
                onChange={(e) => updateCondition(condition.id, { 
                  operator: e.target.value as SearchCondition['operator'] 
                })}
                className="w-16 h-8 px-2 border rounded text-sm"
              >
                {Object.entries(operatorLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              
              <Input
                placeholder="Value"
                value={condition.value || ''}
                onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                className="w-24 h-8 text-sm"
              />

              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addCondition(index)}
                  className="h-8 w-8 p-0"
                  title="Add condition"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addGroup(index)}
                  className="h-8 w-8 p-0"
                  title="Add group"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
                {conditions.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCondition(condition.id)}
                    className="h-8 w-8 p-0"
                    title="Remove"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            // Group condition
            <div className="border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium">Group:</span>
                <select
                  value={condition.logicalOperator || 'AND'}
                  onChange={(e) => updateCondition(condition.id, { 
                    logicalOperator: e.target.value as 'AND' | 'OR' 
                  })}
                  className="w-20 h-7 px-2 border rounded text-sm"
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
                <span className="text-xs text-muted-foreground">within group</span>
                
                <div className="flex gap-1 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addGroup(index)}
                    className="h-7 w-7 p-0"
                    title="Add group"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCondition(condition.id)}
                    className="h-7 w-7 p-0"
                    title="Remove group"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <ConditionBuilder
                conditions={condition.conditions || []}
                onChange={(newConditions) => updateGroupConditions(condition.id, newConditions)}
                level={level + 1}
              />
            </div>
          )}
        </div>
      ))}
      
      {level === 0 && (
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addCondition()}
            className="h-8"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Condition
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addGroup()}
            className="h-8"
          >
            <ChevronDown className="h-3 w-3 mr-1" />
            Add Group
          </Button>
        </div>
      )}
    </div>
  )
}

export const TriggerSignalDialog: React.FC<TriggerSignalDialogProps> = ({
  isOpen,
  onClose,
  onAddToDataSource,
  availableEvents
}) => {
  const [searchPeriodType, setSearchPeriodType] = useState<'events' | 'manual'>('events')
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [manualPeriod, setManualPeriod] = useState({
    start: '',
    end: '',
    plant: '',
    machineNo: '',
    legend: ''
  })
  const [conditionMode, setConditionMode] = useState<'predefined' | 'manual'>('predefined')
  const [selectedPredefinedCondition, setSelectedPredefinedCondition] = useState<string>('')
  const [loadedFromPredefined, setLoadedFromPredefined] = useState<string | null>(null)
  const [searchConditions, setSearchConditions] = useState<SearchCondition[]>([
    { id: 'cond_1', type: 'condition', parameter: '', operator: 'gt', value: '' }
  ])
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set())

  // Mock search function
  const performSearch = async () => {
    setIsSearching(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Generate mock search results based on current condition type
    const currentExpression = getCurrentExpression()
    const mockResults: SearchResult[] = [
      {
        id: '1',
        timestamp: '2024-01-15T10:30:15',
        parameters: { temperature: 85.2, pressure: 12.5, flow: 45.8, speed: 55 },
        matchedConditions: [currentExpression]
      },
      {
        id: '2',
        timestamp: '2024-01-15T11:15:30',
        parameters: { temperature: 92.1, pressure: 13.2, flow: 48.3, speed: 62 },
        matchedConditions: [currentExpression]
      },
      {
        id: '3',
        timestamp: '2024-01-15T14:22:45',
        parameters: { temperature: 88.7, pressure: 11.8, flow: 52.1, speed: 58 },
        matchedConditions: [currentExpression]
      }
    ]
    
    setSearchResults(mockResults)
    setIsSearching(false)
  }

  const handleAddSelectedResults = () => {
    const selectedResults = searchResults.filter(result => 
      selectedResultIds.has(result.id)
    )
    
    // Convert search results to EventInfo format
    const selectedEvent = availableEvents.find(e => e.id === selectedEventId)
    const eventsToAdd: EventInfo[] = selectedResults.map(result => ({
      id: `trigger_${result.id}_${Date.now()}`,
      plant: searchPeriodType === 'manual' ? manualPeriod.plant : (selectedEvent?.plant || 'Signal Detection'),
      machineNo: searchPeriodType === 'manual' ? manualPeriod.machineNo : (selectedEvent?.machineNo || 'AUTO'),
      label: searchPeriodType === 'manual' ? manualPeriod.legend : eventLegend,
      labelDescription: `Conditions: ${result.matchedConditions.join(', ')}`,
      event: 'Trigger Event',
      eventDetail: `Auto-detected at ${result.timestamp}`,
      start: result.timestamp,
      end: result.timestamp // Same timestamp for trigger events
    }))
    
    onAddToDataSource(eventsToAdd)
    
    // Reset dialog state
    setSelectedResultIds(new Set())
    setSearchResults([])
    onClose()
  }

  const [eventLegend, setEventLegend] = useState('')

  const validateConditions = (conditions: SearchCondition[]): boolean => {
    return conditions.some(condition => {
      if (condition.type === 'condition') {
        return condition.parameter && condition.value
      } else if (condition.type === 'group' && condition.conditions) {
        return validateConditions(condition.conditions)
      }
      return false
    })
  }

  const isSearchValid = () => {
    const hasValidPeriod = searchPeriodType === 'events' 
      ? selectedEventId && eventLegend
      : manualPeriod.start && manualPeriod.end && manualPeriod.plant && manualPeriod.machineNo && manualPeriod.legend
    
    const hasValidConditions = conditionMode === 'predefined' 
      ? selectedPredefinedCondition !== ''
      : validateConditions(searchConditions)
    
    return hasValidPeriod && hasValidConditions
  }

  const getCurrentConditions = (): SearchCondition[] => {
    if (conditionMode === 'predefined') {
      const predefined = predefinedConditions.find(c => c.id === selectedPredefinedCondition)
      return predefined ? predefined.conditions : []
    }
    return searchConditions
  }

  const getCurrentExpression = (): string => {
    if (conditionMode === 'predefined') {
      const predefined = predefinedConditions.find(c => c.id === selectedPredefinedCondition)
      return predefined ? predefined.expression : 'No condition selected'
    }
    return formatConditionExpression(searchConditions)
  }

  const loadPredefinedCondition = (conditionId: string) => {
    const predefined = predefinedConditions.find(c => c.id === conditionId)
    if (predefined) {
      // Deep clone the conditions to avoid reference issues
      const clonedConditions = JSON.parse(JSON.stringify(predefined.conditions))
      setSearchConditions(clonedConditions)
      setLoadedFromPredefined(conditionId)
      setConditionMode('manual')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Trigger Signal Condition Search</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="setup" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="setup">Search Setup</TabsTrigger>
              <TabsTrigger value="results" disabled={searchResults.length === 0}>
                Results ({searchResults.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="setup" className="flex-1 overflow-y-auto space-y-4">
              {/* Search Period Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Search Period</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={searchPeriodType}
                    onValueChange={(value) => setSearchPeriodType(value as 'events' | 'manual')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="events" id="events" />
                      <Label htmlFor="events">Use Event Table Periods</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="manual" />
                      <Label htmlFor="manual">Manual Period Specification</Label>
                    </div>
                  </RadioGroup>
                  
                  {searchPeriodType === 'events' && (
                    <div className="space-y-4">
                      <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                        <Label className="text-sm font-medium mb-2 block">Select Event for Period Range:</Label>
                        <RadioGroup
                          value={selectedEventId}
                          onValueChange={setSelectedEventId}
                          className="space-y-2"
                        >
                          {availableEvents.map((event) => (
                            <div key={event.id} className="flex items-center space-x-2">
                              <RadioGroupItem value={event.id} id={`event-${event.id}`} />
                              <Label htmlFor={`event-${event.id}`} className="text-sm flex-1 cursor-pointer">
                                {event.plant} - {event.machineNo} | {event.label} 
                                <span className="text-muted-foreground ml-2">
                                  ({event.start} ~ {event.end})
                                </span>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      
                      <div>
                        <Label htmlFor="event-legend">
                          Legend <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="event-legend"
                          value={eventLegend}
                          onChange={(e) => setEventLegend(e.target.value)}
                          placeholder="Enter legend for trigger signals"
                        />
                      </div>
                    </div>
                  )}
                  
                  {searchPeriodType === 'manual' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="manual-plant">
                            Plant <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="manual-plant"
                            value={manualPeriod.plant}
                            onChange={(e) => setManualPeriod({ ...manualPeriod, plant: e.target.value })}
                            placeholder="Enter plant name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="manual-machine">
                            Machine No <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="manual-machine"
                            value={manualPeriod.machineNo}
                            onChange={(e) => setManualPeriod({ ...manualPeriod, machineNo: e.target.value })}
                            placeholder="Enter machine number"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="manual-start">
                            Start Date/Time <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="manual-start"
                            type="datetime-local"
                            value={manualPeriod.start}
                            onChange={(e) => setManualPeriod({ ...manualPeriod, start: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="manual-end">
                            End Date/Time <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="manual-end"
                            type="datetime-local"
                            value={manualPeriod.end}
                            onChange={(e) => setManualPeriod({ ...manualPeriod, end: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="manual-legend">
                          Legend <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="manual-legend"
                          value={manualPeriod.legend}
                          onChange={(e) => setManualPeriod({ ...manualPeriod, legend: e.target.value })}
                          placeholder="Enter legend for trigger signals"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Search Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Search Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Condition Mode Selection */}
                  <RadioGroup
                    value={conditionMode}
                    onValueChange={(value) => {
                      setConditionMode(value as 'predefined' | 'manual')
                      if (value === 'predefined') {
                        setLoadedFromPredefined(null)
                        setSelectedPredefinedCondition('')
                      }
                    }}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="predefined" id="predefined" />
                      <Label htmlFor="predefined">Use Predefined Conditions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="manual" />
                      <Label htmlFor="manual">Manual Setup</Label>
                    </div>
                  </RadioGroup>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Condition Setup */}
                    <div>
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                        {conditionMode === 'predefined' ? 'Select Condition' : 'Condition Builder'}
                      </h4>
                      
                      {conditionMode === 'predefined' ? (
                        <div className="space-y-3">
                          {predefinedConditions.map((condition) => (
                            <div
                              key={condition.id}
                              className={`border rounded-lg p-3 transition-colors ${
                                selectedPredefinedCondition === condition.id 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-muted hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div 
                                  className="flex-1 cursor-pointer"
                                  onClick={() => setSelectedPredefinedCondition(condition.id)}
                                >
                                  <h5 className="font-medium text-sm">{condition.name}</h5>
                                  <p className="text-xs text-muted-foreground mt-1">{condition.description}</p>
                                  <div className="font-mono text-xs mt-2 p-2 bg-muted/30 rounded">
                                    {condition.expression}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <RadioGroup value={selectedPredefinedCondition}>
                                    <RadioGroupItem 
                                      value={condition.id} 
                                      className="h-4 w-4"
                                      onClick={() => setSelectedPredefinedCondition(condition.id)}
                                    />
                                  </RadioGroup>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      loadPredefinedCondition(condition.id)
                                    }}
                                    title="Customize this condition"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Show source info if loaded from predefined */}
                          {loadedFromPredefined && (
                            <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                              <div className="flex items-center gap-2">
                                <Edit2 className="h-4 w-4 text-blue-600" />
                                <div className="flex-1">
                                  <h6 className="text-sm font-medium text-blue-800">
                                    Customizing: {predefinedConditions.find(c => c.id === loadedFromPredefined)?.name}
                                  </h6>
                                  <p className="text-xs text-blue-600 mt-1">
                                    You can now modify the condition below. Changes will not affect the original preset.
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-blue-600 hover:text-blue-800"
                                  onClick={() => {
                                    setLoadedFromPredefined(null)
                                    setSearchConditions([
                                      { id: 'cond_1', type: 'condition', parameter: '', operator: 'gt', value: '' }
                                    ])
                                  }}
                                >
                                  Start Fresh
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          <ConditionBuilder
                            conditions={searchConditions}
                            onChange={setSearchConditions}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Expression Preview */}
                    <div>
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                        Current Expression
                        {conditionMode === 'manual' && loadedFromPredefined && (
                          <span className="ml-2 text-xs text-blue-600">(Modified from preset)</span>
                        )}
                      </h4>
                      <div className="border rounded-lg p-4 bg-muted/20 min-h-[100px]">
                        <div className="font-mono text-sm break-words">
                          {getCurrentExpression()}
                        </div>
                        
                        {/* Show predefined condition info if selected */}
                        {conditionMode === 'predefined' && selectedPredefinedCondition && (
                          <div className="mt-3 pt-3 border-t border-muted">
                            <div className="text-xs text-muted-foreground">
                              <div className="font-medium mb-1">
                                {predefinedConditions.find(c => c.id === selectedPredefinedCondition)?.name}
                              </div>
                              <div>
                                {predefinedConditions.find(c => c.id === selectedPredefinedCondition)?.description}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Expression explanation */}
                        <div className="mt-4 pt-3 border-t border-muted">
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              <span>AND: All conditions must be true</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              <span>OR: Any condition can be true</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              <span>( ): Grouped conditions</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Search Button */}
              <div className="flex justify-center">
                <Button
                  onClick={performSearch}
                  disabled={!isSearchValid() || isSearching}
                  className="px-8"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isSearching ? 'Searching...' : 'Execute Search'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="flex-1 overflow-y-auto">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Search Results</CardTitle>
                    <Button
                      onClick={handleAddSelectedResults}
                      disabled={selectedResultIds.size === 0}
                    >
                      Add Selected ({selectedResultIds.size}) to Data Source
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {searchResults.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedResultIds.size === searchResults.length && searchResults.length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedResultIds(new Set(searchResults.map(r => r.id)))
                                } else {
                                  setSelectedResultIds(new Set())
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Parameters</TableHead>
                          <TableHead>Matched Conditions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedResultIds.has(result.id)}
                                onCheckedChange={(checked) => {
                                  const newSelectedIds = new Set(selectedResultIds)
                                  if (checked) {
                                    newSelectedIds.add(result.id)
                                  } else {
                                    newSelectedIds.delete(result.id)
                                  }
                                  setSelectedResultIds(newSelectedIds)
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {result.timestamp}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {Object.entries(result.parameters).map(([key, value]) => (
                                  <div key={key} className="text-sm">
                                    <span className="font-medium">{key}:</span> {value}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {result.matchedConditions.map((condition, idx) => (
                                  <div key={idx} className="text-sm bg-green-100 px-2 py-1 rounded">
                                    {condition}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No search results yet. Configure search conditions and execute search.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}