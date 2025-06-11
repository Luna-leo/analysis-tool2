import React, { useCallback, useMemo } from 'react';
import { Edit2, Copy, Trash2, Star, StarOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UnitConverterFormula, UNIT_CATEGORIES } from '@/types/unit-converter';
import { useUnitConverterFormulaStore } from '@/stores/useUnitConverterFormulaStore';

interface UnitConverterFormulaCardProps {
  formula: UnitConverterFormula;
}

export const UnitConverterFormulaCard = React.memo(({ formula }: UnitConverterFormulaCardProps) => {
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
      <CardContent className="p-3 relative">
        {/* Category badge and favorite at top right */}
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <Badge variant="secondary" className="text-xs h-5">
            {UNIT_CATEGORIES[formula.category]}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleFavorite}
            className="h-5 w-5 p-0"
          >
            {formula.isFavorite ? (
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Action buttons below category */}
        <div className="absolute top-9 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDuplicate}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-6 w-6 p-0"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-6 w-6 p-0 hover:text-red-600"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Unit names */}
        <div className="text-xs text-muted-foreground mb-2 pr-20">
          {formula.fromUnit.name} → {formula.toUnit.name}
        </div>

        {/* Unit symbols */}
        <div className="flex items-center gap-2 mb-2">
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

        {/* Description - if exists */}
        {formula.description && (
          <p className="text-xs text-muted-foreground mb-2">
            {formula.description}
          </p>
        )}

        {/* Formula with examples */}
        <div className="text-xs">
          {formula.isBidirectional && formula.reverseFormula ? (
            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 items-center">
              <code className="bg-blue-100/50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                {formula.fromUnit.primarySymbol} = {formula.reverseFormula.replace(/x/g, formula.toUnit.primarySymbol)}
              </code>
              <span className="text-muted-foreground">
                {sampleConversions?.reverse && `e.g. ${sampleConversions.reverse.input} → ${sampleConversions.reverse.output}`}
              </span>
              <code className="bg-green-100/50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                {formula.toUnit.primarySymbol} = {formula.formula.replace(/x/g, formula.fromUnit.primarySymbol)}
              </code>
              <span className="text-muted-foreground">
                {sampleConversions?.forward && `e.g. ${sampleConversions.forward.input} → ${sampleConversions.forward.output}`}
              </span>
            </div>
          ) : (
            <div>
              <code className="bg-green-100/50 dark:bg-green-900/20 px-2 py-0.5 rounded inline-block">
                {formula.toUnit.primarySymbol} = {formula.formula.replace(/x/g, formula.fromUnit.primarySymbol)}
              </code>
              {sampleConversions?.forward && (
                <span className="text-muted-foreground ml-2">
                  e.g. {sampleConversions.forward.input} → {sampleConversions.forward.output}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Alias display - color-coded and always visible */}
        {(formula.fromUnit.aliases.length > 0 || formula.toUnit.aliases.length > 0) && (
          <div className="mt-2 space-y-1">
            <div className="text-xs text-muted-foreground">Also recognizes:</div>
            <div className="flex flex-wrap gap-1.5">
              {formula.fromUnit.aliases.map((alias, index) => (
                <Badge 
                  key={`from-${index}`} 
                  className="text-xs h-5 px-2 bg-blue-100/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                >
                  {alias}
                </Badge>
              ))}
              {formula.toUnit.aliases.map((alias, index) => (
                <Badge 
                  key={`to-${index}`} 
                  className="text-xs h-5 px-2 bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800"
                >
                  {alias}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Usage count - at the bottom */}
        {formula.usageCount > 0 && (
          <div className="text-xs text-muted-foreground mt-2">
            Used {formula.usageCount} times
          </div>
        )}
      </CardContent>
    </Card>
  );
});