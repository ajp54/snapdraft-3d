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


