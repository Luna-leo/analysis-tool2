import React, { useState, useCallback, useMemo } from 'react';
import { MoreVertical, Edit, Copy, Trash, Star, StarOff, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { UnitConverterFormula, UNIT_CATEGORIES } from '@/types/unit-converter';
import { useUnitConverterFormulaStore } from '@/stores/useUnitConverterFormulaStore';

interface UnitConverterFormulaCardProps {
  formula: UnitConverterFormula;
}

export const UnitConverterFormulaCard = React.memo(({ formula }: UnitConverterFormulaCardProps) => {
  const [isAliasOpen, setIsAliasOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
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

  // Calculate sample conversion
  const sampleConversion = useMemo(() => {
    try {
      const sampleValue = 1;
      const func = new Function('x', `return ${formula.formula}`);
      const result = func(sampleValue);
      
      return {
        input: `${sampleValue}${formula.fromUnit.primarySymbol}`,
        output: `${result.toFixed(2)}${formula.toUnit.primarySymbol}`
      };
    } catch {
      return null;
    }
  }, [formula.formula, formula.fromUnit.primarySymbol, formula.toUnit.primarySymbol]);

  return (
    <Card 
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        {/* Header section */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-1">{formula.name}</h3>
            <p className="text-sm text-muted-foreground">{formula.description}</p>
          </div>
          
          {/* Action buttons */}
          <div className={`flex items-center gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleToggleFavorite}
            >
              {formula.isFavorite ? (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Category and usage count */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline">{UNIT_CATEGORIES[formula.category]}</Badge>
          {formula.usageCount > 0 && (
            <span className="text-xs text-muted-foreground">
              Usage count: {formula.usageCount}
            </span>
          )}
        </div>

        {/* Conversion direction display */}
        <div className="bg-muted/30 rounded-md p-3 mb-3">
          <div className="flex items-center justify-center gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{formula.fromUnit.primarySymbol}</div>
              <div className="text-xs text-muted-foreground">{formula.fromUnit.name}</div>
            </div>
            <div className="text-muted-foreground">
              {formula.isBidirectional ? '⇄' : '→'}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formula.toUnit.primarySymbol}</div>
              <div className="text-xs text-muted-foreground">{formula.toUnit.name}</div>
            </div>
          </div>
        </div>

        {/* Conversion formula */}
        <div className="mb-3">
          <div className="text-sm font-medium mb-1">Conversion formula:</div>
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {formula.toUnit.primarySymbol} = {formula.formula.replace(/x/g, formula.fromUnit.primarySymbol)}
          </code>
          {formula.isBidirectional && formula.reverseFormula && (
            <div className="mt-1">
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {formula.fromUnit.primarySymbol} = {formula.reverseFormula.replace(/x/g, formula.toUnit.primarySymbol)}
              </code>
            </div>
          )}
        </div>

        {/* Sample conversion */}
        {sampleConversion && (
          <div className="text-sm text-muted-foreground mb-3">
            Example: {sampleConversion.input} = {sampleConversion.output}
          </div>
        )}

        {/* Alias display (expandable) */}
        {(formula.fromUnit.aliases.length > 0 || formula.toUnit.aliases.length > 0) && (
          <Collapsible open={isAliasOpen} onOpenChange={setIsAliasOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between px-2">
                <span className="text-xs">Recognized notations</span>
                {isAliasOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-2 space-y-2">
                {formula.fromUnit.aliases.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {formula.fromUnit.name}:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {formula.fromUnit.primarySymbol}
                      </Badge>
                      {formula.fromUnit.aliases.map((alias, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {alias}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {formula.toUnit.aliases.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {formula.toUnit.name}:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {formula.toUnit.primarySymbol}
                      </Badge>
                      {formula.toUnit.aliases.map((alias, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {alias}
                        </Badge>
                      ))}
                    </div>
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