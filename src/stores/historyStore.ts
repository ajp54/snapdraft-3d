import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
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
    const snapshot = createSnapshot();
    const last = undoStack.value.at(-1);
    // Skip if nothing changed (compare by serialization)
    if (last && JSON.stringify(last.parts) === JSON.stringify(snapshot.parts)
             && JSON.stringify(last.layers) === JSON.stringify(snapshot.layers)) {
      return;
    }
    undoStack.value.push(snapshot);
    if (undoStack.value.length > maxSnapshots) {
      undoStack.value.shift();
    }
    redoStack.value = [];
  };

  const undo = () => {
    if (undoStack.value.length === 0) return false;
    const sceneStore = useSceneStore();
    redoStack.value.push(createSnapshot());
    if (redoStack.value.length > maxSnapshots) {  // cap redo stack too
      redoStack.value.shift();
    }
    const snapshot = undoStack.value.pop()!;
    sceneStore.placedParts = snapshot.parts;
    sceneStore.layers = snapshot.layers;
    sceneStore.setSelectedIds(new Set(snapshot.selectedIds));
    return true;
  };

  const redo = () => {
    if (redoStack.value.length === 0) return false;
    const sceneStore = useSceneStore();
    undoStack.value.push(createSnapshot());
    if (undoStack.value.length > maxSnapshots) {  // recheck after push
      undoStack.value.shift();
    }
    const snapshot = redoStack.value.pop()!;
    sceneStore.placedParts = snapshot.parts;
    sceneStore.layers = snapshot.layers;
    sceneStore.setSelectedIds(new Set(snapshot.selectedIds));
    return true;
  };

  // computed so templates react automatically
  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);

  const clear = () => {
    undoStack.value = [];
    redoStack.value = [];
  };

  return {
    undoStackSize: computed(() => undoStack.value.length), // expose size, not raw stack
    redoStackSize: computed(() => redoStack.value.length),
    pushSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
  };
});