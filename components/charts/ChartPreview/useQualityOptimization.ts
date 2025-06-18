import { useCallback, useRef, useState } from 'react';

interface UseQualityOptimizationProps {
  dataCount: number;
  enableOptimization?: boolean;
  qualityThreshold?: number;
  debounceDelay?: number;
}

export type QualityLevel = 'low' | 'medium' | 'high';

interface QualityState {
  level: QualityLevel;
  isTransitioning: boolean;
  renderOptions: {
    enableMarkers: boolean;
    markerSize: number;
    lineSimplification: number;
    samplingRate: number;
    enableAnimation: boolean;
  };
}

export const useQualityOptimization = ({
  dataCount,
  enableOptimization = true,
  qualityThreshold = 5000,
  debounceDelay = 150,
}: UseQualityOptimizationProps) => {
  const [qualityState, setQualityState] = useState<QualityState>({
    level: 'high',
    isTransitioning: false,
    renderOptions: {
      enableMarkers: true,
      markerSize: 6,
      lineSimplification: 1,
      samplingRate: 1,
      enableAnimation: true,
    },
  });

  const transitionTimerRef = useRef<NodeJS.Timeout>();

  // Determine quality level based on data count and state
  const getQualityLevel = useCallback((isInteracting: boolean): QualityLevel => {
    if (!enableOptimization) return 'high';
    
    if (isInteracting) {
      // During interaction, prioritize performance
      if (dataCount > qualityThreshold * 2) return 'low';
      if (dataCount > qualityThreshold) return 'medium';
      return 'high';
    } else {
      // After interaction, show full quality
      return 'high';
    }
  }, [dataCount, qualityThreshold, enableOptimization]);

  // Get render options for quality level
  const getRenderOptions = useCallback((level: QualityLevel) => {
    switch (level) {
      case 'low':
        return {
          enableMarkers: false,
          markerSize: 4,
          lineSimplification: 4, // Skip every 4th point
          samplingRate: 0.25, // Show 25% of data
          enableAnimation: false,
        };
      case 'medium':
        return {
          enableMarkers: dataCount < qualityThreshold,
          markerSize: 5,
          lineSimplification: 2, // Skip every 2nd point
          samplingRate: 0.5, // Show 50% of data
          enableAnimation: false,
        };
      case 'high':
      default:
        return {
          enableMarkers: true,
          markerSize: 6,
          lineSimplification: 1, // Show all points
          samplingRate: 1, // Show 100% of data
          enableAnimation: true,
        };
    }
  }, [dataCount, qualityThreshold]);

  // Start interaction (lower quality for performance)
  const startInteraction = useCallback(() => {
    if (!enableOptimization) return;

    // Clear any pending transition
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    const newLevel = getQualityLevel(true);
    setQualityState({
      level: newLevel,
      isTransitioning: true,
      renderOptions: getRenderOptions(newLevel),
    });
  }, [enableOptimization, getQualityLevel, getRenderOptions]);

  // End interaction (restore quality after delay)
  const endInteraction = useCallback(() => {
    if (!enableOptimization) return;

    // Clear any pending transition
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    // Delay quality restoration to avoid flickering
    transitionTimerRef.current = setTimeout(() => {
      const newLevel = getQualityLevel(false);
      setQualityState({
        level: newLevel,
        isTransitioning: false,
        renderOptions: getRenderOptions(newLevel),
      });
    }, debounceDelay);
  }, [enableOptimization, getQualityLevel, getRenderOptions, debounceDelay]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
  }, []);

  return {
    qualityState,
    startInteraction,
    endInteraction,
    cleanup,
  };
};