import { ref, computed, watch } from 'vue';
import * as THREE from 'three';
import { useSceneStore } from '../stores/sceneStore';

export function useSelection(
  meshMapRef: { value: Map<string, THREE.Mesh> }
) {
  const selectedMeshIds = ref<Set<string>>(new Set());

  const sceneStore = useSceneStore();

  const meshesForOutline = computed(() => {
    return Array.from(selectedMeshIds.value)
      .map((id) => meshMapRef.value.get(id))
      .filter((m): m is THREE.Mesh => m !== undefined);
  });

  const selectMesh = (meshId: string, exclusive: boolean = true) => {
    if (exclusive) {
      selectedMeshIds.value.clear();
    }

    if (selectedMeshIds.value.has(meshId)) {
      selectedMeshIds.value.delete(meshId);
    } else {
      selectedMeshIds.value.add(meshId);
    }

    sceneStore.setSelectedIds(selectedMeshIds.value);
    updateOutline();
  };

  const clearSelection = () => {
    selectedMeshIds.value.clear();
    sceneStore.clearSelection();
    updateOutline();
  };

  const setMultipleSelection = (meshIds: Set<string>) => {
    selectedMeshIds.value = new Set(meshIds);
    sceneStore.setSelectedIds(selectedMeshIds.value);
    updateOutline();
  };

  const updateOutline = () => {
    meshMapRef.value.forEach((mesh, id) => {
      if (selectedMeshIds.value.has(id)) {
        (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x444444);
      } else {
        (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
      }
    });
  };

  watch(() => Array.from(sceneStore.selectedIds), () => {
    selectedMeshIds.value = new Set(sceneStore.selectedIds);
    updateOutline();
  });

  return {
    selectedMeshIds,
    meshesForOutline,
    selectMesh,
    clearSelection,
    setMultipleSelection,
    updateOutline,
  };
}
