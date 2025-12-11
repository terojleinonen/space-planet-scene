// src/components/PlanetScene/systems/hyperjump.ts
import * as THREE from "three";

export type HyperjumpController = {
  update: (time: number) => void;
  dispose: () => void;
};

type HyperState = 0 | 1 | 2 | 3;

export function createHyperjumpController(opts: {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  solarSystem: THREE.Group;
  starfieldGroup: THREE.Group;
}): HyperjumpController {
  const { scene, camera, solarSystem, starfieldGroup } = opts;

  let hyperPhase: HyperState = 0;
  let hyperStartTime = 0;
  let didRelocate = false;

  // Tunnel
  const tunnelGroup = new THREE.Group();
  scene.add(tunnelGroup);

  const tunnelSegments = 40;
  const tunnelRadius = 3.8;
  const tunnelGeo = new THREE.CylinderGeometry(
    tunnelRadius,
    tunnelRadius,
    80,
    32,
    tunnelSegments,
    true
  );

  const tunnelPos = tunnelGeo.attributes.position as THREE.BufferAttribute;
  const tunnelColors = new Float32Array(tunnelPos.count * 3);

  for (let i = 0; i < tunnelPos.count; i++) {
    const tNorm = i / tunnelPos.count;
    const c = new THREE.Color().setHSL(0.55 + tNorm * 0.1, 1, 0.5);
    tunnelColors[i * 3 + 0] = c.r;
    tunnelColors[i * 3 + 1] = c.g;
    tunnelColors[i * 3 + 2] = c.b;
  }

  tunnelGeo.setAttribute("color", new THREE.BufferAttribute(tunnelColors, 3));

  const tunnelMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
  tunnelGroup.add(tunnelMesh);
  tunnelGroup.visible = false;

  // Flash overlay
  const flashGeo = new THREE.PlaneGeometry(20, 20);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
  });

  const flashMesh = new THREE.Mesh(flashGeo, flashMat);
  flashMesh.position.set(0, 0, -3);
  camera.add(flashMesh);
  scene.add(camera);

  const autoTriggerTime = 12; // seconds

  const update = (time: number) => {
    if (time > autoTriggerTime && hyperPhase === 0) {
      hyperPhase = 1;
      hyperStartTime = time;
      tunnelGroup.visible = true;
    }

    if (hyperPhase === 0) return;

    if (hyperPhase === 1) {
      const dt = time - hyperStartTime;
      const k = Math.min(dt / 1.0, 1);

      camera.fov = THREE.MathUtils.lerp(60, 72, k);
      camera.updateProjectionMatrix();

      tunnelMat.opacity = k * 0.6;
      flashMat.opacity = k * 0.2;

      starfieldGroup.scale.setScalar(1 + k * 0.2);

      if (dt > 1.0) {
        hyperPhase = 2;
        hyperStartTime = time;
      }
    } else if (hyperPhase === 2) {
      const dt = time - hyperStartTime;
      const k = Math.min(dt / 1.5, 1);

      camera.fov = THREE.MathUtils.lerp(72, 90, k);
      camera.updateProjectionMatrix();

      tunnelGroup.position.z -= k * 3;
      tunnelGroup.scale.setScalar(1 + k * 1.5);
      flashMat.opacity = k * 0.9;

      if (dt > 1.5) {
        hyperPhase = 3;
        hyperStartTime = time;
        didRelocate = false;
      }
    } else if (hyperPhase === 3) {
      const dt = time - hyperStartTime;
      const k = Math.min(dt / 1.0, 1);

      camera.fov = THREE.MathUtils.lerp(90, 60, k);
      camera.updateProjectionMatrix();

      flashMat.opacity = 1.0 - k;

      if (dt > 0.25 && !didRelocate) {
        didRelocate = true;

        solarSystem.position.set(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 6
        );
      }

      if (dt > 1.0) {
        tunnelGroup.visible = false;
        starfieldGroup.scale.setScalar(1.0);
        tunnelGroup.position.set(0, 0, 0);
        tunnelGroup.scale.setScalar(1.0);
        hyperPhase = 0;
        didRelocate = false;
      }
    }
  };

  const dispose = () => {
    tunnelGeo.dispose();
    tunnelMat.dispose();
    flashGeo.dispose();
    flashMat.dispose();
  };

  return { update, dispose };
}