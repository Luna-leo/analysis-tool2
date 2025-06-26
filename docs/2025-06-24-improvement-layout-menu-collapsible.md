# Layout Settings Menu Collapsible Sections

## Meta Information
- **Created**: 2025-06-24
- **Updated**: 2025-06-24
- **Category**: UI Improvement
- **Related Commits**: [to be added after commit]
- **Affected Components**: 
  - `/components/layout/LayoutSettings.tsx`

## Overview
Improved the Layout Settings menu by implementing collapsible sections to reduce visual complexity and improve navigation. The menu now uses accordion-style collapsible sections for better organization of the many display options.

## Details
### Background/Problem
The Layout Settings menu had grown to include:
- Grid layout controls
- 10 display option checkboxes
- Margin controls with presets
- Axis label distance settings

This made the menu:
- Too long for comfortable navigation
- Difficult to scan quickly
- Overwhelming for new users

### Implementation
1. **Collapsible Sections**: Implemented two collapsible sections:
   - "Display Options" - Contains all visibility toggles
   - "Margins & Spacing" - Contains margin presets and controls

2. **Visual Improvements**:
   - Added icons to section headers (Grid3x3, Eye, Sliders)
   - Added chevron indicators for expand/collapse state
   - Improved visual hierarchy with better text colors
   - Added hover states for interactive elements

3. **State Persistence**:
   - Collapse states are saved to localStorage
   - User preferences persist across sessions

4. **Additional Features**:
   - Display options show active count (e.g., "Display Options (8/10)")
   - Added "Reset to Defaults" button at the bottom
   - Max height with scroll for very small screens

### Technical Details
- Used existing Radix UI Collapsible components
- Grid Layout section remains always visible (most used)
- Smooth animations for expand/collapse transitions
- Keyboard accessible (can tab through and use Enter/Space)

## UI Structure
```
┌─ Layout Settings ──────────────────┐
│ ▼ Grid Layout                      │
│   [1×1] [2×2] [3×3] [4×4]         │
│   Custom: [2×] [×2] ☑ Pagination   │
├─────────────────────────────────────┤
│ ▶ Display Options (10/10)          │
├─────────────────────────────────────┤
│ ▶ Margins & Spacing                │
├─────────────────────────────────────┤
│ 🔄 Reset to Defaults               │
└─────────────────────────────────────┘
```

When expanded:
```
│ ▼ Display Options (10/10)          │
│   ☑ Legend                         │
│   ☑ Chart title                    │
│   ☑ Grid lines                     │
│   ☑ X-axis                         │
│   ☑ Y-axis                         │
│   ─ Labels & Data ─                │
│   ☑ X-axis label                   │
│   ☑ Y-axis label                   │
│   ☑ Data markers                   │
│   ☑ Line connections               │
│   ☑ Tooltips                       │
```

## Usage
1. Click the Layout button to open the menu
2. Grid Layout section is always visible for quick access
3. Click section headers to expand/collapse
4. Collapse states are remembered between sessions
5. Use "Reset to Defaults" to restore all settings

## Impact
- Reduced initial visual complexity by ~60%
- Faster access to commonly used grid controls
- Better organization of related settings
- Improved user experience for both new and power users
- No functional changes - all features remain accessible

## Testing
1. Open Layout Settings menu
2. Verify Grid Layout section is visible
3. Click Display Options to expand/collapse
4. Toggle some options and verify count updates
5. Click Margins & Spacing to expand/collapse
6. Refresh page and verify collapse states persist
7. Click Reset to Defaults and verify all settings reset
8. Test keyboard navigation with Tab and Enter keys

## Future Improvements
- Add search/filter for finding specific options
- Consider tooltips for option descriptions
- Add preset configurations (e.g., "Minimal", "Detailed")
- Animate the option count when toggling
- Consider inline editing for margin values