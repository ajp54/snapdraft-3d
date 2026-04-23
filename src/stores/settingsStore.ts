import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type TransformMode = 'select' | 'move' | 'rotate';
export type Unit = 'in' | 'ft' | 'mm';
export type SnapIncrement = 1 | 3 | 6 | 12;

export const useSettingsStore = defineStore('settings', () => {
  const snapEnabled = ref(true);
  const snapIncrement = ref<SnapIncrement>(6); // inches
  const gridEnabled = ref(true);
  const gridSize = ref(12); // inches
  const xrayMode = ref(false);
  const transformMode = ref<TransformMode>('select');
  const unit = ref<Unit>('in');
  const wasteFactor = ref(0); // 0-30%

  const unitLabel = computed(() => {
    switch (unit.value) {
      case 'ft':
        return 'ft';
      case 'mm':
        return 'mm';
      case 'in':
      default:
        return '"';
    }
  });

  const setSnapEnabled = (enabled: boolean) => {
    snapEnabled.value = enabled;
  };

  const setSnapIncrement = (increment: SnapIncrement) => {
    snapIncrement.value = increment;
  };

  const setGridEnabled = (enabled: boolean) => {
    gridEnabled.value = enabled;
  };

  const setGridSize = (size: number) => {
    gridSize.value = size;
  };

  const setXrayMode = (enabled: boolean) => {
    xrayMode.value = enabled;
  };

  const setTransformMode = (mode: TransformMode) => {
    transformMode.value = mode;
  };

  const setUnit = (newUnit: Unit) => {
    unit.value = newUnit;
  };

  const setWasteFactor = (factor: number) => {
    wasteFactor.value = Math.max(0, Math.min(30, factor));
  };

  const toggleSnap = () => {
    snapEnabled.value = !snapEnabled.value;
  };

  const toggleGrid = () => {
    gridEnabled.value = !gridEnabled.value;
  };

  const toggleXray = () => {
    xrayMode.value = !xrayMode.value;
  };

  return {
    snapEnabled,
    snapIncrement,
    gridEnabled,
    gridSize,
    xrayMode,
    transformMode,
    unit,
    wasteFactor,
    unitLabel,
    setSnapEnabled,
    setSnapIncrement,
    setGridEnabled,
    setGridSize,
    setXrayMode,
    setTransformMode,
    setUnit,
    setWasteFactor,
    toggleSnap,
    toggleGrid,
    toggleXray,
  };
});
