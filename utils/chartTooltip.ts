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
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.9)")
    .style("color", "white")
    .style("padding", "10px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", isPinned ? "auto" : "none")
    .style("z-index", isPinned ? 1001 : 1000)
    .style("opacity", 0)
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.3)")
    .style("border", isPinned ? "1px solid #666" : "none")
    
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
  tooltip
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 10) + "px")
    .transition()
    .duration(200)
    .style("opacity", 1)
  
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
  if (currentTooltip && !pinnedTooltip) {
    currentTooltip
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 10) + "px")
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