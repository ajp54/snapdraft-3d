<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSceneStore } from '../stores/sceneStore';
import { usePartsBinStore } from '../stores/partsBinStore';
import { useHistoryStore } from '../stores/historyStore';

const sceneStore = useSceneStore();
const partsBinStore = usePartsBinStore();
const historyStore = useHistoryStore();

const expandedLayers = ref<Set<string>>(new Set());
const renamingId = ref<string | null>(null);
const renamingValue = ref('');
const contextMenuId = ref<string | null>(null);
const contextMenuPos = ref<{ x: number; y: number } | null>(null);

const layersSorted = computed(() => [...sceneStore.layers].sort());

const selectPart = (partId: string, exclusive: boolean = true) => {
  sceneStore.toggleSelection(partId, exclusive);
};

const toggleLayerVisibility = (layerId: string) => {
  const layer = sceneStore.getLayer(layerId);
  if (layer) {
    sceneStore.updateLayer(layerId, { visible: !layer.visible });
  }
};

const toggleLayerLock = (layerId: string) => {
  const layer = sceneStore.getLayer(layerId);
  if (layer) {
    sceneStore.updateLayer(layerId, { locked: !layer.locked });
  }
};

const toggleParts = (partIds: string[], visible?: boolean) => {
  partIds.forEach((id) => {
    const part = sceneStore.placedParts.find((p) => p.id === id);
    if (part) {
      sceneStore.updatePart(id, {
        visible: visible !== undefined ? visible : !part.visible,
      });
    }
  });
};

const togglePartLock = (partId: string) => {
  const part = sceneStore.placedParts.find((p) => p.id === partId);
  if (part) {
    sceneStore.updatePart(partId, { locked: !part.locked });
  }
};

const startRenaming = (id: string, currentName: string) => {
  renamingId.value = id;
  renamingValue.value = currentName;
  contextMenuId.value = null;
};

const finishRenaming = (id: string) => {
  if (!renamingValue.value.trim()) return;

  const layer = sceneStore.getLayer(id);
  if (layer) {
    sceneStore.updateLayer(id, { name: renamingValue.value });
  } else {
    const part = sceneStore.placedParts.find((p) => p.id === id);
    if (part) {
      sceneStore.updatePart(id, { label: renamingValue.value });
    }
  }

  renamingId.value = null;
};

const duplicatePart = (partId: string) => {
  historyStore.pushSnapshot();
  sceneStore.duplicatePart(partId);
  contextMenuId.value = null;
};

const deletePart = (partId: string) => {
  historyStore.pushSnapshot();
  sceneStore.deletePart(partId);
  contextMenuId.value = null;
};

const addLayer = () => {
  historyStore.pushSnapshot();
  sceneStore.addLayer();
};

const deleteLayer = (layerId: string) => {
  if (sceneStore.deleteLayer(layerId)) {
    historyStore.pushSnapshot();
    expandedLayers.value.delete(layerId);
  }
};

const toggleLayerExpand = (layerId: string) => {
  if (expandedLayers.value.has(layerId)) {
    expandedLayers.value.delete(layerId);
  } else {
    expandedLayers.value.add(layerId);
  }
};

const showContextMenu = (id: string, event: MouseEvent) => {
  event.preventDefault();
  contextMenuId.value = id;
  contextMenuPos.value = { x: event.clientX, y: event.clientY };
};

const movePartToLayer = (partId: string, layerId: string) => {
  historyStore.pushSnapshot();
  sceneStore.updatePart(partId, { layerId });
  contextMenuId.value = null;
};

const getPartDefinitionName = (definitionId: string) => {
  return partsBinStore.getPartDefinition(definitionId)?.name || 'Unknown';
};
</script>

