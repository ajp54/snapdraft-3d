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
  <div class="app">
    <LeftPanel />
    <CenterPanel />
    <RightPanel />
  </div>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-columns: 280px 1fr 260px;
  width: 100%;
  height: 100vh;
  gap: 0;
  background: #0a0a0a;
  color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
