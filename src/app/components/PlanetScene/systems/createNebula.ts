// src/components/PlanetScene/systems/createNebula.ts
import * as THREE from "three";
import {
  nebulaVertexShader,
  nebulaFragmentShader,
} from "../shaders/nebulaShader";

export type NebulaSystem = {
  update: (time: number, camera: THREE.Camera) => void;
  setPaletteMode: (mode: 0 | 1) => void;
  dispose: () => void;
};

export function createNebula(scene: THREE.Scene): NebulaSystem {
  const nebulaGeo = new THREE.BoxGeometry(40, 20, 40);

  const uniforms = {
    uTime: { value: 0 },
    uCameraPos: { value: new THREE.Vector3() },
    uDensity: { value: 0.85 },
    uPaletteMode: { value: 0 },
  };

  const nebulaMat = new THREE.ShaderMaterial({
    vertexShader: nebulaVertexShader,
    fragmentShader: nebulaFragmentShader,
    uniforms,
    lights: false,
    transparent: true,
    side: THREE.BackSide,
});

  const mesh = new THREE.Mesh(nebulaGeo, nebulaMat);
  mesh.position.set(0, 0, -5);
  scene.add(mesh);

  const update = (time: number, camera: THREE.Camera) => {
    uniforms.uTime.value = time;
    (uniforms.uCameraPos.value as THREE.Vector3).copy(camera.position);
    mesh.rotation.y += 0.00015;
  };

  const setPaletteMode = (mode: 0 | 1) => {
    uniforms.uPaletteMode.value = mode;
  };

  const dispose = () => {
    nebulaGeo.dispose();
    nebulaMat.dispose();
  };

  return { update, setPaletteMode, dispose };
}