import { useWindowDimensions, Platform } from 'react-native';

interface ResponsiveSizeConfig {
  small: number;
  large: number;
  breakpoint?: number;
}

/**
 * Hook to get responsive font sizes based on screen dimensions
 * @param config Object with small, large font sizes and optional breakpoint
 * @returns Font size in pixels
 * 
 * Default breakpoint: 768px
 * Platform detection: web gets larger text than mobile
 * 
 * @example
 * const fontSize = useResponsiveSize({ small: 12, large: 24 });
 */
export function useResponsiveSize(config: ResponsiveSizeConfig): number {
  const { width } = useWindowDimensions();
  const breakpoint = config.breakpoint ?? 768;
  const isSmallScreen = width < breakpoint;
  const isWeb = Platform.OS === 'web';

  // On small screens, use small size
  // On large screens with web platform, scale up even more
  if (isSmallScreen) {
    return config.small;
  }

  // Large screen: use large size, but add extra scaling for web
  return isWeb ? config.large * 2 : config.large;
}

/**
 * Compute responsive styles for coordinate text
 * @returns Object with fontSize for coordinates
 */
export function useResponsiveCoordinateSize() {
  return useResponsiveSize({
    small: 12,
    large: 16,
    breakpoint: 768,
  });
}
