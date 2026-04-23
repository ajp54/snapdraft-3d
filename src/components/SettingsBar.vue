<script setup lang="ts">
import { computed } from 'vue';
import { useSettingsStore } from '../stores/settingsStore';

const settingsStore = useSettingsStore();

const unit = computed({
  get: () => settingsStore.unit,
  set: (value) => settingsStore.setUnit(value as any),
});

const gridSize = computed({
  get: () => settingsStore.gridSize,
  set: (value) => settingsStore.setGridSize(value),
});

const snapIncrement = computed({
  get: () => settingsStore.snapIncrement,
  set: (value) => settingsStore.setSnapIncrement(value as any),
});
</script>

<template>
  <div class="settings-bar">
    <div class="settings-group">
      <label>Units:</label>
      <select v-model="unit">
        <option value="in">Inches</option>
        <option value="ft">Feet</option>
        <option value="mm">Millimeters</option>
      </select>
    </div>

    <div class="settings-group">
      <label>Grid Size (in):</label>
      <select v-model.number="gridSize">
        <option :value="6">6"</option>
        <option :value="12">12"</option>
        <option :value="24">24"</option>
        <option :value="36">36"</option>
      </select>
    </div>

    <div class="settings-group">
      <label>Snap Increment (in):</label>
      <select v-model.number="snapIncrement">
        <option :value="1">1"</option>
        <option :value="3">3"</option>
        <option :value="6">6"</option>
        <option :value="12">12"</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.settings-bar {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  background: #222;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  gap: 16px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.settings-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

label {
  color: #999;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

select {
  padding: 6px 8px;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

select:focus {
  outline: none;
  border-color: #4A90E2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}
</style>
