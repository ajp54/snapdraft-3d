import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { PartDefinition } from './types';
import { useSceneStore } from './sceneStore';

const DEFAULT_PRESETS: PartDefinition[] = [
  // Lumber
  {
    id: 'preset-2x4',
    name: '2×4 Stud',
    category: 'Lumber',
    dimensions: { width: 1.5, height: 3.5, depth: 8 },
    color: '#D2B48C',
    unitPrice: 5.99,
    isCustom: false,
  },
  {
    id: 'preset-4x4',
    name: '4×4 Post',
    category: 'Lumber',
    dimensions: { width: 3.5, height: 3.5, depth: 12 },
    color: '#8B6F47',
    unitPrice: 12.99,
    isCustom: false,
  },
  {
    id: 'preset-2x6',
    name: '2×6 Joist',
    category: 'Lumber',
    dimensions: { width: 1.5, height: 5.5, depth: 12 },
    color: '#D2B48C',
    unitPrice: 8.99,
    isCustom: false,
  },
  {
    id: 'preset-2x8',
    name: '2×8 Beam',
    category: 'Lumber',
    dimensions: { width: 1.5, height: 7.5, depth: 12 },
    color: '#D2B48C',
    unitPrice: 11.99,
    isCustom: false,
  },
  // Sheet Goods
  {
    id: 'preset-plywood-3q',
    name: 'Plywood ¾"',
    category: 'Sheet Goods',
    dimensions: { width: 0.75, height: 48, depth: 96 },
    color: '#A0826D',
    unitPrice: 45.99,
    isCustom: false,
  },
  {
    id: 'preset-plywood-half',
    name: 'Plywood ½"',
    category: 'Sheet Goods',
    dimensions: { width: 0.5, height: 48, depth: 96 },
    color: '#A0826D',
    unitPrice: 35.99,
    isCustom: false,
  },
  {
    id: 'preset-osb',
    name: 'OSB ¾"',
    category: 'Sheet Goods',
    dimensions: { width: 0.75, height: 48, depth: 96 },
    color: '#B8956A',
    unitPrice: 22.99,
    isCustom: false,
  },
  // Masonry
  {
    id: 'preset-concrete-block',
    name: 'Concrete Block',
    category: 'Masonry',
    dimensions: { width: 8, height: 8, depth: 16 },
    color: '#808080',
    unitPrice: 1.49,
    isCustom: false,
  },
  {
    id: 'preset-brick',
    name: 'Brick',
    category: 'Masonry',
    dimensions: { width: 3.75, height: 2.25, depth: 8 },
    color: '#A0522D',
    unitPrice: 0.99,
    isCustom: false,
  },
];

export const usePartsBinStore = defineStore('partsBin', () => {
  const partDefinitions = ref<Map<string, PartDefinition>>(new Map());
  const activePlacementId = ref<string | null>(null);

  // Initialize with default presets
  DEFAULT_PRESETS.forEach((preset) => {
    partDefinitions.value.set(preset.id, preset);
  });

  const partsList = computed(() => Array.from(partDefinitions.value.values()));

  const getPartCount = (partDefinitionId: string) => {
    const sceneStore = useSceneStore();
    return sceneStore.placedParts.filter((p) => p.definitionId === partDefinitionId).length;
  };

  const addPartDefinition = (
    name: string,
    category: string,
    dimensions: { width: number; height: number; depth: number },
    unitPrice: number,
    color: string = '#D2B48C'
  ) => {
    const id = uuidv4();
    const definition: PartDefinition = {
      id,
      name,
      category,
      dimensions,
      color,
      unitPrice,
      isCustom: true,
    };
    partDefinitions.value.set(id, definition);
    return id;
  };

  const deletePartDefinition = (id: string) => {
    const sceneStore = useSceneStore();
    const count = sceneStore.placedParts.filter((p) => p.definitionId === id).length;
    if (count > 0) {
      return false; // Cannot delete if parts are in scene
    }
    partDefinitions.value.delete(id);
    return true;
  };

  const updatePartDefinition = (
    id: string,
    updates: Partial<PartDefinition>
  ) => {
    const part = partDefinitions.value.get(id);
    if (part) {
      partDefinitions.value.set(id, { ...part, ...updates });
    }
  };

  const setActivePlacement = (id: string | null) => {
    activePlacementId.value = id;
  };

  const getPartDefinition = (id: string) => partDefinitions.value.get(id);

  const exportDefinitions = () => JSON.stringify(Array.from(partDefinitions.value.values()));

  const importDefinitions = (json: string) => {
    try {
      const defs: PartDefinition[] = JSON.parse(json);
      defs.forEach((def) => {
        partDefinitions.value.set(def.id, def);
      });
      return true;
    } catch {
      return false;
    }
  };

  return {
    partDefinitions,
    activePlacementId,
    partsList,
    getPartCount,
    addPartDefinition,
    deletePartDefinition,
    updatePartDefinition,
    setActivePlacement,
    getPartDefinition,
    exportDefinitions,
    importDefinitions,
  };
});
