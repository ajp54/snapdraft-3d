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

<style scoped>
/* Modal and button styles moved to _ui-controls.scss
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #2a2a2a;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #444;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #fff;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.section {
  margin-bottom: 30px;
}

.section h3 {
  color: #ccc;
  font-size: 14px;
  text-transform: uppercase;
  margin: 0 0 12px 0;
  letter-spacing: 1px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.preset-card {
  background: #1a1a1a;
  border: 2px solid #444;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.preset-card:hover {
  border-color: #666;
  background: #222;
}

.preset-card.active {
  border-color: #4A90E2;
  background: #1e3a5f;
}

.preset-name {
  color: #fff;
  font-weight: 500;
  font-size: 12px;
  margin-bottom: 4px;
}

.preset-dims {
  color: #999;
  font-size: 11px;
  margin-bottom: 4px;
}

.preset-price {
  color: #4A90E2;
  font-size: 11px;
  font-weight: 500;
}

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

label {
  display: block;
  color: #aaa;
  font-size: 12px;
  text-transform: uppercase;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

input,
select {
  width: 100%;
  padding: 8px;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
}

input:focus,
select:focus {
  outline: none;
  border-color: #4A90E2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.color-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-input-wrapper input[type='color'] {
  width: 50px;
  height: 36px;
  cursor: pointer;
  padding: 2px;
}

.color-input-wrapper span {
  color: #999;
  font-size: 12px;
  flex: 1;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid #444;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #4A90E2;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #357abd;
}

.btn-secondary {
  background: #444;
  color: #fff;
}

.btn-secondary:hover {
  background: #555;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
*/
</style>
