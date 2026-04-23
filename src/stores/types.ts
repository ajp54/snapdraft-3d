export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

export interface PartDefinition {
  id: string;
  name: string;
  category: string;
  dimensions: Dimensions;
  color: string;
  unitPrice: number;
  isCustom: boolean;
}

export interface PlacedPart {
  id: string;
  definitionId: string;
  label: string;
  position: [number, number, number];
  rotation: [number, number, number];
  colorOverride: string | null;
  layerId: string;
  locked: boolean;
  visible: boolean;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
}

export interface Measurement {
  id: string;
  pointA: [number, number, number];
  pointB: [number, number, number];
  label: string;
}

export interface HistorySnapshot {
  parts: PlacedPart[];
  layers: Layer[];
  selectedIds: string[];
  timestamp: number;
}
