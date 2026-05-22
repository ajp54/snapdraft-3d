<script setup lang="ts">
import { ref } from 'vue';
import Inspector from './Inspector.vue';
import Materials from './Materials.vue';

const activeTab = ref<'inspector' | 'materials'>('inspector');
</script>

<template>
  <div class="right-panel">
    <div class="panel-tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'inspector' }"
        @click="activeTab = 'inspector'"
      >
        Inspector
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'materials' }"
        @click="activeTab = 'materials'"
      >
        Materials
      </button>
    </div>

    <div class="panel-content">
      <Inspector v-show="activeTab === 'inspector'" />
      <Materials v-show="activeTab === 'materials'" />
    </div>
  </div>
</template>

<style scoped>
.right-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
  border-left: 1px solid #333;
}

.panel-tabs {
  display: flex;
  border-bottom: 1px solid #333;
  background: #0a0a0a;
}

/* Button styles moved to _ui-controls.scss
.tab-btn {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  color: #999;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #ccc;
  background: #1a1a1a;
}

.tab-btn.active {
  color: #4A90E2;
  border-bottom-color: #4A90E2;
  background: #1a1a1a;
}
*/

.panel-content {
  flex: 1;
  overflow: hidden;
}
</style>
