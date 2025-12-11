// src/components/PlanetScene/systems/createDust.ts
import * as THREE from "three";

export type DustSystem = {
  update: (time: number) => void;
  dispose: () => void;
};

export function createDust(scene: THREE.Scene): DustSystem {
  const dustGroup = new THREE.Group();
  scene.add(dustGroup);

  const dustGeometry = new THREE.BufferGeometry();
  const dustCount = 1800;
  const dustPositions = new Float32Array(dustCount * 3);

  for (let i = 0; i < dustCount; i++) {
    const r = 7 * Math.random();
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * Math.PI * 2;

    dustPositions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
    dustPositions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
    dustPositions[i * 3 + 2] = r * Math.cos(theta);
  }

  dustGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(dustPositions, 3)
  );

  const dustMaterial = new THREE.PointsMaterial({
    color: 0x93c5fd,
    size: 0.035,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dustGroup.add(dust);

  const update = (time: number) => {
    dustGroup.rotation.y += 0.0006;
    dustGroup.rotation.x += 0.0002;
    dustMaterial.opacity = 0.4 + Math.sin(time * 0.7) * 0.2;
  };

  const dispose = () => {
    dustGeometry.dispose();
    dustMaterial.dispose();
  };

  return { update, dispose };
}