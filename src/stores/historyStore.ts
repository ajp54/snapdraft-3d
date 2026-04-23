import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useSceneStore } from './sceneStore';
import type { HistorySnapshot } from './types';

export const useHistoryStore = defineStore('history', () => {
  const maxSnapshots = 50;
  const undoStack = ref<HistorySnapshot[]>([]);
  const redoStack = ref<HistorySnapshot[]>([]);

  const createSnapshot = (): HistorySnapshot => {
    const sceneStore = useSceneStore();
    return {
      parts: JSON.parse(JSON.stringify(sceneStore.placedParts)),
      layers: JSON.parse(JSON.stringify(sceneStore.layers)),
      selectedIds: Array.from(sceneStore.selectedIds),
      timestamp: Date.now(),
    };
  };

  const pushSnapshot = () => {
    undoStack.value.push(createSnapshot());
    if (undoStack.value.length > maxSnapshots) {
      undoStack.value.shift();
    }
    redoStack.value = [];
  };

  const undo = () => {
    if (undoStack.value.length === 0) return false;

    const sceneStore = useSceneStore();
    const currentSnapshot = createSnapshot();
    redoStack.value.push(currentSnapshot);

    const snapshot = undoStack.value.pop()!;
    sceneStore.placedParts = snapshot.parts;
    sceneStore.layers = snapshot.layers;
    sceneStore.setSelectedIds(new Set(snapshot.selectedIds));

    return true;
  };

  const redo = () => {
    if (redoStack.value.length === 0) return false;

    const sceneStore = useSceneStore();
    const currentSnapshot = createSnapshot();
    undoStack.value.push(currentSnapshot);

    const snapshot = redoStack.value.pop()!;
    sceneStore.placedParts = snapshot.parts;
    sceneStore.layers = snapshot.layers;
    sceneStore.setSelectedIds(new Set(snapshot.selectedIds));

    return true;
  };

  const canUndo = () => undoStack.value.length > 0;
  const canRedo = () => redoStack.value.length > 0;

  const clear = () => {
    undoStack.value = [];
    redoStack.value = [];
  };

  return {
    undoStack,
    redoStack,
    pushSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
  };
});
