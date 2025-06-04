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
import { Search, Plus, Minus, ChevronDown, ChevronRight, Edit2, Save } from "lucide-react"

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

// Function to convert conditions to colored JSX expression
const formatConditionExpressionToJSX = (conditions: SearchCondition[]): React.ReactNode => {
  if (conditions.length === 0) return <span className="text-muted-foreground">No conditions set</span>
  
  const formatCondition = (condition: SearchCondition, key: string): React.ReactNode[] => {
    if (condition.type === 'condition') {
      const param = condition.parameter || '[parameter]'
      const op = operatorLabels[condition.operator || 'gt']
      const value = condition.value || '[value]'
      return [
        <span key={`${key}-param`} className="text-slate-700 font-medium">{param}</span>,
        <span key={`${key}-space1`}> </span>,
        <span key={`${key}-op`} className="text-teal-600 font-semibold">{op}</span>,
        <span key={`${key}-space2`}> </span>,
        <span key={`${key}-value`} className="text-indigo-600 font-medium">{value}</span>
      ]
    } else if (condition.type === 'group' && condition.conditions) {
      const inner: React.ReactNode[] = []
      condition.conditions.forEach((cond, index) => {
        if (index > 0) {
          const logicalOp = cond.logicalOperator || 'AND'
          inner.push(<span key={`${key}-logical-${index}`} className="text-rose-600 font-semibold mx-1">{logicalOp}</span>)
        }
        inner.push(...formatCondition(cond, `${key}-${index}`))
      })
      
      return [
        <span key={`${key}-open`} className="text-amber-600 font-semibold">(</span>,
        ...inner,
        <span key={`${key}-close`} className="text-amber-600 font-semibold">)</span>
      ]
    }
    return []
  }
  
  const result: React.ReactNode[] = []
  conditions.forEach((condition, index) => {
    if (index > 0) {
      const logicalOp = condition.logicalOperator || 'AND'
      result.push(<span key={`logical-${index}`} className="text-rose-600 font-semibold mx-1">{logicalOp}</span>)
    }
    result.push(...formatCondition(condition, `cond-${index}`))
  })
  
  return <>{result}</>
}

