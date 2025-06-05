import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ConditionBuilder } from './ConditionBuilder'
import { predefinedConditions } from '@/data/predefinedConditions'
import { colorCodeExpressionString } from '@/lib/conditionUtils'
import { SearchCondition } from '@/types'
import { Edit2, Save, Minus } from "lucide-react"

interface SavedCondition {
  id: string
  name: string
  expression: string
  conditions: SearchCondition[]
  createdAt: string
}

interface SearchConditionsSectionProps {
  conditionMode: 'predefined' | 'manual'
  onConditionModeChange: (mode: 'predefined' | 'manual') => void
  selectedPredefinedCondition: string
  onSelectedPredefinedConditionChange: (id: string) => void
  loadedFromPredefined: string | null
  searchConditions: SearchCondition[]
  onSearchConditionsChange: (conditions: SearchCondition[]) => void
  savedConditions: SavedCondition[]
  getCurrentExpressionJSX: () => React.ReactNode
  onLoadPredefinedCondition: (id: string) => void
  onResetToFresh: () => void
  onShowSaveDialog: () => void
  onLoadSavedCondition: (condition: SavedCondition) => void
  onDeleteSavedCondition: (id: string) => void
}

export const SearchConditionsSection: React.FC<SearchConditionsSectionProps> = ({
  conditionMode,
  onConditionModeChange,
  selectedPredefinedCondition,
  onSelectedPredefinedConditionChange,
  loadedFromPredefined,
  searchConditions,
  onSearchConditionsChange,
  savedConditions,
  getCurrentExpressionJSX,
  onLoadPredefinedCondition,
  onResetToFresh,
  onShowSaveDialog,
  onLoadSavedCondition,
  onDeleteSavedCondition
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Search Conditions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Condition Mode Selection */}
        <RadioGroup
          value={conditionMode}
          onValueChange={(value) => {
            onConditionModeChange(value as 'predefined' | 'manual')
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
                        onClick={() => onSelectedPredefinedConditionChange(condition.id)}
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
                            onClick={() => onSelectedPredefinedConditionChange(condition.id)}
                          />
                        </RadioGroup>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            onLoadPredefinedCondition(condition.id)
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
                        onClick={onResetToFresh}
                      >
                        Start Fresh
                      </Button>
                    </div>
                  </div>
                )}
                
                <ConditionBuilder
                  conditions={searchConditions}
                  onChange={onSearchConditionsChange}
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
                onClick={onShowSaveDialog}
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
                        onClick={() => onLoadSavedCondition(saved)}
                      >
                        読込
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onDeleteSavedCondition(saved.id)}
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
  )
}