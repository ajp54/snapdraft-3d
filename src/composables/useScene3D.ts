import { ref, computed, shallowRef } from 'vue';
import * as THREE from 'three';
import { useSceneStore } from '../stores/sceneStore';
import { usePartsBinStore } from '../stores/partsBinStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { PlacedPart } from '../stores/types';

export function useScene3D(canvasRefArg: any) {
  const sceneRef = shallowRef<THREE.Scene | null>(null);
  const cameraRef = shallowRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = shallowRef<THREE.WebGLRenderer | null>(null);
  const meshMapRef = ref<Map<string, THREE.Mesh>>(new Map());
  const gridHelperRef = shallowRef<THREE.GridHelper | null>(null);
  const raycasterRef = ref(new THREE.Raycaster());
  const mouseRef = ref(new THREE.Vector2());

  const sceneStore = useSceneStore();
  const partsBinStore = usePartsBinStore();
  const settingsStore = useSettingsStore();

  const isInitialized = computed(() => sceneRef.value !== null);

  const createPartMesh = (part: PlacedPart, definition: any): THREE.Mesh => {
    const dims = definition.dimensions;
    const geometry = new THREE.BoxGeometry(dims.width, dims.height, dims.depth);
    
    const color = part.colorOverride || definition.color;
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: 0.2,
      roughness: 0.7,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...part.position);
    mesh.rotation.set(...part.rotation);
    mesh.userData = { partId: part.id };

    return mesh;
  };

  const updateMesh = (part: PlacedPart) => {
    const mesh = meshMapRef.value.get(part.id);
    if (!mesh) return;

    mesh.position.set(...part.position);
    mesh.rotation.set(...part.rotation);
    mesh.visible = part.visible;

    const definition = partsBinStore.getPartDefinition(part.definitionId);
    if (definition) {
      const color = part.colorOverride || definition.color;
      (mesh.material as THREE.MeshStandardMaterial).color.setStyle(color);
    }

    const opacity = settingsStore.xrayMode ? 0.2 : 1;
    (mesh.material as THREE.MeshStandardMaterial).opacity = opacity;
    (mesh.material as THREE.MeshStandardMaterial).transparent = settingsStore.xrayMode;
  };

  const addPartToScene = (part: PlacedPart) => {
    const definition = partsBinStore.getPartDefinition(part.definitionId);
    if (!definition || !sceneRef.value) return;

    // Remove old mesh if exists
    const oldMesh = meshMapRef.value.get(part.id);
    if (oldMesh) {
      sceneRef.value.remove(oldMesh);
      oldMesh.geometry.dispose();
      (oldMesh.material as THREE.Material).dispose();
    }

    const mesh = createPartMesh(part, definition);
    meshMapRef.value.set(part.id, mesh);
    sceneRef.value.add(mesh);
  };

  const removePartFromScene = (partId: string) => {
    if (!sceneRef.value) return;
    const mesh = meshMapRef.value.get(partId);
    if (mesh) {
      sceneRef.value.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      meshMapRef.value.delete(partId);
    }
  };

  const initScene = () => {
    const canvas = canvasRefArg.value;
    if (!canvas) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.value = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.set(100, 100, 100);
    camera.lookAt(0, 0, 0);
    cameraRef.value = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    rendererRef.value = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Grid
    updateGridHelper();

    // Add existing parts
    sceneStore.placedParts.forEach((part) => {
      addPartToScene(part);
    });

    // Setup event listeners
    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.value.x = ((event.clientX - rect.left) / width) * 2 - 1;
      mouseRef.value.y = -((event.clientY - rect.top) / height) * 2 + 1;
    };

    canvas.addEventListener('mousemove', onMouseMove);
  };

  const updateGridHelper = () => {
    if (!sceneRef.value) return;

    if (gridHelperRef.value) {
      sceneRef.value.remove(gridHelperRef.value);
    }

    if (settingsStore.gridEnabled) {
      const size = settingsStore.gridSize * 10;
      const divisions = 10;
      const gridHelper = new THREE.GridHelper(size, divisions, 0x444444, 0x222222);
      gridHelper.position.y = -0.01;
      gridHelperRef.value = gridHelper;
      sceneRef.value.add(gridHelper);
    } else {
      gridHelperRef.value = null;
    }
  };

  const updateXrayMode = () => {
    meshMapRef.value.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.transparent = settingsStore.xrayMode;
      mat.opacity = settingsStore.xrayMode ? 0.2 : 1;
    });
  };

  const syncWithStore = () => {
    const existingIds = new Set(meshMapRef.value.keys());
    const storeIds = new Set(sceneStore.placedParts.map((p) => p.id));

    // Remove deleted parts
    existingIds.forEach((id) => {
      if (!storeIds.has(id)) {
        removePartFromScene(id);
      }
    });

    // Add new or update existing parts
    sceneStore.placedParts.forEach((part) => {
      if (!existingIds.has(part.id)) {
        addPartToScene(part);
      } else {
        updateMesh(part);
      }
    });
  };

  const dispose = () => {
    if (rendererRef.value) {
      rendererRef.value.dispose();
    }
  };

  return {
    sceneRef,
    cameraRef,
    rendererRef,
    meshMapRef,
    isInitialized,
    initScene,
    updateGridHelper,
    addPartToScene,
    removePartFromScene,
    updateMesh,
    updateXrayMode,
    syncWithStore,
    dispose,
    mouseRef,
    raycasterRef,
  };
}
