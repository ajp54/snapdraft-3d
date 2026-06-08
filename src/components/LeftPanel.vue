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
