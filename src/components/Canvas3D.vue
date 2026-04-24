<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { useScene3D } from '../composables/useScene3D';
import { useSelection } from '../composables/useSelection';
import { useSnapping } from '../composables/useSnapping';
import { useCamera } from '../composables/useCamera';
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts';
import { useSceneStore } from '../stores/sceneStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHistoryStore } from '../stores/historyStore';
import Toolbar from './Toolbar.vue';
import SettingsBar from './SettingsBar.vue';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const sceneStore = useSceneStore();
const settingsStore = useSettingsStore();
const historyStore = useHistoryStore();

const {
  sceneRef,
  cameraRef,
  rendererRef,
  meshMapRef,
  initScene,
  updateGridHelper,
  updateXrayMode,
  syncWithStore,
  mouseRef,
  raycasterRef,
} = useScene3D(canvasRef);

const { selectMesh, clearSelection, updateOutline } = useSelection(
  meshMapRef
);

const { snapPositionToGrid, checkFaceSnap } = useSnapping();
const { setViewPreset, focusOnSelection } = useCamera(cameraRef, sceneRef);
const { handleKeyDown } = useKeyboardShortcuts();

const onDraggingChanged = (event) => {
  orbitControls.enabled = !event.value;
};


let orbitControls: OrbitControls | null = null;
let transformControls: TransformControls | null = null;
let transformControlsHelper: THREE.Object3D | null = null;
let selectedPartForTransform: string | null = null;

onMounted(() => {
  if (!canvasRef.value) return;

  initScene();

  if (cameraRef.value && rendererRef.value && sceneRef.value) {
    orbitControls = new OrbitControls(cameraRef.value, rendererRef.value.domElement);
    orbitControls.autoRotate = false;
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;

    transformControls = new TransformControls(cameraRef.value, rendererRef.value.domElement);
    transformControlsHelper = transformControls.getHelper();
    
    // Add to scene so the gizmo renders
    if (sceneRef.value) {
      sceneRef.value.add(transformControlsHelper);
    }

    // Hide transform controls in select mode
    transformControlsHelper.visible = false;

    transformControls.addEventListener('dragging-changed', (event: any) => {
      if (orbitControls) {
        orbitControls.enabled = !event.value;
      }
    });

    transformControls.addEventListener('change', () => {
      if (selectedPartForTransform && transformControls) {
        const mesh = meshMapRef.value.get(selectedPartForTransform);
        if (mesh) {
          const part = sceneStore.placedParts.find((p) => p.id === selectedPartForTransform);
          if (part) {
            let newPos = mesh.position.toArray() as [number, number, number];
            newPos = snapPositionToGrid(newPos);

            const otherMeshes = Array.from(meshMapRef.value.values()).filter(
              (m) => m.userData.partId !== selectedPartForTransform
            );
            const snappedPos = checkFaceSnap(mesh, otherMeshes, new THREE.Vector3(...newPos));
            if (snappedPos) {
              newPos = snappedPos.toArray() as [number, number, number];
            }

            sceneStore.updatePart(selectedPartForTransform, {
              position: newPos,
              rotation: mesh.rotation.toArray().slice(0, 3) as [number, number, number],
            });
          }
        }
      }
    });
  }

  const handleMouseMove = () => {
    if (settingsStore.transformMode === 'select' && sceneRef.value && cameraRef.value) {
      raycasterRef.value.setFromCamera(mouseRef.value, cameraRef.value);
      const intersects = raycasterRef.value.intersectObjects(sceneRef.value.children);
      
      meshMapRef.value.forEach((mesh) => {
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (intersects.some((obj: any) => obj.object === mesh)) {
          material.emissive.setHex(0x222222);
        } else if (!sceneStore.selectedIds.has(mesh.userData.partId)) {
          material.emissive.setHex(0x000000);
        }
      });
    }
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (settingsStore.transformMode === 'select' && sceneRef.value && cameraRef.value) {
      raycasterRef.value.setFromCamera(mouseRef.value, cameraRef.value);
      const intersects = raycasterRef.value.intersectObjects(sceneRef.value.children);
      const clicked = intersects.find((obj: any) => obj.object instanceof THREE.Mesh);

      if (clicked) {
        const meshId = (clicked.object as any).userData.partId;
        selectMesh(meshId, !event.ctrlKey && !event.shiftKey);
      } else if (!event.ctrlKey && !event.shiftKey) {
        clearSelection();
      }
    }
  };

  const handleKeyEvent = (event: KeyboardEvent) => {
    handleKeyDown(event);
  };

  if (canvasRef.value) {
    canvasRef.value.addEventListener('mousemove', handleMouseMove);
    canvasRef.value.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyEvent);
  }

  let animationFrameId: number | null = null;
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    if (orbitControls) orbitControls.update();
    if (transformControls) {
      // Show/hide transform controls based on mode
      transformControls.visible = settingsStore.transformMode !== 'select';
      transformControlsHelper.visible = settingsStore.transformMode !== 'select';
      
      if (settingsStore.transformMode !== 'select') {
        transformControls.mode =
          settingsStore.transformMode === 'move' ? 'translate' : 'rotate';
      }
    }
    if (rendererRef.value && sceneRef.value && cameraRef.value) {
      rendererRef.value.render(sceneRef.value, cameraRef.value);
    }
  };
  animate();

  syncWithStore();

  return () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
    if (canvasRef.value) {
      canvasRef.value.removeEventListener('mousemove', handleMouseMove);
      canvasRef.value.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyEvent);
    }
    orbitControls?.dispose();
    transformControls?.dispose();
  };
});

watch(() => sceneStore.placedParts.length, () => {
  syncWithStore();
});

watch(() => sceneStore.selectedIds, () => {
  const selected = Array.from(sceneStore.selectedIds);
  if (selected.length > 0 && transformControls) {
    const mesh = meshMapRef.value.get(selected[0]);
    if (mesh) {
      // Ensure transform controls is visible if not in select mode
      transformControls.attach(mesh);
      if (settingsStore.transformMode !== 'select') {
        transformControls.visible = true;
      }
      selectedPartForTransform = selected[0];
    }
  } else if (transformControls) {
    transformControls.detach();
    transformControls.visible = false;
    selectedPartForTransform = null;
  }
  updateOutline();
});

watch(() => settingsStore.gridEnabled, () => {
  updateGridHelper();
});

watch(() => settingsStore.xrayMode, () => {
  updateXrayMode();
});

watch(() => settingsStore.transformMode, () => {
  if (transformControls) {
    const shouldShow = settingsStore.transformMode !== 'select' && 
                       Array.from(sceneStore.selectedIds).length > 0;
    transformControls.visible = shouldShow;
  }
});

const handleViewPreset = (preset: 'top' | 'front' | 'side' | 'iso') => {
  setViewPreset(preset);
};

const handleFocus = () => {
  const selected = Array.from(sceneStore.selectedIds)
    .map((id) => meshMapRef.value.get(id))
    .filter((m): m is THREE.Mesh => m !== undefined);
  if (selected.length > 0) {
    focusOnSelection(selected);
  }
};
</script>

<template>
  <div class="canvas-container">
    <canvas ref="canvasRef" class="canvas"></canvas>
    
    <!-- Toolbar -->
    <Toolbar
      @view-preset="handleViewPreset"
      @focus="handleFocus"
    />

    <!-- Settings Bar -->
    <SettingsBar />
  </div>
</template>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #0a0a0a;
}

.canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
