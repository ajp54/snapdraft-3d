import { ref } from 'vue';
import * as THREE from 'three';

export function useCamera(
  cameraRef: { value: THREE.PerspectiveCamera | null },
  sceneRef: { value: THREE.Scene | null }
) {
  const cameraDistance = ref(150);

  const setViewPreset = (preset: 'top' | 'front' | 'side' | 'iso') => {
    const camera = cameraRef.value;
    if (!camera) return;

    const dist = cameraDistance.value;

    switch (preset) {
      case 'top':
        camera.position.set(0, dist, 0);
        camera.up.set(0, 0, -1);
        break;
      case 'front':
        camera.position.set(0, dist / 2, dist);
        camera.up.set(0, 1, 0);
        break;
      case 'side':
        camera.position.set(dist, dist / 2, 0);
        camera.up.set(0, 1, 0);
        break;
      case 'iso':
        camera.position.set(dist / 1.4, dist / 1.4, dist / 1.4);
        camera.up.set(0, 1, 0);
        break;
    }

    camera.lookAt(0, 0, 0);
  };

  const focusOnSelection = (meshes: THREE.Mesh[]) => {
    const camera = cameraRef.value;
    if (!camera || meshes.length === 0) return;

    // Calculate bounding box of all selected meshes
    const box = new THREE.Box3();
    meshes.forEach((mesh) => {
      box.expandByObject(mesh);
    });

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const distance = size.length() * 1.5;

    camera.position.copy(center);
    camera.position.addScaledVector(camera.position.clone().normalize(), distance);
    camera.lookAt(center);
  };

  const reset = () => {
    setViewPreset('iso');
  };

  return {
    cameraDistance,
    setViewPreset,
    focusOnSelection,
    reset,
  };
}
