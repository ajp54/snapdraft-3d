import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { PlacedPart, Layer, Measurement } from './types';
import { useHistoryStore } from './historyStore';

export const useSceneStore = defineStore('scene', () => {
  const placedParts = ref<PlacedPart[]>([]);
  const layers = ref<Layer[]>([
    {
      id: 'default-layer',
      name: 'Default',
      visible: true,
      locked: false,
      color: '#4A90E2',
    },
  ]);
  const selectedIds = ref<Set<string>>(new Set());
  const measurements = ref<Measurement[]>([]);
  const defaultLayerId = ref('default-layer');

  const getSelectedParts = computed(() =>
    placedParts.value.filter((p) => selectedIds.value.has(p.id))
  );

  const getPartsByLayer = (layerId: string) =>
    placedParts.value.filter((p) => p.layerId === layerId);

  const addPart = (
    definitionId: string,
    position: [number, number, number] = [0, 0, 0],
    label?: string
  ): PlacedPart => {
    useHistoryStore().pushSnapshot();
    const part: PlacedPart = {
      id: uuidv4(),
      definitionId,
      label: label || `Part ${placedParts.value.length + 1}`,
      position,
      rotation: [0, 0, 0],
      colorOverride: null,
      layerId: defaultLayerId.value,
      locked: false,
      visible: true,
    };
    placedParts.value.push(part);
    return part;
  };

  const deletePart = (id: string) => {
    useHistoryStore().pushSnapshot();
    placedParts.value = placedParts.value.filter((p) => p.id !== id);
    selectedIds.value.delete(id);
  };

  const updatePart = (id: string, updates: Partial<PlacedPart>) => {
    // useHistoryStore().pushSnapshot();
    const idx = placedParts.value.findIndex((p) => p.id === id);
    if (idx !== -1) {
      placedParts.value[idx] = { ...placedParts.value[idx], ...updates };
    }
  };

  const duplicatePart = (id: string): PlacedPart | null => {
    const part = placedParts.value.find((p) => p.id === id);
    if (!part) return null;
    useHistoryStore().pushSnapshot();

    const newPart: PlacedPart = {
      ...part,
      id: uuidv4(),
      position: [part.position[0] + 12, part.position[1], part.position[2]] as [number, number, number],
      label: `${part.label} (copy)`,
    };
    placedParts.value.push(newPart);
    return newPart;
  };

  const setSelectedIds = (ids: Set<string>) => {
    selectedIds.value = new Set(ids);
  };

  const toggleSelection = (id: string, exclusive: boolean = true) => {
    if (exclusive) {
      selectedIds.value.clear();
    }
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id);
    } else {
      selectedIds.value.add(id);
    }
  };

  const clearSelection = () => {
    selectedIds.value.clear();
  };

  const addLayer = (name: string = 'New Layer'): Layer => {
    useHistoryStore().pushSnapshot();
    const layer: Layer = {
      id: uuidv4(),
      name,
      visible: true,
      locked: false,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    };
    layers.value.push(layer);
    return layer;
  };

  const deleteLayer = (id: string) => {
    useHistoryStore().pushSnapshot();
    if (id === defaultLayerId.value) return false;
    layers.value = layers.value.filter((l) => l.id !== id);
    // Move parts to default layer
    placedParts.value.forEach((p) => {
      if (p.layerId === id) {
        p.layerId = defaultLayerId.value;
      }
    });
    return true;
  };

  const updateLayer = (id: string, updates: Partial<Layer>) => {
    const idx = layers.value.findIndex((l) => l.id === id);
    if (idx !== -1) {
      layers.value[idx] = { ...layers.value[idx], ...updates };
    }
  };

  const getLayer = (id: string) => layers.value.find((l) => l.id === id);

  const addMeasurement = (
    pointA: [number, number, number],
    pointB: [number, number, number],
    label: string = ''
  ): Measurement => {
    const measurement: Measurement = {
      id: uuidv4(),
      pointA,
      pointB,
      label,
    };
    measurements.value.push(measurement);
    return measurement;
  };

  const deleteMeasurement = (id: string) => {
    measurements.value = measurements.value.filter((m) => m.id !== id);
  };

  const clearMeasurements = () => {
    measurements.value = [];
  };

  const exportScene = () => JSON.stringify({
    parts: placedParts.value,
    layers: layers.value,
    selectedIds: Array.from(selectedIds.value),
  });

  const importScene = (json: string) => {
    try {
      const data = JSON.parse(json);
      useHistoryStore().pushSnapshot();
      placedParts.value = data.parts || [];
      layers.value = data.layers || [];
      selectedIds.value = new Set(data.selectedIds || []);
      return true;
    } catch {
      return false;
    }
  };

  const clear = () => {
    placedParts.value = [];
    layers.value = [
      {
        id: 'default-layer',
        name: 'Default',
        visible: true,
        locked: false,
        color: '#4A90E2',
      },
    ];
    selectedIds.value.clear();
    measurements.value = [];
  };

  return {
    placedParts,
    layers,
    selectedIds,
    measurements,
    defaultLayerId,
    getSelectedParts,
    getPartsByLayer,
    addPart,
    deletePart,
    updatePart,
    duplicatePart,
    setSelectedIds,
    toggleSelection,
    clearSelection,
    addLayer,
    deleteLayer,
    updateLayer,
    getLayer,
    addMeasurement,
    deleteMeasurement,
    clearMeasurements,
    exportScene,
    importScene,
    clear,
  };
});
