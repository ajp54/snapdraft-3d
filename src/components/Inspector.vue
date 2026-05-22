<script setup lang="ts">
import { computed } from 'vue';
import { useSceneStore } from '../stores/sceneStore';
import { usePartsBinStore } from '../stores/partsBinStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHistoryStore } from '../stores/historyStore';
import { formatDimension } from '../utils/unitConversion';
import { degreesToRadians, radiansToDegrees } from '../utils/math';

const sceneStore = useSceneStore();
const partsBinStore = usePartsBinStore();
const settingsStore = useSettingsStore();
const historyStore = useHistoryStore();

const selectedPart = computed(() => {
  const ids = Array.from(sceneStore.selectedIds);
  return ids.length === 1 ? sceneStore.placedParts.find((p) => p.id === ids[0]) : null;
});

const selectedDefinition = computed(() => {
  return selectedPart.value
    ? partsBinStore.getPartDefinition(selectedPart.value.definitionId)
    : null;
});

const posX = computed({
  get: () => (selectedPart.value ? selectedPart.value.position[0] : 0),
  set: (value) => {
    if (selectedPart.value) {
      const pos = [...selectedPart.value.position] as [number, number, number];
      pos[0] = value;
      historyStore.pushSnapshot();
      sceneStore.updatePart(selectedPart.value.id, { position: pos });
    }
  },
});

const posY = computed({
  get: () => (selectedPart.value ? selectedPart.value.position[1] : 0),
  set: (value) => {
    if (selectedPart.value) {
      const pos = [...selectedPart.value.position] as [number, number, number];
      pos[1] = value;
      historyStore.pushSnapshot();
      sceneStore.updatePart(selectedPart.value.id, { position: pos });
    }
  },
});

const posZ = computed({
  get: () => (selectedPart.value ? selectedPart.value.position[2] : 0),
  set: (value) => {
    if (selectedPart.value) {
      const pos = [...selectedPart.value.position] as [number, number, number];
      pos[2] = value;
      historyStore.pushSnapshot();
      sceneStore.updatePart(selectedPart.value.id, { position: pos });
    }
  },
});

const rotX = computed({
  get: () => {
    if (!selectedPart.value) return 0;
    return Math.round(radiansToDegrees(selectedPart.value.rotation[0]));
  },
  set: (value) => {
    if (selectedPart.value) {
      const rot = [...selectedPart.value.rotation] as [number, number, number];
      rot[0] = (value / 180) * Math.PI;
      historyStore.pushSnapshot();
      sceneStore.updatePart(selectedPart.value.id, { rotation: rot });
    }
  },
});

const rotY = computed({
  get: () => {
    if (!selectedPart.value) return 0;
    return Math.round(radiansToDegrees(selectedPart.value.rotation[1]) / 90) * 90;
  },
  set: (value) => {
    if (selectedPart.value) {
      const rot = [...selectedPart.value.rotation] as [number, number, number];
      rot[1] = (value / 180) * Math.PI;
      historyStore.pushSnapshot();
      sceneStore.updatePart(selectedPart.value.id, { rotation: rot });
    }
  },
});

const rotZ = computed({
  get: () => {
    if (!selectedPart.value) return 0;
    return Math.round(radiansToDegrees(selectedPart.value.rotation[2]));
  },
  set: (value) => {
    if (selectedPart.value) {
      const rot = [...selectedPart.value.rotation] as [number, number, number];
      rot[2] = (value / 180) * Math.PI;
      historyStore.pushSnapshot();
      sceneStore.updatePart(selectedPart.value.id, { rotation: rot });
    }
  },
});

const colorOverride = computed({
  get: () => selectedPart.value?.colorOverride || selectedDefinition.value?.color || '#000000',
  set: (value) => {
    if (selectedPart.value) {
      historyStore.pushSnapshot();
      sceneStore.updatePart(selectedPart.value.id, { colorOverride: value });
    }
  },
});

const assignedLayer = computed({
  get: () => selectedPart.value?.layerId || 'default-layer',
  set: (value) => {
    if (selectedPart.value) {
      historyStore.pushSnapshot();
      sceneStore.updatePart(selectedPart.value.id, { layerId: value });
    }
  },
});

const rotateBy90 = (axis: 'x' | 'y' | 'z') => {
  if (!selectedPart.value) return;
  const rot = [...selectedPart.value.rotation] as [number, number, number];
  const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  rot[idx] = (rot[idx] + Math.PI / 2) % (Math.PI * 2);
  historyStore.pushSnapshot();
  sceneStore.updatePart(selectedPart.value.id, { rotation: rot });
};

const duplicatePart = () => {
  if (selectedPart.value) {
    historyStore.pushSnapshot();
    sceneStore.duplicatePart(selectedPart.value.id);
  }
};

const deletePart = () => {
  if (selectedPart.value) {
    historyStore.pushSnapshot();
    sceneStore.deletePart(selectedPart.value.id);
  }
};
</script>

