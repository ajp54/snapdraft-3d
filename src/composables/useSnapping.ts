import * as THREE from 'three';
import { useSettingsStore } from '../stores/settingsStore';
import { snapValue } from '../utils/math';

interface BoundingBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export function useSnapping() {
  const settingsStore = useSettingsStore();

  const getBoundingBox = (mesh: THREE.Mesh): BoundingBox => {
    const geometry = mesh.geometry as THREE.BoxGeometry;
    const scale = mesh.scale;
    const half = new THREE.Vector3(
      (geometry.parameters.width / 2) * scale.x,
      (geometry.parameters.height / 2) * scale.y,
      (geometry.parameters.depth / 2) * scale.z
    );

    return {
      min: mesh.position.clone().sub(half),
      max: mesh.position.clone().add(half),
    };
  };

  const snapPositionToGrid = (position: [number, number, number]): [number, number, number] => {
    if (!settingsStore.snapEnabled) return position;

    const snap = settingsStore.snapIncrement;
    return [
      snapValue(position[0], snap, 0.5),
      position[1], // Keep Y as-is (vertical)
      snapValue(position[2], snap, 0.5),
    ];
  };

  const snapRotationTo90 = (rotation: [number, number, number]): [number, number, number] => {
    const toRadians = (deg: number) => (deg * Math.PI) / 180;
    const toDegrees = (rad: number) => (rad * 180) / Math.PI;

    return [
      rotation[0], // X usually not snapped
      Math.round(toDegrees(rotation[1]) / 90) * toRadians(90),
      rotation[2], // Z usually not snapped
    ];
  };

  const checkFaceSnap = (
    movingMesh: THREE.Mesh,
    otherMeshes: THREE.Mesh[],
    newPosition: THREE.Vector3
  ): THREE.Vector3 | null => {
    if (!settingsStore.snapEnabled) return null;

    const SNAP_DISTANCE = 0.5; // inches
    const movingBox = getBoundingBox(movingMesh);

    for (const otherMesh of otherMeshes) {
      const otherBox = getBoundingBox(otherMesh);

      // Check X-axis alignment
      if (Math.abs(movingBox.min.x - otherBox.max.x) < SNAP_DISTANCE) {
        newPosition.x = otherBox.max.x + (movingBox.max.x - movingBox.min.x) / 2;
        return newPosition;
      }
      if (Math.abs(movingBox.max.x - otherBox.min.x) < SNAP_DISTANCE) {
        newPosition.x = otherBox.min.x - (movingBox.max.x - movingBox.min.x) / 2;
        return newPosition;
      }

      // Check Z-axis alignment
      if (Math.abs(movingBox.min.z - otherBox.max.z) < SNAP_DISTANCE) {
        newPosition.z = otherBox.max.z + (movingBox.max.z - movingBox.min.z) / 2;
        return newPosition;
      }
      if (Math.abs(movingBox.max.z - otherBox.min.z) < SNAP_DISTANCE) {
        newPosition.z = otherBox.min.z - (movingBox.max.z - movingBox.min.z) / 2;
        return newPosition;
      }
    }

    return null;
  };

  return {
    snapPositionToGrid,
    snapRotationTo90,
    checkFaceSnap,
    getBoundingBox,
  };
}
