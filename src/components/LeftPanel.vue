<script setup lang="ts">
import { ref } from 'vue';
import PartsBin from './PartsBin.vue';
import SceneTree from './SceneTree.vue';

const activeTab = ref<'bin' | 'tree'>('bin');
</script>

<template>
  <div class="left-panel">
    <div class="panel-tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'bin' }"
        @click="activeTab = 'bin'"
      >
        Parts Bin
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'tree' }"
        @click="activeTab = 'tree'"
      >
        Scene Tree
      </button>
    </div>

    <div class="panel-content">
      <PartsBin v-show="activeTab === 'bin'" />
      <SceneTree v-show="activeTab === 'tree'" />
    </div>
  </div>
</template>

<style scoped>
.left-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
  border-right: 1px solid #333;
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
