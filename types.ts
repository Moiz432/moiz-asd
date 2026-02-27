export interface ProductState {
  type: 'shirt' | 'hoodie' | 'polo' | 'long_sleeve';
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  color: string;
  hue: number;
  saturation: number;
  lightness: number;
  logos: {
    front: string | null;
    back: string | null;
    leftSleeve: string | null;
    rightSleeve: string | null;
  };
  textureIntensity: number;
  roughness: number;
  metalness: number;
  logoScale: number;
  clearcoat: number;
}

export interface DesignIdea {
  title: string;
  palette: string[];
  description: string;
}