<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePartsBinStore } from '../stores/partsBinStore';
import { useSettingsStore } from '../stores/settingsStore';
import { formatDimension } from '../utils/unitConversion';
import type { PartDefinition } from '../stores/types';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
  }>(),
  {
    modelValue: false,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const partsBinStore = usePartsBinStore();
const settingsStore = useSettingsStore();

const name = ref('');
const category = ref('Lumber');
const width = ref(3.5);
const height = ref(1.5);
const depth = ref(96);
const unitPrice = ref(10);
const color = ref('#D2B48C');
const isPreset = ref(true);
const selectedPresetId = ref<string | null>(null);

const categories = ['Lumber', 'Sheet Goods', 'Masonry', 'Hardware', 'Other'];

const closeModal = () => {
  emit('update:modelValue', false);
  resetForm();
};

const resetForm = () => {
  name.value = '';
  category.value = 'Lumber';
  width.value = 3.5;
  height.value = 1.5;
  depth.value = 96;
  unitPrice.value = 10;
  color.value = '#D2B48C';
  isPreset.value = true;
  selectedPresetId.value = null;
};

const selectPreset = (preset: PartDefinition) => {
  name.value = preset.name;
  category.value = preset.category;
  width.value = preset.dimensions.width;
  height.value = preset.dimensions.height;
  depth.value = preset.dimensions.depth;
  unitPrice.value = preset.unitPrice;
  color.value = preset.color;
  selectedPresetId.value = preset.id;
  isPreset.value = false;
};

const addPart = () => {
  if (!name.value.trim()) return;

  const id = partsBinStore.addPartDefinition(
    name.value,
    category.value,
    { width: width.value, height: height.value, depth: depth.value },
    unitPrice.value,
    color.value
  );

  closeModal();
};
</script>

<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Add New Part</h2>
        <button class="close-btn" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
        <!-- Preset selector -->
        <div class="section">
          <h3>Built-in Presets</h3>
          <div class="preset-grid">
            <button
              v-for="preset in partsBinStore.partsList"
              :key="preset.id"
              :class="['preset-card', { active: selectedPresetId === preset.id }]"
              @click="selectPreset(preset)"
            >
              <div class="preset-name">{{ preset.name }}</div>
              <div class="preset-dims">
                {{ formatDimension(preset.dimensions.width, settingsStore.unit) }} ×
                {{ formatDimension(preset.dimensions.height, settingsStore.unit) }} ×
                {{ formatDimension(preset.dimensions.depth, settingsStore.unit) }}
              </div>
              <div class="preset-price">${{ preset.unitPrice.toFixed(2) }}</div>
            </button>
          </div>
        </div>

        <!-- Custom part form -->
        <div class="section">
          <h3>{{ selectedPresetId ? 'Modify Preset' : 'Custom Part' }}</h3>
          <div class="form-group">
            <label>Part Name</label>
            <input v-model="name" type="text" placeholder="e.g., 2×4 Stud" />
          </div>

          <div class="form-group">
            <label>Category</label>
            <select v-model="category">
              <option v-for="cat in categories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Width ({{ settingsStore.unitLabel }})</label>
              <input v-model.number="width" type="number" step="0.1" />
            </div>
            <div class="form-group">
              <label>Height ({{ settingsStore.unitLabel }})</label>
              <input v-model.number="height" type="number" step="0.1" />
            </div>
            <div class="form-group">
              <label>Depth ({{ settingsStore.unitLabel }})</label>
              <input v-model.number="depth" type="number" step="0.1" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Unit Price ($)</label>
              <input v-model.number="unitPrice" type="number" step="0.01" />
            </div>
            <div class="form-group">
              <label>Color</label>
              <div class="color-input-wrapper">
                <input v-model="color" type="color" />
                <span>{{ color }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">Cancel</button>
        <button class="btn btn-primary" @click="addPart" :disabled="!name.trim()">
          Add Part
        </button>
      </div>
    </div>
  </div>
</template>
