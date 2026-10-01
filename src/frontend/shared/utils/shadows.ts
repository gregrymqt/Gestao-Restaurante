import { Platform, ViewStyle } from 'react-native';

export interface ShadowOptions {
  color?: string;
  offsetX?: number;
  offsetY?: number;
  opacity?: number;
  radius?: number;
  elevation?: number;
}

function hexToRgba(hex: string, opacity: number): string {
  if (hex.startsWith('#') && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  if (hex === '#000' || hex === '#000000') {
    return `rgba(0, 0, 0, ${opacity})`;
  }
  return hex;
}

/**
 * Cria estilos de sombra compatíveis universalmente (iOS, Android e Web),
 * adotando boxShadow no Web para evitar avisos de depreciação do React Native Web.
 */
export function createShadow({
  color = '#000000',
  offsetX = 0,
  offsetY = 2,
  opacity = 0.08,
  radius = 4,
  elevation = 2,
}: ShadowOptions = {}): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px ${hexToRgba(color, opacity)}`,
    } as ViewStyle;
  }

  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}

export const shadows = {
  sm: createShadow({ offsetY: 1, radius: 3, opacity: 0.05, elevation: 1 }),
  md: createShadow({ offsetY: 2, radius: 4, opacity: 0.08, elevation: 2 }),
  lg: createShadow({ offsetY: 4, radius: 8, opacity: 0.15, elevation: 4 }),
  xl: createShadow({ offsetY: 8, radius: 16, opacity: 0.2, elevation: 8 }),
  dialog: createShadow({ offsetY: 16, radius: 32, opacity: 0.2, elevation: 24 }),
};
