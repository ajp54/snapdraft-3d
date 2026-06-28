import { ref } from 'vue';
import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function useCamera(
  cameraRef: { value: THREE.PerspectiveCamera | null },
  _sceneRef: { value: THREE.Scene | null },
  orbitControlsRef: { value: OrbitControls | null }  // ← add this
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
      // case 'iso':
      //   camera.position.set(dist / 1.4, dist / 1.4, dist / 1.4);
      //   camera.up.set(0, 1, 0);
      //   break;
    }

    camera.lookAt(0, 0, 0);
    orbitControlsRef.value?.target.set(0, 0, 0); // ← also sync target on preset changes
    orbitControlsRef.value?.update();
  };

  const focusOnSelection = (meshes: THREE.Mesh[]) => {
    const camera = cameraRef.value;
    if (!camera || meshes.length === 0) return;

    const box = new THREE.Box3();
    meshes.forEach((mesh) => box.expandByObject(mesh));

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const distance = size.length() * 1.5;

    const direction = camera.position.clone().sub(center).normalize();
    camera.position.copy(center).addScaledVector(direction, distance);
    camera.lookAt(center);

    orbitControlsRef.value?.target.copy(center); // ← sync orbit target
    orbitControlsRef.value?.update();
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