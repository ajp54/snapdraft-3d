<script setup lang="ts">
// import { onMounted } from 'vue';
// import { loadFromLocalStorage } from './utils/serialization';
import LeftPanel from './components/LeftPanel.vue';
import CenterPanel from './components/CenterPanel.vue';
import RightPanel from './components/RightPanel.vue';

// onMounted(() => {
//   // Try to load from localStorage on startup
//   loadFromLocalStorage();
// });
</script>

<template>
  <div class="app light">
    <LeftPanel />
    <CenterPanel />
    <RightPanel />
  </div>
</template>
