<script setup lang="ts">
import { computed } from 'vue';
import { useSceneStore } from '../stores/sceneStore';
import { usePartsBinStore } from '../stores/partsBinStore';
import { useSettingsStore } from '../stores/settingsStore';
import { formatCurrency } from '../utils/unitConversion';
import { downloadFile, exportToCSV } from '../utils/serialization';

const sceneStore = useSceneStore();
const partsBinStore = usePartsBinStore();
const settingsStore = useSettingsStore();

const partStats = computed(() => {
  const stats = new Map<string, { definition: any; quantity: number; total: number }>();

  sceneStore.placedParts.forEach((part) => {
    const def = partsBinStore.getPartDefinition(part.definitionId);
    if (!def) return;

    const existing = stats.get(part.definitionId);
    if (existing) {
      existing.quantity++;
      existing.total = existing.quantity * def.unitPrice;
    } else {
      stats.set(part.definitionId, {
        definition: def,
        quantity: 1,
        total: def.unitPrice,
      });
    }
  });

  return Array.from(stats.values());
});

const totalQuantity = computed(() => partStats.value.reduce((sum, s) => sum + s.quantity, 0));

const subtotal = computed(() => {
  return partStats.value.reduce((sum, s) => sum + s.total, 0);
});

const wasteFactor = computed({
  get: () => settingsStore.wasteFactor,
  set: (value) => settingsStore.setWasteFactor(value),
});

const wasteCost = computed(() => {
  return (subtotal.value * wasteFactor.value) / 100;
});

const grandTotal = computed(() => {
  return subtotal.value + wasteCost.value;
});

const exportCSV = () => {
  const csv = exportToCSV();
  downloadFile(csv, 'snapdraft-project.csv', 'text/csv;charset=utf-8;');
};
</script>

<template>
  <div class="materials">
    <div class="materials-header">
      <h3>Materials</h3>
    </div>

    <div class="materials-content">
      <!-- Parts Table -->
      <div class="parts-table">
        <div class="table-header">
          <div class="col-name">Part</div>
          <div class="col-qty">Qty</div>
          <div class="col-price">Unit Price</div>
          <!-- <div class="col-total">Total</div> -->
        </div>

        <div v-if="partStats.length === 0" class="table-empty">
          <p>No parts in scene</p>
        </div>

        <div v-for="stat in partStats" :key="stat.definition.id" class="table-row">
          <div class="col-name">{{ stat.definition.name }}</div>
          <div class="col-qty">{{ stat.quantity }}</div>
          <div class="col-price">{{ formatCurrency(stat.definition.unitPrice) }}</div>
          <!-- <div class="col-total">{{ formatCurrency(stat.total) }}</div> -->
        </div>
      </div>

      <!-- Summary Section -->
      <div class="summary-section">
        <div class="summary-row">
          <span class="label">Part Count:</span>
          <span class="value">{{ totalQuantity }}</span>
        </div>

        <div class="summary-row">
          <span class="label">Subtotal:</span>
          <span class="value">{{ formatCurrency(subtotal) }}</span>
        </div>

        <!-- Waste Factor -->
        <div class="waste-section">
          <div class="waste-label">Waste Factor: {{ wasteFactor }}%</div>
          <input
            v-model.number="wasteFactor"
            type="range"
            min="0"
            max="30"
            step="1"
            class="waste-slider"
          />
          <div class="summary-row">
            <span class="label">Waste Cost:</span>
            <span class="value">{{ formatCurrency(wasteCost) }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="summary-row total">
          <span class="label">Total Cost:</span>
          <span class="value">{{ formatCurrency(grandTotal) }}</span>
        </div>
      </div>

      <!-- Export Button -->
      <button class="export-btn" @click="exportCSV">
        📥 Export CSV
      </button>
    </div>
  </div>
</template>
