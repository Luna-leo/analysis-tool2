import * as d3 from 'd3'

let currentTooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null = null
let pinnedTooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null = null
let currentTooltipData: { content: string; x: number; y: number } | null = null

export function showTooltip(
  event: MouseEvent,
  content: string,
  isPinned = false
): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> {
  
  // If not pinned, remove any existing non-pinned tooltip
  if (!isPinned && currentTooltip) {
    currentTooltip.remove()
    currentTooltip = null
  }
  
  // Create new tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", isPinned ? "chart-tooltip-pinned" : "chart-tooltip")
    .style("position", "fixed")
    .style("background", "rgba(0, 0, 0, 0.9)")
    .style("color", "white")
    .style("padding", "10px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", 99999) // Increased z-index to ensure tooltip is always on top
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.3)")
    .style("border", "1px solid #333")
    .style("min-width", "200px")
    .style("max-width", "300px")
    
  // Add close button for pinned tooltip
  if (isPinned) {
    tooltip.html(`
      <div style="position: relative;">
        <button class="tooltip-close" style="position: absolute; top: -5px; right: -5px; background: #666; border: none; color: white; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 12px; line-height: 1; padding: 0;">✕</button>
        ${content}
      </div>
    `)
    
    // Add click handler to close button
    tooltip.select(".tooltip-close").on("click", () => {
      hidePinnedTooltip()
    })
  } else {
    tooltip.html(content)
  }
    
  // Position and show
  // Use clientX/clientY for fixed positioning
  // Calculate position to avoid tooltip appearing under cursor
  const tooltipNode = tooltip.node()
  if (!tooltipNode) return tooltip
  
  // First, show tooltip off-screen to measure dimensions
  tooltip
    .style("left", "-9999px")
    .style("top", "-9999px")
    .style("display", "block")
    .style("opacity", "0")
  
  // Get tooltip dimensions
  const tooltipRect = tooltipNode.getBoundingClientRect()
  const tooltipWidth = tooltipRect.width
  const tooltipHeight = tooltipRect.height
  
  // Calculate optimal position
  // Default: position to the right and below cursor to avoid overlap
  let x = event.clientX + 15 // Offset to the right
  let y = event.clientY + 15 // Offset below cursor for better stability
  
  // Adjust if tooltip would go off-screen
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // If tooltip would go off right edge, position to the left of cursor
  if (x + tooltipWidth > viewportWidth - 10) {
    x = event.clientX - tooltipWidth - 20
  }
  
  // If tooltip would go off bottom edge, position above cursor
  if (y + tooltipHeight > viewportHeight - 10) {
    y = event.clientY - tooltipHeight - 10
  }
  
  // Ensure tooltip doesn't go off top or left edges
  x = Math.max(10, x)
  y = Math.max(10, y)
  
  tooltip
    .style("left", x + "px")
    .style("top", y + "px")
    .style("opacity", "1")
  
  if (isPinned) {
    pinnedTooltip = tooltip
  } else {
    currentTooltip = tooltip
    currentTooltipData = { content, x: event.pageX, y: event.pageY }
  }
    
  return tooltip
}

export function togglePinnedTooltip(event: MouseEvent, content: string): void {
  // If there's a pinned tooltip at the same location, hide it
  if (pinnedTooltip && currentTooltipData && 
      Math.abs(currentTooltipData.x - event.pageX) < 50 && 
      Math.abs(currentTooltipData.y - event.pageY) < 50) {
    hidePinnedTooltip()
  } else {
    // Hide any existing pinned tooltip and show new one
    hidePinnedTooltip()
    showTooltip(event, content, true)
  }
}

export function updateTooltipPosition(event: MouseEvent): void {
  if (currentTooltip) {
    const tooltipNode = currentTooltip.node()
    if (!tooltipNode) return
    
    const tooltipRect = tooltipNode.getBoundingClientRect()
    const tooltipWidth = tooltipRect.width
    const tooltipHeight = tooltipRect.height
    
    // Calculate optimal position with same logic as showTooltip
    let x = event.clientX + 15
    let y = event.clientY + 15
    
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    if (x + tooltipWidth > viewportWidth - 10) {
      x = event.clientX - tooltipWidth - 20
    }
    
    if (y + tooltipHeight > viewportHeight - 10) {
      y = event.clientY - tooltipHeight - 10
    }
    
    x = Math.max(10, x)
    y = Math.max(10, y)
    
    currentTooltip
      .style("left", x + "px")
      .style("top", y + "px")
  }
}

export function hideTooltip(): void {
  if (currentTooltip) {
    currentTooltip.remove()
    currentTooltip = null
    currentTooltipData = null
  }
  
  // Remove any orphaned non-pinned tooltips
  d3.selectAll(".chart-tooltip").remove()
}

export function hidePinnedTooltip(): void {
  if (pinnedTooltip) {
    pinnedTooltip.remove()
    pinnedTooltip = null
  }
  
  // Remove any orphaned pinned tooltips
  d3.selectAll(".chart-tooltip-pinned").remove()
}

export function hideAllTooltips(): void {
  hideTooltip()
  hidePinnedTooltip()
}

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', hideAllTooltips)
}