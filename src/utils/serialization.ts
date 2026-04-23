import { usePartsBinStore } from '../stores/partsBinStore';
import { useSceneStore } from '../stores/sceneStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { PartDefinition, PlacedPart, Layer } from '../stores/types';

export interface SaveData {
  version: string;
  timestamp: number;
  partDefinitions: PartDefinition[];
  placedParts: PlacedPart[];
  layers: Layer[];
  settings: {
    snapIncrement: number;
    gridSize: number;
    unit: string;
    wasteFactor: number;
  };
}

export function exportToJSON(): string {
  const partsBinStore = usePartsBinStore();
  const sceneStore = useSceneStore();
  const settingsStore = useSettingsStore();

  const data: SaveData = {
    version: '1.0.0',
    timestamp: Date.now(),
    partDefinitions: Array.from(partsBinStore.partDefinitions.values()),
    placedParts: sceneStore.placedParts,
    layers: sceneStore.layers,
    settings: {
      snapIncrement: settingsStore.snapIncrement,
      gridSize: settingsStore.gridSize,
      unit: settingsStore.unit,
      wasteFactor: settingsStore.wasteFactor,
    },
  };

  return JSON.stringify(data, null, 2);
}

export function importFromJSON(json: string): boolean {
  try {
    const data: SaveData = JSON.parse(json);

    const partsBinStore = usePartsBinStore();
    const sceneStore = useSceneStore();
    const settingsStore = useSettingsStore();

    // Import part definitions
    partsBinStore.partDefinitions.clear();
    data.partDefinitions.forEach((def) => {
      partsBinStore.partDefinitions.set(def.id, def);
    });

    // Import scene
    sceneStore.placedParts = data.placedParts;
    sceneStore.layers = data.layers;
    sceneStore.clearSelection();

    // Import settings
    settingsStore.setSnapIncrement(data.settings.snapIncrement as 1 | 3 | 6 | 12);
    settingsStore.setGridSize(data.settings.gridSize);
    settingsStore.setUnit(data.settings.unit as 'in' | 'ft' | 'mm');
    settingsStore.setWasteFactor(data.settings.wasteFactor);

    return true;
  } catch {
    return false;
  }
}

export function exportToCSV(): string {
  const partsBinStore = usePartsBinStore();
  const sceneStore = useSceneStore();
  const settingsStore = useSettingsStore();

  const rows: string[] = [];
  rows.push('Part Name,Category,Dimensions,Quantity,Unit Price,Line Total');

  let totalCost = 0;
  const partCounts = new Map<string, number>();

  // Count parts in scene
  sceneStore.placedParts.forEach((part) => {
    const count = partCounts.get(part.definitionId) || 0;
    partCounts.set(part.definitionId, count + 1);
  });

  // Add rows for each part definition
  partCounts.forEach((quantity, defId) => {
    const def = partsBinStore.getPartDefinition(defId);
    if (!def) return;

    const dims = `${def.dimensions.width}×${def.dimensions.height}×${def.dimensions.depth}"`;
    const unitPrice = def.unitPrice;
    const withWaste = quantity * (1 + settingsStore.wasteFactor / 100);
    const lineTotal = withWaste * unitPrice;
    totalCost += lineTotal;

    rows.push(
      `"${def.name}","${def.category}","${dims}",${withWaste.toFixed(1)},$${unitPrice.toFixed(2)},$${lineTotal.toFixed(2)}`
    );
  });

  rows.push('');
  rows.push(`Total Cost,$${totalCost.toFixed(2)}`);

  return rows.join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function saveToLocalStorage(): void {
  const data = exportToJSON();
  localStorage.setItem('snapdraft-3d-save', data);
}

export function loadFromLocalStorage(): boolean {
  const data = localStorage.getItem('snapdraft-3d-save');
  if (!data) return false;
  return importFromJSON(data);
}
