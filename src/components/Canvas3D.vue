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
import { Object3D } from 'three';
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
  updateMesh,
  mouseRef,
  raycasterRef,
} = useScene3D(canvasRef);

const { selectMesh, clearSelection, updateOutline } = useSelection(
  meshMapRef
);

const orbitControlsRef = ref<OrbitControls | null>(null);
const { snapPositionToGrid, checkFaceSnap } = useSnapping();
const { setViewPreset, focusOnSelection } = useCamera(cameraRef, sceneRef, orbitControlsRef);
const { handleKeyDown } = useKeyboardShortcuts();

let orbitControls: OrbitControls | null = null;
let transformControls: (TransformControls & Object3D) | null = null;
let transformHelper: THREE.Object3D | null = null;
let selectedPartForTransform: string | null = null;
let mouseDownPos = { x: 0, y: 0 };
let isDraggingGizmo = false;

const DRAG_THRESHOLD = 4; // pixels

const updateTransformControlsVisibility = () => {
  if (!transformControls || !transformHelper) return;
  const hasSelection = sceneStore.selectedIds.size > 0;
  const isTransformMode = settingsStore.transformMode !== 'select';
  const shouldBeActive = hasSelection && isTransformMode;
  
  transformHelper.visible = shouldBeActive;
  transformControls.enabled = shouldBeActive;
};

onMounted(() => {
  
  if (!canvasRef.value) return;

  initScene();

  if (cameraRef.value && rendererRef.value && sceneRef.value) {
    orbitControls = new OrbitControls(cameraRef.value, rendererRef.value.domElement);
    orbitControls.autoRotate = false;
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControlsRef.value = orbitControls;


    transformControls = new TransformControls(cameraRef.value, rendererRef.value.domElement) as TransformControls & Object3D;
    transformHelper = transformControls.getHelper();
    sceneRef.value.add(transformHelper);
    
    // Hide transform controls in select mode
    transformControls.visible = false;

    transformControls.addEventListener('dragging-changed', (event: any) => {
      if (orbitControls) {
        orbitControls.enabled = !event.value;
      }
      isDraggingGizmo = event.value

      if (event.value) {
        historyStore.pushSnapshot();
      }
    });

    transformControls.addEventListener('change', () => {
      if (selectedPartForTransform && transformControls) {
        const mesh = meshMapRef.value.get(selectedPartForTransform);
        if (mesh) {
          const part = sceneStore.placedParts.find((p) => p.id === selectedPartForTransform);
          if (part) {
            let newPos = mesh.position.toArray() as [number, number, number];
            
            // Only snap if snapping is enabled
            if (settingsStore.snapEnabled) {
              newPos = snapPositionToGrid(newPos);
            
              const otherMeshes = Array.from(meshMapRef.value.values()).filter(
                (m) => m.userData.partId !== selectedPartForTransform
              );
              const snappedPos = checkFaceSnap(mesh, otherMeshes, new THREE.Vector3(...newPos));
              if (snappedPos) {
                newPos = snappedPos.toArray() as [number, number, number];
              }
            }
            
            mesh.position.set(...newPos);
          
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
    mouseDownPos = { x: event.clientX, y: event.clientY };

    if (settingsStore.transformMode === 'select' && sceneRef.value && cameraRef.value) {
      raycasterRef.value.setFromCamera(mouseRef.value, cameraRef.value);
      const intersects = raycasterRef.value.intersectObjects(sceneRef.value.children);
      const clicked = intersects.find((obj: any) => obj.object instanceof THREE.Mesh && obj.object.userData.partId);

      if (clicked) {
        const meshId = (clicked.object as any).userData.partId;
        selectMesh(meshId, !event.ctrlKey && !event.shiftKey);
      } 
      // else if (!event.ctrlKey && !event.shiftKey) {
      //   clearSelection();
      // }
    }
  };

const handleMouseUp = (event: MouseEvent) => {
  const dx = Math.abs(event.clientX - mouseDownPos.x);
  const dy = Math.abs(event.clientY - mouseDownPos.y);
  const wasDrag = dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD;

  if (wasDrag || isDraggingGizmo) return; // Camera was being rotated, ignore

  if (sceneRef.value && cameraRef.value) {
    raycasterRef.value.setFromCamera(mouseRef.value, cameraRef.value);
    const intersects = raycasterRef.value.intersectObjects(sceneRef.value.children, true);
    const clicked = intersects.find((obj: any) =>
      obj.object instanceof THREE.Mesh && obj.object.userData.partId
    );

    if (clicked) {
      const meshId = clicked.object.userData.partId;
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
    canvasRef.value.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyEvent);
  }

  let animationFrameId: number | null = null;
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);

    if (orbitControls) orbitControls.update();

    if (transformControls) {
      if (settingsStore.transformMode === 'move') {
        transformControls.mode = 'translate';
      } else if (settingsStore.transformMode === 'rotate') {
        transformControls.mode = 'rotate';
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
      canvasRef.value.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyEvent);
    }
    orbitControls?.dispose();
    transformControls?.dispose();
  };
});

// watch(() => sceneStore.placedParts.length, () => {
//   syncWithStore();
// });

watch(() => sceneStore.placedParts, (parts) => {
  parts.forEach((part) => {
    const mesh = meshMapRef.value.get(part.id);
    if (mesh) {
      updateMesh(part);
    }
  });
  syncWithStore();
}, { deep: true, immediate: false });

watch(() => sceneStore.selectedIds, () => {
  const selected = Array.from(sceneStore.selectedIds);
  if (selected.length > 0 && transformControls) {
    const mesh = meshMapRef.value.get(selected[0]);
    if (mesh) {
      transformControls.attach(mesh);
      updateTransformControlsVisibility();
      selectedPartForTransform = selected[0];
    }
  } else if (transformControls) {
    transformControls.detach();
    updateTransformControlsVisibility();
    selectedPartForTransform = null;
  }
  updateOutline();
}, { deep: true });

watch(() => settingsStore.gridEnabled, () => {
  updateGridHelper();
});

watch(() => settingsStore.xrayMode, () => {
  updateXrayMode();
});

watch(() => settingsStore.transformMode, () => {
  if (transformControls) {
    // transformControls.visible = settingsStore.transformMode !== 'select';
    updateTransformControlsVisibility();
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
    <Toolbar :scene="sceneRef"
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
