// src/components/PlanetScene/systems/cameraFly.ts
import * as THREE from "three";

export type CameraFlyController = {
  update: (time: number) => void;
};

export function createCameraFlyController(opts: {
  camera: THREE.PerspectiveCamera;
  planetTargets: THREE.Vector3[];
}): CameraFlyController {
  const { camera, planetTargets } = opts;

  const ease = (x: number) => x * x * x * (x * (x * 6.0 - 15.0) + 10.0);

  const update = (time: number) => {
    const a = ease(Math.min(time / 10, 1));

    camera.position.x = THREE.MathUtils.lerp(0, 4.5, a);
    camera.position.y = THREE.MathUtils.lerp(1.2, 0.6, a);
    camera.position.z = THREE.MathUtils.lerp(6, 1.5, a);

    if (planetTargets.length === 0) return;

    const segmentCount = planetTargets.length - 1;
    const scaled = a * segmentCount;
    const segment = Math.floor(scaled);
    const next = Math.min(segment + 1, segmentCount);
    const localT = scaled - segment;

    const from = planetTargets[segment];
    const to = planetTargets[next];

    const target = new THREE.Vector3().lerpVectors(from, to, localT);
    camera.lookAt(target);
  };

  return { update };
}