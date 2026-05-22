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

<style scoped>
.scene-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #333;
}

.tree-header h3 {
  margin: 0;
  color: #fff;
  font-size: 16px;
}

/* Button styles moved to _ui-controls.scss
.add-btn {
  background: #4A90E2;
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #357abd;
}

.expand-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: #999;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.expand-btn:hover {
  color: #ccc;
}

.visibility-btn,
.lock-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.6;
  transition: all 0.2s;
}

.visibility-btn:hover,
.lock-btn:hover {
  opacity: 1;
}

.visibility-btn.hidden,
.lock-btn.locked {
  opacity: 1;
  color: #f44336;
}

.rename-input-wrapper {
  flex: 1;
  min-width: 0;
}

.rename-input {
  width: 100%;
  background: #1a1a1a;
  border: 1px solid #4A90E2;
  border-radius: 3px;
  color: #fff;
  padding: 4px 6px;
  font-size: 12px;
}

.rename-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.3);
}

.context-menu {
  position: fixed;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  z-index: 1000;
  min-width: 160px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.context-menu button {
  width: 100%;
  border: none;
  background: none;
  color: #ccc;
  padding: 8px 12px;
  text-align: left;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.context-menu button:hover {
  background: #333;
  color: #fff;
}

.context-menu button.danger:hover {
  background: #5a2a2a;
  color: #ff6b6b;
}
*/

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.layer-group {
  border-bottom: 1px solid #333;
}

.layer-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #222;
  border-bottom: 1px solid #333;
  gap: 4px;
}

.part-row {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.part-row:hover {
  background: #252525;
}

.part-row.selected {
  background: #1e3a5f;
}

.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid #555;
  flex-shrink: 0;
}

.layer-name {
  color: #aaa;
  font-size: 13px;
  font-weight: 500;
  flex: 1;
  min-width: 0;
}

.part-label {
  color: #ccc;
  font-size: 12px;
  flex: 1;
  min-width: 0;
}

.part-type {
  color: #777;
  font-size: 11px;
  margin-left: 4px;
}

.part-indent {
  width: 20px;
  flex-shrink: 0;
}

.menu-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: #999;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.menu-btn:hover {
  color: #fff;
  background: #333;
  border-radius: 3px;
}

.spacer {
  flex: 1;
}

.layer-parts {
  background: #1a1a1a;
}

.menu-divider {
  height: 1px;
  background: #444;
  margin: 4px 0;
}

.menu-submenu {
  padding: 4px 0;
}

.menu-label {
  color: #999;
  padding: 6px 12px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.submenu-item {
  padding-left: 20px !important;
  font-size: 11px;
}
</style>