<template>
  <div class="scene-tree">
    <div class="tree-header">
      <h3>Scene Tree</h3>
      <button class="add-btn" @click="addLayer">+ Layer</button>
    </div>

    <div class="tree-content">
      <div v-for="layer in layersSorted" :key="layer.id" class="layer-group">
        <!-- Layer Row -->
        <div class="layer-row">
          <button
            class="expand-btn"
            @click="toggleLayerExpand(layer.id)"
          >
            {{ expandedLayers.has(layer.id) ? '▼' : '▶' }}
          </button>

          <button
            class="visibility-btn"
            :class="{ hidden: !layer.visible }"
            @click="toggleLayerVisibility(layer.id)"
            :title="layer.visible ? 'Hide' : 'Show'"
          >
            👁
          </button>

          <button
            class="lock-btn"
            :class="{ locked: layer.locked }"
            @click="toggleLayerLock(layer.id)"
            :title="layer.locked ? 'Unlock' : 'Lock'"
          >
            🔒
          </button>

          <div
            class="color-swatch"
            :style="{ backgroundColor: layer.color }"
            :title="`Layer color: ${layer.color}`"
          ></div>

          <div
            v-if="renamingId === layer.id"
            class="rename-input-wrapper"
          >
            <input
              v-model="renamingValue"
              class="rename-input"
              @blur="finishRenaming(layer.id)"
              @keydown.enter="finishRenaming(layer.id)"
              @keydown.escape="renamingId = null"
              autofocus
            />
          </div>
          <div v-else class="layer-name">{{ layer.name }}</div>

          <div class="spacer"></div>

          <button
            class="menu-btn"
            @click="showContextMenu(layer.id, $event)"
          >
            ⋯
          </button>
        </div>

        <!-- Parts in Layer -->
        <div v-show="expandedLayers.has(layer.id)" class="layer-parts">
          <div
            v-for="part in sceneStore.getPartsByLayer(layer.id)"
            :key="part.id"
            :class="[
              'part-row',
              { selected: sceneStore.selectedIds.has(part.id) }
            ]"
            @click="selectPart(part.id, !($event.ctrlKey || $event.shiftKey))"
            @contextmenu="showContextMenu(part.id, $event)"
          >
            <div class="part-indent"></div>

            <button
              class="visibility-btn"
              :class="{ hidden: !part.visible }"
              @click.stop="toggleParts([part.id], !part.visible)"
              :title="part.visible ? 'Hide' : 'Show'"
            >
              👁
            </button>

            <button
              class="lock-btn"
              :class="{ locked: part.locked }"
              @click.stop="togglePartLock(part.id)"
              :title="part.locked ? 'Unlock' : 'Lock'"
            >
              🔒
            </button>

            <div
              v-if="renamingId === part.id"
              class="rename-input-wrapper"
            >
              <input
                v-model="renamingValue"
                class="rename-input"
                @blur="finishRenaming(part.id)"
                @keydown.enter="finishRenaming(part.id)"
                @keydown.escape="renamingId = null"
                autofocus
              />
            </div>
            <div v-else class="part-label">
              {{ part.label }}
              <span class="part-type">({{ getPartDefinitionName(part.definitionId) }})</span>
            </div>

            <div class="spacer"></div>

            <button
              class="menu-btn"
              @click.stop="showContextMenu(part.id, $event)"
            >
              ⋯
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Context Menu -->
    <div
      v-if="contextMenuId && contextMenuPos"
      class="context-menu"
      :style="{ top: contextMenuPos.y + 'px', left: contextMenuPos.x + 'px' }"
      @click.stop
    >
      <template v-if="sceneStore.getLayer(contextMenuId)">
        <button @click="startRenaming(contextMenuId, sceneStore.getLayer(contextMenuId)!.name)">
          Rename
        </button>
        <button @click="deleteLayer(contextMenuId)">Delete</button>
      </template>
      <template v-else>
        <button @click="startRenaming(contextMenuId, sceneStore.placedParts.find(p => p.id === contextMenuId)?.label || '')">
          Rename
        </button>
        <button @click="duplicatePart(contextMenuId)">Duplicate</button>
        <div class="menu-divider"></div>
        <div class="menu-submenu">
          <div class="menu-label">Move to Layer</div>
          <button
            v-for="layer in sceneStore.layers"
            :key="layer.id"
            class="submenu-item"
            @click="movePartToLayer(contextMenuId, layer.id)"
          >
            {{ layer.name }}
          </button>
        </div>
        <div class="menu-divider"></div>
        <button class="danger" @click="deletePart(contextMenuId)">Delete</button>
      </template>
    </div>
  </div>
</template>
