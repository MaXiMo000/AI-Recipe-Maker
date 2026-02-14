import { useState, useEffect } from 'react';

export interface ScreenSize {
  width: number;
  height: number;
}

export type DeviceType = 'mobile' | 'tablet' | 'laptop' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

export interface Breakpoints {
  mobile: boolean;
  tablet: boolean;
  laptop: boolean;
  desktop: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  '2xl': boolean;
}

export interface UseResponsiveReturn {
  screenSize: ScreenSize;
  deviceType: DeviceType;
  orientation: Orientation;
  breakpoints: Breakpoints;
  isTouchDevice: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
}

export function useResponsive(): UseResponsiveReturn {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() =>
    typeof window !== 'undefined'
      ? { width: window.innerWidth, height: window.innerHeight }
      : { width: 1200, height: 800 }
  );

  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [orientation, setOrientation] = useState<Orientation>('portrait');

  useEffect(() => {
    const handleResize = (): void => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenSize({ width, height });
      if (width <= 480) setDeviceType('mobile');
      else if (width <= 768) setDeviceType('tablet');
      else if (width <= 1024) setDeviceType('laptop');
      else setDeviceType('desktop');
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    window.addEventListener('resize', handleResize);
    const onOrientationChange = (): void => {
      setTimeout(handleResize, 100);
    };
    window.addEventListener('orientationchange', onOrientationChange);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', onOrientationChange);
    };
  }, []);

  const breakpoints: Breakpoints = {
    mobile: screenSize.width <= 480,
    tablet: screenSize.width > 480 && screenSize.width <= 768,
    laptop: screenSize.width > 768 && screenSize.width <= 1024,
    desktop: screenSize.width > 1024,
    sm: screenSize.width >= 640,
    md: screenSize.width >= 768,
    lg: screenSize.width >= 1024,
    xl: screenSize.width >= 1280,
    '2xl': screenSize.width >= 1536,
  };

  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return {
    screenSize,
    deviceType,
    orientation,
    breakpoints,
    isTouchDevice,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop' || deviceType === 'laptop',
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait',
  };
}
