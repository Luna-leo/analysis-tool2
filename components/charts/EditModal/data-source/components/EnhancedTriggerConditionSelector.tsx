import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandSeparator } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Edit2, Copy, Plus, Filter, Check, X } from 'lucide-react';
import { useTriggerConditionStore } from '@/stores/useTriggerConditionStore';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

interface EnhancedTriggerConditionSelectorProps {
  activeFilterIds: string[];
  onFiltersChange: (filterIds: string[]) => void;
  disabled?: boolean;
  displayedItemsCount?: number;
  totalItemsCount?: number;
}

export function EnhancedTriggerConditionSelector({
  activeFilterIds,
  onFiltersChange,
  disabled = false,
  displayedItemsCount,
  totalItemsCount
}: EnhancedTriggerConditionSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [hoveredItemId, setHoveredItemId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const { conditions, duplicateCondition } = useTriggerConditionStore();
  const { openSearchConditionDialog } = useUIStore();
  
  const filteredConditions = React.useMemo(() => {
    if (!searchQuery) return conditions;
    
    const query = searchQuery.toLowerCase();
    return conditions.filter(condition => 
      condition.name.toLowerCase().includes(query) ||
      condition.description?.toLowerCase().includes(query)
    );
  }, [conditions, searchQuery]);
  
  const handleToggleFilter = (conditionId: string) => {
    if (activeFilterIds.includes(conditionId)) {
      onFiltersChange(activeFilterIds.filter(id => id !== conditionId));
    } else {
      onFiltersChange([...activeFilterIds, conditionId]);
    }
  };
  
  const handleEdit = (e: React.MouseEvent, conditionId: string) => {
    e.stopPropagation();
    openSearchConditionDialog(conditionId);
    setOpen(false);
  };
  
  const handleDuplicate = (e: React.MouseEvent, conditionId: string) => {
    e.stopPropagation();
    const newConditionId = duplicateCondition(conditionId);
    if (newConditionId) {
      openSearchConditionDialog(newConditionId);
    }
    setOpen(false);
  };
  
  const handleAddNew = () => {
    openSearchConditionDialog();
    setOpen(false);
  };
  
  const handleClearAll = () => {
    onFiltersChange([]);
  };
  
  const getButtonLabel = () => {
    if (activeFilterIds.length === 0) {
      return "Filter by Conditions";
    }
    if (activeFilterIds.length === 1) {
      const condition = conditions.find(c => c.id === activeFilterIds[0]);
      return condition ? condition.name : "Filter by Conditions";
    }
    return `${activeFilterIds.length} filters active`;
  };
  
  const showFilteredCount = displayedItemsCount !== undefined && totalItemsCount !== undefined && 
                            activeFilterIds.length > 0 && displayedItemsCount !== totalItemsCount;
  
  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select trigger conditions"
            className={cn(
              "w-full justify-between",
              activeFilterIds.length > 0 && "border-primary"
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="truncate">{getButtonLabel()}</span>
              {activeFilterIds.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterIds.length}
                </Badge>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search conditions..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandEmpty>No conditions found.</CommandEmpty>
            {activeFilterIds.length > 0 && (
              <>
                <CommandGroup>
                  <CommandItem
                    onSelect={handleClearAll}
                    className="text-destructive cursor-pointer"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear all filters
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            <CommandGroup className="max-h-[300px] overflow-auto">
              {filteredConditions.map((condition) => (
                <CommandItem
                  key={condition.id}
                  value={condition.id}
                  onSelect={() => handleToggleFilter(condition.id)}
                  onMouseEnter={() => setHoveredItemId(condition.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={cn(
                      "h-4 w-4 border rounded flex items-center justify-center",
                      activeFilterIds.includes(condition.id) && "bg-primary border-primary"
                    )}>
                      {activeFilterIds.includes(condition.id) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{condition.name}</div>
                      {condition.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {condition.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {hoveredItemId === condition.id && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleEdit(e, condition.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDuplicate(e, condition.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CommandItem>
              ))}
              <CommandSeparator />
              <CommandItem
                onSelect={handleAddNew}
                className="flex items-center gap-2 text-primary cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Condition</span>
              </CommandItem>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {showFilteredCount && (
        <div className="text-xs text-muted-foreground mt-1">
          Showing {displayedItemsCount} of {totalItemsCount} items
        </div>
      )}
    </div>
  );
}