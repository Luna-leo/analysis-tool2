import React, { useState, useCallback, useMemo } from 'react';
import { Edit2, Copy, Trash2, Star, StarOff, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { UnitConverterFormula, UNIT_CATEGORIES } from '@/types/unit-converter';
import { useUnitConverterFormulaStore } from '@/stores/useUnitConverterFormulaStore';

interface UnitConverterFormulaCardProps {
  formula: UnitConverterFormula;
}

export const UnitConverterFormulaCard = React.memo(({ formula }: UnitConverterFormulaCardProps) => {
  const [isAliasOpen, setIsAliasOpen] = useState(false);
  
  const { 
    openDialog, 
    deleteFormula, 
    duplicateFormula, 
    toggleFavorite,
    incrementUsageCount 
  } = useUnitConverterFormulaStore();

  const handleEdit = useCallback(() => {
    openDialog('edit', formula);
  }, [openDialog, formula]);

  const handleDuplicate = useCallback(() => {
    duplicateFormula(formula.id);
  }, [duplicateFormula, formula.id]);

  const handleDelete = useCallback(() => {
    deleteFormula(formula.id);
  }, [deleteFormula, formula.id]);

  const handleToggleFavorite = useCallback(() => {
    toggleFavorite(formula.id);
  }, [toggleFavorite, formula.id]);

  // Calculate sample conversions
  const sampleConversions = useMemo(() => {
    try {
      const result: any = {};
      
      // Forward conversion
      const forwardFunc = new Function('x', `return ${formula.formula}`);
      const forwardResult = forwardFunc(1);
      result.forward = {
        input: `1${formula.fromUnit.primarySymbol}`,
        output: `${forwardResult.toFixed(2)}${formula.toUnit.primarySymbol}`
      };
      
      // Reverse conversion (if bidirectional)
      if (formula.isBidirectional && formula.reverseFormula) {
        const reverseFunc = new Function('x', `return ${formula.reverseFormula}`);
        const reverseResult = reverseFunc(1);
        result.reverse = {
          input: `1${formula.toUnit.primarySymbol}`,
          output: `${reverseResult.toFixed(2)}${formula.fromUnit.primarySymbol}`
        };
      }
      
      return result;
    } catch {
      return null;
    }
  }, [formula.formula, formula.reverseFormula, formula.isBidirectional, formula.fromUnit.primarySymbol, formula.toUnit.primarySymbol]);

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        {/* Unit names and category at the top */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <div>
            {formula.fromUnit.name} → {formula.toUnit.name}
          </div>
          <Badge variant="outline" className="text-xs h-5">
            {UNIT_CATEGORIES[formula.category]}
          </Badge>
        </div>

        {/* Compact header with conversion direction */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            {/* Conversion direction display - large and prominent */}
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg w-14 h-14 flex items-center justify-center">
                <span className="font-bold text-xl text-blue-700 dark:text-blue-300">{formula.fromUnit.primarySymbol}</span>
              </div>
              <span className="text-muted-foreground text-lg">
                {formula.isBidirectional ? '⇄' : '→'}
              </span>
              <div className="bg-green-100 dark:bg-green-900/30 rounded-lg w-14 h-14 flex items-center justify-center">
                <span className="font-bold text-xl text-green-700 dark:text-green-300">{formula.toUnit.primarySymbol}</span>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              className="h-7 w-7 p-0"
            >
              {formula.isFavorite ? (
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDuplicate}
              className="h-7 w-7 p-0"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-7 w-7 p-0"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-7 w-7 p-0 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Description - if exists */}
        {formula.description && (
          <p className="text-xs text-muted-foreground mb-2">
            {formula.description}
          </p>
        )}

        {/* Formula with examples */}
        <div className="flex gap-2 text-xs">
          {formula.isBidirectional && formula.reverseFormula ? (
            <>
              <div className="flex-1">
                <code className="bg-blue-100/50 dark:bg-blue-900/20 px-2 py-0.5 rounded block">
                  {formula.fromUnit.primarySymbol} = {formula.reverseFormula.replace(/x/g, formula.toUnit.primarySymbol)}
                </code>
                {sampleConversions?.reverse && (
                  <div className="text-muted-foreground mt-0.5 ml-2">
                    e.g. {sampleConversions.reverse.input} → {sampleConversions.reverse.output}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <code className="bg-green-100/50 dark:bg-green-900/20 px-2 py-0.5 rounded block">
                  {formula.toUnit.primarySymbol} = {formula.formula.replace(/x/g, formula.fromUnit.primarySymbol)}
                </code>
                {sampleConversions?.forward && (
                  <div className="text-muted-foreground mt-0.5 ml-2">
                    e.g. {sampleConversions.forward.input} → {sampleConversions.forward.output}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1">
              <code className="bg-green-100/50 dark:bg-green-900/20 px-2 py-0.5 rounded block">
                {formula.toUnit.primarySymbol} = {formula.formula.replace(/x/g, formula.fromUnit.primarySymbol)}
              </code>
              {sampleConversions?.forward && (
                <div className="text-muted-foreground mt-0.5 ml-2">
                  e.g. {sampleConversions.forward.input} → {sampleConversions.forward.output}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Usage count - inline if exists */}
        {formula.usageCount > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            Used {formula.usageCount} times
          </div>
        )}

        {/* Alias display - more compact */}
        {(formula.fromUnit.aliases.length > 0 || formula.toUnit.aliases.length > 0) && (
          <Collapsible open={isAliasOpen} onOpenChange={setIsAliasOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between px-1 h-6 mt-2">
                <span className="text-xs">Also recognizes: {[...formula.fromUnit.aliases, ...formula.toUnit.aliases].slice(0, 3).join(', ')}{[...formula.fromUnit.aliases, ...formula.toUnit.aliases].length > 3 ? '...' : ''}</span>
                {isAliasOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-1 text-xs space-y-1">
                {formula.fromUnit.aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-muted-foreground">{formula.fromUnit.name}:</span>
                    {formula.fromUnit.aliases.map((alias, index) => (
                      <Badge key={index} variant="outline" className="text-xs h-4 px-1">
                        {alias}
                      </Badge>
                    ))}
                  </div>
                )}
                {formula.toUnit.aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-muted-foreground">{formula.toUnit.name}:</span>
                    {formula.toUnit.aliases.map((alias, index) => (
                      <Badge key={index} variant="outline" className="text-xs h-4 px-1">
                        {alias}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
});