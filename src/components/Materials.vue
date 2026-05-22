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

<style scoped>
.materials {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
}

.materials-header {
  padding: 16px;
  border-bottom: 1px solid #333;
}

.materials-header h3 {
  margin: 0;
  color: #fff;
  font-size: 16px;
}

.materials-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.parts-table {
  background: #222;
  border: 1px solid #333;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 11px;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 30px 75px;
  gap: 8px;
  padding: 8px;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
  border-radius: 6px 6px 0 0;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 25px 75px;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #333;
  color: #ccc;
}

.table-row:last-child {
  border-bottom: none;
}

.table-empty {
  padding: 16px;
  text-align: center;
  color: #666;
}

.col-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-qty,
.col-price,
.col-total {
  text-align: right;
}

.summary-section {
  background: #222;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.summary-row.total {
  font-weight: 600;
  color: #fff;
  margin-top: 8px;
}

.label {
  color: #999;
}

.value {
  color: #4A90E2;
  font-weight: 500;
}

.summary-row.total .value {
  color: #7fd9a0;
  font-size: 14px;
}

.waste-section {
  margin: 8px 0;
  padding: 8px 0;
  border-top: 1px solid #333;
  border-bottom: 1px solid #333;
}

.waste-label {
  color: #999;
  font-size: 11px;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.waste-slider {
  width: 100%;
  height: 4px;
  margin-bottom: 6px;
  cursor: pointer;
  appearance: none;
  background: #1a1a1a;
  border-radius: 2px;
  outline: none;
}

.waste-slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  background: #4A90E2;
  border-radius: 50%;
  cursor: pointer;
}

.waste-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #4A90E2;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.divider {
  height: 1px;
  background: #333;
  margin: 8px 0;
}

/* Button styles moved to _ui-controls.scss
.export-btn {
  padding: 10px;
  background: #2a5a5a;
  border: 1px solid #4A90E2;
  border-radius: 4px;
  color: #7fd9d9;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: auto;
}

.export-btn:hover {
  background: #3a7a7a;
  color: #fff;
}
*/
</style>
