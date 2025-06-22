# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Chinami's Analysis App" - an advanced data analysis and visualization tool built with Next.js 15, React 19, and TypeScript. The application specializes in CSV data import, real-time charting, and complex data analysis with formula support.

## Commands

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production (Note: TypeScript and ESLint errors are ignored)
- `npm run build:analyze` - Build with bundle analysis
- `npm start` - Start production server
- `npm run type-check` - Check TypeScript types without emitting files
- `npm run lint` - Run Next.js linter (Note: No ESLint configuration exists)

### Important Notes
- **No test framework is configured** - There are no test commands or test files
- **No formatting tools** - No Prettier or similar tools are set up
- TypeScript errors are ignored during builds (see next.config.ts)

## Architecture

### Technology Stack
- **Framework**: Next.js 15.2.4 with App Router
- **UI**: React 19 with TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: Zustand stores (see `/stores/`)
- **Charts**: D3.js for rendering, Recharts for some components
- **Data Storage**: IndexedDB via idb library
- **Forms**: React Hook Form + Zod validation

### Key Directories
- `/app/` - Next.js App Router pages
- `/components/` - React components organized by feature
  - `analysis/` - Main analysis tool component
  - `charts/` - Chart rendering and configuration
  - `ui/` - shadcn/ui base components
- `/stores/` - Zustand state stores (file, layout, UI, etc.)
- `/utils/` - Utility functions for charts, CSV, performance
- `/hooks/` - Custom React hooks
- `/types/` - TypeScript type definitions
- `/constants/` - Application constants and defaults

### Important Patterns

1. **Type System**: Use PlotStyle types (not legacy DataSourceStyle). See `/docs/type-migration-guide.md` for migration details. All chart types are in `types/chart-types.ts`.

2. **Chart Margins**: Unified margin system with dynamic adjustments. See `/docs/unified-margin-system.md` for implementation details.

3. **Performance**: The app includes LOD rendering, data sampling (LTTB, Douglas-Peucker), and performance presets. Check `utils/performance/` for optimization utilities.

4. **Data Management**: 
   - CSV parsing supports multiple formats (standard and CASS)
   - SharedDataCache for performance optimization
   - IndexedDB for persistent client-side storage

### Component Patterns
- Use shadcn/ui components from `/components/ui/`
- Follow existing patterns for new components
- State management through Zustand stores
- Canvas-based chart rendering for performance

## Development Guidelines

### When Making Changes
1. Check TypeScript types with `npm run type-check` before committing
2. Follow existing code patterns in neighboring files
3. Use path alias `@/` for imports (maps to root)
4. Maintain the unified margin system for any chart-related changes
5. Consider performance implications - the app handles large datasets

### Key Features to Understand
- **CSV Import**: Advanced parsing with multiple format support
- **Formula System**: Mathematical expressions with LaTeX rendering via KaTeX
- **Event System**: Trigger conditions and event detection for data monitoring
- **Interlock System**: Safety monitoring features
- **Template System**: Plot style templates for consistent visualization

### Common Tasks
- Adding new chart features: Update types in `/types/chart-types.ts`, implement in `/components/charts/`
- State management: Create/update stores in `/stores/`
- UI components: Use existing shadcn/ui components or add new ones following the pattern
- Performance optimization: Use utilities in `/utils/performance/`

### Production Considerations
- Console logs (except errors/warnings) are removed in production
- React Strict Mode is disabled to prevent double rendering
- Bundle is optimized for d3 and lodash imports

## Documentation Rules

### When to Create Documentation
Documentation must be created for the following cases:
- **Feature Addition** - When implementing new functionality
- **Bug Fix** - When fixing existing issues
- **Refactoring** - When making significant code improvements
- **Breaking Change** - When changing existing behavior

### Documentation Format
All documentation should follow this standard format:

```markdown
# [Implementation Title]

## Meta Information
- **Created**: YYYY-MM-DD
- **Updated**: YYYY-MM-DD
- **Category**: Feature | Bug Fix | Refactoring | Breaking Change
- **Related Commits**: [commit hash]
- **Affected Components**: [list of affected files]

## Overview
[Brief description of the implementation]

## Details
### Background/Problem
[Why this implementation was necessary]

### Implementation
[What was specifically implemented]

### Technical Details
[Technical details, architecture changes, etc.]

## Usage
[How to use new features, if applicable]

## Impact
[Impact on other components]

## Testing
[How to verify the implementation works]

## Future Improvements
[Remaining tasks or improvements]
```

### Documentation Storage
- Store in `/docs/` directory
- Filename format: `[date]-[category]-[brief-title].md`
  - Example: `2025-06-22-bugfix-x-axis-parameter-range.md`

### Implementation Workflow
1. Complete implementation
2. Commit code changes
3. Create documentation
4. Commit documentation

This ensures all significant changes are properly documented for future reference.