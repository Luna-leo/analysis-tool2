# Unified Margin System

## Overview

The unified margin system provides consistent chart margins across all grid layouts (1x1, 2x2, 3x3, 4x4, etc.) by using a simple, predictable calculation method.

## Design Principles

1. **Proportional Scaling**: Margins scale with container size using fixed ratios
2. **Content Protection**: Minimum margins ensure axis labels are always visible
3. **Maximum Limits**: Prevent excessive margins on large displays

## Configuration

The system uses three levels of constraints:

### Default Configuration (Base)
#### Base Ratios (percentage of container)
- Top: 8%
- Right: 5%
- Bottom: 12%
- Left: 10%

#### Minimum Values (pixels)
- Top: 20px (for title)
- Right: 15px (padding)
- Bottom: 35px (X-axis label)
- Left: 45px (Y-axis label)

#### Maximum Values (pixels)
- Top: 60px
- Right: 60px
- Bottom: 80px
- Left: 80px

### Layout-Specific Adjustments

The system automatically adjusts left margins based on grid density:

#### Large Layouts (1x1, 1x2, 2x1, 2x2)
- Left ratio: 10%
- Left minimum: 45px
- Left maximum: 80px

#### Medium Layouts (2x3, 3x2)
- Left ratio: 11%
- Left minimum: 50px
- Left maximum: 90px

#### Small Layouts (3x3)
- Left ratio: 12%
- Left minimum: 55px
- Left maximum: 100px

#### Ultra-Small Layouts (3x4, 4x3, 4x4+)
- Left ratio: 10%
- Left minimum: 45px
- Left maximum: 70px
- Additional reductions for all margins to maximize space

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

## Dynamic Layout Adjustments

The system automatically categorizes layouts and applies appropriate margins:

### Layout Categories
1. **Large** (≤4 cells): Optimized for spacious displays
2. **Medium** (5-6 cells): Balanced margins
3. **Small** (7-9 cells): Increased left margin for Y-axis labels
4. **Ultra-Small** (≥10 cells): Space-optimized with minimal margins

### Ultra-Small Layout Special Handling

For ultra-small layouts (3x4, 4x3, 4x4+), additional optimizations are applied:

#### Adjusted Base Ratios
- Top: 6% (reduced from 8%)
- Right: 4% (reduced from 5%)
- Bottom: 8% (reduced from 12%)
- Left: 10% (balanced for space constraints)

#### Adjusted Minimums
- Top: 15px (reduced from 20px)
- Right: 10px (reduced from 15px)
- Bottom: 20px (reduced from 35px)
- Left: 45px (maintained for Y-axis labels)

#### Adjusted Maximums
- Top: 40px (reduced from 60px)
- Right: 40px (reduced from 60px)
- Bottom: 50px (reduced from 80px)
- Left: 70px (limited for space optimization)

### Dynamic Label Offsets

The system also adjusts axis label offsets based on layout:
- **4x4 layouts**: X-axis offset 25px (reduced from 30px)
- **3x3 layouts**: X-axis offset 28px (slightly reduced)
- **Other layouts**: X-axis offset 30px (default)

## Benefits

1. **Adaptive**: Automatically adjusts margins based on grid density
2. **Optimized**: Each layout category gets appropriate spacing
3. **Balanced**: Prevents both cramped and overly spacious layouts
4. **Predictable**: Clear rules for each layout category
5. **Maintainable**: Centralized configuration for easy adjustments
6. **Flexible**: Special handling for extreme layouts while maintaining consistency

## Migration

The system is backward compatible. Existing charts will continue to use their current margin settings unless explicitly updated to use the unified mode.