// Function to color code expression strings (for saved conditions)
const colorCodeExpressionString = (expression: string): React.ReactNode => {
  return expression
    .split(/(\bAND\b|\bOR\b|\(|\)|>=|<=|>|<|!=|=)/)
    .map((part, index) => {
      const trimmed = part.trim()
      if (trimmed === 'AND' || trimmed === 'OR') {
        return <span key={index} className="text-rose-600 font-semibold mx-1">{part}</span>
      } else if (trimmed === '(' || trimmed === ')') {
        return <span key={index} className="text-amber-600 font-semibold">{part}</span>
      } else if (['>=', '<=', '>', '<', '!=', '='].includes(trimmed)) {
        return <span key={index} className="text-teal-600 font-semibold">{part}</span>
      } else if (trimmed && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
        // Parameter names
        return <span key={index} className="text-slate-700 font-medium">{part}</span>
      } else if (trimmed && /^\d+(\.\d+)?$/.test(trimmed)) {
        // Numeric values
        return <span key={index} className="text-indigo-600 font-medium">{part}</span>
      }
      return <span key={index}>{part}</span>
    })
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
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())
  const [eventSearchQuery, setEventSearchQuery] = useState('')
  const [manualPeriod, setManualPeriod] = useState({
    start: '',
    end: '',
    plant: '',
    machineNo: ''
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
    const selectedEvents = availableEvents.filter(e => selectedEventIds.has(e.id))
    const eventsToAdd: EventInfo[] = selectedResults.map(result => ({
      id: `trigger_${result.id}_${Date.now()}`,
      plant: searchPeriodType === 'manual' ? manualPeriod.plant : 'Signal Detection',
      machineNo: searchPeriodType === 'manual' ? manualPeriod.machineNo : 'AUTO',
      label: triggerLegend,
      labelDescription: `Conditions: ${result.matchedConditions.join(', ')} | Search period: ${searchPeriodType === 'manual' ? 'Manual' : `${selectedEvents.length} events`}`,
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

  const [triggerLegend, setTriggerLegend] = useState('')
  const [savedConditions, setSavedConditions] = useState<Array<{
    id: string
    name: string
    expression: string
    conditions: SearchCondition[]
    createdAt: string
  }>>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveConditionName, setSaveConditionName] = useState('')

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
      ? selectedEventIds.size > 0
      : manualPeriod.start && manualPeriod.end && manualPeriod.plant && manualPeriod.machineNo
    
    const hasValidConditions = conditionMode === 'predefined' 
      ? selectedPredefinedCondition !== ''
      : validateConditions(searchConditions)
    
    const hasValidLegend = triggerLegend.trim() !== ''
    
    return hasValidPeriod && hasValidConditions && hasValidLegend
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

  const getCurrentExpressionJSX = (): React.ReactNode => {
    if (conditionMode === 'predefined') {
      const predefined = predefinedConditions.find(c => c.id === selectedPredefinedCondition)
      if (!predefined) return <span className="text-muted-foreground">No condition selected</span>
      
      // Parse the predefined expression for color coding
      const expression = predefined.expression
      const coloredExpression = expression
        .split(/(\bAND\b|\bOR\b|\(|\)|>|<|>=|<=|=|!=)/)
        .map((part, index) => {
          if (part === 'AND' || part === 'OR') {
            return <span key={index} className="text-rose-600 font-semibold mx-1">{part}</span>
          } else if (part === '(' || part === ')') {
            return <span key={index} className="text-amber-600 font-semibold">{part}</span>
          } else if (['>', '<', '>=', '<=', '=', '!='].includes(part)) {
            return <span key={index} className="text-teal-600 font-semibold">{part}</span>
          } else if (part.trim() && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(part.trim())) {
            // Parameter names
            return <span key={index} className="text-slate-700 font-medium">{part}</span>
          } else if (part.trim() && /^\d+(\.\d+)?$/.test(part.trim())) {
            // Numeric values
            return <span key={index} className="text-indigo-600 font-medium">{part}</span>
          }
          return <span key={index}>{part}</span>
        })
      
      return <>{coloredExpression}</>
    }
    return formatConditionExpressionToJSX(searchConditions)
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

  // Filter events based on search query
  const filteredEvents = availableEvents.filter(event => {
    if (!eventSearchQuery) return true
    
    const query = eventSearchQuery.toLowerCase()
    return (
      event.plant.toLowerCase().includes(query) ||
      event.machineNo.toLowerCase().includes(query) ||
      event.label.toLowerCase().includes(query) ||
      (event.labelDescription && event.labelDescription.toLowerCase().includes(query)) ||
      event.event.toLowerCase().includes(query) ||
      (event.eventDetail && event.eventDetail.toLowerCase().includes(query))
    )
  })

  const saveCurrentCondition = () => {
    if (!saveConditionName.trim()) return
    
    const currentConditions = getCurrentConditions()
    const currentExpression = getCurrentExpression()
    
    const newSavedCondition = {
      id: `saved_${Date.now()}`,
      name: saveConditionName.trim(),
      expression: currentExpression,
      conditions: JSON.parse(JSON.stringify(currentConditions)), // Deep clone
      createdAt: new Date().toISOString()
    }
    
    setSavedConditions([...savedConditions, newSavedCondition])
    setSaveConditionName('')
    setShowSaveDialog(false)
  }

  const loadSavedCondition = (savedCondition: typeof savedConditions[0]) => {
    // Load the saved conditions
    setSearchConditions(JSON.parse(JSON.stringify(savedCondition.conditions)))
    setConditionMode('manual')
    setLoadedFromPredefined(null)
    setSelectedPredefinedCondition('')
  }

  const deleteSavedCondition = (conditionId: string) => {
    setSavedConditions(savedConditions.filter(c => c.id !== conditionId))
  }

  return (
    <>
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
                    className="flex gap-6"
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
                      <div className="border rounded-lg overflow-hidden max-h-64">
                        <div className="p-3 bg-muted/30 border-b">
                          <div className="flex items-center justify-between gap-4">
                            <Label className="text-sm font-medium">Select Events for Period Range:</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Search events..."
                                value={eventSearchQuery}
                                onChange={(e) => setEventSearchQuery(e.target.value)}
                                className="h-7 w-48 text-xs"
                              />
                              <div className="text-xs text-muted-foreground whitespace-nowrap">
                                {selectedEventIds.size} of {filteredEvents.length} selected
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-48">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">
                                  <Checkbox
                                    checked={filteredEvents.length > 0 && filteredEvents.every(e => selectedEventIds.has(e.id))}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        const newSelected = new Set(selectedEventIds)
                                        filteredEvents.forEach(e => newSelected.add(e.id))
                                        setSelectedEventIds(newSelected)
                                      } else {
                                        const newSelected = new Set(selectedEventIds)
                                        filteredEvents.forEach(e => newSelected.delete(e.id))
                                        setSelectedEventIds(newSelected)
                                      }
                                    }}
                                    className="h-3 w-3"
                                  />
                                </TableHead>
                                <TableHead className="h-8 text-xs px-2">Plant</TableHead>
                                <TableHead className="h-8 text-xs px-2">Machine</TableHead>
                                <TableHead className="h-8 text-xs px-2">Label</TableHead>
                                <TableHead className="h-8 text-xs px-2">Event</TableHead>
                                <TableHead className="h-8 text-xs px-2">Start</TableHead>
                                <TableHead className="h-8 text-xs px-2">End</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredEvents.length > 0 ? filteredEvents.map((event) => (
                                <TableRow 
                                  key={event.id}
                                  className={`cursor-pointer ${selectedEventIds.has(event.id) ? "bg-primary/10" : ""}`}
                                  onClick={() => {
                                    const newSelectedIds = new Set(selectedEventIds)
                                    if (selectedEventIds.has(event.id)) {
                                      newSelectedIds.delete(event.id)
                                    } else {
                                      newSelectedIds.add(event.id)
                                    }
                                    setSelectedEventIds(newSelectedIds)
                                  }}
                                >
                                  <TableCell className="px-1 py-1">
                                    <Checkbox
                                      checked={selectedEventIds.has(event.id)}
                                      onCheckedChange={(checked) => {
                                        const newSelectedIds = new Set(selectedEventIds)
                                        if (checked) {
                                          newSelectedIds.add(event.id)
                                        } else {
                                          newSelectedIds.delete(event.id)
                                        }
                                        setSelectedEventIds(newSelectedIds)
                                      }}
                                      className="h-3 w-3"
                                    />
                                  </TableCell>
                                  <TableCell className="px-2 py-1 text-xs">{event.plant}</TableCell>
                                  <TableCell className="px-2 py-1 text-xs">{event.machineNo}</TableCell>
                                  <TableCell className="px-2 py-1 text-xs">
                                    <div className="leading-tight">
                                      <div>{event.label}</div>
                                      <div className="text-muted-foreground">{event.labelDescription || ""}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-2 py-1 text-xs">
                                    <div className="leading-tight">
                                      <div>{event.event}</div>
                                      <div className="text-muted-foreground">{event.eventDetail || ""}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-2 py-1 text-xs">
                                    <div>
                                      <div>{event.start.split("T")[0]}</div>
                                      <div>{event.start.split("T")[1]}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-2 py-1 text-xs">
                                    <div>
                                      <div>{event.end.split("T")[0]}</div>
                                      <div>{event.end.split("T")[1]}</div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )) : (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground text-xs">
                                    {eventSearchQuery ? 'No events found matching your search.' : 'No events available.'}
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
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
                  {/* Legend Setting */}
                  <div className="border rounded-lg p-3 bg-muted/20">
                    <Label htmlFor="trigger-legend" className="text-sm font-medium">
                      Trigger Signal Legend <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="trigger-legend"
                      value={triggerLegend}
                      onChange={(e) => setTriggerLegend(e.target.value)}
                      placeholder="Enter legend for trigger signals"
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This legend will be used for all detected trigger signal events.
                    </p>
                  </div>

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
                                    {colorCodeExpressionString(condition.expression)}
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
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Current Expression
                          {conditionMode === 'manual' && loadedFromPredefined && (
                            <span className="ml-2 text-xs text-blue-600">(Modified from preset)</span>
                          )}
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setShowSaveDialog(true)}
                          disabled={getCurrentExpression() === 'No conditions set' || getCurrentExpression() === 'No condition selected'}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          条件登録
                        </Button>
                      </div>
                      <div className="border rounded-lg p-4 bg-muted/20 min-h-[100px]">
                        <div className="font-mono text-sm break-words">
                          {getCurrentExpressionJSX()}
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
                        
                        {/* Expression explanation with color coding */}
                        <div className="mt-4 pt-3 border-t border-muted">
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-700 font-medium">parameters</span>
                              <span className="text-teal-600 font-semibold">&gt; &lt; =</span>
                              <span className="text-indigo-600 font-medium">values</span>
                              <span className="text-rose-600 font-semibold">AND OR</span>
                              <span className="text-amber-600 font-semibold">( )</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-rose-600 rounded-full"></span>
                              <span>AND: All conditions must be true, OR: Any condition can be true</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                              <span>( ): Grouped conditions for complex logic</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Saved Conditions Section */}
                      {savedConditions.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-xs font-medium text-muted-foreground mb-2">保存済み条件</h5>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {savedConditions.map((saved) => (
                              <div key={saved.id} className="flex items-center gap-2 p-2 border rounded text-xs">
                                <div className="flex-1">
                                  <div className="font-medium">{saved.name}</div>
                                  <div className="text-muted-foreground font-mono text-[10px] truncate">
                                    {colorCodeExpressionString(saved.expression)}
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => loadSavedCondition(saved)}
                                >
                                  読込
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => deleteSavedCondition(saved.id)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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

    {/* Save Condition Dialog */}
    <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>トリガー信号条件を登録</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="condition-name">条件名 <span className="text-red-500">*</span></Label>
            <Input
              id="condition-name"
              value={saveConditionName}
              onChange={(e) => setSaveConditionName(e.target.value)}
              placeholder="条件に名前を付けてください"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">保存される条件式:</Label>
            <div className="mt-1 p-3 border rounded bg-muted/20 font-mono text-xs break-words">
              {getCurrentExpressionJSX()}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
            キャンセル
          </Button>
          <Button 
            onClick={saveCurrentCondition}
            disabled={!saveConditionName.trim()}
          >
            登録
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}