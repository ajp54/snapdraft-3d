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
