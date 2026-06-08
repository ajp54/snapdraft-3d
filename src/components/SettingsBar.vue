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
        <option :value="0.25">1/4"</option>
        <option :value="0.5">1/2"</option>
        <option :value="1">1"</option>
        <option :value="6">6"</option>
        <option :value="12">12"</option>
      </select>
    </div>
  </div>
</template>
