<script setup lang="ts">
import { computed } from 'vue';
import { useSceneStore } from '../stores/sceneStore';
import { usePartsBinStore } from '../stores/partsBinStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHistoryStore } from '../stores/historyStore';
import { formatDimension } from '../utils/unitConversion';
import { radiansToDegrees } from '../utils/math';

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
