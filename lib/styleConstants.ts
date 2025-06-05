// Design System Constants
export const COLORS = {
  // Expression syntax highlighting
  syntax: {
    parameter: "text-slate-700",
    operator: "text-teal-600",
    value: "text-indigo-600",
    logical: "text-rose-600",
    grouping: "text-amber-600",
  },
  
  // Status colors
  status: {
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-600",
      textDark: "text-blue-800",
      hover: "hover:text-blue-800",
    },
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-600",
      textDark: "text-green-800",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-600",
      textDark: "text-yellow-800",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-600",
      textDark: "text-red-800",
    },
  },
} as const

export const SPACING = {
  // Component spacing
  section: "space-y-4",
  card: "space-y-3",
  inline: "space-x-2",
  grid: "gap-6",
  
  // Padding/margin
  cardPadding: "p-3",
  sectionPadding: "p-4",
  buttonPadding: "px-2",
} as const

export const SIZING = {
  // Icon sizes
  iconSm: "h-3 w-3",
  iconMd: "h-4 w-4",
  iconLg: "h-5 w-5",
  
  // Button sizes
  buttonSm: "h-6",
  buttonMd: "h-7",
  buttonLg: "h-8",
  
  // Indicators
  indicator: "w-2 h-2",
} as const

export const BORDERS = {
  default: "border rounded-lg",
  card: "border rounded-lg",
  input: "border rounded",
} as const

// Utility functions for common patterns
export const getStatusClasses = (type: keyof typeof COLORS.status) => ({
  container: `${BORDERS.card} ${SPACING.cardPadding} ${COLORS.status[type].bg} ${COLORS.status[type].border}`,
  icon: `${SIZING.iconMd} ${COLORS.status[type].text}`,
  title: `text-sm font-medium ${COLORS.status[type].textDark}`,
  text: `text-xs ${COLORS.status[type].text}`,
  button: `${SIZING.buttonMd} text-xs ${COLORS.status[type].text} ${COLORS.status[type].hover}`,
})

export const getSyntaxClasses = () => ({
  parameter: `${COLORS.syntax.parameter} font-medium`,
  operator: `${COLORS.syntax.operator} font-semibold`,
  value: `${COLORS.syntax.value} font-medium`,
  logical: `${COLORS.syntax.logical} font-semibold`,
  grouping: `${COLORS.syntax.grouping} font-semibold`,
})