<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePartsBinStore } from '../stores/partsBinStore';
import { useSceneStore } from '../stores/sceneStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHistoryStore } from '../stores/historyStore';
import { formatDimension, formatCurrency } from '../utils/unitConversion';
import AddPartModal from './AddPartModal.vue';

const partsBinStore = usePartsBinStore();
const sceneStore = useSceneStore();
const settingsStore = useSettingsStore();
const historyStore = useHistoryStore();

const showModal = ref(false);
const expandedCategory = ref<string | null>(null);

const partsByCategory = computed(() => {
  const map = new Map<string, typeof partsBinStore.partsList>();
  partsBinStore.partsList.forEach((part) => {
    if (!map.has(part.category)) {
      map.set(part.category, []);
    }
    map.get(part.category)!.push(part);
  });
  return map;
});

const categories = computed(() => Array.from(partsByCategory.value.keys()).sort());

const addPartToScene = (definitionId: string) => {
  historyStore.pushSnapshot();
  const part = sceneStore.addPart(definitionId);
  sceneStore.toggleSelection(part.id, true);
};

const deletePart = (id: string) => {
  const count = partsBinStore.getPartCount(id);
  if (count > 0) {
    alert('Cannot delete part definition while instances exist in the scene');
    return;
  }
  partsBinStore.deletePartDefinition(id);
};

const toggleCategory = (category: string) => {
  expandedCategory.value = expandedCategory.value === category ? null : category;
};
</script>

<template>
  <div class="parts-bin">
    <div class="bin-header">
      <h3>Parts Bin</h3>
      <button class="add-btn" @click="showModal = true">+ Add Part</button>
    </div>

    <div class="parts-list">
      <div v-for="category in categories" :key="category" class="category-section">
        <button class="category-header" @click="toggleCategory(category)">
          <span class="arrow">{{ expandedCategory === category ? '▼' : '▶' }}</span>
          <span class="category-name">{{ category }}</span>
        </button>

        <div v-show="expandedCategory === category" class="category-parts">
          <div
            v-for="part in partsByCategory.get(category)"
            :key="part.id"
            class="part-card"
          >
            <div class="part-header">
              <div class="color-dot" :style="{ backgroundColor: part.color }"></div>
              <div class="part-info">
                <div class="part-name">{{ part.name }}</div>
                <div class="part-dims">
                  {{ formatDimension(part.dimensions.width, settingsStore.unit) }} ×
                  {{ formatDimension(part.dimensions.height, settingsStore.unit) }} ×
                  {{ formatDimension(part.dimensions.depth, settingsStore.unit) }}
                </div>
              </div>
            </div>

            <div class="part-footer">
              <div class="part-details">
                <div class="part-price">{{ formatCurrency(part.unitPrice) }}</div>
                <div class="part-count">
                  Count: {{ partsBinStore.getPartCount(part.id) }}
                </div>
              </div>
              <div class="part-actions">
                <button class="action-btn place-btn" @click="addPartToScene(part.id)">
                  +
                </button>
                <button
                  v-if="part.isCustom"
                  class="action-btn delete-btn"
                  :disabled="partsBinStore.getPartCount(part.id) > 0"
                  @click="deletePart(part.id)"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Part Modal -->
    <AddPartModal v-model="showModal" />
  </div>
</template>

<style scoped>
.parts-bin {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
}

.bin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #333;
}

.bin-header h3 {
  margin: 0;
  color: #fff;
  font-size: 16px;
}

/* Button styles moved to _ui-controls.scss
.add-btn {
  background: #4A90E2;
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #357abd;
}

.category-header {
  width: 100%;
  background: #222;
  border: none;
  padding: 12px 16px;
  text-align: left;
  color: #aaa;
  font-size: 12px;
  text-transform: uppercase;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.category-header:hover {
  background: #2a2a2a;
  color: #ccc;
}

.arrow {
  font-size: 10px;
  min-width: 16px;
}

.category-name {
  flex: 1;
  letter-spacing: 0.5px;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.place-btn {
  background: #2a5a3a;
  color: #6fd97f;
}

.place-btn:hover {
  background: #3a7a4a;
}

.delete-btn {
  background: #5a2a2a;
  color: #d97f7f;
}

.delete-btn:hover:not(:disabled) {
  background: #7a3a3a;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
*/

.category-parts {
  padding: 8px;
  background: #1a1a1a;
}

.part-card {
  background: #222;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.part-card:hover {
  border-color: #444;
  background: #252525;
}

.part-header {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
  border: 1px solid #444;
}

.part-info {
  flex: 1;
  min-width: 0;
}

.part-name {
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 2px;
}

.part-dims {
  color: #999;
  font-size: 11px;
}

.part-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.part-details {
  flex: 1;
  min-width: 0;
}

.part-price {
  color: #4A90E2;
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 2px;
}

.part-count {
  color: #777;
  font-size: 10px;
}

.part-actions {
  display: flex;
  gap: 4px;
}

/* Action button styles moved to _ui-controls.scss
.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.place-btn {
  background: #2a5a3a;
  color: #6fd97f;
}

.place-btn:hover {
  background: #3a7a4a;
}

.delete-btn {
  background: #5a2a2a;
  color: #d97f7f;
}

.delete-btn:hover:not(:disabled) {
  background: #7a3a3a;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
*/
</style>
