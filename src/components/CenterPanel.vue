<script setup lang="ts">
import Canvas3D from './Canvas3D.vue';

const emit = defineEmits<{
  'view-preset': [preset: 'top' | 'front' | 'side' | 'iso'];
  'focus': [];
}>();
</script>

<template>
  <div class="center-panel">
    <Canvas3D @view-preset="$emit('view-preset', $event)" @focus="$emit('focus')" />
  </div>
</template>

<style scoped>
.center-panel {
  position: relative;
  flex: 1;
  overflow: hidden;
  background: #0a0a0a;
}
</style>
