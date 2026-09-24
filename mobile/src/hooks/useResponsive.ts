import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return {
    isSmallDevice: width < 375, // e.g., iPhone SE
    isTablet: width >= 768,     // iPad and large Android tablets
    width,
    height,
  };
}
