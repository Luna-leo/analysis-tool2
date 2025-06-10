import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { ChevronDown, Edit2, Copy, Plus, Filter } from 'lucide-react';
import { useTriggerConditionStore } from '@/stores/useTriggerConditionStore';
import { useUIStore } from '@/stores/useUIStore';

interface TriggerConditionSelectorProps {
  selectedConditionId?: string;
  onSelect: (conditionId: string) => void;
  disabled?: boolean;
}

export function TriggerConditionSelector({
  selectedConditionId,
  onSelect,
  disabled = false
}: TriggerConditionSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [hoveredItemId, setHoveredItemId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const { conditions, duplicateCondition } = useTriggerConditionStore();
  const { openSearchConditionDialog } = useUIStore();
  
  const selectedCondition = conditions.find(c => c.id === selectedConditionId);
  
  const filteredConditions = React.useMemo(() => {
    if (!searchQuery) return conditions;
    
    const query = searchQuery.toLowerCase();
    return conditions.filter(condition => 
      condition.name.toLowerCase().includes(query) ||
      condition.description?.toLowerCase().includes(query)
    );
  }, [conditions, searchQuery]);
  
  const handleSelect = (conditionId: string) => {
    onSelect(conditionId);
    setOpen(false);
    setSearchQuery('');
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
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select trigger condition"
          className="w-full justify-between"
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {selectedCondition ? selectedCondition.name : "Filter by Conditions"}
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
          <CommandGroup className="max-h-[300px] overflow-auto">
            {filteredConditions.map((condition) => (
              <CommandItem
                key={condition.id}
                value={condition.id}
                onSelect={() => handleSelect(condition.id)}
                onMouseEnter={() => setHoveredItemId(condition.id)}
                onMouseLeave={() => setHoveredItemId(null)}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{condition.name}</div>
                  {condition.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {condition.description}
                    </div>
                  )}
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
  );
}