<template>
  <div class="inspector">
    <div class="inspector-header">
      <h3>Inspector</h3>
    </div>

    <div v-if="!selectedPart" class="inspector-empty">
      <p>No part selected</p>
    </div>

    <div v-else class="inspector-content">
      <!-- Part Info -->
      <div class="section">
        <div class="section-title">Part</div>
        <div class="info-row">
          <span class="label">Name:</span>
          <span class="value">{{ selectedPart.label }}</span>
        </div>
        <div class="info-row">
          <span class="label">Type:</span>
          <span class="value">{{ selectedDefinition?.name }}</span>
        </div>
        <div class="info-row">
          <span class="label">Category:</span>
          <span class="value">{{ selectedDefinition?.category }}</span>
        </div>
      </div>

      <!-- Position -->
      <div class="section">
        <div class="section-title">Position</div>
        <div class="input-group">
          <label>X</label>
          <input v-model.number="posX" type="number" step="1" />
        </div>
        <div class="input-group">
          <label>Y</label>
          <input v-model.number="posY" type="number" step="1" />
        </div>
        <div class="input-group">
          <label>Z</label>
          <input v-model.number="posZ" type="number" step="1" />
        </div>
      </div>

      <!-- Rotation -->
      <div class="section">
        <div class="section-title">Rotation (°)</div>
        <div class="rotation-group">
          <div class="input-group">
            <label>Rx</label>
            <input v-model.number="rotX" type="number" step="1" />
            <button class="step-btn" @click="rotateBy90('x')">90°</button>
          </div>
          <div class="input-group">
            <label>Ry</label>
            <input v-model.number="rotY" type="number" step="1" />
            <button class="step-btn" @click="rotateBy90('y')">90°</button>
          </div>
          <div class="input-group">
            <label>Rz</label>
            <input v-model.number="rotZ" type="number" step="1" />
            <button class="step-btn" @click="rotateBy90('z')">90°</button>
          </div>
        </div>
      </div>

      <!-- Dimensions -->
      <div class="section">
        <div class="section-title">Dimensions</div>
        <div class="info-row">
          <span class="label">W × H × D:</span>
          <span class="value">
            <template v-if="selectedDefinition">
              {{ formatDimension(selectedDefinition.dimensions.width, settingsStore.unit) }} ×
              {{ formatDimension(selectedDefinition.dimensions.height, settingsStore.unit) }} ×
              {{ formatDimension(selectedDefinition.dimensions.depth, settingsStore.unit) }}
            </template>
          </span>
        </div>
      </div>

      <!-- Color -->
      <div class="section">
        <div class="section-title">Color Override</div>
        <div class="color-input-wrapper">
          <input v-model="colorOverride" type="color" class="color-input" />
          <span>{{ colorOverride }}</span>
        </div>
      </div>

      <!-- Layer -->
      <div class="section">
        <div class="section-title">Layer</div>
        <select v-model="assignedLayer" class="layer-select">
          <option v-for="layer in sceneStore.layers" :key="layer.id" :value="layer.id">
            {{ layer.name }}
          </option>
        </select>
      </div>

      <!-- Actions -->
      <div class="section actions">
        <button class="btn btn-secondary" @click="duplicatePart">Duplicate</button>
        <button class="btn btn-danger" @click="deletePart">Delete</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.inspector {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
}

.inspector-header {
  padding: 16px;
  border-bottom: 1px solid #333;
}

.inspector-header h3 {
  margin: 0;
  color: #fff;
  font-size: 16px;
}

.inspector-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #666;
  text-align: center;
}

.inspector-empty p {
  margin: 0;
}

.inspector-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.section {
  margin-bottom: 16px;
  padding: 12px;
  background: #222;
  border-radius: 6px;
  border: 1px solid #333;
}

.section-title {
  color: #aaa;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  font-weight: 600;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  color: #999;
}

.value {
  color: #ccc;
  text-align: right;
}

/* Form control styles moved to _ui-controls.scss
.input-group {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.input-group:last-child {
  margin-bottom: 0;
}

.input-group label {
  width: 30px;
  color: #999;
  font-size: 12px;
  flex-shrink: 0;
}

.input-group input {
  flex: 1;
  padding: 6px;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  min-width: 0;
}

.input-group input:focus {
  outline: none;
  border-color: #4A90E2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.rotation-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rotation-group .input-group {
  margin-bottom: 0;
}

.step-btn {
  padding: 4px 8px;
  background: #2a4a6a;
  border: 1px solid #4A90E2;
  border-radius: 4px;
  color: #4A90E2;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.step-btn:hover {
  background: #3a5a7a;
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 50px;
  height: 36px;
  padding: 2px;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
}

.color-input:focus {
  outline: none;
  border-color: #4A90E2;
}

.color-input-wrapper span {
  color: #999;
  font-size: 12px;
}

.layer-select {
  width: 100%;
  padding: 6px;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
}

.layer-select:focus {
  outline: none;
  border-color: #4A90E2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary {
  background: #2a5a5a;
  color: #7fd9d9;
}

.btn-secondary:hover {
  background: #3a7a7a;
}

.btn-danger {
  background: #5a2a2a;
  color: #ff8080;
}

.btn-danger:hover {
  background: #7a3a3a;
}
*/
</style>
