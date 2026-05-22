<script setup lang="ts">
import * as THREE from 'three';
import { computed } from 'vue';
import { useSettingsStore } from '../stores/settingsStore';
import { useHistoryStore } from '../stores/historyStore';
import { downloadFile, exportToJSON, saveToLocalStorage, importFromJSON } from '../utils/serialization';

const settingsStore = useSettingsStore();
const historyStore = useHistoryStore();

const props = defineProps<{
  scene: THREE.Scene | null;
}>();

const emit = defineEmits<{
  'view-preset': [preset: 'top' | 'front' | 'side' | 'iso'];
  'focus': [];
}>();

const snapEnabled = computed({
  get: () => settingsStore.snapEnabled,
  set: (value) => settingsStore.setSnapEnabled(value),
});

const gridEnabled = computed({
  get: () => settingsStore.gridEnabled,
  set: (value) => settingsStore.setGridEnabled(value),
});

const xrayMode = computed({
  get: () => settingsStore.xrayMode,
  set: (value) => settingsStore.setXrayMode(value),
});

const transformMode = computed({
  get: () => settingsStore.transformMode,
  set: (value) => settingsStore.setTransformMode(value),
});

const clearScene = () => {
  if (!props.scene) return;
  const toRemove = props.scene.children.filter(
    obj => obj instanceof THREE.Mesh
  );
  toRemove.forEach(obj => props.scene!.remove(obj));
};

const save = async() => {
  saveToLocalStorage();
  const json = exportToJSON();
  // downloadFile(json, 'snapdraft-project.json', 'application/json');
  if ((window as any).showSaveFilePicker) {
    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: 'snapdraft-project.json',
        types: [{
          description: 'JSON File',
          accept: { 'application/json': ['.json'] },
        }],
        });

      const writable = await fileHandle.createWritable();
      await writable.write(json);
      await writable.close();
    } catch (err) {
      if ((err as any).name !== 'AbortError') {
        console.error('Save failed:', err);
      }
      // AbortError = user cancelled the dialog, safe to ignore
    }
    } else {
    downloadFile(json, 'snapdraft-project.json', 'application/json');
  }
};

const load = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        clearScene();
        if (importFromJSON(content)) {
          console.log('Project loaded successfully!');
        } else {
          alert('Failed to load project');
        }
      } catch {
        alert('Error loading project');
      }
    };
    reader.readAsText(file);
  };
  input.click();
};
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-group">
      <button
        class="tool-btn"
        :class="{ active: historyStore.canUndo }"
        @click="historyStore.undo()"
        title="Undo (Ctrl+Z)"
      >
        ↶
      </button>
      <button
        class="tool-btn"
        :class="{ active: historyStore.canRedo }"
        @click="historyStore.redo()"
        title="Redo (Ctrl+Y)"
      >
        ↷
      </button>
    </div>

    <div class="toolbar-group">
      <button
        class="tool-btn"
        :class="{ active: transformMode === 'select' }"
        @click="transformMode = 'select'"
        title="Select Mode"
      >
        ◉
      </button>
      <button
        class="tool-btn"
        :class="{ active: transformMode === 'move' }"
        @click="transformMode = 'move'"
        title="Move Mode"
      >
        ✚
      </button>
      <button
        class="tool-btn"
        :class="{ active: transformMode === 'rotate' }"
        @click="transformMode = 'rotate'"
        title="Rotate Mode"
      >
        ↻
      </button>
    </div>

    <div class="toolbar-group">
      <button
        class="tool-btn toggle-btn"
        :class="{ active: snapEnabled }"
        @click="snapEnabled = !snapEnabled"
        title="Toggle Snap (G)"
      >
        🧲
      </button>
      <button
        class="tool-btn toggle-btn"
        :class="{ active: gridEnabled }"
        @click="gridEnabled = !gridEnabled"
        title="Toggle Grid"
      >
        ⊞
      </button>
      <button
        class="tool-btn toggle-btn"
        :class="{ active: xrayMode }"
        @click="xrayMode = !xrayMode"
        title="X-Ray Mode"
      >
        ✕
      </button>
    </div>

    <div class="toolbar-group">
      <button
        class="tool-btn view-btn"
        @click="$emit('view-preset', 'top')"
        title="Top View"
      >
        T
      </button>
      <button
        class="tool-btn view-btn"
        @click="$emit('view-preset', 'front')"
        title="Front View"
      >
        F
      </button>
      <button
        class="tool-btn view-btn"
        @click="$emit('view-preset', 'side')"
        title="Side View"
      >
        S
      </button>
      <!-- <button
        class="tool-btn view-btn"
        @click="$emit('view-preset', 'iso')"
        title="Isometric View"
      >
        I
      </button> -->
    </div>

    <div class="toolbar-group">
      <button
        class="tool-btn"
        @click="$emit('focus')"
        title="Focus on Selection (F)"
      >
        🎯
      </button>
    </div>

    <div class="toolbar-spacer"></div>

    <div class="toolbar-group">
      <button class="tool-btn" @click="save" title="Save Project">
        💾
      </button>
      <button class="tool-btn" @click="load" title="Load Project">
        📂
      </button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: #222;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  gap: 8px;
  align-items: center;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.toolbar-group {
  display: flex;
  gap: 4px;
  padding-right: 8px;
  border-right: 1px solid #444;
}

.toolbar-group:last-of-type {
  padding-right: 0;
  border-right: none;
}

/* Button styles moved to _ui-controls.scss
.tool-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #555;
  background: #1a1a1a;
  border-radius: 4px;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-weight: 600;
}

.tool-btn:hover {
  border-color: #777;
  color: #ccc;
  background: #252525;
}

.tool-btn.active {
  border-color: #4A90E2;
  background: #1e3a5f;
  color: #4A90E2;
}

.tool-btn.active:hover {
  background: #2a4a7a;
}
*/

.toolbar-spacer {
  flex: 1;
}
</style>
