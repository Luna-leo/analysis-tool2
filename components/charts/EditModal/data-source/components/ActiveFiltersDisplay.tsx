import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useTriggerConditionStore } from '@/stores/useTriggerConditionStore';

interface ActiveFiltersDisplayProps {
  activeFilterIds: string[];
  onRemoveFilter: (filterId: string) => void;
  onClearAll: () => void;
}

export function ActiveFiltersDisplay({
  activeFilterIds,
  onRemoveFilter,
  onClearAll
}: ActiveFiltersDisplayProps) {
  const { getConditionById } = useTriggerConditionStore();
  
  if (activeFilterIds.length === 0) return null;
  
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <span className="text-xs text-muted-foreground">Active filters:</span>
      {activeFilterIds.map(filterId => {
        const condition = getConditionById(filterId);
        if (!condition) return null;
        
        return (
          <Badge key={filterId} variant="secondary" className="flex items-center gap-1">
            <span className="max-w-[150px] truncate">{condition.name}</span>
            <button
              onClick={() => onRemoveFilter(filterId)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}
      {activeFilterIds.length > 1 && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearAll}
          className="h-6 px-2 text-xs"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}