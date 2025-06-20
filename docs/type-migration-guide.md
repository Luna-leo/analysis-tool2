# Type Definition Migration Guide

## Overview

This guide documents the type system refactoring performed to improve code organization and reduce duplication.

## Key Changes

### 1. Chart Types Consolidation

All chart-related types have been moved to `types/chart-types.ts`:
- `ChartComponent`
- `FileNode`
- `LayoutSettings`
- `ChartSettings`

These types are re-exported from `types/index.ts` for backward compatibility.

### 2. ChartSizes Removal

`ChartSizes` has been removed from the global types as it was only used in `VirtualizedChartGrid.tsx`. It's now defined locally:

```typescript
// In VirtualizedChartGrid.tsx
interface ChartSizes {
  cardMinHeight: number
  chartMinHeight: number
  isCompactLayout: boolean
}
```

### 3. DurationUnit Deprecation

`DurationUnit` has been removed in favor of `TimeUnit` for consistency. The two files that used duration units now use literal types:
- `'s' | 'm' | 'h'` for short durations
- `'seconds' | 'minutes' | 'hours'` for full names

### 4. EventMaster Improvement

`EventMaster` now extends `EventInfo` to reduce duplication:

```typescript
export interface EventMaster extends Omit<EventInfo, 'labelDescription' | 'eventDetail' | 'start' | 'end'> {
  labelDescription: string // Required in EventMaster
  eventDetail: string // Required in EventMaster
  start: Date | string
  end: Date | string
  [key: string]: string | number | boolean | Date | null | undefined
}
```

### 5. Plot Styles vs DataSourceStyle

#### DataSourceStyle (Legacy)
- Used at the **file/grid level** in `FileNode.dataSourceStyles`
- Applies common styling to all charts in a grid
- Kept for backward compatibility
- Located in `types/index.ts`

#### PlotStyle (Recommended)
- Used at the **chart level** for fine-grained control
- Supports different modes: by data source, by parameter, or both
- More flexible and powerful
- Located in `types/plot-style.ts`

Example usage:
```typescript
// File-level styling (DataSourceStyle)
const fileNode: FileNode = {
  dataSourceStyles: {
    'datasource-1': { lineColor: '#ff0000', markerSize: 8 }
  }
}

// Chart-level styling (PlotStyle)
const chart: ChartComponent = {
  plotStyles: {
    mode: 'datasource',
    byDataSource: {
      'datasource-1': {
        marker: { type: 'circle', size: 8, borderColor: '#ff0000', fillColor: '#ffffff' },
        line: { width: 2, color: '#ff0000', style: 'solid' }
      }
    }
  }
}
```

## Migration Steps

1. **Update imports**: All existing imports from `@/types` will continue to work due to re-exports.

2. **Replace DurationUnit**: If you're using `DurationUnit`, replace it with `TimeUnit` or use literal types.

3. **Use PlotStyle for new features**: When implementing new chart styling features, use the PlotStyle system instead of DataSourceStyle.

## Benefits

1. **Better Organization**: Related types are grouped together
2. **Reduced Duplication**: EventMaster extends EventInfo, reducing redundant fields
3. **Type Safety**: Stricter typing with MarkerSettings and LineSettings
4. **Maintainability**: Clear separation between legacy and modern approaches
5. **Performance**: Removing unused global types reduces bundle size

## Future Improvements

1. Migrate all DataSourceStyle usage to PlotStyle
2. Remove legacy verticalLines/horizontalLines in favor of referenceLines
3. Consolidate time-related types further
4. Add more specific types for chart data instead of using `any`