import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandSeparator } from '@/components/ui/command';
import { ChevronDown, Edit2, Copy, Plus, Filter, Check, X } from 'lucide-react';
import { useTriggerConditionStore } from '@/stores/useTriggerConditionStore';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

interface EnhancedTriggerConditionSelectorProps {
  activeFilterId: string | null;
  onFilterChange: (filterId: string | null) => void;
  disabled?: boolean;
  displayedItemsCount?: number;
  totalItemsCount?: number;
}

export function EnhancedTriggerConditionSelector({
  activeFilterId,
  onFilterChange,
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
  
  const handleSelectFilter = (conditionId: string) => {
    if (activeFilterId === conditionId) {
      onFilterChange(null); // Deselect if clicking the same filter
    } else {
      onFilterChange(conditionId);
    }
    setOpen(false); // Close the popover after selection
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
  
  const handleClear = () => {
    onFilterChange(null);
    setOpen(false);
  };
  
  const getButtonLabel = () => {
    if (disabled) {
      return "Select items to filter";
    }
    if (!activeFilterId) {
      return "Filter by Conditions";
    }
    const condition = conditions.find(c => c.id === activeFilterId);
    return condition ? condition.name : "Filter by Conditions";
  };
  
  const showFilteredCount = displayedItemsCount !== undefined && totalItemsCount !== undefined && 
                            activeFilterId && displayedItemsCount !== totalItemsCount;
  
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
              activeFilterId && "border-primary"
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="truncate">{getButtonLabel()}</span>
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
            {activeFilterId && (
              <>
                <CommandGroup>
                  <CommandItem
                    onSelect={handleClear}
                    className="text-destructive cursor-pointer"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear filter
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
                  onSelect={() => handleSelectFilter(condition.id)}
                  onMouseEnter={() => setHoveredItemId(condition.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {activeFilterId === condition.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
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