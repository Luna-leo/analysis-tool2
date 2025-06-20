# Unified Margin System

## Overview

The unified margin system provides consistent chart margins across all grid layouts (1x1, 2x2, 3x3, 4x4, etc.) by using a simple, predictable calculation method.

## Design Principles

1. **Proportional Scaling**: Margins scale with container size using fixed ratios
2. **Content Protection**: Minimum margins ensure axis labels are always visible
3. **Maximum Limits**: Prevent excessive margins on large displays

## Configuration

The system uses three levels of constraints:

### Base Ratios (percentage of container)
- Top: 8%
- Right: 5%
- Bottom: 12%
- Left: 10%

### Minimum Values (pixels)
- Top: 20px (for title)
- Right: 15px (padding)
- Bottom: 35px (X-axis label)
- Left: 45px (Y-axis label)

### Maximum Values (pixels)
- Top: 60px
- Right: 60px
- Bottom: 80px
- Left: 80px

## Calculation Formula

```typescript
margin = Math.min(
  maximum,
  Math.max(
    minimum,
    containerSize * ratio
  )
)
```

## Usage

Enable the unified margin system by setting `marginMode: 'unified'` in chart settings:

```typescript
const chartSettings = {
  marginMode: 'unified',
  // other settings...
}
```

## Benefits

1. **Consistency**: All grid layouts have the same visual proportions
2. **Simplicity**: Single calculation method for all cases
3. **Predictability**: Easy to understand and debug
4. **Maintainability**: No special cases or overrides needed

## Migration

The system is backward compatible. Existing charts will continue to use their current margin settings unless explicitly updated to use the unified mode.